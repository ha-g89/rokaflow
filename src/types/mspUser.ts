export interface MspUserListItem {
  id: string
  firstName: string
  lastName: string
  email: string
  role: 'MspAdmin' | 'MspMember'
  status: 'Actief' | 'UitnodigingVerstuurd' | 'ToegangIngetrokken'
  createdAt: string
}
