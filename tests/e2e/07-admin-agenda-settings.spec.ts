import { test, expect } from '@playwright/test';
import { clearAuth, loginAdmin, completeMfaSetup, resetMfaForUser } from './helpers';

test.describe('Admin → Agenda y Settings', () => {
  test.beforeEach(async () => {
    await resetMfaForUser('admin@bookly.com');
  });

  test('agenda admin carga sin error', async ({ page }) => {
    await clearAuth(page);
    await loginAdmin(page);
    if (page.url().includes("/login/mfa-setup")) { await completeMfaSetup(page); await page.waitForURL(/admin/, { timeout: 15_000 }); }
    await page.goto('/admin/agenda');
    // Calendar presente
    await expect(page.locator('.cal--day, .cal--week').first()).toBeVisible({ timeout: 10_000 });
  });

  test('settings tiene atajos a Usuarios, Auditoría, Agenda', async ({ page }) => {
    await clearAuth(page);
    await loginAdmin(page);
    if (page.url().includes("/login/mfa-setup")) { await completeMfaSetup(page); await page.waitForURL(/admin/, { timeout: 15_000 }); }
    await page.goto('/admin/settings');
    await expect(page.getByRole('link', { name: /Usuarios/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Auditoría/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Horarios|Calendario|Agenda/i })).toBeVisible();
  });
});
