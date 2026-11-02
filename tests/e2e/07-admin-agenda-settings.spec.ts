import { test, expect } from '@playwright/test';
import { clearAuth, loginAdmin } from './helpers';

test.describe('Admin → Agenda y Settings', () => {

  test('agenda admin carga sin error', async ({ page }) => {
    await clearAuth(page);
    await loginAdmin(page);
    await page.goto('/admin/agenda');
    // Calendar presente
    await expect(page.locator('.cal--day, .cal--week').first()).toBeVisible({ timeout: 10_000 });
  });

  test('settings tiene atajos a Usuarios, Auditoría, Agenda', async ({ page }) => {
    await clearAuth(page);
    await loginAdmin(page);
    await page.goto('/admin/settings');
    // Los accesos rápidos viven en .settings__link; el sidebar también tiene
    // enlaces con nombres parecidos, así que se acota el scope a la sección.
    const shortcuts = page.locator('.settings__link');
    await expect(shortcuts.filter({ hasText: 'Usuarios' })).toBeVisible();
    await expect(shortcuts.filter({ hasText: 'Auditoría' })).toBeVisible();
    await expect(shortcuts.filter({ hasText: /Agenda/i })).toBeVisible();
  });
});
