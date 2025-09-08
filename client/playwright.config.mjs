import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  reporter: [['list']],
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 5000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
