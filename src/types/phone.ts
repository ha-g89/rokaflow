export interface PhoneListItem {
  id: string
  brand: string
  model: string
  serialNumber: string
  imeiNumber: string
  supplier: string | null
  purchaseValue: number | null
  status: 'InStock' | 'InUse' | 'Decommissioned' | 'UnderRepair' | 'OnOrder'
  assignedToUserId: string | null
  assignedToName: string | null
  simCardId: string | null
  simCardNumber: string | null
  simPhoneNumber: string | null
  subscriptionName: string | null
  subscriptionProvider: string | null
  subscriptionStatus: string | null
  purchasedAt: string | null
  returnedAt: string | null
  orderedAt: string | null
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
  UnderRepair: 'In reparatie',
  OnOrder: 'In bestelling',
}

export const PHONE_STATUS_TONE: Record<PhoneStatus, string> = {
  InStock: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  InUse: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Decommissioned: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
  UnderRepair: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  OnOrder: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
}

export const PHONE_STATUS_OPTIONS = [
  { value: '0', label: 'Op voorraad' },
  { value: '1', label: 'In gebruik' },
  { value: '2', label: 'Afgeschreven' },
  { value: '3', label: 'In reparatie' },
  { value: '4', label: 'In bestelling' },
]

export function phoneStatusToValue(status: PhoneStatus): number {
  const map: Record<PhoneStatus, number> = { InStock: 0, InUse: 1, Decommissioned: 2, UnderRepair: 3, OnOrder: 4 }
  return map[status] ?? 0
}
