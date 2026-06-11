export interface LocationListItem {
  id: string
  name: string
  address: string
  city: string
  country: string
  province: string
  postalCode: string
  phone: string
  hardwareCount: number
  employeeCount: number
  createdAt: string
}

export interface LocationMemberDto {
  id: string
  firstName: string
  lastName: string
  jobTitle: string
  email: string
  status: string
}

export interface LocationHardwareDto {
  id: string
  name: string
  brand: string
  type: string
  status: string
  serialNumber: string
  assignedToName: string | null
}

export interface LocationDetailResponse {
  id: string
  name: string
  address: string
  city: string
  country: string
  province: string
  postalCode: string
  phone: string
  createdAt: string
  members: LocationMemberDto[]
  hardware: LocationHardwareDto[]
}

export interface CreateLocationRequest {
  name: string
  address: string
  city: string
  country: string
  province: string
  postalCode: string
  phone: string
}
