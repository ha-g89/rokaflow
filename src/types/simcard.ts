export interface SimCardListItem {
  id: string
  kaartNummer: string
  type: 'Physical' | 'ESim'
  phoneNumber: string
  provider: string
  status: 'InUse' | 'InStock' | 'Expired'
  phoneId: string | null
  phoneName: string | null
  assignedToUserId: string | null
  assignedToName: string | null
  subscriptionId: string | null
  subscriptionName: string | null
  createdAt: string
}

export const SIM_TYPE_LABEL: Record<string, string> = {
  Physical: 'SIM-kaart',
  ESim: 'eSIM',
}

export const SIM_STATUS_LABEL: Record<string, string> = {
  InUse: 'In gebruik',
  InStock: 'Voorraad',
  Expired: 'Verlopen',
}

export const SIM_STATUS_TONE: Record<string, string> = {
  InUse: 'bg-emerald-100 text-emerald-700',
  InStock: 'bg-slate-100 text-slate-600',
  Expired: 'bg-red-100 text-red-500',
}

export const SIM_TYPE_OPTIONS = [
  { value: '0', label: 'SIM-kaart' },
  { value: '1', label: 'eSIM' },
]

export const SIM_STATUS_OPTIONS = [
  { value: '0', label: 'In gebruik' },
  { value: '1', label: 'Voorraad' },
  { value: '2', label: 'Verlopen' },
]
