import { expect, type Page } from '@playwright/test';
import { TOTP, Secret } from 'otpauth';

const BACKEND = 'http://127.0.0.1:18080';
const FRONTEND = 'http://127.0.0.1:5173';

export type Role = 'admin' | 'admin-mfa' | 'professional' | 'customer';

const CREDS: Record<Role, { email: string; password: string }> = {
  admin:         { email: 'admin@bookly.com',       password: 'Bookly1234!' },
  'admin-mfa':   { email: 'admin2@bookly.com',      password: 'Bookly1234!' },
  professional:  { email: 'pro.cristian@bookly.com', password: 'Bookly1234!' },
  customer:      { email: 'cliente.maria@bookly.com',password: 'Bookly1234!' },
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

export async function loginAdmin(page: Page) {
  // admin@bookly.com no tiene MFA en seed → entra a mfa-setup
  await loginUI(page, 'admin');
  // La primera vez el admin NO está enrolado, va a /login/mfa-setup.
  // Si ya estaba enrolado (re-run del test), va a /login/mfa directamente.
  await page.waitForURL(/\/login\/(mfa|mfa-setup|admin)/, { timeout: 15_000 });
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
