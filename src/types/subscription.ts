export interface SubscriptionListItem {
  id: string
  name: string
  provider: string
  supplier: string | null
  type: 'Mobile' | 'Data'
  bundle: string
  monthlyCost: number | null
  startsAt: string | null
  expiresAt: string | null
  status: 'Active' | 'Cancelled' | 'Inactive' | 'Incomplete'
  location: string
  simCardId: string | null
  simCardNumber: string | null
  simPhoneNumber: string | null
  assignedToName: string | null
  createdAt: string
}

export const SUB_TYPE_LABEL: Record<string, string> = {
  Mobile: 'Mobiel',
  Data: 'Data',
}

export const SUB_STATUS_LABEL: Record<string, string> = {
  Active: 'Actief',
  Cancelled: 'Opgezegd',
  Inactive: 'Inactief',
  // Systeemstatus: door bulk-import gezet zolang prijs/bundel nog ontbreken. Niet
  // handmatig kiesbaar — zie SUB_STATUS_OPTIONS, die deze waarde bewust weglaat.
  Incomplete: 'Nog af te maken',
}

export const SUB_STATUS_TONE: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-red-100 text-red-600',
  Inactive: 'bg-amber-100 text-amber-700',
  Incomplete: 'bg-violet-100 text-violet-700',
}

export const SUB_TYPE_OPTIONS = [
  { value: '0', label: 'Mobiel' },
  { value: '1', label: 'Data' },
]

export const SUB_STATUS_OPTIONS = [
  { value: '0', label: 'Actief' },
  { value: '1', label: 'Opgezegd' },
  { value: '2', label: 'Inactief' },
]
