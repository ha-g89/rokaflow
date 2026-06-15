export interface TenantHistoryItem {
  id: string
  occurredAt: string
  entityType: string
  action: string
  summary: string
  performedBy: string | null
}

export type HistoryCategory = null | 'employees' | 'hardware' | 'software' | 'licenses' | 'phones'
