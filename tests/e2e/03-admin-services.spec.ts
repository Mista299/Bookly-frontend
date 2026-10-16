import { test, expect } from '@playwright/test';
import { clearAuth, loginAdmin, completeMfaSetup, resetMfaForUser } from './helpers';

test.describe('Admin → Servicios', () => {
  test.beforeEach(async () => {
    // Asegurar que el admin no tiene MFA para que vaya a mfa-setup
    await resetMfaForUser('admin@bookly.com');
  });

  test('admin entra vía MFA setup y llega a /admin', async ({ page }) => {
    await clearAuth(page);
    await loginAdmin(page);
    // Si está en /login/mfa-setup, completa (espera a que redirija a /admin solo)
    if (page.url().includes('/login/mfa-setup')) {
      await completeMfaSetup(page);
      await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 });
    } else {
      await expect(page).toHaveURL(/\/admin/, { timeout: 10_000 });
    }
  });

  test('overview de admin muestra conteos de servicios', async ({ page }) => {
    await clearAuth(page);
    await loginAdmin(page);
    if (page.url().includes('/login/mfa-setup')) {
      await completeMfaSetup(page);
      await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 });
    }
    await expect(page.getByText('Servicios publicados')).toBeVisible();
    await expect(page.getByText('En pausa')).toBeVisible();
  });

  test('lista de servicios con filtros y búsqueda', async ({ page }) => {
    await clearAuth(page);
    await loginAdmin(page);
    if (page.url().includes('/login/mfa-setup')) {
      await completeMfaSetup(page);
      await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 });
    }
    await page.goto('/admin/services');
    await expect(page.getByText('Corte clásico')).toBeVisible();
    await expect(page.getByText('Tinte y color')).toBeVisible();
    // Filtrar
    await page.getByRole('button', { name: 'Inactivos' }).click();
    await expect(page.getByText('Tinte y color')).toBeVisible();
    await expect(page.getByText('Corte clásico')).not.toBeVisible();
  });

  test('crear servicio con validaciones', async ({ page }) => {
    await clearAuth(page);
    await loginAdmin(page);
    if (page.url().includes('/login/mfa-setup')) {
      await completeMfaSetup(page);
      await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 });
    }
    await page.goto('/admin/services/new');
    // Validación 1-480
    await page.getByLabel('Nombre').fill('E2E Servicio');
    await page.locator('select').first().selectOption({ label: 'Peluquería' });
    await page.getByLabel('Duración (minutos)').fill('0');
    await page.getByLabel('Precio (COP)').fill('0');
    await page.getByRole('button', { name: 'Crear servicio' }).click();
    await expect(page.getByText(/La duración debe estar entre 1 y 480/i)).toBeVisible();
    await expect(page.getByText(/El precio debe ser mayor a 0/i)).toBeVisible();
  });

  test('crear servicio válido redirige al detalle', async ({ page }) => {
    await clearAuth(page);
    await loginAdmin(page);
    if (page.url().includes('/login/mfa-setup')) {
      await completeMfaSetup(page);
      await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 });
    }
    await page.goto('/admin/services/new');
    const uniqueName = `E2E Test Service ${Date.now()}`;
    await page.getByLabel('Nombre').fill(uniqueName);
    await page.locator('select').first().selectOption({ label: 'Peluquería' });
    await page.getByLabel('Duración (minutos)').fill('45');
    await page.getByLabel('Precio (COP)').fill('30000');
    await page.getByRole('button', { name: 'Crear servicio' }).click();
    await expect(page).toHaveURL(/\/admin\/services\/[^/]+$/, { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: uniqueName })).toBeVisible();
  });

  test('detalle de servicio muestra bloque de asignación de profesionales', async ({ page }) => {
    await clearAuth(page);
    await loginAdmin(page);
    if (page.url().includes('/login/mfa-setup')) {
      await completeMfaSetup(page);
      await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 });
    }
    // Buscar el link al servicio "Corte clásico"
    await page.goto('/admin/services');
    await page.getByRole('link', { name: 'Corte clásico' }).first().click();
    await expect(page).toHaveURL(/\/admin\/services\/[^/]+$/);
    // El bloque de profesionales debe estar visible
    await expect(page.getByText(/Profesionales que ofrecen este servicio/i)).toBeVisible({ timeout: 8_000 });
    // Cristian López debe aparecer en el multiselect
    await expect(page.getByText('Cristian López').first()).toBeVisible();
  });
});
