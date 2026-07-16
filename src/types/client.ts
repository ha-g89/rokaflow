export interface ClientListItem {
  id: string
  name: string
  isActive: boolean
  userCount: number
  createdAt: string
  organisationId?: string | null
  organisationName?: string | null
  logoDataUrl?: string | null
  /** Numeric TenantPlanStatus (0 Trial, 1 GracePeriod, 2 Active, 3 Blocked, 4 PendingApproval). See src/types/billing.ts. */
  planStatus?: number | null
}

export interface ClientResponse {
  id: string
  name: string
  organisationId: string
  isActive: boolean
  userCount: number
  createdAt: string
}
