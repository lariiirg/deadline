import { test } from "node:test";
import assert from "node:assert/strict";
import supertest from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";
import { date, registerSchema } from "../controllers/validation.js";
process.env.JWT_SECRET =
  "test-only-key-that-is-long-enough-and-not-for-production";
// Deliberately small database double: these tests exercise HTTP middleware and
// permissions, not MySQL or persistence. See mysql.integration.test.js for that.
let writes = 0;
const db = {
  async execute(sql, params = []) {
    if (sql === "SELECT 1") return [[{ ok: 1 }]];
    if (sql.startsWith("SELECT id,name,email"))
      return [
        [
          {
            id: params[0],
            name: "Test",
            email: "test@example.com",
            account_type: "aluno",
          },
        ],
      ];
    if (sql.startsWith("SELECT p.* FROM projects"))
      return [params[1] === 3 ? [] : [{ id: 1, owner_id: 1, name: "Test" }]];
    if (sql.startsWith("SELECT * FROM tasks"))
      return [
        params[0] === 999
          ? []
          : [{ id: 1, project_id: 1, assignee_id: 2, status: "pendente" }],
      ];
    if (sql.startsWith("UPDATE tasks")) {
      writes++;
      return [{ affectedRows: 1 }];
    }
    throw new Error("Unexpected query in test: " + sql);
  },
};
const api = supertest(createApp(db));
const bearer = (n) =>
  "Bearer " +
  jwt.sign({}, process.env.JWT_SECRET, { subject: String(n), expiresIn: "1h" });
test("HTTP: health verifies database connectivity", async () => {
  await api.get("/api/health").expect(200);
});
test("HTTP: protected routes require authentication", async () => {
  await api.get("/api/projects").expect(401);
});
test("HTTP: forged token is rejected", async () => {
  await api
    .get("/api/projects")
    .set("Authorization", "Bearer invalid")
    .expect(401);
});
test("HTTP: expired token is rejected", async () => {
  const token = jwt.sign({}, process.env.JWT_SECRET, {
    subject: "1",
    expiresIn: -1,
  });
  await api
    .get("/api/profile")
    .set("Authorization", "Bearer " + token)
    .expect(401);
});
test("HTTP: member cannot edit project", async () => {
  await api
    .put("/api/projects/1")
    .set("Authorization", bearer(2))
    .send({ name: "attack" })
    .expect(403);
});
test("HTTP: member cannot delete project", async () => {
  await api
    .delete("/api/projects/1")
    .set("Authorization", bearer(2))
    .expect(403);
});

test("HTTP: student member cannot add members even with a forged account type", async () => {
  await api
    .post("/api/projects/1/members")
    .set("Authorization", bearer(2))
    .send({ email: "test@example.com", account_type: "professor" })
    .expect(403);
});
test("HTTP: member cannot create tasks", async () => {
  await api
    .post("/api/projects/1/tasks")
    .set("Authorization", bearer(2))
    .send({})
    .expect(403);
});
test("HTTP: member cannot edit task fields", async () => {
  await api
    .put("/api/projects/1/tasks/1")
    .set("Authorization", bearer(2))
    .send({ title: "attack" })
    .expect(403);
});
test("HTTP: member cannot delete tasks", async () => {
  await api
    .delete("/api/projects/1/tasks/1")
    .set("Authorization", bearer(2))
    .expect(403);
});
test("HTTP: outsider cannot read project", async () => {
  await api.get("/api/projects/1").set("Authorization", bearer(3)).expect(404);
});
test("HTTP: outsider cannot update tasks", async () => {
  await api
    .patch("/api/projects/1/tasks/1/status")
    .set("Authorization", bearer(3))
    .send({ status: "concluída" })
    .expect(404);
});
test("HTTP: assignee can complete their own task", async () => {
  const before = writes;
  await api
    .patch("/api/projects/1/tasks/1/status")
    .set("Authorization", bearer(2))
    .send({ status: "concluída" })
    .expect(200);
  assert.equal(writes, before + 1);
});
test("HTTP: another member cannot complete unassigned task", async () => {
  await api
    .patch("/api/projects/1/tasks/1/status")
    .set("Authorization", bearer(4))
    .send({ status: "concluída" })
    .expect(403);
});
test("HTTP: creator can complete any task", async () => {
  await api
    .patch("/api/projects/1/tasks/1/status")
    .set("Authorization", bearer(1))
    .send({ status: "concluída" })
    .expect(200);
});
test("HTTP: status route rejects field smuggling", async () => {
  await api
    .patch("/api/projects/1/tasks/1/status")
    .set("Authorization", bearer(2))
    .send({ status: "concluída", assignee_id: 4 })
    .expect(400);
});
test("HTTP: missing task returns 404", async () => {
  await api
    .patch("/api/projects/1/tasks/999/status")
    .set("Authorization", bearer(2))
    .send({ status: "concluída" })
    .expect(404);
});
test("HTTP: invalid id returns 400", async () => {
  await api
    .get("/api/projects/NaN")
    .set("Authorization", bearer(1))
    .expect(400);
});
test("HTTP: malformed JSON has structured error", async () => {
  await api
    .post("/api/auth/login")
    .set("Content-Type", "application/json")
    .send("{bad")
    .expect(400);
});
test("HTTP: duplicate e-mail maps to 409", async () => {
  const app = createApp({
    async execute() {
      throw Object.assign(new Error("duplicate"), { code: "ER_DUP_ENTRY" });
    },
  });
  await supertest(app)
    .post("/api/auth/register")
    .send({
      name: "Student",
      email: "test@example.com",
      password: "testing123",
    })
    .expect(409);
});
test("HTTP: unavailable database health returns 503", async () => {
  const app = createApp({
    async execute() {
      throw new Error("offline");
    },
  });
  await supertest(app).get("/api/health").expect(503);
});
test("Validation: rejects impossible dates", () => {
  assert.equal(date.safeParse("2026-02-30").success, false);
  assert.equal(date.safeParse("2028-02-29").success, true);
});
test("Validation: account level and bcrypt byte limit", () => {
  assert.equal(
    registerSchema.safeParse({
      name: "A",
      email: "a@b.com",
      password: "á".repeat(40),
    }).success,
    false,
  );
  assert.equal(
    registerSchema.safeParse({
      name: "A",
      email: "a@b.com",
      password: "password123",
      account_type: "admin",
    }).success,
    false,
  );
});
test("HTTP: unknown routes return JSON 404", async () => {
  const r = await api.get("/not-found").expect(404);
  assert.ok(r.body.message);
});
