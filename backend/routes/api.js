import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { createAddMember } from "../controllers/members.js";
import {
  projectSchema,
  taskSchema,
  profileSchema,
  registerSchema,
  fail,
  id,
} from "../controllers/validation.js";

export function createRouter(db) {
  const router = Router();
  const query = async (sql, params = [], connection = db) =>
    (await connection.execute(sql, params))[0];
  const publicUser = async (userId) =>
    (
      await query(
        "SELECT id,name,email,account_type,created_at FROM users WHERE id=?",
        [userId],
      )
    )[0];
  const token = (user) =>
    jwt.sign({}, process.env.JWT_SECRET, {
      subject: String(user.id),
      expiresIn: "7d",
      algorithm: "HS256",
    });
  const authLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 40,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Muitas tentativas. Tente novamente em 15 minutos." },
  });
  router.post("/auth/register", authLimit, async (req, res) => {
    const data = registerSchema.parse(req.body);
    const hash = await bcrypt.hash(data.password, 12);
    const result = await query(
      "INSERT INTO users (name,email,password_hash,account_type) VALUES (?,?,?,?)",
      [data.name, data.email, hash, data.account_type],
    );
    const user = await publicUser(result.insertId);
    res.status(201).json({ user, token: token(user) });
  });
  router.post("/auth/login", authLimit, async (req, res) => {
    const data = z
      .object({
        email: z.email().transform((v) => v.toLowerCase()),
        password: z.string().min(1).max(200),
      })
      .parse(req.body);
    const user = (
      await query("SELECT * FROM users WHERE email=?", [data.email])
    )[0];
    if (!user || !(await bcrypt.compare(data.password, user.password_hash)))
      fail(401, "E-mail ou senha incorretos.");
    res.json({ user: await publicUser(user.id), token: token(user) });
  });
  router.use(authenticate);
  router.use(async (req, res, next) => {
    req.user = await publicUser(req.userId);
    if (!req.user) fail(401, "Usuário não encontrado.");
    next();
  });
  router.get("/profile", async (req, res) => {
    const counts = (
      await query(
        "SELECT COUNT(*) AS participating, COALESCE(SUM(p.owner_id=?),0) AS created FROM projects p JOIN project_members m ON m.project_id=p.id WHERE m.user_id=?",
        [req.userId, req.userId],
      )
    )[0];
    res.json({ ...(await publicUser(req.userId)), ...counts });
  });
  router.put("/profile", async (req, res) => {
    const d = profileSchema.parse(req.body);
    await query("UPDATE users SET name=?,email=? WHERE id=?", [
      d.name,
      d.email,
      req.userId,
    ]);
    res.json(await publicUser(req.userId));
  });
  const member = async (projectId, userId, admin = false) => {
    const p = (
      await query(
        "SELECT p.* FROM projects p JOIN project_members m ON m.project_id=p.id WHERE p.id=? AND m.user_id=?",
        [id(projectId), userId],
      )
    )[0];
    if (!p) fail(404, "Projeto não encontrado ou acesso indisponível.");
    if (admin && p.owner_id !== userId)
      fail(403, "Somente o criador pode administrar este projeto.");
    return p;
  };
  const listProjects = (userId) =>
    query(
      `SELECT p.*, IF(p.owner_id=?, 'criador','integrante') AS role,
 (SELECT COUNT(*) FROM project_members m2 WHERE m2.project_id=p.id) AS member_count,
 (SELECT COUNT(*) FROM tasks t WHERE t.project_id=p.id) AS task_count,
 (SELECT COUNT(*) FROM tasks t WHERE t.project_id=p.id AND t.status='concluída') AS completed_tasks
 FROM projects p JOIN project_members m ON m.project_id=p.id WHERE m.user_id=? ORDER BY p.created_at DESC,p.id DESC`,
      [userId, userId],
    );
  router.get("/projects", async (req, res) =>
    res.json(await listProjects(req.userId)),
  );
  router.post("/projects", async (req, res) => {
    const d = projectSchema.parse(req.body);
    const connection = await db.getConnection();
    let projectId;
    try {
      await connection.beginTransaction();
      const result = await query(
        "INSERT INTO projects (owner_id,name,subject,topic,description,due_date,status) VALUES (?,?,?,?,?,?,?)",
        [
          req.userId,
          d.name,
          d.subject,
          d.topic,
          d.description,
          d.due_date,
          d.status,
        ],
        connection,
      );
      projectId = result.insertId;
      await query(
        "INSERT INTO project_members (project_id,user_id) VALUES (?,?)",
        [projectId, req.userId],
        connection,
      );
      await query(
        "INSERT INTO invitations (code,project_id) VALUES (?,?)",
        [randomBytes(8).toString("hex").toUpperCase(), projectId],
        connection,
      );
      await connection.commit();
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }
    res.status(201).json(await member(projectId, req.userId));
  });
  router.post("/invitations/join", async (req, res) => {
    const { code } = z
      .object({
        code: z
          .string()
          .trim()
          .regex(/^[a-fA-F0-9]{16}$/)
          .transform((v) => v.toUpperCase()),
      })
      .parse(req.body);
    const invite = (
      await query("SELECT project_id FROM invitations WHERE code=?", [code])
    )[0];
    if (!invite) fail(404, "Convite não encontrado.");
    await query(
      "INSERT INTO project_members (project_id,user_id) VALUES (?,?) ON DUPLICATE KEY UPDATE user_id=VALUES(user_id)",
      [invite.project_id, req.userId],
    );
    res.json(await member(invite.project_id, req.userId));
  });
  router.get("/projects/:id", async (req, res) => {
    const p = await member(req.params.id, req.userId);
    const members = await query(
      "SELECT u.id,u.name,u.email FROM users u JOIN project_members m ON m.user_id=u.id WHERE m.project_id=? ORDER BY u.name",
      [p.id],
    );
    const tasks = await query(
      "SELECT t.*,u.name AS assignee_name FROM tasks t LEFT JOIN users u ON u.id=t.assignee_id WHERE t.project_id=? ORDER BY t.due_date,t.id",
      [p.id],
    );
    const invitation = (
      await query("SELECT code FROM invitations WHERE project_id=?", [p.id])
    )[0];
    res.json({
      ...p,
      members,
      tasks,
      progress: tasks.length
        ? Math.round(
            (tasks.filter((t) => t.status === "concluída").length /
              tasks.length) *
              100,
          )
        : 0,
      invitation: {
        code: invitation.code,
        url: `${process.env.APP_URL || "http://localhost:8081"}/?invite=${invitation.code}`,
      },
    });
  });
  router.post("/projects/:id/members", createAddMember({ query, member }));
  router.get("/projects/:id/members", async (req, res) => {
    const p = await member(req.params.id, req.userId);
    res.json(
      await query(
        "SELECT u.id,u.name,u.email FROM users u JOIN project_members m ON m.user_id=u.id WHERE m.project_id=?",
        [p.id],
      ),
    );
  });
  router.put("/projects/:id", async (req, res) => {
    const p = await member(req.params.id, req.userId, true);
    const d = projectSchema.parse(req.body);
    await query(
      "UPDATE projects SET name=?,subject=?,topic=?,description=?,due_date=?,status=? WHERE id=?",
      [d.name, d.subject, d.topic, d.description, d.due_date, d.status, p.id],
    );
    res.json(await member(p.id, req.userId));
  });
  router.delete("/projects/:id", async (req, res) => {
    const p = await member(req.params.id, req.userId, true);
    await query("DELETE FROM projects WHERE id=?", [p.id]);
    res.sendStatus(204);
  });
  async function validateAssignee(p, d) {
    if (
      d.assignee_id &&
      !(
        await query(
          "SELECT user_id FROM project_members WHERE project_id=? AND user_id=?",
          [p.id, d.assignee_id],
        )
      ).length
    )
      fail(400, "O responsável deve participar do projeto.");
  }
  router.get("/projects/:id/tasks", async (req, res) => {
    const p = await member(req.params.id, req.userId);
    res.json(
      await query(
        "SELECT * FROM tasks WHERE project_id=? ORDER BY due_date,id",
        [p.id],
      ),
    );
  });
  router.post("/projects/:id/tasks", async (req, res) => {
    const p = await member(req.params.id, req.userId, true);
    const d = taskSchema.parse(req.body);
    await validateAssignee(p, d);
    const result = await query(
      "INSERT INTO tasks (project_id,title,description,assignee_id,due_date,status) VALUES (?,?,?,?,?,?)",
      [p.id, d.title, d.description, d.assignee_id, d.due_date, d.status],
    );
    res.status(201).json({ id: result.insertId, ...d });
  });
  const taskAccess = async (req, admin) => {
    const p = await member(req.params.id, req.userId, admin);
    const t = (
      await query("SELECT * FROM tasks WHERE id=? AND project_id=?", [
        id(req.params.taskId),
        p.id,
      ])
    )[0];
    if (!t) fail(404, "Tarefa não encontrada.");
    return { p, t };
  };
  router.put("/projects/:id/tasks/:taskId", async (req, res) => {
    const { p, t } = await taskAccess(req, true);
    const d = taskSchema.parse(req.body);
    await validateAssignee(p, d);
    await query(
      "UPDATE tasks SET title=?,description=?,assignee_id=?,due_date=?,status=? WHERE id=?",
      [d.title, d.description, d.assignee_id, d.due_date, d.status, t.id],
    );
    res.json({ id: t.id, ...d });
  });
  router.patch("/projects/:id/tasks/:taskId/status", async (req, res) => {
    const { p, t } = await taskAccess(req, false);
    if (p.owner_id !== req.userId && t.assignee_id !== req.userId)
      fail(403, "Você só pode atualizar tarefas atribuídas a você.");
    const d = z
      .object({ status: z.enum(["pendente", "em andamento", "concluída"]) })
      .strict()
      .parse(req.body);
    await query("UPDATE tasks SET status=? WHERE id=?", [d.status, t.id]);
    res.json({ ...t, status: d.status });
  });
  router.delete("/projects/:id/tasks/:taskId", async (req, res) => {
    const { t } = await taskAccess(req, true);
    await query("DELETE FROM tasks WHERE id=?", [t.id]);
    res.sendStatus(204);
  });
  router.get("/dashboard", async (req, res) => {
    const projects = await listProjects(req.userId);
    const total = projects.reduce((n, p) => n + p.task_count, 0);
    const done = projects.reduce((n, p) => n + p.completed_tasks, 0);
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Sao_Paulo",
    });
    const end = new Date(Date.now() + 7 * 86400000).toLocaleDateString(
      "en-CA",
      { timeZone: "America/Sao_Paulo" },
    );
    res.json({
      projects,
      active: projects.filter((p) => p.status !== "concluído").length,
      completed: projects.filter((p) => p.status === "concluído").length,
      near: projects.filter(
        (p) =>
          p.status !== "concluído" && p.due_date >= today && p.due_date <= end,
      ).length,
      progress: total ? Math.round((done / total) * 100) : 0,
    });
  });
  router.get("/calendar", async (req, res) => {
    const projects = await listProjects(req.userId);
    const tasks = await query(
      "SELECT t.*,p.name AS project_name FROM tasks t JOIN projects p ON p.id=t.project_id JOIN project_members m ON m.project_id=p.id WHERE m.user_id=?",
      [req.userId],
    );
    res.json([
      ...projects.map((p) => ({
        id: `p${p.id}`,
        project_id: p.id,
        title: p.name,
        due_date: p.due_date,
        type: "Projeto",
        status: p.status,
      })),
      ...tasks.map((t) => ({ ...t, id: `t${t.id}`, type: "Tarefa" })),
    ]);
  });
  return router;
}
