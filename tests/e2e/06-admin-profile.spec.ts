import { test, expect } from '@playwright/test';
import { clearAuth, loginAdmin } from './helpers';

test.describe('Admin → Profile (MFA settings, cambio contraseña)', () => {

  test('cambio de contraseña valida campos', async ({ page }) => {
    await clearAuth(page);
    await loginAdmin(page);
    await page.goto('/admin/profile');
    await page.getByRole('button', { name: /Cambiar contraseña/ }).click();
    // Rellenar y enviar
    await page.getByLabel('Contraseña actual').fill('WrongPass1234!');
    await page.getByLabel('Nueva contraseña', { exact: false }).first().fill('Admin123!Pass');
    await page.getByLabel('Repite la nueva contraseña').fill('Admin123!Pass');
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    // El backend rechaza la contraseña actual. El error se muestra inline en
    // el modal (y además en un toast).
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole('alert')).toContainText(/incorrecta|inválida/i);
  });

  test('profile muestra el email y rol del admin', async ({ page }) => {
    await clearAuth(page);
    await loginAdmin(page);
    await page.goto('/admin/profile');
    await expect(page.getByText('admin@bookly.local').first()).toBeVisible();
    await expect(page.getByText('QA Admin').first()).toBeVisible();
  });
});
