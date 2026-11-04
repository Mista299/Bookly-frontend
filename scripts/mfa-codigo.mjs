#!/usr/bin/env node
/**
 * mfa-codigo.mjs — Muestra el código TOTP vigente del admin.
 *
 * El segundo factor del admin (admin@bookly.local) usa TOTP. Este script
 * descifra el secret guardado en la base de datos y calcula el código de 6
 * dígitos, igual que haría Google Authenticator.
 *
 * Uso:
 *   node scripts/mfa-codigo.mjs              # código de admin@bookly.local
 *   node scripts/mfa-codigo.mjs correo@x.com # otro usuario
 *   node scripts/mfa-codigo.mjs --loop       # refresca el código cada 5s
 */

import { execSync } from 'node:child_process';
import { createDecipheriv } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOTP, Secret } from 'otpauth';

const here = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(here, '..');
const BACKEND = path.resolve(PROJECT, '..', 'backendcf');

const args = process.argv.slice(2);
const loop = args.includes('--loop');
const email = args.find((a) => !a.startsWith('--')) ?? 'admin@bookly.local';

/** Clave de cifrado del secret MFA (AES-256-GCM). */
function encryptionKey() {
  if (process.env.MFA_ENCRYPTION_KEY) return process.env.MFA_ENCRYPTION_KEY.trim();
  const envPath = path.join(BACKEND, '.env');
  try {
    const m = readFileSync(envPath, 'utf8').match(/^MFA_ENCRYPTION_KEY=(.+)$/m);
    if (m) return m[1].trim();
  } catch {
    /* sin .env legible */
  }
  throw new Error(
    'No se encontró MFA_ENCRYPTION_KEY. Define la variable de entorno o revisa backendcf/.env'
  );
}

/** Lee y descifra el secret MFA enrolado de un usuario. */
function readSecret(userEmail) {
  const enc = execSync(
    `docker exec backendcf-db psql -U backendcf -d backendcf -tAc ` +
      `"SELECT mfa_secret_encrypted FROM app_user WHERE email='${userEmail.replace(/'/g, "''")}';"`,
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
  ).trim();

  if (!enc) {
    throw new Error(
      `El usuario ${userEmail} no tiene MFA enrolado.\n` +
        'Enrolarlo con:  node scripts/mfa-codigo.mjs --reset'
    );
  }

  const key = Buffer.from(encryptionKey(), 'base64');
  const buf = Buffer.from(enc, 'base64');
  const iv = buf.subarray(0, 12);
  const ct = buf.subarray(12);

  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(ct.subarray(ct.length - 16));
  return Buffer.concat([
    decipher.update(ct.subarray(0, ct.length - 16)),
    decipher.final()
  ]).toString('utf8');
}

/** Calcula el código TOTP de 6 dígitos. */
function code(secret) {
  const totp = new TOTP({
    issuer: 'Bookly',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secret)
  });
  return totp.generate();
}

function segundosRestantes() {
  return 30 - (Math.floor(Date.now() / 1000) % 30);
}

/**
 * Desenrola al usuario: la próxima vez que entre, el backend le pedirá
 * configurar el segundo factor y la pantalla mostrará el secret para
 * escanearlo (o el script puede seguir dando códigos).
 */
if (args.includes('--reset')) {
  execSync(
    `docker exec backendcf-db psql -U backendcf -d backendcf -c ` +
      `"UPDATE app_user SET mfa_enabled=false, mfa_secret_encrypted=NULL ` +
      `WHERE email='${email.replace(/'/g, "''")}';" ` +
      `"DELETE FROM mfa_trusted_device WHERE user_id=(SELECT id FROM app_user WHERE email='${email.replace(/'/g, "''")}');"`,
    { stdio: 'ignore' }
  );
  console.log(`MFA deshabilitado para ${email}.`);
  console.log('En el próximo login se abrirá la pantalla de configuración (con QR).');
  process.exit(0);
}

try {
  const secret = readSecret(email);

  // Modo "solo código": útil en scripts y pipelines.
  if (args.includes('--solo')) {
    console.log(code(secret));
    process.exit(0);
  }

  if (!loop) {
    const c = code(secret);
    console.log('');
    console.log(`  ${email}`);
    console.log(`  ┌───────────────┐`);
    console.log(`  │  ${c.split('').join(' ')}  │`);
    console.log(`  └───────────────┘`);
    console.log(`  Vence en ${segundosRestantes()}s`);
    console.log('');
    process.exit(0);
  }

  // Modo loop: refresca el código cuando cambia.
  console.log(`Códigos TOTP para ${email} (Ctrl+C para salir):\n`);
  let anterior = '';
  const tick = () => {
    const c = code(secret);
    if (c !== anterior) {
      anterior = c;
      const seg = segundosRestantes();
      process.stdout.write(`\r  ${c.split('').join(' ')}   (${seg}s)   `);
    }
    setTimeout(tick, 1000);
  };
  tick();
} catch (e) {
  console.error(`Error: ${e.message}`);
  process.exit(1);
}
