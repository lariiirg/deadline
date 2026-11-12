import "./config/env.js";
import { pool } from "./config/db.js";
import { createApp } from "./app.js";
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error(
    "Configure JWT_SECRET com pelo menos 32 caracteres no backend/.env.",
  );
  process.exit(1);
}
try {
  await pool.execute("SELECT 1");
} catch (e) {
  console.error(
    `MySQL indisponível (${e.code}). Confira backend/.env e o serviço em ${process.env.DB_HOST || "127.0.0.1"}:${process.env.DB_PORT || 3307}.`,
  );
  process.exit(1);
}
const server = createApp(pool).listen(
  Number(process.env.PORT || 3000),
  "0.0.0.0",
  () =>
    console.log(
      "Deadline API disponível na porta " + (process.env.PORT || 3000),
    ),
);
server.on("error", async (error) => {
  console.error(
    error.code === "EADDRINUSE"
      ? "A porta da API já está em uso. Encerre a outra instância antes de iniciar."
      : `Não foi possível iniciar a API: ${error.code || error.message}`,
  );
  await pool.end();
  process.exit(1);
});
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () =>
    server.close(async () => {
      await pool.end();
      process.exit(0);
    }),
  );
