export type TargetEntityType = 'Employee' | 'Hardware' | 'Phone' | 'SimCard' | 'License' | 'Location'
export type DefaultChecklistType = 'Starter' | 'Leaver'

export interface ProcessTemplateListItem {
  id: string
  name: string
  description: string | null
  targetEntityType: TargetEntityType
  defaultChecklistType: DefaultChecklistType | null
  isSystemDefault: boolean
  itemCount: number
  sortOrder: number
}

export interface ProcessTemplateItem {
  id: string
  title: string
  description: string | null
  sortOrder: number
  isRequired: boolean
}

export interface ProcessTemplateDetail extends ProcessTemplateListItem {
  items: ProcessTemplateItem[]
}

export const TARGET_ENTITY_LABEL: Record<TargetEntityType, string> = {
  Employee: 'Medewerkers',
  Hardware: 'Hardware',
  Phone:    'Telefoons',
  SimCard:  'SIM-kaarten',
  License:  'Licenties',
  Location: 'Locaties',
}

export const TARGET_ENTITY_TONE: Record<TargetEntityType, string> = {
  Employee: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  Hardware: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Phone:    'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  SimCard:  'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
  License:  'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  Location: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
}

export const CHECKLIST_TYPE_LABEL: Record<DefaultChecklistType, string> = {
  Starter: 'Aantreden',
  Leaver:  'Aftreden',
}

export const CHECKLIST_TYPE_TONE: Record<DefaultChecklistType, string> = {
  Starter: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Leaver:  'bg-red-50 text-red-600 ring-1 ring-red-200',
}
