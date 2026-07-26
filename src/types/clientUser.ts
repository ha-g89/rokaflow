export interface ClientUserListItem {
  id: string
  email: string
  firstName: string
  lastName: string
  department: string
  jobTitle: string
  status: 'InService' | 'LeavePlanned' | 'Left' | 'StartPlanned'
  startDate: string | null
  leaveDate: string | null
  isActive: boolean
  isPortalUser: boolean
  hardwareCount: number
  licenseCount: number
  completeness: number
  createdAt: string
  departmentId: string | null
  departmentName: string
  managerName: string
}

export interface ClientUserResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  clientId: string
  isActive: boolean
  createdAt: string
}

export type ContractType = 'Vast' | 'Tijdelijk' | 'Stagiair' | 'Extern'

export interface ClientUserDetailResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  department: string
  departmentId: string | null
  departmentName: string
  managerId: string | null
  managerName: string
  jobTitle: string
  phone: string
  status: 'InService' | 'LeavePlanned' | 'Left' | 'StartPlanned'
  contractType: ContractType | null
  startDate: string | null
  leaveDate: string | null
  locationId: string | null
  locationName: string | null
  isActive: boolean
  isPortalUser: boolean
  role: string
  completeness: number
  createdAt: string
  hardware: HardwareAssetDto[]
  phones: PhoneDto[]
  software: SoftwareAssignmentDto[]
  licenses: UserLicenseDto[]
  starterChecklist: ChecklistEntryDto[]
  leaverChecklist: ChecklistEntryDto[]
  history: UserActivityDto[]
}

export interface HardwareAssetDto {
  id: string
  name: string
  brand: string
  assetNumber: string
  serialNumber: string
  type: string
  status: string
  location: string
  purchaseValue: number | null
  issuedAt: string | null
  returnedAt: string | null
  isReturned: boolean
}

export interface UserLicenseDto {
  userLicenseId: string
  licenseId: string
  name: string
  vendor: string
  type: string
  assignedAt: string
  isActive: boolean
  expiresAt: string | null
  isSoftwareLicense: boolean
}

export interface SoftwareAssignmentDto {
  id: string
  name: string
  account: string
  issuedAt: string
  isActive: boolean
}

export interface PhoneDto {
  id: string
  brand: string
  model: string
  serialNumber: string
  imeiNumber: string
  status: string
  purchaseValue: number | null
  purchasedAt: string | null
  simCardNumber: string | null
  simPhoneNumber: string | null
}

export interface ChecklistEntryDto {
  id: string
  sortOrder: number
  item: string
  isChecked: boolean
  updatedAt: string
}

export interface UserActivityDto {
  id: string
  occurredAt: string
  description: string
  processedBy: string
}

export type UserStatus = ClientUserListItem['status']

export const STATUS_LABEL: Record<UserStatus, string> = {
  InService:    'In dienst',
  StartPlanned: 'In dienst gepland',
  LeavePlanned: 'Uit dienst gepland',
  Left:         'Uit dienst',
}

export const STATUS_TONE: Record<UserStatus, string> = {
  InService:    'bg-emerald-100 text-emerald-700',
  StartPlanned: 'bg-blue-100 text-blue-700',
  LeavePlanned: 'bg-amber-100 text-amber-800',
  Left:         'bg-red-100 text-red-700',
}
