import type { UserRole } from './auth';

export interface UserSearchResult {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface RoleAssignmentRequest {
  role: UserRole;
  specialty?: string;
}

export interface RoleAssignmentResponse {
  userId: string;
  role: UserRole;
}

export interface PasswordResetResponse {
  temporaryPassword: string;
}
