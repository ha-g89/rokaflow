export interface SoftwareListItem {
  id: string
  name: string
  publisher: string
  vendor: string | null
  isPaid: boolean
  licenseId: string | null
  licenseName: string | null
  maxUsers: number | null
  assignedUsers: number | null
  licenseExpiresAt: string | null
  createdAt: string
}
