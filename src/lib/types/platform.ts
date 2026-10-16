export interface PlatformSetupRequest {
  name: string;
  adminEmail: string;
  adminPassword: string;
  adminFullName: string;
}

export interface PlatformSetupResponse {
  platformId: string;
  adminUserId: string;
}
