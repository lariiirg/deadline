// Uses a NEW local MySQL instance and leaves the installed MySQL service alone.
// Test artifacts stay in artifacts/ for inspection; no recursive deletion.
const { spawn, execFile } = require("node:child_process");
const { promisify } = require("node:util");
const fs = require("node:fs"),
  path = require("node:path"),
  net = require("node:net");
const mysql = require("../backend/node_modules/mysql2/promise");
const run = promisify(execFile),
  root = path.resolve(__dirname, "..");
const bin =
  process.env.MYSQL_BIN || "C:/Program Files/MySQL/MySQL Server 8.0/bin";
const port = 13307;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function freePort(n) {
  await new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once("error", reject);
    s.listen(n, "127.0.0.1", () => s.close(resolve));
  });
}
async function main() {
  await freePort(port);
  await freePort(3000);
  const dir = path.join(root, "artifacts", "mysql-" + Date.now());
  fs.mkdirSync(dir, { recursive: true });
  const datadir = path.join(dir, "data");
  console.log("Initializing isolated MySQL on 127.0.0.1:" + port);
  await run(
    path.join(bin, "mysqld.exe"),
    ["--no-defaults", "--initialize-insecure", `--datadir=${datadir}`],
    { windowsHide: true, timeout: 60000 },
  );
  const log = fs.openSync(path.join(dir, "mysql.log"), "a");
  const server = spawn(
    path.join(bin, "mysqld.exe"),
    [
      "--no-defaults",
      `--datadir=${datadir}`,
      `--port=${port}`,
      "--bind-address=127.0.0.1",
      "--mysqlx=0",
      "--console",
    ],
    { windowsHide: true, stdio: ["ignore", log, log] },
  );
  let connection, apiProcess;
  const env = {
    ...process.env,
    DB_HOST: "127.0.0.1",
    DB_PORT: String(port),
    DB_USER: "root",
    DB_PASSWORD: "",
    DB_NAME: "deadline",
    JWT_SECRET: require("node:crypto").randomBytes(48).toString("hex"),
    RUN_DB_TESTS: "1",
    CORS_ORIGINS: "http://127.0.0.1:8099",
    PORT: "3000",
  };
  try {
    for (let i = 0; i < 100; i++) {
      try {
        connection = await mysql.createConnection({
          host: "127.0.0.1",
          port,
          user: "root",
          password: "",
          multipleStatements: true,
        });
        break;
      } catch {
        if (server.exitCode !== null)
          throw new Error("Isolated MySQL exited; inspect " + dir);
        await sleep(300);
      }
    }
    if (!connection) throw new Error("MySQL initialization timed out.");
    await connection.query(
      fs.readFileSync(path.join(root, "database/deadline.sql"), "utf8"),
    );
    await connection.query(
      fs.readFileSync(path.join(root, "database/deadline.sql"), "utf8"),
    );
    console.log(
      "Schema imported twice without deleting data. Running real MySQL integration.",
    );
    const result = await run(
      process.execPath,
      ["--test", "tests/mysql.integration.test.js"],
      {
        cwd: path.join(root, "backend"),
        env,
        windowsHide: true,
        timeout: 60000,
      },
    );
    console.log(result.stdout);
    apiProcess = spawn(process.execPath, ["server.js"], {
      cwd: path.join(root, "backend"),
      env,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    apiProcess.stdout.on("data", (d) => process.stdout.write(d));
    apiProcess.stderr.on("data", (d) => process.stderr.write(d));
    let ready = false;
    for (let i = 0; i < 60; i++) {
      try {
        const r = await fetch("http://127.0.0.1:3000/api/health");
        if (r.ok) {
          ready = true;
          break;
        }
      } catch {}
      await sleep(250);
    }
    if (!ready) throw new Error("Test API did not start.");
    console.log("Running browser tests with a real API/MySQL case.");
    const web = await run(
      process.execPath,
      [path.join(root, "node_modules/@playwright/test/cli.js"), "test"],
      {
        cwd: root,
        env: { ...env, RUN_DB_BROWSER: "1" },
        windowsHide: true,
        timeout: 180000,
        maxBuffer: 4 * 1024 * 1024,
      },
    );
    console.log(web.stdout);
  } finally {
    if (apiProcess) apiProcess.kill();
    if (connection) await connection.end();
    try {
      await run(
        path.join(bin, "mysqladmin.exe"),
        [
          "--host=127.0.0.1",
          `--port=${port}`,
          "--user=root",
          "--skip-password",
          "shutdown",
        ],
        { windowsHide: true, timeout: 15000 },
      );
    } catch {
      server.kill();
    }
    fs.closeSync(log);
    console.log("Isolated test server stopped. Artifacts: " + dir);
  }
}
main().catch((e) => {
  console.error(e.stdout || "", e.stderr || "", e.message);
  process.exitCode = 1;
});
