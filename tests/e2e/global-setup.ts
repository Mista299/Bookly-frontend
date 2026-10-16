import { exec } from 'node:child_process';

/**
 * Resetea el estado de la DB antes de correr la suite.
 * - admin (sin MFA) puede probar el flujo setup MFA fresh.
 * - admin2 (con mfaEnabled=true) tiene un secret no válido en seed → no usable para verify.
 *   Lo reseteamos a mfaEnabled=false para que el primer test de /admin/users/audit no falle
 *   por 403 cuando un admin2 sin token intenta entrar.
 * - Servicios creados por tests E2E (nombre "E2E%"): se eliminan para que no
 *   contaminen el featured de /customer que hace slice(0,4).
 * - bookings: NO se borran porque muchos tests dependen de los datos del seed.
 *   El test de "crear reserva nueva" hace clearAllBookings() por su cuenta.
 * - audit_log: NO se borra (es inmutable). La inmutabilidad es correcta en producción.
 */
export default async function globalSetup() {
  await new Promise<void>((resolve, reject) => {
    const sql = `
      DELETE FROM mfa_recovery_code;
      DELETE FROM mfa_trusted_device;
      UPDATE app_user SET mfa_enabled = false, mfa_secret_encrypted = NULL;
      DELETE FROM profesional_servicio WHERE servicio_id IN (SELECT id FROM servicios WHERE nombre LIKE 'E2E%%');
      DELETE FROM servicios WHERE nombre LIKE 'E2E%%';
      DELETE FROM app_user WHERE email LIKE 'e2e+%%@bookly.test';
    `.replace(/\s+/g, ' ').trim();
    exec(
      `docker exec backendcf-db psql -U backendcf -d backendcf -c "${sql}" >/dev/null 2>&1`,
      (err) => (err ? reject(err) : resolve())
    );
  });
}
