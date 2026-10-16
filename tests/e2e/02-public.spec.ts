import { test, expect } from '@playwright/test';
import { clearAuth } from './helpers';

test.describe('Páginas públicas (sin auth)', () => {
  test('/login muestra links a /register y /setup', async ({ page }) => {
    await clearAuth(page);
    await page.goto('/login');
    await expect(page.getByRole('link', { name: 'Crear cuenta de cliente' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Configurar plataforma' })).toBeVisible();
  });

  test('/register muestra el formulario completo', async ({ page }) => {
    await clearAuth(page);
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Crea tu cuenta' })).toBeVisible();
    await expect(page.getByLabel('Nombre completo')).toBeVisible();
    await expect(page.getByLabel('Correo')).toBeVisible();
    await expect(page.getByLabel('Contraseña')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Crear cuenta' })).toBeVisible();
  });

  test('/register valida email y contraseña antes de enviar', async ({ page }) => {
    await clearAuth(page);
    await page.goto('/register');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    await page.waitForTimeout(500);
    await page.getByLabel('Nombre completo').fill('Test User');
    await page.getByLabel('Correo').fill('correo-malo');
    await page.getByLabel('Contraseña').fill('Bookly1234!'); // contraseña fuerte
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    // El email inválido dispara error inline
    await expect(page.getByText('Introduce un correo válido.')).toBeVisible({ timeout: 5_000 });
  });

  test('/register valida contraseña débil', async ({ page }) => {
    await clearAuth(page);
    await page.goto('/register');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    await page.waitForTimeout(500);
    await page.getByLabel('Nombre completo').fill('Test User');
    await page.getByLabel('Correo').fill('user@bookly.test');
    await page.getByLabel('Contraseña').fill('123');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    // Email válido + contraseña débil → al menos debe seguir en /register (no redirige)
    await expect(page).toHaveURL(/\/register/, { timeout: 5_000 });
  });

  test('/register crea un CUSTOMER nuevo y redirige a /login', async ({ page }) => {
    await clearAuth(page);
    const email = `e2e+${Date.now()}@bookly.test`;
    await page.goto('/register');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    await page.getByLabel('Nombre completo').fill('E2E User');
    await page.getByLabel('Correo').fill(email);
    await page.getByLabel('Contraseña').fill('Bookly1234!');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('/setup muestra el formulario de plataforma', async ({ page }) => {
    await clearAuth(page);
    await page.goto('/setup');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Configura tu plataforma' })).toBeVisible();
    // Esperar a que el form esté presente
    await page.waitForSelector('form input', { timeout: 5_000 });
    await expect(page.getByLabel('Nombre de la plataforma')).toBeVisible();
    await expect(page.getByLabel('Correo del administrador')).toBeVisible();
    // El campo de contraseña es el único con label "Contraseña" en este formulario
    await expect(page.locator('input').nth(2)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Configurar plataforma' })).toBeVisible();
  });

  test('/forbidden se ve cuando un usuario sin permisos llega', async ({ page }) => {
    await clearAuth(page);
    await page.goto('/forbidden');
    await expect(page.getByRole('heading', { name: 'Acceso denegado' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Volver/i })).toBeVisible();
  });

  test('+error.svelte renderiza 404', async ({ page }) => {
    await clearAuth(page);
    await page.goto('/this-does-not-exist-404');
    await expect(page.getByRole('heading', { name: /no encontr|página/i })).toBeVisible({ timeout: 8_000 });
  });
});
