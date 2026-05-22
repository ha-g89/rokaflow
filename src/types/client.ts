export interface ClientListItem {
  id: string
  name: string
  isActive: boolean
  userCount: number
  createdAt: string
}

export interface ClientResponse {
  id: string
  name: string
  organisationId: string
  isActive: boolean
  userCount: number
  createdAt: string
}
