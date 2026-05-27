export interface DepartmentListItem {
  id: string
  name: string
  description: string
  managerUserId: string | null
  managerName: string
  memberCount: number
  hardwareCount: number
  licenseCount: number
  softwareCount: number
  createdAt: string
}

export interface DepartmentMemberDto {
  id: string
  firstName: string
  lastName: string
  jobTitle: string
  email: string
  status: string
  hardwareCount: number
  licenseCount: number
  softwareCount: number
  addedAt: string
}

export interface DepartmentDetailResponse {
  id: string
  name: string
  description: string
  managerUserId: string | null
  managerName: string
  createdAt: string
  hardwareCount: number
  licenseCount: number
  softwareCount: number
  members: DepartmentMemberDto[]
}

export interface CreateDepartmentRequest {
  name: string
  description: string
  managerUserId: string | null
  memberIds: string[]
}
