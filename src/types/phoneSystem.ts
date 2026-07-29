export interface PhoneSystemListItem {
  id: string
  product: string
  label: string | null
  provider: string | null
  supplier: string | null
  type: string
  status: string
  seatCount: number | null
  channelCount: number | null
  mainNumber: string | null
  numberRange: string | null
  requestedAt: string
  activatedAt: string | null
  termMonths: number | null
  monthlyCost: number | null
  city: string
  notes: string | null
  createdAt: string
}

export const PHONE_SYSTEM_TYPE_OPTIONS = [
  { value: 0, label: 'Hosted (cloud)' },
  { value: 1, label: 'On-premise' },
  { value: 2, label: 'SIP-trunk' },
  { value: 3, label: 'Anders' },
] as const

export const PHONE_SYSTEM_TYPE_VALUE: Record<string, number> = {
  Hosted: 0, OnPremise: 1, SipTrunk: 2, Anders: 3,
}

export const PHONE_SYSTEM_TYPE_LABEL: Record<string, string> = {
  Hosted: 'Hosted (cloud)',
  OnPremise: 'On-premise',
  SipTrunk: 'SIP-trunk',
  Anders: 'Anders',
}

export const PHONE_SYSTEM_STATUS_OPTIONS = [
  { value: 0, label: 'Aangevraagd' },
  { value: 1, label: 'Actief' },
  { value: 2, label: 'Inactief' },
  { value: 3, label: 'Opgezegd' },
] as const

export const PHONE_SYSTEM_STATUS_VALUE: Record<string, number> = {
  Requested: 0, Active: 1, Inactive: 2, Cancelled: 3,
}

export const PHONE_SYSTEM_STATUS_LABEL: Record<string, string> = {
  Requested: 'Aangevraagd',
  Active: 'Actief',
  Inactive: 'Inactief',
  Cancelled: 'Opgezegd',
}

export const PHONE_SYSTEM_STATUS_TONE: Record<string, string> = {
  Requested: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Inactive: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}
