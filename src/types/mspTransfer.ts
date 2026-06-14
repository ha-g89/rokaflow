export type MspTransferStatus = 'Pending' | 'Completed' | 'Rejected' | 'Cancelled' | 'Expired'

export interface TenantTransferPreviewDto {
  tenantId: string
  tenantName: string
  currentMspName: string | null
  hasPendingRequest: boolean
}

export interface MspTransferRequestDto {
  id: string
  tenantId: string
  tenantName: string
  fromMspName: string | null
  toMspName: string
  status: MspTransferStatus
  notes: string | null
  requestedAt: string
  expiresAt: string
  completedAt: string | null
}

export const TRANSFER_STATUS_LABEL: Record<MspTransferStatus, string> = {
  Pending:   'In behandeling',
  Completed: 'Voltooid',
  Rejected:  'Afgewezen',
  Cancelled: 'Geannuleerd',
  Expired:   'Verlopen',
}

export const TRANSFER_STATUS_TONE: Record<MspTransferStatus, string> = {
  Pending:   'bg-amber-100 text-amber-700',
  Completed: 'bg-emerald-100 text-emerald-700',
  Rejected:  'bg-red-100 text-red-700',
  Cancelled: 'bg-slate-100 text-slate-500',
  Expired:   'bg-slate-100 text-slate-500',
}
