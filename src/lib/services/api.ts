import { browser } from '$app/environment';
import type { ApiError } from '$lib/types/auth';

export const TOKEN_KEY = 'bookly.token';
const API_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

export const tokenStore = {
  get(): string | null {
    if (!browser) return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token: string) {
    if (!browser) return;
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    if (!browser) return;
    localStorage.removeItem(TOKEN_KEY);
  }
};

async function safeJson(response: Response): Promise<unknown> {
  const ct = response.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) {
    try {
      return await response.text();
    } catch {
      return null;
    }
  }
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function buildApiError(status: number, payload: unknown, fallback: string): ApiError {
  const obj = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
  const message =
    (obj && typeof obj.message === 'string' && obj.message) ||
    (typeof payload === 'string' && payload) ||
    fallback;
  return {
    errorCode: obj && typeof obj.errorCode === 'string' ? obj.errorCode : undefined,
    message,
    status,
    details: obj && typeof obj.details === 'object' ? (obj.details as Record<string, string>) : undefined
  };
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { json?: unknown; silent401?: boolean } = {}
): Promise<T> {
  const { json, headers, silent401, ...rest } = init;

  const finalHeaders = new Headers(headers);
  finalHeaders.set('Accept', 'application/json');
  if (json !== undefined) {
    finalHeaders.set('Content-Type', 'application/json');
  }
  const token = tokenStore.get();
  if (token) {
    finalHeaders.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers: finalHeaders,
      body: json !== undefined ? JSON.stringify(json) : (rest.body ?? undefined)
    });
  } catch (e) {
    throw buildApiError(0, null, e instanceof Error ? e.message : 'Error de red');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await safeJson(response);

  if (response.status === 401) {
    if (!silent401) tokenStore.clear();
    throw buildApiError(401, payload, 'No autorizado');
  }

  if (!response.ok) {
    throw buildApiError(response.status, payload, 'Error en la solicitud');
  }

  return payload as T;
}