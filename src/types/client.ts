export interface ClientListItem {
  id: string
  name: string
  isActive: boolean
  userCount: number
  createdAt: string
  organisationId?: string | null
  organisationName?: string | null
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
