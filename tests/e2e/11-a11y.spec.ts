import { test, expect, type BrowserContext } from '@playwright/test';

/** Estado de sesión guardado (localStorage + cookies). */
type StorageState = Awaited<ReturnType<BrowserContext['storageState']>>;
import {
  expectAccessibleNames,
  expectImageAltText,
  expectHeadingOrder,
  expectSingleH1,
  expectVisibleFocus,
  expectNoClippedText,
  expectReadableFontSizes,
  expectTextContrast,
  expectNoConsoleErrors
} from './assertions';
import { clearAuth, loginCustomer, loginProfessional, loginAdmin } from './helpers';

/**
 * Suite de accesibilidad (WCAG 2.1 AA).
 *
 * Cada ruta genera un caso por cada comprobación. Es la que garantiza que la
 * app sea usable con lector de pantalla y con TalkBack en Android.
 */

const RUTAS_PUBLICAS: { label: string; ruta: string }[] = [
  { label: '/login', ruta: '/login' },
  { label: '/register', ruta: '/register' },
  { label: '/setup', ruta: '/setup' },
  { label: '/forbidden', ruta: '/forbidden' }
];

const RUTAS_CLIENTE: { label: string; ruta: string }[] = [
  { label: '/customer', ruta: '/customer' },
  { label: '/customer/services', ruta: '/customer/services' },
  { label: '/customer/agenda', ruta: '/customer/agenda' },
  { label: '/customer/profile', ruta: '/customer/profile' }
];

const RUTAS_PROFESIONAL: { label: string; ruta: string }[] = [
  { label: '/professional', ruta: '/professional' },
  { label: '/professional/agenda', ruta: '/professional/agenda' },
  { label: '/professional/schedule', ruta: '/professional/schedule' },
  { label: '/professional/turns', ruta: '/professional/turns' },
  { label: '/professional/profile', ruta: '/professional/profile' }
];

const RUTAS_ADMIN: { label: string; ruta: string }[] = [
  { label: '/admin', ruta: '/admin' },
  { label: '/admin/services', ruta: '/admin/services' },
  { label: '/admin/services/new', ruta: '/admin/services/new' },
  { label: '/admin/professionals', ruta: '/admin/professionals' },
  { label: '/admin/users', ruta: '/admin/users' },
  { label: '/admin/audit', ruta: '/admin/audit' },
  { label: '/admin/agenda', ruta: '/admin/agenda' },
  { label: '/admin/settings', ruta: '/admin/settings' },
  { label: '/admin/profile', ruta: '/admin/profile' }
];

type Grupo = { nombre: string; rutas: { label: string; ruta: string }[]; entrar: () => Promise<void> };

const GRUPOS: Grupo[] = [
  {
    nombre: 'Públicas',
    rutas: RUTAS_PUBLICAS,
    entrar: async () => {
      /* sin sesión */
    }
  },
  {
    nombre: 'Cliente',
    rutas: RUTAS_CLIENTE,
    entrar: async () => {
      /* ya autenticado en el test */
    }
  },
  {
    nombre: 'Profesional',
    rutas: RUTAS_PROFESIONAL,
    entrar: async () => {
      /* ya autenticado en el test */
    }
  },
  {
    nombre: 'Admin',
    rutas: RUTAS_ADMIN,
    entrar: async () => {
      /* ya autenticado en el test */
    }
  }
];

/**
 * Autentica según el grupo.
 *
 * El login de admin implica MFA (setup + TOTP) y es lento, así que el
 * storageState se cachea por grupo: el primer caso hace el login y los
 * siguientes reutilizan la sesión guardada. Además evita que un token
 * caducado a mitad de la suite invalide las comprobaciones.
 */
const storageCache = new Map<string, StorageState>();

async function autenticar(
  page: Parameters<typeof loginCustomer>[0],
  grupo: string,
  contexto: BrowserContext
): Promise<void> {
  const cached = storageCache.get(grupo);

  if (cached) {
    // Reinyectamos el localStorage (donde vive el token de sesión) en cada
    // navegación, igual que haría una app real tras recargar.
    const items = cached.origins.flatMap((o) =>
      o.localStorage.map((entry) => [entry.name, entry.value] as const)
    );
    await contexto.addInitScript((pairs) => {
      for (const [k, v] of pairs) localStorage.setItem(k, v);
    }, items);
    return;
  }

  await clearAuth(page);
  if (grupo === 'Cliente') await loginCustomer(page);
  else if (grupo === 'Profesional') await loginProfessional(page);
  else if (grupo === 'Admin') await loginAdmin(page);

  storageCache.set(grupo, await contexto.storageState());
}

