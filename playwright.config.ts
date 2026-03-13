import { defineConfig, devices } from '@playwright/test';
import { config as loadEnv } from 'dotenv';

loadEnv();

const serverPort = process.env.PORT || '3000';
const resolvedBaseUrl = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${serverPort}`;

export default defineConfig({
  testDir: './src/__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 60_000, // 60 s — generous for video + per-step screenshots on slower browsers
  outputDir: 'test-results',
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['./src/__tests__/e2e/reporter/markdown.reporter.ts'],
  ],
  use: {
    baseURL: resolvedBaseUrl,
    // Always record video and capture a final screenshot so every test run
    // produces artifacts that the markdown reporter can document.
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: 'on',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    // webkit and Mobile Safari require libicudata.so.66 / libicui18n.so.66 etc. (ICU 66),
    // which are not available on rolling-release distros (Arch/CachyOS). Enable in CI or
    // on Ubuntu/Debian by running: pnpm exec playwright install-deps webkit
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    // { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
  webServer: {
    command: 'pnpm run dev',
    url: resolvedBaseUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
