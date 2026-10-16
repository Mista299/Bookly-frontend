export type UserRole = 'CUSTOMER' | 'PROFESSIONAL' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: User;
  mfaRequired: boolean;
  mfaSetupRequired: boolean;
  mfaToken: string | null;
  deviceToken: string | null;
}

export interface RegisterResponse {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
}

export interface ApiError {
  errorCode?: string;
  message: string;
  status: number;
  details?: Record<string, string>;
  lockMinutes?: number;
  traceId?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterCustomerRequest {
  email: string;
  password: string;
  fullName: string;
}
