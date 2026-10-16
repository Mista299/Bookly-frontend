import { apiFetch } from './api';
import type { AuditLogPageResponse } from '$lib/types/audit';

export interface AuditQuery {
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export const auditService = {
  list(q: AuditQuery = {}): Promise<AuditLogPageResponse> {
    const search = new URLSearchParams();
    if (q.from) search.set('from', q.from);
    if (q.to) search.set('to', q.to);
    search.set('page', String(q.page ?? 0));
    search.set('size', String(q.size ?? 50));
    return apiFetch<AuditLogPageResponse>(`/auditoria?${search.toString()}`);
  }
};
