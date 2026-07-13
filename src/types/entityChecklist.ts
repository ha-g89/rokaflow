export interface EntityChecklistItem {
  id: string
  title: string
  sortOrder: number
  isChecked: boolean
  checkedAt: string | null
  checkedBy: string | null
}

export interface EntityChecklist {
  id: string
  templateId: string | null
  templateName: string
  entityType: string
  entityId: string
  appliedBy: string
  createdAt: string
  completedAt: string | null
  items: EntityChecklistItem[]
}
