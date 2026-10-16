import { apiFetch } from './api';
import type { Professional, ProfessionalInput, ServiceIdsRequest } from '$lib/types/professional';

export const professionalService = {
  list(): Promise<Professional[]> {
    return apiFetch<Professional[]>('/profesionales');
  },

  create(input: ProfessionalInput): Promise<Professional> {
    return apiFetch<Professional>('/profesionales', {
      method: 'POST',
      json: { ...input, email: input.email.trim().toLowerCase() }
    });
  },

  getServiceIds(professionalId: string): Promise<string[]> {
    return apiFetch<string[]>(`/profesionales/${professionalId}/servicios`);
  },

  setServiceIds(professionalId: string, serviceIds: string[]): Promise<void> {
    const body: ServiceIdsRequest = { serviceIds };
    return apiFetch<void>(`/profesionales/${professionalId}/servicios`, {
      method: 'PUT',
      json: body
    });
  }
};
