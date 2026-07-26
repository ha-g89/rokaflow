export interface ImportRowError {
  rowNumber: number
  message: string
}

export interface ImportFieldDefinition {
  key: string
  label: string
  required: boolean
}

export interface ImportColumnsResult {
  fileErrors: string[]
  fileColumns: string[]
  fields: ImportFieldDefinition[]
  suggestedMapping: Record<string, string | null>
}

export interface ImportResult {
  createdCount: number
  skippedCount: number
  errors: ImportRowError[]
}

export interface ImportHardwareRow {
  rowNumber: number
  isValid: boolean
  errors: string[]
  name: string
  brand: string
  assetNumber: string
  serialNumber: string
  type: string
  supplier: string | null
  purchaseValue: number | null
  locationName: string | null
  locationWillBeCreated: boolean
  assignedToEmail: string | null
}

export interface HardwareImportPreview {
  fileErrors: string[]
  totalRows: number
  validRowCount: number
  planLimitExceeded: boolean
  planLimitMessage: string | null
  rows: ImportHardwareRow[]
}

export interface ImportEmployeeRow {
  rowNumber: number
  isValid: boolean
  errors: string[]
  firstName: string
  lastName: string
  email: string
  department: string | null
  jobTitle: string | null
  phone: string | null
  startDate: string | null
  contractType: string | null
  managerEmail: string | null
  locationName: string | null
  locationWillBeCreated: boolean
}

export interface EmployeeImportPreview {
  fileErrors: string[]
  totalRows: number
  validRowCount: number
  planLimitExceeded: boolean
  planLimitMessage: string | null
  rows: ImportEmployeeRow[]
}

export interface ImportSoftwareRow {
  rowNumber: number
  isValid: boolean
  errors: string[]
  name: string
  publisher: string
  vendor: string | null
  isPaid: boolean
  assignedToEmail: string | null
}

export interface SoftwareImportPreview {
  fileErrors: string[]
  totalRows: number
  validRowCount: number
  planLimitExceeded: boolean
  planLimitMessage: string | null
  rows: ImportSoftwareRow[]
}

export interface ImportPhoneRow {
  rowNumber: number
  isValid: boolean
  errors: string[]
  brand: string
  model: string
  serialNumber: string
  imeiNumber: string
  supplier: string | null
  purchaseValue: number | null
  assignedToEmail: string | null
}

export interface PhoneImportPreview {
  fileErrors: string[]
  totalRows: number
  validRowCount: number
  planLimitExceeded: boolean
  planLimitMessage: string | null
  rows: ImportPhoneRow[]
}

export interface ImportSubscriptionRow {
  rowNumber: number
  isValid: boolean
  errors: string[]
  name: string
  provider: string | null
  supplier: string | null
  type: string | null
  bundle: string | null
  phoneNumber: string | null
  monthlyCost: number | null
  startsAt: string | null
  expiresAt: string | null
  status: string | null
  assignedToEmail: string | null
}

export interface SubscriptionImportPreview {
  fileErrors: string[]
  totalRows: number
  validRowCount: number
  planLimitExceeded: boolean
  planLimitMessage: string | null
  rows: ImportSubscriptionRow[]
}
