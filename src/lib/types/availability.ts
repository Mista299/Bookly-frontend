export interface AvailabilityBlock {
  startTime: string;
  endTime: string;
}

export interface AvailabilityDay {
  date: string; // yyyy-MM-dd
  slots: AvailabilityBlock[];
}

export interface AvailabilityResponse {
  professionalId: string;
  serviceId: string;
  durationMinutes: number;
  from: string;
  to: string;
  available: boolean;
  message?: string;
  days: AvailabilityDay[];
}
