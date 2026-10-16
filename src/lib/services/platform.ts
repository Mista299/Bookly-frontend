import { apiFetch } from './api';
import type { PlatformSetupRequest, PlatformSetupResponse } from '$lib/types/platform';

export const platformService = {
  setup(input: PlatformSetupRequest): Promise<PlatformSetupResponse> {
    return apiFetch<PlatformSetupResponse>('/platform/setup', {
      method: 'POST',
      json: { ...input, adminEmail: input.adminEmail.trim().toLowerCase() }
    });
  }
};
