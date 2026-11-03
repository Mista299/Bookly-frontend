import { test, expect } from '@playwright/test';

test.describe('Smoke', () => {
  test('frontend responde y redirige a /login', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/login$/, { timeout: 10_000 });
    await expect(page.getByText('Entra a tu cuenta.')).toBeVisible();
  });

  test('splash ya no muestra el BOOKLY loading', async ({ page }) => {
    await page.goto('/');
    // No debería quedarse en el splash para siempre
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(page.url()).toMatch(/\/login/);
  });
});
