import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3100";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  timeout: 60_000,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL, trace: "retain-on-failure", screenshot: "only-on-failure", video: "retain-on-failure" },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : { command: "npm run dev -- -p 3100", url: baseURL, reuseExistingServer: !process.env.CI, timeout: 120_000 },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 14"], browserName: "chromium" } },
    { name: "vertical-teaser", testMatch: /promo\/walkthrough\.spec\.ts/, use: { viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1, video: { mode: "on", size: { width: 1080, height: 1920 } } } },
    { name: "vertical-full", testMatch: /promo\/walkthrough\.spec\.ts/, use: { viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1, video: { mode: "on", size: { width: 1080, height: 1920 } } } },
    { name: "linkedin", testMatch: /promo\/walkthrough\.spec\.ts/, use: { viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1, video: { mode: "on", size: { width: 1600, height: 900 } } } },
  ],
});
