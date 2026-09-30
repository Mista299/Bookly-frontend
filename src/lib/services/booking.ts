import { apiFetch } from './api';
import type { Booking } from '$lib/types/booking';

// Endpoints pendientes (HU-08..HU-09). El backend aún no expone /bookings.
// Hasta entonces, las llamadas devolverán 401 y los callers las manejan silenciosamente.
export interface ListBookingsParams {
  date: string; // YYYY-MM-DD
  professionalId?: string;
}

export const bookingService = {
  list({ date, professionalId }: ListBookingsParams): Promise<Booking[]> {
    const search = new URLSearchParams({ date });
    if (professionalId) search.set('professionalId', professionalId);
    return apiFetch<Booking[]>(`/bookings?${search.toString()}`, {
      method: 'GET',
      silent401: true
    });
  }
};