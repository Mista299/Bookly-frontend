import { apiFetch } from './api';
import type { Service, ServiceInput, ServiceStatus } from '$lib/types/service';

export const serviceService = {
  list(category?: string): Promise<Service[]> {
    const q = category ? `?categoria=${encodeURIComponent(category)}` : '';
    return apiFetch<Service[]>(`/servicios${q}`);
  },

  get(id: string): Promise<Service> {
    return apiFetch<Service>(`/servicios/${id}`);
  },

  create(input: ServiceInput): Promise<Service> {
    return apiFetch<Service>('/servicios', {
      method: 'POST',
      json: { ...input, status: input.status ?? 'ACTIVO' }
    });
  },

  update(id: string, input: ServiceInput): Promise<Service> {
    return apiFetch<Service>(`/servicios/${id}`, {
      method: 'PUT',
      json: input
    });
  },

  async setStatus(id: string, status: ServiceStatus, current: Service): Promise<Service> {
    return this.update(id, {
      name: current.name,
      description: current.description,
      category: current.category,
      durationMinutes: current.durationMinutes,
      price: current.price,
      status
    });
  },

  remove(id: string): Promise<void> {
    return apiFetch<void>(`/servicios/${id}`, {
      method: 'DELETE'
    });
  }
};