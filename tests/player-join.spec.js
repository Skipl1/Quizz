import { test, expect } from '@playwright/test';

test.describe('Player Join Flow', () => {
  test('shows join screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /QUIZZ/i })).toBeVisible({ timeout: 15000 });
    const input = page.getByPlaceholder(/имя/i);
    await expect(input).toBeVisible();
  });

  test('registers with valid name', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder(/имя/i).fill('TestPlayer');
    await page.getByRole('button', { name: /войти/i }).click();
    await expect(page.getByText(/ожидание/i)).toBeVisible({ timeout: 15000 });
  });

  test('blocks empty name', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /войти/i }).click();
    await expect(page.getByPlaceholder(/имя/i)).toBeVisible({ timeout: 5000 });
  });
});
