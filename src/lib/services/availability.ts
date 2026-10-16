import { apiFetch } from './api';
import type {
  AvailabilityResponse
} from '$lib/types/availability';

export interface FindAvailabilityParams {
  professionalId: string;
  serviceId: string;
  from: string; // yyyy-MM-dd
  to: string; // yyyy-MM-dd
}

export const availabilityService = {
  find(params: FindAvailabilityParams): Promise<AvailabilityResponse> {
    const search = new URLSearchParams({
      profesionalId: params.professionalId,
      servicioId: params.serviceId,
      desde: params.from,
      hasta: params.to
    });
    return apiFetch<AvailabilityResponse>(`/disponibilidad?${search.toString()}`);
  }
};
