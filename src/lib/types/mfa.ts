export interface MfaEnrollmentResponse {
  secret: string;
  otpauthUri: string;
}

export interface MfaConfirmResponse {
  // El backend ha cambiado el nombre de este campo entre versiones:
  // algunas builds lo exponen como `session`, otras como `authResponse`.
  // El frontend acepta ambos para ser tolerante a deploys viejos y nuevos.
  session?: import('$lib/types/auth').AuthResponse;
  authResponse?: import('$lib/types/auth').AuthResponse;
  recoveryCodes: string[];
}

export interface MfaVerifyRequest {
  mfaToken: string;
  code: string;
  trustDevice: boolean;
}

export interface MfaEnrollRequest {
  mfaToken: string;
}

export interface MfaDisableRequest {
  password: string;
  code: string;
}

export interface MfaRegenerateRequest {
  code: string;
}

export interface MfaRecoveryCodesResponse {
  recoveryCodes: string[];
}

export interface MfaRecoveryStatusResponse {
  remaining: number;
}
