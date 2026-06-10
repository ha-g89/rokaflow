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

export interface CreateLocationRequest {
  name: string
  address: string
  city: string
  country: string
  province: string
  postalCode: string
  phone: string
}
