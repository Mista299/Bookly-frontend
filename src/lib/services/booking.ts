import { apiFetch } from './api';
import type { ApiError } from '$lib/types/auth';
import type { Booking, CreateBookingRequest, CancelBookingRequest } from '$lib/types/booking';

function isApiError(e: unknown): e is ApiError {
  return !!e && typeof e === 'object' && 'status' in (e as Record<string, unknown>);
}

export const bookingService = {
  listForCustomer(customerId: string): Promise<Booking[]> {
    return apiFetch<Booking[]>(`/reservas/cliente/${customerId}`, { silent401: false });
  },

  listForProfessional(professionalId: string): Promise<Booking[]> {
    return apiFetch<Booking[]>(`/reservas/profesional/${professionalId}`);
  },

  async create(input: CreateBookingRequest): Promise<Booking> {
    try {
      return await apiFetch<Booking>('/reservas', { method: 'POST', json: input });
    } catch (err) {
      if (isApiError(err) && err.errorCode === 'BOOKING_CONFLICT') {
        throw err;
      }
      throw err;
    }
  },

  cancel(bookingId: string, body: CancelBookingRequest = {}): Promise<{ bookingId: string; status: string; cancelledAt: string; cancellationReason: string | null }> {
    return apiFetch(`/reservas/${bookingId}/cancelacion`, { method: 'PATCH', json: body });
  }
};
