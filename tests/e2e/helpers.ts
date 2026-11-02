import { expect, type Page } from '@playwright/test';
import { TOTP, Secret } from 'otpauth';

const BACKEND = 'http://127.0.0.1:18080';
const FRONTEND = 'http://127.0.0.1:5173';

export type Role = 'admin' | 'admin-mfa' | 'professional' | 'customer';

const CREDS: Record<Role, { email: string; password: string }> = {
  admin:         { email: 'admin@bookly.local',        password: 'Admin123!Pass' },
  'admin-mfa':   { email: 'admin@bookly.local',        password: 'Admin123!Pass' },
  professional:  { email: 'prof.cristian@bookly.local',password: 'Prof123!Pass' },
  customer:      { email: 'cliente.maria@bookly.local', password: 'Client123!Pass' },
};

export async function clearAuth(page: Page) {
  await page.context().clearCookies();
  await page.evaluate(() => {
    try {
      localStorage.removeItem('bookly.token');
      localStorage.removeItem('bookly.user');
    } catch {
      // ignore
    }
  });
}

export async function loginUI(page: Page, role: Role) {
  const { email, password } = CREDS[role];
  await page.goto('/login');
  // SvelteKit sirve SSR y luego hidrata. Si interactuamos antes de la hidratación,
  // el form se submitea como HTML normal (recarga la página).
  await page.waitForLoadState('networkidle', { timeout: 15_000 });
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
}

export async function expectOnPath(page: Page, path: RegExp, timeout = 10_000) {
  await expect(page).toHaveURL(path, { timeout });
}

/**
 * Login de admin que resuelve el segundo factor por las dos vías (setup y
 * verify). Es idempotente y deja al usuario en /admin con sesión activa.
 */
export async function loginAdmin(page: Page) {
  await loginUI(page, 'admin');
  await page.waitForURL(/\/login\/(mfa|mfa-setup|admin)/, { timeout: 15_000 });

  if (/\/admin/.test(page.url())) return; // el backend devolvió accessToken

  if (/\/login\/mfa-setup/.test(page.url())) {
    await completeMfaSetup(page);
    await page.waitForURL(/\/admin/, { timeout: 15_000 });
    return;
  }

  // /login/mfa → recuperamos el secret enrolado de la base de datos.
  const secret = await readEnrolledSecret('admin@bookly.local');
  if (!secret) {
    throw new Error(
      'El admin está enrolado en MFA pero no se pudo leer el secret. ' +
        "Ejecuta resetMfaForUser('admin@bookly.local') antes del login."
    );
  }
  await verifyMfaCode(page, secret);
  await page.waitForURL(/\/admin/, { timeout: 15_000 });
}

/**
 * Login completo de admin incluyendo el segundo factor.
 * - Si el admin no está enrolado → recorre /login/mfa-setup leyendo el secret
 *   de la pantalla y calculando el TOTP.
 * - Si ya está enrolado → recorre /login/mfa con el secret conocido.
 * Devuelve el secret para reutilizarlo en asserts.
 */
export async function loginAdminFull(page: Page, knownSecret?: string): Promise<string> {
  await loginUI(page, 'admin');
  await page.waitForURL(/\/login\/(mfa|mfa-setup|admin)/, { timeout: 15_000 });

  if (/\/admin/.test(page.url())) {
    // Ya autenticado (admin sin MFA y backend devolvió accessToken).
    return knownSecret ?? '';
  }

  if (/\/login\/mfa-setup/.test(page.url())) {
    const secret = await completeMfaSetup(page, knownSecret);
    await page.waitForURL(/\/admin/, { timeout: 15_000 });
    return secret;
  }

  // /login/mfa — el secret debe ser conocido de antemano.
  if (!knownSecret) throw new Error('Admin enrolado: se necesita el secret MFA conocido');
  await verifyMfaCode(page, knownSecret);
  await page.waitForURL(/\/admin/, { timeout: 15_000 });
  return knownSecret;
}

/**
 * Lee el secret MFA enrolado de la base de datos y lo descifra.
 *
 * El backend guarda el secret cifrado con AES/GCM (ver TotpSecretCipher), con
 * la clave de `MFA_ENCRYPTION_KEY` en el .env del backend. Los tests necesitan
 * el secret en claro para calcular el TOTP del endpoint /login/mfa.
 *
 * Si no se puede descifrar, devuelve null y el caller resetea el MFA.
 */
