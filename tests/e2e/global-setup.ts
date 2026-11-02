import { exec, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Prepara la base de datos antes de correr la suite.
 *
 * 1) Ejecuta `seed-e2e.sh`, que deja el dominio de la app (servicios de salón,
 *    profesionales con horario, clientes y reservas) en un estado conocido y
 *    verificable.
 * 2) Limpia MFA (recovery codes, trusted devices, flags) para que el admin
 *    entre por /login/mfa-setup y las specs puedan calcular el TOTP.
 * 3) Elimina los servicios "E2E%" que crean las specs, para que no
 *    contaminen el featured de /customer (que hace slice(0,4)).
 * 4) Elimina los usuarios "e2e+%" que crean las specs.
 * 5) NO borra bookings: el seed los crea y muchas specs dependen de ellos.
 * 6) NO borra audit_log: es inmutable por diseño (trigger BEFORE DELETE).
 */
export default async function globalSetup() {
  // 1) Seed de dominio.
  try {
    execSync('bash seed-e2e.sh', {
      cwd: here,
      stdio: 'inherit',
      timeout: 180_000
    });
  } catch {
    // Si el seed falla (backend no levantado) la suite seguirá y fallará con
    // mensajes más claros en cada spec.
  }

  // 2-4) Limpieza determinista.
  await new Promise<void>((resolve, reject) => {
    const sql = `
      DELETE FROM mfa_recovery_code;
      DELETE FROM mfa_trusted_device;
      UPDATE app_user SET mfa_enabled = false, mfa_secret_encrypted = NULL, failed_login_attempts = 0, locked_until = NULL;
      DELETE FROM profesional_servicio WHERE servicio_id IN (SELECT id FROM servicios WHERE nombre LIKE 'E2E%');
      DELETE FROM servicios WHERE nombre LIKE 'E2E%';
      DELETE FROM app_user WHERE email LIKE 'e2e+%@bookly.local';
    `
      .replace(/\s+/g, ' ')
      .trim();
    exec(
      `docker exec backendcf-db psql -U backendcf -d backendcf -c "${sql}" >/dev/null 2>&1`,
      (err) => (err ? reject(err) : resolve())
    );
  });
}
