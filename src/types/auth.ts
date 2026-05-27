export type UserRole = 'superuser' | 'org_admin' | 'org_member' | 'client_user'

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
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: AuthUser
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
