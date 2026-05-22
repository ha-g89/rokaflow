export interface OrganisationListItem {
  id: string
  name: string
  slug: string
  isActive: boolean
  userCount: number
  clientCount: number
  createdAt: string
}

export interface OrganisationDetailResponse {
  id: string
  name: string
  slug: string
  isActive: boolean
  createdAt: string
  clients: OrgClientItem[]
  users: OrgUserItem[]
}

export interface OrgClientItem {
  id: string
  name: string
  isActive: boolean
  userCount: number
  createdAt: string
}

export interface OrgUserItem {
  id: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
}

export interface CreateOrganisationRequest {
  name: string
  slug?: string
  adminEmail: string
  adminPassword: string
}
