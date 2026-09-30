export type BookingStatus = 'CONFIRMED' | 'PENDING' | 'CANCELLED';

export interface Booking {
  id: string;
  serviceId: string;
  serviceName: string;
  professionalId: string;
  customerId: string;
  customerName: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  status: BookingStatus;
}

export type SlotState = 'AVAILABLE' | 'BOOKED' | 'NO_SERVICE' | 'OUT_OF_HOURS' | 'SELECTED';

export interface TimeSlot {
  start: string; // ISO
  end: string;   // ISO
  state: SlotState;
  booking?: Booking;
}