export type ServiceStatus = 'ACTIVO' | 'INACTIVO';

export interface Service {
  id: string;
  name: string;
  /** El backend puede devolver `null` cuando el servicio se creó sin descripción. */
  description?: string | null;
  /** El backend puede devolver `null` en servicios creados sin categoría. */
  category?: string | null;
  durationMinutes: number;
  price: number;
  status: ServiceStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type ServiceInput = {
  name: string;
  description?: string;
  category: string;
  durationMinutes: number;
  price: number;
  status?: ServiceStatus;
};

export interface ProfessionalSummary {
  id: string;
  fullName: string;
  specialty: string;
  email?: string;
}
