export interface ClientListItem {
  id: string
  name: string
  isActive: boolean
  userCount: number
  createdAt: string
  logoDataUrl?: string | null
}

export interface ClientResponse {
  id: string
  name: string
  organisationId: string
  isActive: boolean
  userCount: number
  createdAt: string
}
