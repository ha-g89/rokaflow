export interface SubscriptionListItem {
  id: string
  name: string
  provider: string
  supplier: string | null
  type: 'Mobile' | 'Data'
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
  // Systeemstatus: door bulk-import gezet zolang de prijs nog ontbreekt. Niet
  // handmatig kiesbaar — zie SUB_STATUS_OPTIONS, die deze waarde bewust weglaat.
  Incomplete: 'Nog af te maken',
}

export const SUB_STATUS_TONE: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  Inactive: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  Incomplete: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
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
