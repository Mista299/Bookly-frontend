export interface AuditLogResponse {
  id: string;
  actorUserId: string;
  actionType: string;
  resourceType: string;
  resourceId: string;
  occurredAt: string;
  sourceIp: string;
  metadata: Record<string, string>;
}

export interface AuditLogPageResponse {
  content: AuditLogResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
