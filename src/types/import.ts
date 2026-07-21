export interface ImportRowError {
  rowNumber: number
  message: string
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
