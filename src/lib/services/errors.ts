import type { ApiError } from '$lib/types/auth';

export function formatApiError(err: unknown, fallback = 'Algo salió mal.'): string {
  const e = err as ApiError | null | undefined;
  if (!e || typeof e !== 'object') return fallback;
  if (e.errorCode === 'EMAIL_ALREADY_REGISTERED')
    return 'Este correo ya está registrado.';
  if (e.errorCode === 'INVALID_CREDENTIALS') return 'Credenciales inválidas.';
  if (e.errorCode === 'INVALID_PASSWORD')
    return 'La contraseña actual es incorrecta.';
  if (e.errorCode === 'PASSWORD_MISMATCH')
    return 'Las contraseñas nuevas no coinciden.';
  if (e.errorCode === 'ACCOUNT_LOCKED')
    return `Cuenta bloqueada. Espera ${e.lockMinutes ?? 15} minutos antes de volver a intentarlo.`;
  if (e.errorCode === 'PLATFORM_ALREADY_CONFIGURED')
    return 'La plataforma ya fue configurada. Inicia sesión.';
  if (e.errorCode === 'BOOKING_CONFLICT')
    return 'Ese horario ya no está disponible. Elige otro.';
  if (e.errorCode === 'ROLE_CHANGE_CONFLICT')
    return 'Esta cuenta ya es profesional; no se le puede cambiar el rol.';
  if (e.errorCode === 'SCHEDULE_CONFLICT')
    return e.message?.includes('superpone') ? e.message : 'Hay franjas que se solapan en el mismo día.';
  if (e.errorCode === 'MFA_CODE_INVALID' || e.errorCode === 'MFA_INVALID_CODE')
    return 'El código no es válido. Inténtalo de nuevo.';
  if (e.errorCode === 'MFA_NOT_ENROLLED')
    return 'Aún no has activado el segundo factor.';
  if (e.errorCode === 'UNAUTHORIZED')
    return 'Tu sesión expiró. Vuelve a iniciar sesión.';
  if (e.errorCode === 'ACCESS_DENIED')
    return 'No tienes permisos para hacer esto.';
  if (e.details?.email) return `Correo: ${e.details.email}`;
  if (e.details?.password) return `Contraseña: ${e.details.password}`;
  return e.message ?? fallback;
}

export function isApiError(e: unknown): e is ApiError {
  return !!e && typeof e === 'object' && 'status' in (e as Record<string, unknown>);
}
