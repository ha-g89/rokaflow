export interface LicenseListItem {
  id: string
  name: string
  vendor: string
  supplier: string | null
  type: string
  target: 'User' | 'Device'
  maxUsers: number
  assignedUsers: number
  startsAt: string
  expiresAt: string | null
  isActive: boolean
  users: LicenseUserDto[]
  devices: LicenseDeviceDto[]
}

export interface LicenseUserDto {
  userLicenseId: string
  userId: string
  fullName: string
  email: string
  assignedAt: string
}

export interface LicenseDeviceDto {
  deviceLicenseId: string
  hardwareAssetId: string
  name: string
  brand: string
  serialNumber: string
  assignedAt: string
}

export const LICENSE_TYPE_OPTIONS = [
  { value: 0, label: 'Basic' },
  { value: 1, label: 'Pro' },
  { value: 2, label: 'Enterprise' },
] as const

export const LICENSE_TARGET_OPTIONS = [
  { value: '0', label: 'Gebruiker' },
  { value: '1', label: 'Device' },
]

export const LICENSE_TYPE_LABEL: Record<string, string> = {
  Basic: 'Basic',
  Pro: 'Pro',
  Enterprise: 'Enterprise',
  Free: 'Gratis',
}

export const LICENSE_TYPE_TONE: Record<string, string> = {
  Basic: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  Pro: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Enterprise: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  Free: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
}

export const LICENSE_TARGET_LABEL: Record<string, string> = {
  User: 'Gebruiker',
  Device: 'Device',
}
