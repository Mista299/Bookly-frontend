import { test, expect } from '@playwright/test';
import { clearAuth, loginAdmin, completeMfaSetup, resetMfaForUser } from './helpers';

test.describe('Admin → Profile (MFA settings, cambio contraseña)', () => {
  test.beforeEach(async () => {
    await resetMfaForUser('admin@bookly.com');
  });

  test('cambio de contraseña valida campos', async ({ page }) => {
    await clearAuth(page);
    await loginAdmin(page);
    if (page.url().includes("/login/mfa-setup")) { await completeMfaSetup(page); await page.waitForURL(/admin/, { timeout: 15_000 }); }
    await page.goto('/admin/profile');
    await page.getByRole('button', { name: /Cambiar contraseña/ }).click();
    // Rellenar y enviar
    await page.getByLabel('Contraseña actual').fill('WrongPass1234!');
    await page.getByLabel('Nueva contraseña', { exact: true }).fill('Bookly1234!');
    await page.getByLabel('Confirmar nueva contraseña').fill('Bookly1234!');
    await page.getByRole('button', { name: 'Actualizar contraseña' }).click();
    // Backend debería responder error (current incorrecta)
    await expect(page.getByText(/actual es incorrecta|current password|incorrecta/i)).toBeVisible({ timeout: 8_000 });
  });

  test('profile muestra el email y rol del admin', async ({ page }) => {
    await clearAuth(page);
    await loginAdmin(page);
    if (page.url().includes("/login/mfa-setup")) { await completeMfaSetup(page); await page.waitForURL(/admin/, { timeout: 15_000 }); }
    await page.goto('/admin/profile');
    await expect(page.getByText('admin@bookly.com')).toBeVisible();
    await expect(page.getByText('Administradora Demo')).toBeVisible();
  });
});
