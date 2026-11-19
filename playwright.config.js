const { defineConfig } = require("@playwright/test");
module.exports = defineConfig({
  testDir: "./tests/web",
  timeout: 30000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:8099",
    channel: "msedge",
    headless: true,
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "node scripts/serve-web.cjs",
        port: 8099,
        reuseExistingServer: false,
      },
  reporter: "list",
});
