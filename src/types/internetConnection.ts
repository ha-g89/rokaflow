export interface InternetConnectionListItem {
  id: string
  product: string
  provider: string | null
  supplier: string | null
  type: string
  status: string
  activatedAt: string | null
  termMonths: number | null
  postalCode: string
  houseNumber: string
  ipAddress: string | null
  hostCount: number | null
  notes: string | null
  createdAt: string
}

export const CONNECTION_TYPE_OPTIONS = [
  { value: 0, label: 'FTTH' },
  { value: 1, label: 'FTTB' },
  { value: 2, label: 'Fiber' },
  { value: 3, label: 'DSL' },
  { value: 4, label: 'Coax' },
  { value: 5, label: '4G' },
  { value: 6, label: '5G' },
  { value: 7, label: 'Straal' },
  { value: 8, label: 'Starlink' },
  { value: 9, label: 'Anders' },
] as const

export const CONNECTION_TYPE_LABEL: Record<string, string> = {
  Ftth: 'FTTH',
  Fttb: 'FTTB',
  Fiber: 'Fiber',
  Dsl: 'DSL',
  Coax: 'Coax',
  FourG: '4G',
  FiveG: '5G',
  Straal: 'Straal',
  Starlink: 'Starlink',
  Anders: 'Anders',
}

export const INTERNET_CONNECTION_STATUS_OPTIONS = [
  { value: 0, label: 'Aangevraagd' },
  { value: 1, label: 'Actief' },
  { value: 2, label: 'Inactief' },
  { value: 3, label: 'Opgezegd' },
] as const

export const INTERNET_CONNECTION_STATUS_LABEL: Record<string, string> = {
  Requested: 'Aangevraagd',
  Active: 'Actief',
  Inactive: 'Inactief',
  Cancelled: 'Opgezegd',
}

export const INTERNET_CONNECTION_STATUS_TONE: Record<string, string> = {
  Requested: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Inactive: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}
