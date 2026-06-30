export type NotificationPriority = 'Low' | 'Medium' | 'High'

export interface NotificationDto {
  id: string
  tenantId: string
  tenantName: string | null
  type: string
  priority: NotificationPriority
  entityType: 'License' | 'Subscription' | 'HardwareAsset' | 'Phone' | 'User'
  entityId: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export interface UnreadCountDto {
  unread: number
}

export interface NotificationTypeDto {
  type: string
  displayName: string
  description: string
  entityType: string
  isEnabled: boolean
  priority: NotificationPriority
}

export interface NotificationRunLogDto {
  runAt: string
  tenantsProcessed: number
  notificationsCreated: number
  durationMs: number
}
