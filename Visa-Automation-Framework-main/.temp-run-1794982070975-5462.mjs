/**
 * Auto-generated single-execution Playwright config
 * Created: 2026-11-18T06:07:50.975Z
 * File: cameroon-visa.spec.ts
 * Project: Desktop-Chromium
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/spec',
  testMatch: '**/cameroon-visa.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 120000,
  expect: {
    timeout: 15000,
  },
  projects: [
    {
      name: 'Desktop-Chromium',
      use: {
        viewport: { width: 1920, height: 1080 },
        browserName: 'chromium',
        actionTimeout: 15000,
        navigationTimeout: 30000,
        screenshot: 'only-on-failure',
        launchOptions: {
        headless: true,
        args: [],
      },
      },
    },
  ],
});
