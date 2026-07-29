export interface EntityNote {
  id: string
  content: string
  createdAt: string
  createdByName: string
  createdByUserId: string | null
  isFromMsp: boolean
}

export type NoteEntityType =
  | 'Employee'
  | 'Hardware'
  | 'License'
  | 'Software'
  | 'Subscription'
  | 'Phone'
  | 'SimCard'
  | 'InternetConnection'
  | 'PhoneSystem'
