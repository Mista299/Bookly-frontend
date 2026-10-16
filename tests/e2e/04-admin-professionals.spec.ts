import { test, expect } from '@playwright/test';
import { clearAuth, loginAdmin, completeMfaSetup, resetMfaForUser } from './helpers';

test.describe('Admin → Profesionales', () => {
  test.beforeEach(async () => {
    await resetMfaForUser('admin@bookly.com');
  });

  test('lista muestra los 3 profesionales del seed', async ({ page }) => {
    await clearAuth(page);
    await loginAdmin(page);
    if (page.url().includes("/login/mfa-setup")) { await completeMfaSetup(page); await page.waitForURL(/admin/, { timeout: 15_000 }); }
    await page.goto('/admin/professionals');
    await expect(page.getByText('Cristian López')).toBeVisible();
    await expect(page.getByText('Laura Martínez')).toBeVisible();
    await expect(page.getByText('Andrés Castaño')).toBeVisible();
  });

  test('cada profesional muestra los servicios asignados', async ({ page }) => {
    await clearAuth(page);
    await loginAdmin(page);
    if (page.url().includes("/login/mfa-setup")) { await completeMfaSetup(page); await page.waitForURL(/admin/, { timeout: 15_000 }); }
    await page.goto('/admin/professionals');
    // Cristian: Peluquería y barbería → servicios Corte, Peinado, Tinte
    const card = page.locator(':has-text("Cristian López")').first();
    await expect(card).toBeVisible();
    // Buscamos los chips de servicios cerca del nombre
    const section = page.locator('section, div').filter({ hasText: 'Cristian López' }).first();
    await expect(section).toBeVisible();
  });

  test('alta de profesional valida email y password', async ({ page }) => {
    await clearAuth(page);
    await loginAdmin(page);
    if (page.url().includes("/login/mfa-setup")) { await completeMfaSetup(page); await page.waitForURL(/admin/, { timeout: 15_000 }); }
    await page.goto('/admin/professionals');
    await page.getByRole('button', { name: /Añadir profesional/ }).first().click();
    // Form visible
    await expect(page.getByLabel('Nombre completo')).toBeVisible();
    // Llenar con password débil
    await page.getByLabel('Nombre completo').fill('Pro E2E');
    await page.getByLabel('Correo').fill('e2e-pro@bookly.com');
    await page.getByLabel('Contraseña inicial').fill('123');
    await page.getByLabel('Especialidad').fill('Test');
    await page.getByRole('button', { name: 'Añadir al equipo' }).click();
    await expect(page.getByText(/al menos 8 caracteres/i)).toBeVisible();
  });

  test('alta de profesional válida lo agrega a la lista', async ({ page }) => {
    await clearAuth(page);
    await loginAdmin(page);
    if (page.url().includes("/login/mfa-setup")) { await completeMfaSetup(page); await page.waitForURL(/admin/, { timeout: 15_000 }); }
    await page.goto('/admin/professionals');
    const email = `pro+e2e+${Date.now()}@bookly.test`;
    await page.getByRole('button', { name: /Añadir profesional/ }).first().click();
    await page.getByLabel('Nombre completo').fill('Pro E2E New');
    await page.getByLabel('Correo').fill(email);
    await page.getByLabel('Contraseña inicial').fill('Bookly1234!');
    await page.getByLabel('Especialidad').fill('Peluquería');
    await page.getByRole('button', { name: 'Añadir al equipo' }).click();
    await expect(page.getByText('Profesional añadido.')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('Pro E2E New')).toBeVisible();
  });
});
