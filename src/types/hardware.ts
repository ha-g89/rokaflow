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
  assignedToUserId: string | null
  assignedToName: string | null
  issuedAt: string | null
  returnedAt: string | null
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
}

export const HARDWARE_STATUS_TONE: Record<string, string> = {
  InStock: 'bg-blue-100 text-blue-700',
  InUse: 'bg-emerald-100 text-emerald-700',
  Decommissioned: 'bg-slate-100 text-slate-600',
}
