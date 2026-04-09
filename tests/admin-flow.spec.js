import { test, expect } from '@playwright/test';

test.describe('Admin Flow', () => {
  test('shows admin login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /админ/i })).toBeVisible({ timeout: 15000 });
  });

  test('rejects wrong credentials', async ({ page }) => {
    await page.goto('/admin');
    await page.getByLabel(/логин/i).fill('wrong');
    await page.getByLabel(/пароль/i).fill('wrong');
    await page.getByRole('button', { name: /войти/i }).click();
    await expect(page.getByText('Неверный логин или пароль', { role: 'paragraph' })).toBeVisible({ timeout: 10000 });
  });

  test('accepts correct credentials', async ({ page }) => {
    await page.goto('/admin');
    await page.getByLabel(/логин/i).fill('admin');
    await page.getByLabel(/пароль/i).fill('admin123');
    await page.getByRole('button', { name: /войти/i }).click();
    await expect(page.getByRole('button', { name: /викторины/i })).toBeVisible({ timeout: 15000 });
  });
});
