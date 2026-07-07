export interface HardwareHistoryItem {
  id: string
  occurredAt: string
  summary: string
  description: string
  performedBy: string | null
}

export interface HardwareAssetListItem {
  id: string
  name: string
  brand: string
  type: string
  assetNumber: string
  serialNumber: string
  status: string
  location: string
  purchaseValue: number | null
  supplier: string | null
  assignedToUserId: string | null
  assignedToName: string | null
  locationId: string | null
  locationName: string | null
  issuedAt: string | null
  returnedAt: string | null
  createdAt: string
}

export const HARDWARE_TYPE_OPTIONS = [
  { value: 0, label: 'Laptop' },
  { value: 1, label: 'Desktop' },
  { value: 2, label: 'Telefoon' },
  { value: 3, label: 'Tablet' },
  { value: 4, label: 'Monitor' },
  { value: 5, label: 'Overig' },
] as const

export const HARDWARE_STATUS_OPTIONS = [
  { value: 0, label: 'Op voorraad' },
  { value: 1, label: 'In gebruik' },
  { value: 2, label: 'Afgeschreven' },
  { value: 3, label: 'In reparatie' },
] as const

export const HARDWARE_TYPE_LABEL: Record<string, string> = {
  Laptop: 'Laptop',
  Desktop: 'Desktop',
  Phone: 'Telefoon',
  Tablet: 'Tablet',
  Monitor: 'Monitor',
  Other: 'Overig',
}

export const HARDWARE_STATUS_LABEL: Record<string, string> = {
  InStock: 'Op voorraad',
  InUse: 'In gebruik',
  Decommissioned: 'Afgeschreven',
  UnderRepair: 'In reparatie',
}

export const HARDWARE_STATUS_TONE: Record<string, string> = {
  InStock: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  InUse: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Decommissioned: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  UnderRepair: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
}
