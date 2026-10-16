export type BookingStatus = 'CONFIRMADA' | 'CANCELADA' | 'RESCHEDULED' | 'COMPLETED';

export interface Booking {
  id: string;
  serviceId: string;
  serviceName?: string;
  professionalId: string;
  professionalName?: string;
  customerId: string;
  customerName?: string;
  startTime: string; // ISO 8601 LocalDateTime (sin offset)
  endTime: string;
  status: BookingStatus;
  createdAt?: string;
  updatedAt?: string;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
}

export type SlotState = 'AVAILABLE' | 'BOOKED' | 'NO_SERVICE' | 'OUT_OF_HOURS' | 'SELECTED';

export interface TimeSlot {
  start: string;
  end: string;
  state: SlotState;
  booking?: Booking;
}

export interface CreateBookingRequest {
  professionalId: string;
  serviceId: string;
  startTime: string; // ISO LocalDateTime yyyy-MM-ddTHH:mm:ss
  endTime: string;
}

export interface CancelBookingRequest {
  reason?: string;
}
