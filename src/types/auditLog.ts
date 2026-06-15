export interface AuditEntry {
  id: string
  action: string
  changes: string | null
  userName: string | null
  createdAt: string
}
