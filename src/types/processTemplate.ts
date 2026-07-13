export type TargetEntityType = 'Employee' | 'Hardware' | 'Phone' | 'SimCard' | 'License' | 'Location'
export type DefaultChecklistType = 'Starter' | 'Leaver'

export interface ProcessTemplateListItem {
  id: string
  name: string
  description: string | null
  targetEntityType: TargetEntityType
  defaultChecklistType: DefaultChecklistType | null
  autoApplyTrigger: string | null
  isSystemDefault: boolean
  itemCount: number
  sortOrder: number
}

export type AutomationKey =
  | 'device_assigned'
  | 'device_returned'
  | 'phone_assigned'
  | 'phone_returned'
  | 'license_assigned'
  | 'license_revoked'

export interface ProcessTemplateItem {
  id: string
  title: string
  description: string | null
  sortOrder: number
  isRequired: boolean
  automationKey: string | null
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

export const AUTOMATION_KEY_OPTIONS: { value: string; label: string }[] = [
  { value: '',                 label: '— Geen automatisering —' },
  { value: 'device_assigned',  label: 'Device gekoppeld (aantreden)' },
  { value: 'phone_assigned',   label: 'Telefoon gekoppeld (aantreden)' },
  { value: 'license_assigned', label: 'Licentie gekoppeld (aantreden)' },
  { value: 'device_returned',  label: 'Device ingeleverd (aftreden)' },
  { value: 'phone_returned',   label: 'Telefoon ingeleverd (aftreden)' },
  { value: 'license_revoked',  label: 'Licentie ingetrokken (aftreden)' },
]

export const AUTOMATION_KEY_LABEL: Record<string, string> = {
  device_assigned:  'Device ↗',
  phone_assigned:   'Telefoon ↗',
  license_assigned: 'Licentie ↗',
  device_returned:  'Device ↙',
  phone_returned:   'Telefoon ↙',
  license_revoked:  'Licentie ↙',
}

// ── Auto-apply triggers (checklist verschijnt vanzelf op het apparaat) ────────

export const AUTO_APPLY_TRIGGER_OPTIONS: Partial<Record<TargetEntityType, { value: string; label: string }[]>> = {
  Hardware: [
    { value: 'hardware.age_near_limit', label: 'Hardware nadert 5 jaar (4,5+ jaar oud)' },
    { value: 'hardware.age_over_limit', label: 'Hardware ouder dan 5 jaar' },
    { value: 'hardware.os_outdated',    label: 'Besturingssysteem verouderd (end-of-life)' },
  ],
  Phone: [
    { value: 'phone.age_near_limit', label: 'Telefoon nadert 3 jaar (2,5+ jaar oud)' },
    { value: 'phone.age_over_limit', label: 'Telefoon ouder dan 3 jaar' },
  ],
}

export const AUTO_APPLY_TRIGGER_LABEL: Record<string, string> = {
  'hardware.age_near_limit': 'Nadert 5 jaar',
  'hardware.age_over_limit': 'Ouder dan 5 jaar',
  'hardware.os_outdated':    'OS verouderd',
  'phone.age_near_limit':    'Nadert 3 jaar',
  'phone.age_over_limit':    'Ouder dan 3 jaar',
}