export async function readEnrolledSecret(email: string): Promise<string | null> {
  const { exec } = await import('node:child_process');

  const encrypted = await new Promise<string | null>((resolve) => {
    exec(
      `docker exec backendcf-db psql -U backendcf -d backendcf -tAc "SELECT mfa_secret_encrypted FROM app_user WHERE email='${email}';" 2>/dev/null`,
      (err, stdout) => {
        if (err) return resolve(null);
        const value = stdout.trim();
        resolve(value && value !== '' ? value : null);
      }
    );
  });
  if (!encrypted) return null;

  // Clave de cifrado: .env del backend o variable de entorno.
  let key = process.env.MFA_ENCRYPTION_KEY ?? '';
  if (!key) {
    const { readFileSync } = await import('node:fs');
    const envPath =
      process.env.BACKEND_ENV ?? '/home/mista/Escritorio/udea/2026-II/calidad-software/Proyecto-FE/backendcf/.env';
    try {
      const m = readFileSync(envPath, 'utf8').match(/^MFA_ENCRYPTION_KEY=(.+)$/m);
      if (m) key = m[1].trim();
    } catch {
      // sin .env legible
    }
  }
  if (!key) return null;

  try {
    const { createDecipheriv } = await import('node:crypto');
    const raw = Buffer.from(key, 'base64');
    if (raw.length !== 32) return null;

    const buf = Buffer.from(encrypted, 'base64');
    const iv = buf.subarray(0, 12);
    const ciphertext = buf.subarray(12);

    const decipher = createDecipheriv('aes-256-gcm', raw, iv);
    decipher.setAuthTag(ciphertext.subarray(ciphertext.length - 16));
    const plaintext = Buffer.concat([
      decipher.update(ciphertext.subarray(0, ciphertext.length - 16)),
      decipher.final()
    ]).toString('utf8');
    return plaintext || null;
  } catch {
    return null;
  }
}

export async function loginAdminMfa(page: Page) {
  // admin2@bookly.com SÍ tiene MFA en seed → va a /login/mfa
  await loginUI(page, 'admin-mfa');
  await page.waitForURL(/\/login\/mfa/, { timeout: 15_000 });
}

export async function loginProfessional(page: Page) {
  await loginUI(page, 'professional');
  // Los profesionales no tienen MFA, login → /professional
  await page.waitForURL(/\/professional/, { timeout: 15_000 });
}

export async function loginCustomer(page: Page) {
  await loginUI(page, 'customer');
  // Customer sin MFA → /customer
  await page.waitForURL(/\/customer/, { timeout: 15_000 });
}

/** Genera un código TOTP válido usando otpauth. */
export function totpCode(secret: string): string {
  const t = new TOTP({
    issuer: 'Bookly',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secret)
  });
  return t.generate();
}

/** Hace el flujo completo de MFA setup: enrola + confirma. */
export async function completeMfaSetup(page: Page, secretOverride?: string): Promise<string> {
  // Esperar a que aparezca el QR (stage='enroll')
  await expect(page.getByText('Configura tu segundo factor.')).toBeVisible({ timeout: 10_000 });

  // Si se nos da el secret, usarlo; si no, leerlo del secret expuesto en pantalla.
  let secret = secretOverride;
  if (!secret) {
    // El secret se renderiza en un <code> monospace con class secret__code
    secret = (await page.locator('code.secret__code').first().textContent())?.trim() ?? '';
  }
  if (!secret) throw new Error('No MFA secret visible');

  // Generar código y tipearlo. Usamos keyboard.type en el primer input
  // porque así el componente OtpInput procesa correctamente cada keystroke
  // (auto-avanza, valida, llama onComplete al llegar a 6 dígitos).
  const code = totpCode(secret);
  await page.locator('input.otp__char').first().click();
  await page.keyboard.type(code, { delay: 50 });
  return secret;
}

export async function verifyMfaCode(page: Page, secret: string) {
  const code = totpCode(secret);
  const inputs = page.locator('input.otp__char');
  await inputs.first().click();
  await page.keyboard.type(code, { delay: 30 });
}

/** Resetea el MFA de un usuario vía backend (no UI). Necesita token de admin. */
export async function resetMfaForUser(email: string) {
  // Usamos la DB directamente via psql, mucho más simple que el flujo API
  const { exec } = await import('node:child_process');
  await new Promise<void>((resolve, reject) => {
    exec(
      `docker exec backendcf-db psql -U backendcf -d backendcf -c "DELETE FROM mfa_recovery_code WHERE user_id=(SELECT id FROM app_user WHERE email='${email}'); DELETE FROM mfa_trusted_device WHERE user_id=(SELECT id FROM app_user WHERE email='${email}'); UPDATE app_user SET mfa_enabled=false, mfa_secret_encrypted=NULL WHERE email='${email}';" >/dev/null`,
      (err) => (err ? reject(err) : resolve())
    );
  });
}

export async function clearAllBookings() {
  const { exec } = await import('node:child_process');
  await new Promise<void>((resolve, reject) => {
    // audit_log es inmutable (trigger BEFORE DELETE) — deshabilitarlo temporalmente.
    // El test de "crear reserva" no necesita audit_log limpio.
    exec(
      `docker exec backendcf-db psql -U backendcf -d backendcf -c "ALTER TABLE audit_log DISABLE TRIGGER USER; DELETE FROM bookings; ALTER TABLE audit_log ENABLE TRIGGER USER;" >/dev/null 2>&1`,
      (err) => (err ? reject(err) : resolve())
    );
  });
}

export { FRONTEND, BACKEND };
