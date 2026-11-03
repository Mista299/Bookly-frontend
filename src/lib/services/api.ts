import { browser } from '$app/environment';
import type { ApiError } from '$lib/types/auth';

export const TOKEN_KEY = 'bookly.token';
export const UNAUTHORIZED_EVENT = 'bookly:unauthorized';

/**
 * URL base de la API.
 *
 * - En desarrollo web, el proxy de Vite sirve `/api` contra el backend local,
 *   así que basta con la ruta relativa.
 * - En el APK (Capacitor) no hay proxy: el WebView sirve la app desde
 *   `https://localhost`, así que hace falta una URL absoluta. Se define con
 *   VITE_API_URL en el build del APK (ver package.json → build:android).
 */
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

  const details =
    obj && typeof obj.details === 'object' && obj.details !== null
      ? (obj.details as Record<string, string>)
      : undefined;

  const lockMinutes =
    obj && typeof obj.lockMinutes === 'number'
      ? obj.lockMinutes
      : obj && details && typeof (details as Record<string, unknown>).lockMinutes === 'number'
        ? ((details as Record<string, unknown>).lockMinutes as number)
        : undefined;

  return {
    errorCode: obj && typeof obj.errorCode === 'string' ? obj.errorCode : undefined,
    message,
    status,
    details,
    lockMinutes,
    traceId: obj && typeof obj.traceId === 'string' ? obj.traceId : undefined
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
    // Solo cerramos la sesion si esta peticion se envio con un token que
    // sigue siendo el vigente. Hay tres casos en los que NO hay que cerrar:
    //
    // 1. La peticion se envio sin token (p. ej. un onMount que se dispara
    //    durante el login, antes de que se guarde el token).
    // 2. El token de la peticion ya no es el actual (la sesion se renovo
    //    mientras la peticion estaba en vuelo): el 401 es obsoleto.
    // 3. silent401: el llamador ya sabe que va a recibir un 401.
    const currentToken = tokenStore.get();
    const sentWithCurrentToken = !!token && token === currentToken;
    const isStale = !token || !sentWithCurrentToken;

    if (!silent401 && !isStale) {
      tokenStore.clear();
      if (browser) {
        window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
      }
    }
    throw buildApiError(401, payload, 'No autorizado');
  }

  if (!response.ok) {
    throw buildApiError(response.status, payload, 'Error en la solicitud');
  }

  return payload as T;
}

export const apiBaseUrl = API_URL;
