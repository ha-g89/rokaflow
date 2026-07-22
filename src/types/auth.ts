export type UserRole = 'superuser' | 'msp_admin' | 'msp_member' | 'portal_admin' | 'employee'

/** Spiegelt backend RokaFlow.Domain.Enums.TenantType (Client = 0, Msp = 1). */
export enum AccountType {
  Client = 0,
  Msp = 1,
}

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  tenantId: string | null
  tenantName: string | null
  /** Set when operating in a context-switch (MSP mode) */
  switchedFromOrgId: string | null
  switchedFromOrgName: string | null
}

export interface LoginResponse {
  accessToken?: string
  refreshToken?: string
  expiresIn?: number
  user?: AuthUser
  mfaRequired?: boolean
  mfaSetupRequired?: boolean
  mfaChallengeToken?: string
}

export interface MfaSetupResponse {
  otpAuthUri: string
}

export interface LoginRequest {
  email: string
  password: string
}

/** Response from POST /api/clients/{id}/switch */
export interface SwitchToClientResponse {
  switchToken: string
  clientId: string
  clientName: string
  orgName: string
}
