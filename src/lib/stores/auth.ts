import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { tokenStore, apiFetch, apiBaseUrl } from '$lib/services/api';
import type { ApiError, AuthResponse, User, UserRole } from '$lib/types/auth';
import type {
  MfaDisableRequest,
  MfaEnrollRequest,
  MfaEnrollmentResponse,
  MfaRecoveryCodesResponse,
  MfaRecoveryStatusResponse,
  MfaRegenerateRequest,
  MfaVerifyRequest
} from '$lib/types/mfa';
import type { LoginRequest, RegisterCustomerRequest, ChangePasswordRequest } from '$lib/types/auth';
import type { RegisterResponse } from '$lib/types/auth';

export type LoginOutcome =
  | { kind: 'authenticated'; user: User }
  | { kind: 'mfaRequired'; mfaToken: string; user: User }
  | { kind: 'mfaSetupRequired'; mfaToken: string; user: User }
  | { kind: 'locked'; lockMinutes: number }
  | { kind: 'error'; error: ApiError };

interface AuthState {
  user: User | null;
  loading: boolean;
  ready: boolean;
  error: string | null;
}

const initial: AuthState = {
  user: null,
  loading: false,
  ready: false,
  error: null
};

const USER_KEY = 'bookly.user';

interface JwtPayload {
  sub?: string;
  email?: string;
  role?: UserRole;
  exp?: number;
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const padded = part + '='.repeat((4 - (part.length % 4)) % 4);
    const json = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

function readCachedUser(): User | null {
  if (!browser) return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function writeCachedUser(user: User | null): void {
  if (!browser) return;
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

function mapAuth(data: AuthResponse): User {
  return {
    id: data.user.id,
    email: data.user.email,
    fullName: data.user.fullName,
    role: data.user.role
  };
}

function createAuthStore() {
  const store = writable<AuthState>(initial);

  function setUser(user: User | null) {
    if (user) writeCachedUser(user);
    else writeCachedUser(null);
    store.update((s) => ({ ...s, user }));
  }

  async function bootstrap() {
    if (!browser) {
      store.update((s) => ({ ...s, ready: true }));
      return;
    }
    const token = tokenStore.get();
    if (!token) {
      writeCachedUser(null);
      store.update((s) => ({ ...s, ready: true }));
      return;
    }

    const payload = decodeJwt(token);
    if (payload?.exp && payload.exp * 1000 < Date.now()) {
      tokenStore.clear();
      writeCachedUser(null);
      store.update((s) => ({ ...s, ready: true }));
      return;
    }

    store.update((s) => ({ ...s, loading: true }));
    try {
      const cached = readCachedUser();
      if (cached && cached.id === payload?.sub) {
        store.set({ user: cached, loading: false, ready: true, error: null });
        return;
      }
      if (payload?.sub && payload.email && payload.role) {
        const fallback: User = {
          id: payload.sub,
          email: payload.email,
          fullName: payload.email.split('@')[0],
          role: payload.role
        };
        writeCachedUser(fallback);
        store.set({ user: fallback, loading: false, ready: true, error: null });
        return;
      }
      tokenStore.clear();
      writeCachedUser(null);
      store.set({ user: null, loading: false, ready: true, error: null });
    } catch {
      tokenStore.clear();
      writeCachedUser(null);
      store.set({ user: null, loading: false, ready: true, error: null });
    }
  }

  async function login(email: string, password: string): Promise<LoginOutcome> {
    store.update((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        json: { email: email.trim().toLowerCase(), password }
      });

      if (data?.accessToken && data?.user) {
        tokenStore.set(data.accessToken);
        const user = mapAuth(data);
        setUser(user);
        store.update((s) => ({ ...s, loading: false, error: null }));
        return { kind: 'authenticated', user };
      }
      if (data?.mfaRequired && data?.mfaToken) {
        store.update((s) => ({ ...s, loading: false, error: null }));
        // mfaSetupRequired=true → el backend exige enrolar antes de poder usar la cuenta.
        // En ese caso mandamos a /login/mfa-setup (QR) en vez de /login/mfa (verify).
        if (data.mfaSetupRequired) {
          return { kind: 'mfaSetupRequired', mfaToken: data.mfaToken, user: data.user as User };
        }
        return { kind: 'mfaRequired', mfaToken: data.mfaToken, user: data.user as User };
      }
      store.update((s) => ({ ...s, loading: false, error: 'Respuesta inesperada' }));
      return { kind: 'error', error: { message: 'Respuesta inesperada', status: 500 } };
    } catch (err) {
      const error = err as ApiError;
      const message = error?.message ?? 'No pudimos iniciar sesión.';
      if (error.status === 423 || error.errorCode === 'ACCOUNT_LOCKED') {
        store.update((s) => ({ ...s, loading: false, error: message }));
        return { kind: 'locked', lockMinutes: error.lockMinutes ?? 15 };
      }
      store.update((s) => ({ ...s, loading: false, error: message }));
      return { kind: 'error', error };
    }
  }

  async function verifyMfa(mfaToken: string, code: string, trustDevice = false): Promise<LoginOutcome> {
    store.update((s) => ({ ...s, loading: true, error: null }));
    try {
      const req: MfaVerifyRequest = { mfaToken, code, trustDevice };
      const data = await apiFetch<AuthResponse>('/auth/mfa/verify', {
        method: 'POST',
        json: req
      });
      if (data?.accessToken && data?.user) {
        tokenStore.set(data.accessToken);
        const user = mapAuth(data);
        setUser(user);
        store.update((s) => ({ ...s, loading: false, error: null }));
        return { kind: 'authenticated', user };
      }
      store.update((s) => ({ ...s, loading: false, error: 'Respuesta inesperada' }));
      return { kind: 'error', error: { message: 'Respuesta inesperada', status: 500 } };
    } catch (err) {
      const error = err as ApiError;
      const message = error?.message ?? 'Código inválido.';
      if (error.status === 423 || error.errorCode === 'ACCOUNT_LOCKED') {
        store.update((s) => ({ ...s, loading: false, error: message }));
        return { kind: 'locked', lockMinutes: error.lockMinutes ?? 15 };
      }
      store.update((s) => ({ ...s, loading: false, error: message }));
      return { kind: 'error', error };
    }
  }

  async function skipMfa(mfaToken: string): Promise<LoginOutcome> {
    store.update((s) => ({ ...s, loading: true, error: null }));
    try {
      const req: MfaEnrollRequest = { mfaToken };
      const data = await apiFetch<AuthResponse>('/auth/mfa/skip', {
        method: 'POST',
        json: req
      });
      if (data?.accessToken && data?.user) {
        tokenStore.set(data.accessToken);
        const user = mapAuth(data);
        setUser(user);
        store.update((s) => ({ ...s, loading: false, error: null }));
        return { kind: 'authenticated', user };
      }
      store.update((s) => ({ ...s, loading: false, error: 'Respuesta inesperada' }));
      return { kind: 'error', error: { message: 'Respuesta inesperada', status: 500 } };
    } catch (err) {
      const error = err as ApiError;
      store.update((s) => ({ ...s, loading: false, error: error?.message ?? 'Error' }));
      return { kind: 'error', error };
    }
  }

  async function register(input: RegisterCustomerRequest): Promise<RegisterResponse> {
    store.update((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await apiFetch<RegisterResponse>('/auth/register', {
        method: 'POST',
        json: { ...input, email: input.email.trim().toLowerCase() }
      });
      store.update((s) => ({ ...s, loading: false, error: null }));
      return data;
    } catch (err) {
      const error = err as ApiError;
      store.update((s) => ({ ...s, loading: false, error: error?.message ?? 'Error' }));
      throw error;
    }
  }

  async function changePassword(req: ChangePasswordRequest): Promise<void> {
    // silent401: el backend responde 401 cuando la contraseña ACTUAL es
    // incorrecta. Eso no es una sesión expirada, así que no debe cerrar la
    // sesión ni expulsar al usuario de la aplicación.
    await apiFetch<void>('/auth/password', {
      method: 'PUT',
      json: req,
      silent401: true
    });
  }

  function logout() {
    tokenStore.clear();
    writeCachedUser(null);
    store.set({ ...initial, ready: true });
  }

  async function enrollMfa(mfaToken: string): Promise<MfaEnrollmentResponse> {
    return apiFetch<MfaEnrollmentResponse>('/auth/mfa/enroll', {
      method: 'POST',
      json: { mfaToken }
    });
  }

  async function confirmMfaEnrollment(
    mfaToken: string,
    code: string,
    trustDevice = false
  ): Promise<{ user: User | null; recoveryCodes: string[] }> {
    const data = await apiFetch<import('$lib/types/mfa').MfaConfirmResponse>(
      '/auth/mfa/enroll/confirm',
      { method: 'POST', json: { mfaToken, code, trustDevice } }
    );
    // El backend puede llamarlo `session` (builds nuevas) o `authResponse` (builds viejas).
    const auth = data.session ?? data.authResponse;
    if (auth?.accessToken && auth?.user) {
      tokenStore.set(auth.accessToken);
      const user = mapAuth(auth);
      setUser(user);
      return { user, recoveryCodes: data.recoveryCodes ?? [] };
    }
    return { user: (auth?.user as User) ?? null, recoveryCodes: data.recoveryCodes ?? [] };
  }

  async function getMfaRecoveryStatus(): Promise<MfaRecoveryStatusResponse> {
    return apiFetch<MfaRecoveryStatusResponse>('/mfa/recovery-codes/estado');
  }

  async function regenerateRecoveryCodes(req: MfaRegenerateRequest): Promise<MfaRecoveryCodesResponse> {
    return apiFetch<MfaRecoveryCodesResponse>('/mfa/recovery-codes/regenerar', {
      method: 'POST',
      json: req
    });
  }

  async function disableMfa(req: MfaDisableRequest): Promise<void> {
    await apiFetch<void>('/mfa/desactivar', { method: 'POST', json: req });
  }

  return {
    subscribe: store.subscribe,
    bootstrap,
    login,
    logout,
    register,
    verifyMfa,
    skipMfa,
    enrollMfa,
    confirmMfaEnrollment,
    getMfaRecoveryStatus,
    regenerateRecoveryCodes,
    disableMfa,
    changePassword
  };
}

export const auth = createAuthStore();
export const apiUrl = apiBaseUrl;
