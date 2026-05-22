export interface SimCardListItem {
  id: string
  kaartNummer: string
  type: 'Physical' | 'ESim'
  phoneNumber: string
  provider: string
  status: 'InUse' | 'Reserved' | 'Expired'
  phoneId: string | null
  phoneName: string | null
  assignedToUserId: string | null
  assignedToName: string | null
  subscriptionId: string | null
  subscriptionName: string | null
  createdAt: string
}

export const SIM_TYPE_LABEL: Record<string, string> = {
  Physical: 'Fysiek',
  ESim: 'eSIM',
}

export const SIM_STATUS_LABEL: Record<string, string> = {
  InUse: 'In gebruik',
  Reserved: 'Gereserveerd',
  Expired: 'Verlopen',
}

export const SIM_STATUS_TONE: Record<string, string> = {
  InUse: 'bg-emerald-100 text-emerald-700',
  Reserved: 'bg-amber-100 text-amber-700',
  Expired: 'bg-slate-100 text-slate-500',
}

export const SIM_TYPE_OPTIONS = [
  { value: '0', label: 'Fysiek' },
  { value: '1', label: 'eSIM' },
]

export const SIM_STATUS_OPTIONS = [
  { value: '0', label: 'In gebruik' },
  { value: '1', label: 'Gereserveerd' },
  { value: '2', label: 'Verlopen' },
]
