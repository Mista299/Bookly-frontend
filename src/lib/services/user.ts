import { apiFetch } from './api';
import type { UserSearchResult, RoleAssignmentRequest, RoleAssignmentResponse, PasswordResetResponse } from '$lib/types/user';

export const userService = {
  search(query: string): Promise<UserSearchResult[]> {
    return apiFetch<UserSearchResult[]>(
      `/usuarios/buscar?q=${encodeURIComponent(query.trim())}`
    );
  },

  assignRole(userId: string, body: RoleAssignmentRequest): Promise<RoleAssignmentResponse> {
    return apiFetch<RoleAssignmentResponse>(`/usuarios/${userId}/rol`, {
      method: 'PUT',
      json: body
    });
  },

  resetPassword(userId: string): Promise<PasswordResetResponse> {
    return apiFetch<PasswordResetResponse>(`/usuarios/${userId}/clave/restablecer`, {
      method: 'POST'
    });
  }
};
