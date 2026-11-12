import express from "express";
import cors from "cors";
import helmet from "helmet";
import { ZodError } from "zod";
import { createRouter } from "./routes/api.js";
export function createApp(db) {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  const origins = (process.env.CORS_ORIGINS || "http://localhost:8081")
    .split(",")
    .map((v) => v.trim());
  app.use(
    cors({
      origin(origin, cb) {
        cb(null, !origin || origins.includes(origin));
      },
    }),
  );
  app.use(express.json({ limit: "100kb" }));
  app.get("/api/health", async (req, res) => {
    try {
      await db.execute("SELECT 1");
      res.json({ status: "ok", database: "connected" });
    } catch {
      res.status(503).json({
        message: "MySQL indisponível. Verifique a configuração e a porta 3307.",
      });
    }
  });
  app.use("/api", createRouter(db));
  app.use((req, res) =>
    res.status(404).json({ message: "Rota não encontrada." }),
  );
  app.use((err, req, res, next) => {
    if (err instanceof ZodError)
      return res.status(400).json({
        message: err.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("\n"),
      });
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({
        message: "Este e-mail já está cadastrado ou o registro já existe.",
      });
    if (err.type === "entity.parse.failed")
      return res.status(400).json({ message: "JSON inválido." });
    if (err.type === "entity.too.large")
      return res.status(413).json({ message: "Requisição muito grande." });
    if (!err.status) console.error(err.code || err.message);
    res.status(err.status || 500).json({
      message: err.status
        ? err.message
        : "Não foi possível concluir a operação. Verifique a API e a conexão com o banco.",
    });
  });
  return app;
}
