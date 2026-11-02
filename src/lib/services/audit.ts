import { apiFetch } from './api';
import type { AuditLogPageResponse } from '$lib/types/audit';

export interface AuditQuery {
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

/**
 * El backend exige OffsetDateTime (`2026-01-01T00:00:00Z`) en los filtros de
 * fecha, pero los <input type="datetime-local"> entregan LocalDateTime
 * (`2026-01-01T00:00`). Sin esta conversión el backend responde 400 y la
 * pantalla de auditoría queda siempre vacía.
 */
function toOffsetDateTime(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  // Ya trae offset o zona explícita: se respeta tal cual.
  if (/(Z|[+-]\d{2}:?\d{2})$/.test(raw)) return raw;
  // LocalDateTime → se interpreta en la zona local del navegador y se
  // convierte a ISO con offset.
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toISOString();
}

export const auditService = {
  list(q: AuditQuery = {}): Promise<AuditLogPageResponse> {
    const search = new URLSearchParams();
    const from = q.from ? toOffsetDateTime(q.from) : null;
    const to = q.to ? toOffsetDateTime(q.to) : null;
    if (from) search.set('from', from);
    if (to) search.set('to', to);
    search.set('page', String(q.page ?? 0));
    search.set('size', String(q.size ?? 50));
    return apiFetch<AuditLogPageResponse>(`/auditoria?${search.toString()}`);
  }
};
