import "dotenv/config";
import { test } from "node:test";
import assert from "node:assert/strict";
import supertest from "supertest";
import bcrypt from "bcrypt";
import { pool } from "../config/db.js";
import { createApp } from "../app.js";
test(
  "MySQL: complete two-user flow, invitations, permissions, CRUD and persistence",
  { skip: process.env.RUN_DB_TESTS !== "1" },
  async () => {
    const api = supertest(createApp(pool)),
      stamp = Date.now();
    const users = [];
    let projectId;
    const request = (method, path, token, body) => {
      const r = api[method]("/api" + path);
      if (token) r.set("Authorization", "Bearer " + token);
      if (body) r.send(body);
      return r;
    };
    try {
      for (const account_type of ["aluno", "professor"]) {
        const r = await request("post", "/auth/register", null, {
          name: "Integration " + account_type,
          email: `deadline-test-${stamp}-${account_type}@example.com`,
          password: "Test-password-123",
          account_type,
        }).expect(201);
        users.push(r.body);
      }
      const [owner, member] = users;
      const [[stored]] = await pool.execute(
        "SELECT password_hash FROM users WHERE id=?",
        [owner.user.id],
      );
      assert.notEqual(stored.password_hash, "Test-password-123");
      assert.ok(
        await bcrypt.compare("Test-password-123", stored.password_hash),
      );
      await request("post", "/auth/register", null, {
        name: "Duplicate",
        email: owner.user.email,
        password: "Test-password-123",
      }).expect(409);
      await request("post", "/auth/login", null, {
        email: owner.user.email,
        password: "wrong",
      }).expect(401);
      await request("post", "/auth/login", null, {
        email: owner.user.email,
        password: "Test-password-123",
      }).expect(200);
      const project = {
        name: "Integration project",
        subject: "Biologia",
        topic: "Ecologia",
        description: "Temporary automated integration test",
        due_date: "2030-12-01",
        status: "em andamento",
      };
      const created = await request(
        "post",
        "/projects",
        owner.token,
        project,
      ).expect(201);
      projectId = created.body.id;
      await request("get", `/projects/${projectId}`, member.token).expect(404);
      const detail = (
        await request("get", `/projects/${projectId}`, owner.token).expect(200)
      ).body;
      assert.equal(detail.members.length, 1);
      assert.match(detail.invitation.url, /invite=/);
      await request("post", `/projects/${projectId}/members`, owner.token, {
        email: `missing-${stamp}@example.com`,
      }).expect(404);
      await request("post", `/projects/${projectId}/members`, owner.token, {
        email: " " + member.user.email.toUpperCase() + " ",
      }).expect(200);
      await request("post", `/projects/${projectId}/members`, owner.token, {
        email: member.user.email,
      }).expect(200);
      const [[membership]] = await pool.execute(
        "SELECT COUNT(*) AS total FROM project_members WHERE project_id=? AND user_id=?",
        [projectId, member.user.id],
      );
      assert.equal(membership.total, 1);
      await request("post", `/projects/${projectId}/members`, member.token, {
        email: owner.user.email,
      }).expect(200);
      await pool.execute("UPDATE users SET account_type='aluno' WHERE id=?", [
        member.user.id,
      ]);
      await request("post", `/projects/${projectId}/members`, member.token, {
        email: owner.user.email,
      }).expect(403);
      await pool.execute(
        "UPDATE users SET account_type='professor' WHERE id=?",
        [member.user.id],
      );
      await pool.execute(
        "DELETE FROM project_members WHERE project_id=? AND user_id=?",
        [projectId, member.user.id],
      );
      await request("post", `/projects/${projectId}/members`, member.token, {
        email: owner.user.email,
      }).expect(404);
      await request("post", "/invitations/join", member.token, {
        code: detail.invitation.code.toLowerCase(),
      }).expect(200);
      await request("post", "/invitations/join", member.token, {
        code: detail.invitation.code,
      }).expect(200);
      assert.equal(
        (
          await request(
            "get",
            `/projects/${projectId}/members`,
            owner.token,
          ).expect(200)
        ).body.length,
        2,
      );
      await request(
        "put",
        `/projects/${projectId}`,
        member.token,
        project,
      ).expect(403);
      await request("delete", `/projects/${projectId}`, member.token).expect(
        403,
      );
      const task = {
        title: "Pesquisar",
        description: "Reunir fontes",
        assignee_id: member.user.id,
        due_date: "2030-11-01",
        status: "pendente",
      };
      await request(
        "post",
        `/projects/${projectId}/tasks`,
        member.token,
        task,
      ).expect(403);
      const createdTask = (
        await request(
          "post",
          `/projects/${projectId}/tasks`,
          owner.token,
          task,
        ).expect(201)
      ).body;
      await request(
        "put",
        `/projects/${projectId}/tasks/${createdTask.id}`,
        member.token,
        task,
      ).expect(403);
      await request(
        "delete",
        `/projects/${projectId}/tasks/${createdTask.id}`,
        member.token,
      ).expect(403);
      await request(
        "patch",
        `/projects/${projectId}/tasks/${createdTask.id}/status`,
        member.token,
        { status: "concluída" },
      ).expect(200);
      assert.equal(
        (
          await request("get", `/projects/${projectId}`, member.token).expect(
            200,
          )
        ).body.progress,
        100,
      );
      const [[persisted]] = await pool.execute(
        "SELECT status FROM tasks WHERE id=?",
        [createdTask.id],
      );
      assert.equal(persisted.status, "concluída");
      assert.ok(
        (await request("get", "/calendar", member.token).expect(200)).body.some(
          (e) => e.project_id === projectId,
        ),
      );
      assert.ok(
        (
          await request("get", "/dashboard", member.token).expect(200)
        ).body.projects.some((p) => p.id === projectId),
      );
      await request("put", `/projects/${projectId}`, owner.token, {
        ...project,
        name: "Updated",
      }).expect(200);
      await request(
        "put",
        `/projects/${projectId}/tasks/${createdTask.id}`,
        owner.token,
        { ...task, title: "Updated task" },
      ).expect(200);
      await request("put", "/profile", member.token, {
        name: "Updated profile",
        email: member.user.email,
      }).expect(200);
      await request(
        "delete",
        `/projects/${projectId}/tasks/${createdTask.id}`,
        owner.token,
      ).expect(204);
      await request("delete", `/projects/${projectId}`, owner.token).expect(
        204,
      );
      projectId = null;
    } finally {
      if (projectId)
        await pool.execute("DELETE FROM projects WHERE id=?", [projectId]);
      for (const u of users)
        await pool.execute("DELETE FROM users WHERE id=?", [u.user.id]);
      await pool.end();
    }
  },
);
