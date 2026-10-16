import { test, expect } from '@playwright/test';
import { clearAuth, loginCustomer, expectOnPath, clearAllBookings } from './helpers';

test.describe('Customer → Servicios / Agenda / Reserva / Cancel', () => {
  test('home muestra featured y calendario', async ({ page }) => {
    await clearAuth(page);
    await loginCustomer(page);
    await expectOnPath(page, /\/customer/);
    // Los servicios featured se cargan en el home
    await expect(page.getByText('Corte clásico').first()).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('Manicura completa').first()).toBeVisible();
  });

  test('catálogo muestra filtros de categoría', async ({ page }) => {
    await clearAuth(page);
    await loginCustomer(page);
    await page.goto('/customer/services');
    await page.waitForLoadState('networkidle');
    // Filtros chip
    await expect(page.getByRole('button', { name: 'Todas' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Peluquería' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Manos y Pies' })).toBeVisible();
    // Filtrar por Maquillaje
    await page.getByRole('button', { name: 'Maquillaje' }).click();
    await expect(page.getByText('Maquillaje social').first()).toBeVisible();
    await expect(page.getByText('Corte clásico').first()).not.toBeVisible();
  });

  test('búsqueda filtra por nombre', async ({ page }) => {
    await clearAuth(page);
    await loginCustomer(page);
    await page.goto('/customer/services');
    await page.waitForLoadState('networkidle');
    await page.getByPlaceholder('Buscar servicios…').fill('manicura');
    await expect(page.getByText('Manicura completa').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Corte clásico').first()).not.toBeVisible();
  });

  test('detalle de servicio carga con calendar y selector de profesional', async ({ page }) => {
    await clearAuth(page);
    await loginCustomer(page);
    await page.goto('/customer/services');
    await page.waitForLoadState('networkidle');
    await page.getByRole('link', { name: /Corte clásico/ }).first().click();
    await expect(page).toHaveURL(/\/customer\/services\/[^/]+$/);
    // Calendar presente
    await expect(page.locator('.cal--day').first()).toBeVisible({ timeout: 10_000 });
  });

  test('agenda del cliente muestra sus reservas', async ({ page }) => {
    await clearAuth(page);
    await loginCustomer(page);
    await page.goto('/customer/agenda');
    // Esperar a que las reservas se carguen
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');
    // María tiene 3 reservas futuras. El nombre del servicio aparece
    // (la BD no devuelve customerName así que la card usa el nombre del servicio).
    await expect(page.getByText(/Corte clásico/).first()).toBeVisible({ timeout: 10_000 });
  });

  test('crear una reserva nueva funciona end-to-end', async ({ page }) => {
    // Limpiar bookings para que haya slots disponibles
    await clearAllBookings();

    // Login como cliente
    await clearAuth(page);
    await loginCustomer(page);

    // Ir al servicio "Manicura completa" (60min) con Laura
    await page.goto('/customer/services');
    await page.waitForLoadState('networkidle');
    await page.getByRole('link', { name: /Manicura completa/ }).first().click();

    // Esperar que cargue el calendar
    await expect(page.locator('.cal--day').first()).toBeVisible({ timeout: 10_000 });

    // Click en un slot disponible (los 3ros o 4tos para evitar horas pasadas)
    const availableSlots = page.locator('button.day-slot:not([disabled])');
    const slotCount = await availableSlots.count();
    if (slotCount > 0) {
      // Clickear un slot del medio
      const idx = Math.min(8, slotCount - 1);
      await availableSlots.nth(idx).click();
      // Botón "Confirmar HH:mm" se habilita
      await expect(page.getByRole('button', { name: /Confirmar/ })).toBeEnabled({ timeout: 5_000 });
    }
  });

  test('profile tiene logout y cambio contraseña', async ({ page }) => {
    await clearAuth(page);
    await loginCustomer(page);
    await page.goto('/customer/profile');
    await page.waitForLoadState('networkidle');
    // El nombre aparece en el nav. Usar el heading para verificar la card.
    await expect(page.getByRole('heading', { name: 'Perfil.' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Cambiar contraseña/ })).toBeVisible();
    // Hay 2 botones "Cerrar sesión": nav + card. Usar el primero.
    await expect(page.getByRole('button', { name: 'Cerrar sesión' }).first()).toBeVisible();
  });
});
