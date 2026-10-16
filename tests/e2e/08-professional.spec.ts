import { test, expect } from '@playwright/test';
import { clearAuth, loginCustomer, loginProfessional, expectOnPath } from './helpers';

test.describe('Professional → Schedule / Agenda / Turns', () => {
  test('home del profesional muestra turnos de hoy', async ({ page }) => {
    await clearAuth(page);
    await loginProfessional(page);
    await expectOnPath(page, /\/professional$/);
    // El label del counter o el heading "Turnos del día" deben estar
    await expect(page.locator('.counter__label').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('heading', { name: 'Turnos del día' })).toBeVisible();
  });

  test('schedule editor muestra las 10 franjas precargadas', async ({ page }) => {
    await clearAuth(page);
    await loginProfessional(page);
    await page.goto('/professional/schedule');
    await expect(page.getByRole('heading', { name: /Mi horario/ })).toBeVisible();
    // Cada día (L-V) tiene 2 franjas = 10 inputs time total
    const timeInputs = page.locator('input[type="time"]');
    await expect(timeInputs).toHaveCount(20, { timeout: 8_000 }); // 5 días × 2 franjas × 2 (inicio+fin)
  });

  test('agenda del profesional se ve', async ({ page }) => {
    await clearAuth(page);
    await loginProfessional(page);
    await page.goto('/professional/agenda');
    await expect(page.getByRole('heading', { name: /Mi agenda|Disponibilidad/ })).toBeVisible();
  });

  test('turns lista agrupada con filtros', async ({ page }) => {
    await clearAuth(page);
    await loginProfessional(page);
    await page.goto('/professional/turns');
    // El listado de turnos carga. Sin customerName del backend,
    // se muestra "Cliente" como placeholder. Verificamos que la página
    // carga con al menos un día o un turno (o empty state).
    await expect(page.getByRole('heading', { name: 'Turnos.' })).toBeVisible();
    // Filtros
    await expect(page.getByRole('button', { name: 'Todos' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Confirmados' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancelados' })).toBeVisible();
  });

  test('profile tiene botón logout y cambio contraseña', async ({ page }) => {
    await clearAuth(page);
    await loginProfessional(page);
    await page.goto('/professional/profile');
    // El nombre aparece en el nav y en la card. Usar el heading.
    await expect(page.getByRole('heading', { name: 'Perfil.' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Cambiar contraseña/ })).toBeVisible();
    // Hay 2 botones "Cerrar sesión": uno en el nav y otro en la card. Usar el primero.
    await expect(page.getByRole('button', { name: 'Cerrar sesión' }).first()).toBeVisible();
  });
});
