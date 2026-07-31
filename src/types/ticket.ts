export interface TicketListItem {
  id: string
  ticketNumber: number
  category: string
  description: string
  status: string
  priority: string
  entityType: string | null
  entityId: string | null
  assetName: string | null
  createdByUserId: string | null
  createdByName: string
  assignedToUserId: string | null
  assignedToName: string | null
  dueAt: string | null
  commentCount: number
  createdAt: string
  resolvedAt: string | null
  closedAt: string | null
}

export interface TicketCommentDto {
  id: string
  content: string
  createdByName: string
  isFromReporter: boolean
  createdAt: string
}

export interface TicketDetailDto extends TicketListItem {
  comments: TicketCommentDto[]
}

export const TICKET_STATUS_OPTIONS = [
  { value: 0, label: 'Open' },
  { value: 1, label: 'In behandeling' },
  { value: 2, label: 'Opgelost' },
  { value: 3, label: 'Gesloten' },
] as const

export const TICKET_STATUS_VALUE: Record<string, number> = { Open: 0, InProgress: 1, Resolved: 2, Closed: 3 }

export const TICKET_STATUS_LABEL: Record<string, string> = {
  Open: 'Open', InProgress: 'In behandeling', Resolved: 'Opgelost', Closed: 'Gesloten',
}

export const TICKET_STATUS_TONE: Record<string, string> = {
  Open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  InProgress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  Resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Closed: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}

export const TICKET_PRIORITY_OPTIONS = [
  { value: 0, label: 'Laag' },
  { value: 1, label: 'Normaal' },
  { value: 2, label: 'Hoog' },
  { value: 3, label: 'Urgent' },
] as const

export const TICKET_PRIORITY_VALUE: Record<string, number> = { Low: 0, Normal: 1, High: 2, Urgent: 3 }

export const TICKET_PRIORITY_LABEL: Record<string, string> = {
  Low: 'Laag', Normal: 'Normaal', High: 'Hoog', Urgent: 'Urgent',
}

export const TICKET_PRIORITY_TONE: Record<string, string> = {
  Low: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  Normal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  High: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  Urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

export const TICKET_CATEGORY_OPTIONS = [
  { value: 0, label: 'Defect, doet het niet' },
  { value: 1, label: 'Storing of traag' },
  { value: 2, label: 'Schade' },
  { value: 3, label: 'Vervanging of upgrade' },
  { value: 4, label: 'Aanvraag accessoire' },
  { value: 5, label: 'Anders' },
] as const

export const TICKET_CATEGORY_VALUE: Record<string, number> = {
  Defect: 0, Malfunction: 1, Damage: 2, Replacement: 3, Request: 4, Other: 5,
}

export const TICKET_CATEGORY_LABEL: Record<string, string> = {
  Defect: 'Defect, doet het niet',
  Malfunction: 'Storing of traag',
  Damage: 'Schade',
  Replacement: 'Vervanging of upgrade',
  Request: 'Aanvraag accessoire',
  Other: 'Anders',
}

export function isTicketOverdue(t: TicketListItem): boolean {
  return !!t.dueAt && t.status !== 'Resolved' && t.status !== 'Closed' && new Date(t.dueAt) < new Date()
}

export function notifyTicketsChanged() {
  window.dispatchEvent(new Event('rf-tickets-changed'))
}
