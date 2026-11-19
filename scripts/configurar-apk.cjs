const fs = require("node:fs");
const path = require("node:path");
const { validateApiUrl } = require("../app/config/api-url.cjs");
const root = path.resolve(__dirname, "..");
async function main() {
  const api = validateApiUrl(process.argv[2], { allowHttp: true });
  const response = await fetch(api + "/health", {
    signal: AbortSignal.timeout(10000),
  });
  const health = await response.json();
  if (!response.ok || health.database !== "connected")
    throw new Error(
      "A API ou o MySQL não respondeu corretamente. Inicie o backend e confira a URL.",
    );
  const easPath = path.join(root, "app/eas.json");
  const eas = JSON.parse(fs.readFileSync(easPath, "utf8"));
  eas.build["apk-lan"].env = {
    ...eas.build["apk-lan"].env,
    EXPO_PUBLIC_API_URL: api,
  };
  fs.writeFileSync(easPath, JSON.stringify(eas, null, 2) + "\n");
  const backendEnv = path.join(root, "backend/.env");
  if (fs.existsSync(backendEnv)) {
    let content = fs.readFileSync(backendEnv, "utf8");
    const parsed = require("../backend/node_modules/dotenv").parse(content);
    const web = new URL(api);
    web.port = "8081";
    web.pathname = "";
    const appUrl = web.origin;
    const values = {
      APP_URL: appUrl,
      CORS_ORIGINS: [
        ...new Set([
          ...(
            parsed.CORS_ORIGINS || "http://localhost:8081,http://127.0.0.1:8081"
          )
            .split(",")
            .map((v) => v.trim()),
          appUrl,
        ]),
      ].join(","),
    };
    for (const [key, value] of Object.entries(values)) {
      const pattern = new RegExp("^" + key + "=.*$", "m");
      content = pattern.test(content)
        ? content.replace(pattern, () => key + "=" + value)
        : content + "\n" + key + "=" + value;
    }
    fs.writeFileSync(backendEnv, content);
    console.log(
      "APP_URL e CORS_ORIGINS ajustados no backend/.env privado. Reinicie a API para aplicar os links LAN.",
    );
  }
  console.log(
    "Perfil apk-lan configurado para " +
      api +
      ". Reinicie o backend e teste " +
      api +
      "/health no navegador do celular na mesma rede.",
  );
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
