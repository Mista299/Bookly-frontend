export type ServiceStatus = 'ACTIVO' | 'INACTIVO';

export interface Service {
  id: string;
  name: string;
  description?: string;
  category: string;
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