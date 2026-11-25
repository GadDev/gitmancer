import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://127.0.0.1:3000",
    headless: true,
    launchOptions: {
      ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
        ? {
            executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
            args: JSON.parse(process.env.PLAYWRIGHT_CHROMIUM_ARGS || "[]"),
          }
        : {}),
    },
  },
  webServer: {
    env: { APP_ORIGIN: "http://127.0.0.1:3000" },
    command: "npm run start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 90000,
  },
});
