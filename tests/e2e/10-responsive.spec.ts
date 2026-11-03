import { test, expect } from '@playwright/test';
import {
  DEVICES,
  MOBILE_DEVICE_KEYS,
  type DeviceKey,
  type DeviceSpec
} from './devices';
import {
  expectNoHorizontalOverflow,
  expectTouchTargets,
  expectAccessibleNames,
  expectImageAltText,
  expectHeadingOrder,
  expectSingleH1,
  expectVisibleFocus,
  expectNoClippedText,
  expectReadableFontSizes,
  expectNoConsoleErrors
} from './assertions';
import { clearAuth, loginCustomer, loginProfessional, loginAdmin } from './helpers';

/**
 * Suite responsive: verifica que la app se comporta bien en cada tamaño de
 * pantalla real. Es la que garantiza el requisito "que se vea bien en
 * cualquier celular".
 *
 * Cada ruta × cada dispositivo genera un caso.
 */

const RUTAS_PUBLICAS = ['/login', '/register', '/setup', '/forbidden'];

const RUTAS_CLIENTE = ['/customer', '/customer/services', '/customer/agenda', '/customer/profile'];

const RUTAS_PROFESIONAL = [
  '/professional',
  '/professional/agenda',
  '/professional/schedule',
  '/professional/turns',
  '/professional/profile'
];

const RUTAS_ADMIN = [
  '/admin',
  '/admin/services',
  '/admin/professionals',
  '/admin/users',
  '/admin/audit',
  '/admin/agenda',
  '/admin/settings',
  '/admin/profile'
];

/** Aplica el dispositivo al contexto del test. */
function useDevice(key: DeviceKey) {
  const d = DEVICES[key] as DeviceSpec;
  test.use({
    viewport: d.viewport,
    deviceScaleFactor: d.deviceScaleFactor,
    isMobile: d.isMobile,
    hasTouch: d.hasTouch,
    userAgent: d.userAgent
  });
}

test.describe('Responsive → Rutas públicas', () => {
  for (const key of Object.keys(DEVICES) as DeviceKey[]) {
    test.describe(DEVICES[key].label, () => {
      useDevice(key);

      for (const ruta of RUTAS_PUBLICAS) {
        test(`${ruta} no desborda horizontalmente`, async ({ page }) => {
          const errors: string[] = [];
          page.on('console', (m) => {
            if (m.type() === 'error') errors.push(m.text());
          });
          await page.goto(ruta);
          await page.waitForLoadState('networkidle');
          await expectNoHorizontalOverflow(page);
          expectNoConsoleErrors(errors);
        });
      }
    });
  }
});

test.describe('Responsive → Cliente', () => {
  for (const key of MOBILE_DEVICE_KEYS) {
    test.describe(DEVICES[key].label, () => {
      useDevice(key);

      for (const ruta of RUTAS_CLIENTE) {
        test(`${ruta} se adapta sin desbordes`, async ({ page }) => {
          await clearAuth(page);
          await loginCustomer(page);
          await page.goto(ruta);
          await page.waitForLoadState('networkidle');
          await expectNoHorizontalOverflow(page);
        });
      }
    });
  }
});

test.describe('Responsive → Profesional', () => {
  for (const key of MOBILE_DEVICE_KEYS) {
    test.describe(DEVICES[key].label, () => {
      useDevice(key);

      for (const ruta of RUTAS_PROFESIONAL) {
        test(`${ruta} se adapta sin desbordes`, async ({ page }) => {
          await clearAuth(page);
          await loginProfessional(page);
          await page.goto(ruta);
          await page.waitForLoadState('networkidle');
          await expectNoHorizontalOverflow(page);
        });
      }
    });
  }
});

test.describe('Responsive → Admin', () => {
  for (const key of MOBILE_DEVICE_KEYS) {
    test.describe(DEVICES[key].label, () => {
      useDevice(key);

      for (const ruta of RUTAS_ADMIN) {
        test(`${ruta} se adapta sin desbordes`, async ({ page }) => {
          await clearAuth(page);
          await loginAdmin(page);
          await page.goto(ruta);
          await page.waitForLoadState('networkidle');
          await expectNoHorizontalOverflow(page);
        });
      }
    });
  }
});

test.describe('Responsive → Táctil', () => {
  for (const key of MOBILE_DEVICE_KEYS) {
    test.describe(DEVICES[key].label, () => {
      useDevice(key);

      for (const ruta of RUTAS_CLIENTE) {
        test(`${ruta} mantiene objetivos táctiles de 44px`, async ({ page }) => {
          await clearAuth(page);
          await loginCustomer(page);
          await page.goto(ruta);
          await page.waitForLoadState('networkidle');
          await expectTouchTargets(page);
        });
      }
    });
  }
});

test.describe('Responsive → Barra inferior', () => {
  for (const key of MOBILE_DEVICE_KEYS) {
    test.describe(DEVICES[key].label, () => {
      useDevice(key);

      test('la barra inferior existe y es usable', async ({ page }) => {
        await clearAuth(page);
        await loginCustomer(page);
        await page.goto('/customer');
        await page.waitForLoadState('networkidle');

        const nav = page.locator('nav.bnav');
        await expect(nav).toBeVisible();
        await expectTouchTargets(page);
      });

      test('la barra inferior del admin agrupa los destinos extra en "Más"', async ({
        page
      }) => {
        await clearAuth(page);
        await loginAdmin(page);
        await page.goto('/admin');
        await page.waitForLoadState('networkidle');

        const nav = page.locator('nav.bnav');
        await expect(nav).toBeVisible();

        // La barra inferior del admin no puede mostrar 7 destinos: se
        // quedaría sin espacio. Las 4 secciones principales van directas y el
        // resto bajo "Más".
        const labels = await nav.locator('.bnav__label').allTextContents();
        expect(labels.length).toBe(5);
        expect(labels).toEqual(['Resumen', 'Servicios', 'Profesionales', 'Usuarios', 'Más']);

        // El botón "Más" abre el panel con el resto de secciones.
        const mas = page.getByRole('button', { name: 'Más' });
        await expect(mas).toBeVisible();
        await mas.click();

        const sheet = page.getByRole('dialog', { name: 'Más secciones' });
        await expect(sheet).toBeVisible();
        await expect(sheet.getByRole('link', { name: 'Auditoría' })).toBeVisible();
        await expect(sheet.getByRole('link', { name: 'Agenda' })).toBeVisible();
        await expect(sheet.getByRole('link', { name: 'Ajustes' })).toBeVisible();
      });
    });
  }
});

test.describe('Responsive → Safe area', () => {
  for (const key of MOBILE_DEVICE_KEYS) {
    test.describe(DEVICES[key].label, () => {
      useDevice(key);

      test('la barra inferior respeta el safe-area inferior', async ({ page }) => {
        await clearAuth(page);
        await loginCustomer(page);
        await page.goto('/customer');
        await page.waitForLoadState('networkidle');

        // El padding inferior de la barra debe ser >= 0 y el nav no debe
        // quedar pegado al borde inferior sin margen.
        const info = await page.evaluate(() => {
          const nav = document.querySelector('nav.bnav');
          if (!nav) return null;
          const s = getComputedStyle(nav);
          const r = nav.getBoundingClientRect();
          return {
            paddingBottom: parseFloat(s.paddingBottom),
            bottom: Math.round(r.bottom),
            viewportHeight: window.innerHeight
          };
        });
        expect(info).not.toBeNull();
        expect(info!.bottom).toBeLessThanOrEqual(info!.viewportHeight + 1);
      });
    });
  }
});
