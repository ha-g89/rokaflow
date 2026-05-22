export type UserRole = 'superuser' | 'org_admin' | 'org_member' | 'client_user'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  tenantId: string | null
  tenantName: string | null
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
