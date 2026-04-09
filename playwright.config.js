import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // globalSetup отключён — сервер запускается вручную
  testDir: './tests',
  fullyParallel: false,
  timeout: 90000,
  expect: { timeout: 20000 },
  retries: 1,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3003',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
    // Игнорируем ошибки подключения для повторных попыток
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },
  projects: [
    { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Chrome', use: { ...devices['iPhone 14'] } },
  ],
  // Повторная попытка только при сетевых ошибках
  forbidOnly: false,
});
