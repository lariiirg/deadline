const { defineConfig } = require("@playwright/test");
module.exports = defineConfig({
  testDir: "./tests/web",
  timeout: 30000,
  use: { baseURL: "http://127.0.0.1:8099", channel: "msedge", headless: true },
  webServer: {
    command: "node scripts/serve-web.cjs",
    port: 8099,
    reuseExistingServer: false,
  },
  reporter: "list",
});
