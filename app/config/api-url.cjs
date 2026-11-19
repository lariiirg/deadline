function validateApiUrl(value, { allowHttp = false } = {}) {
  if (!value)
    throw new Error("Configure EXPO_PUBLIC_API_URL antes de gerar o APK.");
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(
      "EXPO_PUBLIC_API_URL deve ser uma URL válida terminada em /api.",
    );
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname.replace(/\/$/, "") !== "/api"
  )
    throw new Error("Use uma URL HTTP(S) sem credenciais, terminada em /api.");
  if (
    ["localhost", "::1", "[::1]", "0.0.0.0", "10.0.2.2"].includes(
      url.hostname.toLowerCase(),
    ) ||
    /^127\./.test(url.hostname)
  )
    throw new Error(
      "O APK no celular precisa do IPv4 do computador ou de uma API HTTPS, não de localhost/emulador.",
    );
  if (!allowHttp && url.protocol !== "https:")
    throw new Error(
      "O perfil apk exige HTTPS. Para a rede Wi-Fi local, use apk-lan.",
    );
  return url.toString().replace(/\/$/, "");
}
module.exports = { validateApiUrl };
