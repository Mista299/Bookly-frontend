import { apiFetch } from './api';
import type { Professional, ProfessionalInput } from '$lib/types/professional';

// Backend (Sprint 1) solo expone POST /profesionales.
// GET /profesionales no existe todavía; el caller debe manejar 404/401.
export const professionalService = {
  list(): Promise<Professional[]> {
    return apiFetch<Professional[]>('/profesionales');
  },

  create(input: ProfessionalInput): Promise<Professional> {
    return apiFetch<Professional>('/profesionales', {
      method: 'POST',
      json: input
    });
  }
};