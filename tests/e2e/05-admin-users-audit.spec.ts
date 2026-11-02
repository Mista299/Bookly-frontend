import { test, expect } from '@playwright/test';
import { clearAuth, loginAdmin } from './helpers';

test.describe('Admin → Usuarios / Roles / Auditoría', () => {

  test('buscar usuarios lista los del seed', async ({ page }) => {
    await clearAuth(page);
    await loginAdmin(page);
    await page.goto('/admin/users');

    // La búsqueda del backend ordena por nombre completo y limita a 10
    // resultados, así que cada usuario del seed se localiza por su nombre.
    for (const nombre of ['María Restrepo', 'Juan Pérez', 'Ana Sánchez', 'Pedro Gómez']) {
      await page.getByRole('searchbox', { name: 'Buscar' }).fill(nombre);
      await page.waitForTimeout(600); // debounce 280ms + red
      await expect(page.getByText(nombre).first()).toBeVisible({ timeout: 8_000 });
    }
  });

  test('búsqueda vacía muestra estado vacío', async ({ page }) => {
    await clearAuth(page);
    await loginAdmin(page);
    await page.goto('/admin/users');
    await page.getByRole('searchbox', { name: 'Buscar' }).fill('zzzzzzz-no-existe');
    await page.waitForTimeout(1500);
    await expect(page.getByText('Sin resultados')).toBeVisible({ timeout: 5_000 });
  });

  test('modal de cambio de rol abre', async ({ page }) => {
    await clearAuth(page);
    await loginAdmin(page);
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await page.getByRole('searchbox', { name: 'Buscar' }).fill('juan');
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Cambiar rol' }).first().click();
    await expect(page.getByText('Cambiar rol').first()).toBeVisible();
    // El select debe tener 3 opciones (texto en español)
    const select = page.locator('select').first();
    const options = await select.locator('option').allTextContents();
    expect(options).toEqual(expect.arrayContaining(['Cliente', 'Profesional', 'Administrador']));
  });

  test('reset password muestra la contraseña temporal', async ({ page }) => {
    await clearAuth(page);
    await loginAdmin(page);
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await page.getByRole('searchbox', { name: 'Buscar' }).fill('juan');
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Restablecer contraseña' }).first().click();
    // El modal muestra la contraseña temporal
    await expect(page.getByText(/Contraseña temporal/i)).toBeVisible({ timeout: 8_000 });
  });

  test('auditoría muestra las entradas del seed', async ({ page }) => {
    await clearAuth(page);
    await loginAdmin(page);
    await page.goto('/admin/audit');
    await page.waitForLoadState('networkidle');
    // Filtros visibles
    await expect(page.getByLabel('Desde')).toBeVisible();
    await expect(page.getByLabel('Hasta')).toBeVisible();
    // Llenar filtros (el backend los requiere) y aplicar
    await page.getByLabel('Desde').fill('2026-01-01T00:00');
    await page.getByLabel('Hasta').fill('2027-01-01T00:00');
    await page.getByRole('button', { name: 'Aplicar' }).click();
    // Esperar a que cargue la lista
    await expect(page.getByText('BOOKING_CREATED').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('BOOKING_CANCELLED').first()).toBeVisible();
    await expect(page.getByText('ROLE_CHANGED').first()).toBeVisible();
  });

  test('auditoría paginación funciona', async ({ page }) => {
    await clearAuth(page);
    await loginAdmin(page);
    await page.goto('/admin/audit');
    await page.waitForLoadState('networkidle');
    // Llenar filtros y aplicar
    await page.getByLabel('Desde').fill('2026-01-01T00:00');
    await page.getByLabel('Hasta').fill('2027-01-01T00:00');
    await page.getByRole('button', { name: 'Aplicar' }).click();
    // Solo hay 6 entradas, todas en página 1 → pager visible
    await expect(page.getByText(/Página 1 de 1/).first()).toBeVisible({ timeout: 10_000 });
  });
});
