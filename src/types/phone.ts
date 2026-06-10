export interface PhoneListItem {
  id: string
  brand: string
  model: string
  serialNumber: string
  imeiNumber: string
  supplier: string | null
  status: 'InStock' | 'InUse' | 'Decommissioned'
  assignedToUserId: string | null
  assignedToName: string | null
  simCardId: string | null
  simCardNumber: string | null
  simPhoneNumber: string | null
  issuedAt: string | null
  returnedAt: string | null
  createdAt: string
}

export interface PhoneHistoryItem {
  id: string
  occurredAt: string
  summary: string
  description: string
  performedBy: string | null
}

export type PhoneStatus = PhoneListItem['status']

export const PHONE_STATUS_LABEL: Record<PhoneStatus, string> = {
  InStock: 'Op voorraad',
  InUse: 'In gebruik',
  Decommissioned: 'Afgeschreven',
}

export const PHONE_STATUS_TONE: Record<PhoneStatus, string> = {
  InStock: 'bg-blue-100 text-blue-700',
  InUse: 'bg-emerald-100 text-emerald-700',
  Decommissioned: 'bg-slate-100 text-slate-500',
}

export const PHONE_STATUS_OPTIONS = [
  { value: '0', label: 'Op voorraad' },
  { value: '1', label: 'In gebruik' },
  { value: '2', label: 'Afgeschreven' },
]