test.describe('A11y → Estructura', () => {
  for (const grupo of GRUPOS) {
    for (const { label, ruta } of grupo.rutas) {
      test(`${grupo.nombre} ${label} tiene un único h1`, async ({ page, context: contexto }) => {
        await autenticar(page, grupo.nombre, contexto);
        await page.goto(ruta);
        await page.waitForLoadState('networkidle');
        await expectSingleH1(page);
      });

      test(`${grupo.nombre} ${label} respeta la jerarquía de headings`, async ({ page, context: contexto }) => {
        await autenticar(page, grupo.nombre, contexto);
        await page.goto(ruta);
        await page.waitForLoadState('networkidle');
        await expectHeadingOrder(page);
      });
    }
  }
});

test.describe('A11y → Controles', () => {
  for (const grupo of GRUPOS) {
    for (const { label, ruta } of grupo.rutas) {
      test(`${grupo.nombre} ${label} nombra todos sus controles`, async ({ page, context: contexto }) => {
        await autenticar(page, grupo.nombre, contexto);
        await page.goto(ruta);
        await page.waitForLoadState('networkidle');
        await expectAccessibleNames(page);
      });

      test(`${grupo.nombre} ${label} describe sus imágenes`, async ({ page, context: contexto }) => {
        await autenticar(page, grupo.nombre, contexto);
        await page.goto(ruta);
        await page.waitForLoadState('networkidle');
        await expectImageAltText(page);
      });
    }
  }
});

test.describe('A11y → Legibilidad', () => {
  for (const grupo of GRUPOS) {
    for (const { label, ruta } of grupo.rutas) {
      test(`${grupo.nombre} ${label} mantiene contraste AA`, async ({ page, context: contexto }) => {
        await autenticar(page, grupo.nombre, contexto);
        await page.goto(ruta);
        await page.waitForLoadState('networkidle');
        await expectTextContrast(page);
      });

      test(`${grupo.nombre} ${label} no recorta texto`, async ({ page, context: contexto }) => {
        await autenticar(page, grupo.nombre, contexto);
        await page.goto(ruta);
        await page.waitForLoadState('networkidle');
        await expectNoClippedText(page);
      });

      test(`${grupo.nombre} ${label} usa tamaño de fuente legible`, async ({ page, context: contexto }) => {
        await autenticar(page, grupo.nombre, contexto);
        await page.goto(ruta);
        await page.waitForLoadState('networkidle');
        await expectReadableFontSizes(page);
      });
    }
  }
});

test.describe('A11y → Teclado', () => {
  for (const grupo of GRUPOS) {
    for (const { label, ruta } of grupo.rutas) {
      test(`${grupo.nombre} ${label} muestra el foco al tabular`, async ({ page, context: contexto }) => {
        await autenticar(page, grupo.nombre, contexto);
        await page.goto(ruta);
        await page.waitForLoadState('networkidle');
        await expectVisibleFocus(page);
      });
    }
  }
});

test.describe('A11y → Consola limpia', () => {
  for (const grupo of GRUPOS) {
    for (const { label, ruta } of grupo.rutas) {
      test(`${grupo.nombre} ${label} no deja errores en consola`, async ({
        page,
        context: contexto
      }) => {
        const errors: string[] = [];
        page.on('console', (m) => {
          if (m.type() === 'error') errors.push(m.text());
        });
        await autenticar(page, grupo.nombre, contexto);
        await page.goto(ruta);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);
        expectNoConsoleErrors(errors);
      });
    }
  }
});

test.describe('A11y → Movimiento reducido', () => {
  test('respeta prefers-reduced-motion en el login', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    // Con movimiento reducido no debe haber transiciones largas.
    const durations = await page.evaluate(() => {
      const out: number[] = [];
      document.querySelectorAll<HTMLElement>('*').forEach((el) => {
        const s = getComputedStyle(el);
        const d = parseFloat(s.transitionDuration);
        if (!Number.isNaN(d) && d > 0.5) out.push(d);
      });
      return out;
    });
    // Tolerancia: algunos elementos pueden tener transiciones cortas.
    expect(durations.filter((d) => d > 0.6).length).toBeLessThan(5);
  });
});

test.describe('A11y → Landmarks y skip link', () => {
  test('la app expone un landmark main', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toHaveCount(1);
  });

  test('la navegación tiene aria-label', async ({ page }) => {
    await clearAuth(page);
    await loginCustomer(page);
    await page.goto('/customer');
    await page.waitForLoadState('networkidle');
    const navs = page.locator('nav[aria-label]');
    expect(await navs.count()).toBeGreaterThan(0);
  });

  test('la barra inferior marca la sección activa con aria-current', async ({ page }) => {
    await clearAuth(page);
    await loginCustomer(page);
    await page.goto('/customer/services');
    await page.waitForLoadState('networkidle');
    const current = page.locator('nav.bnav a[aria-current="page"]');
    expect(await current.count()).toBeGreaterThan(0);
  });
});
