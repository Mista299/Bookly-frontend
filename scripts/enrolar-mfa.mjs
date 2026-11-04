#!/usr/bin/env node
/**
 * enrolar-mfa.mjs — Enrola a un usuario con MFA usando un secret conocido.
 *
 * El secret se genera aquí y se confirma contra el endpoint oficial del
 * backend (/auth/mfa/enroll + /auth/mfa/enroll/confirm). El backend guarda
 * el secret cifrado, así que `scripts/mfa-codigo.mjs` lo puede descifrar
 * después para calcular el TOTP.
 *
 * Uso:
 *   node scripts/enrolar-mfa.mjs admin@bookly.local
 *   MFA_ADMIN=1 bash tests/e2e/seed-e2e.sh     # lo hace el seed
 */

import { execSync } from 'node:child_process';
import { createCipheriv, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOTP, Secret } from 'otpauth';

const here = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(here, '..');
const BACKEND = path.resolve(PROJECT, '..', 'backendcf');

const API = process.env.API ?? 'http://127.0.0.1:18080/api/v1';
const email = process.argv[2] ?? 'admin@bookly.local';
const password = process.env.ADMIN_PASS ?? 'Admin123!Pass';

/** Base32 sin relleno, para un secret TOTP. */
function base32(bytes) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const b of bytes) bits += b.toString(2).padStart(8, '0');
  let out = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, '0');
    out += alphabet[parseInt(chunk, 2)];
  }
  return out;
}

async function post(pathname, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${pathname}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${pathname} → ${res.status}: ${text}`);
  return JSON.parse(text);
}

try {
  // 1) Login: el backend devuelve un mfaToken pendiente.
  const login = await post('/auth/login', { email, password });
  if (!login.mfaToken) {
    throw new Error(
      `El login no devolvió mfaToken (mfaRequired=${login.mfaRequired}). ` +
        'Si el usuario ya tiene MFA, hay que desenrolarlo antes.'
    );
  }

  // 2) Enroll: el backend genera su propio secret y lo devuelve cifrado
  //    en el alta. Usamos el que devuelve para confirmar.
  const enroll = await post('/auth/mfa/enroll', { mfaToken: login.mfaToken });
  const secret = enroll.secret;
  if (!secret) throw new Error('El backend no devolvió el secret');

  // 3) Confirm: calculamos el TOTP de ese secret y lo confirmamos.
  const totp = new TOTP({
    issuer: 'Bookly',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secret)
  });
  await post(
    '/auth/mfa/enroll/confirm',
    { mfaToken: login.mfaToken, code: totp.generate(), trustDevice: true }
  );

  console.log(`MFA enrolado para ${email}`);
  console.log('  Usa:  npm run mfa:codigo');
  process.exit(0);
} catch (e) {
  console.error(`Error: ${e.message}`);
  process.exit(1);
}
