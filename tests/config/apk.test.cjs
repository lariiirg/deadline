const { test } = require("node:test");
const assert = require("node:assert/strict");
const { validateApiUrl } = require("../../app/config/api-url.cjs");
const configure = require("../../app/app.config.js");
test("APK: rejects missing, loopback and malformed API URLs", () => {
  for (const value of [
    undefined,
    "bad",
    "http://localhost:3000/api",
    "http://127.0.0.2:3000/api",
    "http://[::1]:3000/api",
    "http://10.0.2.2:3000/api",
    "https://user:password@example.org/api",
    "https://example.org/",
    "https://example.org/api?secret=x",
  ])
    assert.throws(() => validateApiUrl(value, { allowHttp: true }));
});
test("APK: HTTP permitted only for LAN profile and HTTPS accepted", () => {
  assert.equal(
    validateApiUrl("http://192.168.1.5:3000/api/", { allowHttp: true }),
    "http://192.168.1.5:3000/api",
  );
  assert.throws(() => validateApiUrl("http://192.168.1.5:3000/api"));
  assert.equal(
    validateApiUrl("https://example.org/api"),
    "https://example.org/api",
  );
});
test("APK config: preserves existing config and enables cleartext only for LAN", () => {
  const oldProfile = process.env.EAS_BUILD_PROFILE;
  const oldUrl = process.env.EXPO_PUBLIC_API_URL;
  try {
    process.env.EAS_BUILD_PROFILE = "apk-lan";
    process.env.EXPO_PUBLIC_API_URL = "http://192.168.1.5:3000/api";
    const result = configure({
      config: {
        name: "Deadline",
        plugins: ["expo-status-bar"],
        android: { package: "com.deadline.school" },
      },
    });
    assert.equal(result.name, "Deadline");
    assert.equal(result.android.package, "com.deadline.school");
    assert.equal(result.plugins[1][1].android.usesCleartextTraffic, true);
    process.env.EAS_BUILD_PROFILE = "apk";
    assert.throws(() => configure({ config: {} }));
    process.env.EXPO_PUBLIC_API_URL = "https://example.org/api";
    assert.equal(
      configure({ config: {} }).plugins[0][1].android.usesCleartextTraffic,
      false,
    );
  } finally {
    if (oldProfile === undefined) delete process.env.EAS_BUILD_PROFILE;
    else process.env.EAS_BUILD_PROFILE = oldProfile;
    if (oldUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = oldUrl;
  }
});
