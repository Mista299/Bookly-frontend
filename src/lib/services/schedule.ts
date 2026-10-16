import { apiFetch } from './api';
import type { ScheduleResponse, ScheduleRequest } from '$lib/types/schedule';

export const scheduleService = {
  get(professionalId: string): Promise<ScheduleResponse> {
    return apiFetch<ScheduleResponse>(`/horarios/${professionalId}`);
  },

  replace(professionalId: string, body: ScheduleRequest): Promise<ScheduleResponse> {
    return apiFetch<ScheduleResponse>(`/horarios/${professionalId}`, {
      method: 'PUT',
      json: body
    });
  }
};
