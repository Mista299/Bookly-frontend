import { test, expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';
import { clearAuth, loginCustomer, expectOnPath } from './helpers';

/**
 * Crea una reserva desde la UI (catálogo → detalle → slot → confirmar).
 * Se usa cuando otra spec.cleanupó la tabla bookings y esta necesita una cita
 * visible en la agenda.
 *
 * El calendario arranca en "hoy", donde todos los huecos ya han pasado (o están
 * ocupados), así que avanzamos día a día con el control "Día siguiente" hasta
 * encontrar un slot libre dentro del horario del profesional.
 */
async function crearReservaPara(page: Page, servicio = 'Corte clásico') {
  await page.goto('/customer/services');
  await page.waitForLoadState('networkidle');
  const link = page.getByRole('link', { name: new RegExp(servicio) }).first();
  await expect(link).toBeVisible({ timeout: 10_000 });
  const href = await link.getAttribute('href');
  await page.goto(href!);
  await page.waitForLoadState('networkidle');

  const dateLabel = page.locator('.picker__date-label');
  await expect(dateLabel).toBeVisible({ timeout: 15_000 });
  const siguiente = page.getByRole('button', { name: 'Día siguiente' });

  // Probamos hasta 14 días: el profesional atiende L-V.
  for (let dia = 1; dia <= 14; dia++) {
    const antes = await dateLabel.textContent();
    await siguiente.click();
    await expect(dateLabel).not.toHaveText(antes ?? '', { timeout: 15_000 });
    await page.waitForTimeout(800);
    const slots = page.locator('button.day-slot:not([disabled])');
    const count = await slots.count();
    if (count > 0) {
      await slots.nth(Math.min(4, count - 1)).click();
      const confirmar = page.getByRole('button', { name: /Confirmar/ });
      await expect(confirmar).toBeEnabled({ timeout: 5_000 });
      await confirmar.click();
      await page.waitForTimeout(1500);
      return;
    }
  }
  throw new Error('No se encontró ningún slot disponible en 14 días');
}

test.describe('Customer → Servicios / Agenda / Reserva / Cancel', () => {
  test('home muestra featured y calendario', async ({ page }) => {
    await clearAuth(page);
    await loginCustomer(page);
    await expectOnPath(page, /\/customer/);
    // El home muestra los primeros servicios activos (slice 0,4). Comprobamos
    // que hay un bloque de servicios y que el calendario del día está presente.
    await expect(page.getByRole('heading', { name: 'Servicios' })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole('heading', { name: /Disponibilidad/i })).toBeVisible();
    await expect(page.locator('.day-slot').first()).toBeVisible({ timeout: 10_000 });
    // Y que al menos un servicio del dominio aparece en la lista.
    await expect(page.getByText(/Corte clásico|Manicura completa|Coloración completa/).first()).toBeVisible();
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
    // El seed E2E crea 2 reservas futuras para María. Otras specs pueden
    // consumir esos huecos, así que esta spec crea la suya si no encuentra
    // ninguna y luego vuelve a la agenda para comprobarla.
    const conReserva = page.getByText(/Corte clásico/).first();
    if (!(await conReserva.isVisible({ timeout: 5_000 }).catch(() => false))) {
      await crearReservaPara(page);
      await page.goto('/customer/agenda');
      await page.waitForLoadState('networkidle');
    }
    await expect(conReserva).toBeVisible({ timeout: 10_000 });
  });

  test('crear una reserva nueva funciona end-to-end', async ({ page }) => {
    // No se limpian todas las reservas (otras specs dependen del seed E2E):
    // el calendario solo necesita un slot libre en un día futuro.
    await clearAuth(page);
    await loginCustomer(page);

    // Ir al servicio "Manicura completa" (60 min). Vamos por URL directa tras
    // localizar el id del servicio en el catálogo: es más determinista que
    // hacer clic en el enlace (que puede perderse si la lista aún carga).
    await page.goto('/customer/services');
    await page.waitForLoadState('networkidle');
    const link = page.getByRole('link', { name: /Manicura completa/ }).first();
    await expect(link).toBeVisible({ timeout: 10_000 });
    const href = await link.getAttribute('href');
    expect(href).toBeTruthy();
    await page.goto(href!);
    await page.waitForLoadState('networkidle');

    // El control de fecha está siempre presente. Ojo: en "hoy" puede no haber
    // calendario (todas las franjas ya pasaron), así que no lo damos por hecho.
    const dateLabel = page.locator('.picker__date-label');
    await expect(dateLabel).toBeVisible({ timeout: 15_000 });

    // Buscamos un slot libre. El calendario arranca en "hoy" (ya pasado), así
    // que avanzamos días con el control "Día siguiente". Reservamos en un día
    // futuro para que la cita quede en la sección de "próximas" de la agenda.
    const siguiente = page.getByRole('button', { name: 'Día siguiente' });
    let slot: Locator | null = null;
    for (let dia = 1; dia <= 14; dia++) {
      const antes = await dateLabel.textContent();
      await siguiente.click();
      // Esperamos a que la fecha cambie (la disponibilidad se recarga por red).
      await expect(dateLabel).not.toHaveText(antes ?? '', { timeout: 15_000 });
      await page.waitForTimeout(800);
      const availableSlots = page.locator('button.day-slot:not([disabled])');
      const slotCount = await availableSlots.count();
      if (slotCount > 0) {
        slot = availableSlots.nth(Math.min(4, slotCount - 1));
        break;
      }
    }
    expect(slot, 'No se encontró ningún slot disponible en 14 días').not.toBeNull();

    await slot!.click();
    // Botón "Confirmar HH:mm" se habilita
    const confirmar = page.getByRole('button', { name: /Confirmar/ });
    await expect(confirmar).toBeEnabled({ timeout: 5_000 });
    // Y la reserva se confirma: la app navega sola a la agenda del cliente.
    await confirmar.click();
    await expect(page).toHaveURL(/\/customer\/agenda/, { timeout: 15_000 });
    await page.waitForLoadState('networkidle');

    // Verificamos el efecto real: la cita aparece en la agenda.
    await expect(page.getByText(/Manicura completa/).first()).toBeVisible({ timeout: 15_000 });
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
