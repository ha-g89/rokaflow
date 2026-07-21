export const BillingInterval = { Monthly: 0, Yearly: 1 } as const
export type BillingInterval = (typeof BillingInterval)[keyof typeof BillingInterval]

export const InvoiceStatus = { Sent: 0, Reminded: 1, Overdue: 2, Paid: 3, Cancelled: 4 } as const
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus]

export const InvoiceKind = { Regular: 0, ProRataSettlement: 1 } as const
export type InvoiceKind = (typeof InvoiceKind)[keyof typeof InvoiceKind]

export interface InvoiceListItem {
  id: string
  invoiceNumber: string
  billedToTenantId: string
  billedToName: string
  periodStart: string
  periodEnd: string
  kind: InvoiceKind
  total: number
  status: InvoiceStatus
  sentAt: string | null
  dueAt: string | null
  paidAt: string | null
  createdAt: string
}

export interface InvoiceLine {
  tenantId: string
  description: string
  planName: string
  days: number
  unitPrice: number
  amount: number
}

export interface InvoiceDetail extends InvoiceListItem {
  subTotal: number
  discountPct: number
  discountAmount: number
  vatPct: number
  vatAmount: number
  lines: InvoiceLine[]
}

export interface BillingProfile {
  interval: BillingInterval
  invoiceEmail: string | null
  companyName: string | null
  addressLine: string | null
  postalCode: string | null
  city: string | null
  country: string | null
  vatNumber: string | null
  kvkNumber: string | null
  iban: string | null
  yearAnchorDate: string | null
}

export interface BillingConfig {
  vatPct: number
  yearlyDiscountPct: number
  dueDays: number
  reminderToGraceDays: number
  graceToBlockedDays: number
  onboardingExpiryDays: number
  mspBaseFee: number
  mspPerClientRate: number
}

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  [InvoiceStatus.Sent]: 'Verzonden',
  [InvoiceStatus.Reminded]: 'Herinnerd',
  [InvoiceStatus.Overdue]: 'Vervallen',
  [InvoiceStatus.Paid]: 'Betaald',
  [InvoiceStatus.Cancelled]: 'Geannuleerd',
}

// GET /api/clients returns `planStatus` as a NUMBER (TenantPlanStatus enum
// serialized numerically: 0 Trial, 1 GracePeriod, 2 Active, 3 Blocked,
// 4 PendingApproval). This is distinct from `TenantPlanStatus` in
// platformPlan.ts, which is a STRING union used by other endpoints — do not
// conflate the two.
export const TENANT_PLAN_STATUS_PENDING_APPROVAL = 4
