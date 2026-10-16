export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY'
];

export interface ScheduleSlot {
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm
  endTime: string;
}

export interface ScheduleResponse {
  professionalId: string;
  slots: ScheduleSlot[];
}

export interface ScheduleRequest {
  slots: ScheduleSlot[];
}
