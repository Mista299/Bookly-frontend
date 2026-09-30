import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { tokenStore } from '$lib/services/api';
import { apiFetch } from '$lib/services/api';
import type { User, UserRole } from '$lib/types/auth';

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

function createAuthStore() {
  const store = writable<AuthState>(initial);

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
      // Prefer cached user (preserves fullName across refreshes); fall back to JWT-only.
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

  async function login(email: string, password: string) {
    store.update((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await apiFetch<{ accessToken: string; user: User }>('/auth/login', {
        method: 'POST',
        json: { email: email.trim().toLowerCase(), password }
      });
      if (data?.accessToken) tokenStore.set(data.accessToken);
      if (data?.user) writeCachedUser(data.user);
      store.set({ user: data.user, loading: false, ready: true, error: null });
      return data.user;
    } catch (err) {
      const message = (err as { message?: string })?.message ?? 'No pudimos iniciar sesión.';
      store.update((s) => ({ ...s, loading: false, error: message }));
      throw err;
    }
  }

  function logout() {
    tokenStore.clear();
    writeCachedUser(null);
    store.set({ ...initial, ready: true });
  }

  return {
    subscribe: store.subscribe,
    bootstrap,
    login,
    logout
  };
}

export const auth = createAuthStore();