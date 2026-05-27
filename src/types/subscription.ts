export interface SubscriptionListItem {
  id: string
  name: string
  provider: string
  type: 'Mobile' | 'Internet'
  bundle: string
  monthlyCost: number | null
  startsAt: string | null
  expiresAt: string | null
  status: 'Active' | 'Cancelled' | 'Inactive'
  location: string
  simCardId: string | null
  simCardNumber: string | null
  simPhoneNumber: string | null
  assignedToName: string | null
  createdAt: string
}

export const SUB_TYPE_LABEL: Record<string, string> = {
  Mobile: 'Mobiel',
  Internet: 'Internet',
}

export const SUB_STATUS_LABEL: Record<string, string> = {
  Active: 'Actief',
  Cancelled: 'Opgezegd',
  Inactive: 'Inactief',
}

export const SUB_STATUS_TONE: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-red-100 text-red-600',
  Inactive: 'bg-amber-100 text-amber-700',
}

export const SUB_TYPE_OPTIONS = [
  { value: '0', label: 'Mobiel' },
  { value: '1', label: 'Internet' },
]

export const SUB_STATUS_OPTIONS = [
  { value: '0', label: 'Actief' },
  { value: '1', label: 'Opgezegd' },
  { value: '2', label: 'Inactief' },
]
