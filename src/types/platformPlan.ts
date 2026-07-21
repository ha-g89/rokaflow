import type { BillingInterval } from './billing'

export type TenantPlanStatus = 'Trial' | 'GracePeriod' | 'Active' | 'Blocked' | 'PendingApproval' | 'None'

export interface PlatformPlanDto {
  id: string
  name: string
  maxAssets: number
  maxEmployees: number
  maxPortalUsers: number
  directRate: number | null
  mspDiscountPct: number
  sortOrder: number
  isActive: boolean
  tenantCount: number
}

export interface TenantPlanDto {
  tenantId: string
  tenantName: string
  planId: string | null
  planName: string | null
  status: TenantPlanStatus
  interval: BillingInterval
  yearAnchorDate: string | null
  trialEndsAt: string | null
  graceEndsAt: string | null
  activatedAt: string | null
  createdAt: string
  monthlyAmount: number | null
  nextBillingDate: string | null
}

export interface MyPlanDto {
  planId: string | null
  planName: string | null
  status: TenantPlanStatus
  trialEndsAt: string | null
  graceEndsAt: string | null
  activatedAt: string | null
  maxAssets: number | null
  maxEmployees: number | null
  maxPortalUsers: number | null
  usedAssets: number
  usedEmployees: number
  usedPortalUsers: number
}
