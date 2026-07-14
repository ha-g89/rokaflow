import { useSort, SortHeader } from '@/components/ui/SortHeader'
import { useState } from 'react'
import { ArrowLeftRight, RefreshCw, XCircle, Loader2, Building2, Calendar, Clock } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import type { MspTransferRequestDto, MspTransferStatus } from '@/types/mspTransfer'
import { TRANSFER_STATUS_LABEL, TRANSFER_STATUS_TONE } from '@/types/mspTransfer'

// ── helpers ───────────────────────────────────────────────────────────────────

function fmt(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtTime(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleString('nl-NL', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const STATUS_FILTERS: { value: MspTransferStatus | 'all'; label: string }[] = [
  { value: 'all',       label: 'Alles' },
  { value: 'Pending',   label: 'In behandeling' },
  { value: 'Completed', label: 'Voltooid' },
  { value: 'Rejected',  label: 'Afgewezen' },
  { value: 'Cancelled', label: 'Geannuleerd' },
  { value: 'Expired',   label: 'Verlopen' },
]

// ── component ─────────────────────────────────────────────────────────────────

export interface TransfersViewProps {
  transfers: MspTransferRequestDto[]
  cancellingId: string | null
  onCancel: (id: string) => void
  onRefresh: () => void
  onNewTransfer: () => void
}

export function TransfersView({ transfers, cancellingId, onCancel, onRefresh, onNewTransfer }: TransfersViewProps) {
  const [activeFilter, setActiveFilter] = useState<MspTransferStatus | 'all'>('all')

  const counts = STATUS_FILTERS.reduce((acc, f) => {
    acc[f.value] = f.value === 'all'
      ? transfers.length
      : transfers.filter(t => t.status === f.value).length
    return acc
  }, {} as Record<string, number>)

  const visible = activeFilter === 'all'
    ? transfers
    : transfers.filter(t => t.status === activeFilter)

  const { sorted, sortKey, sortDir, toggleSort } = useSort(visible, {
    client:      t => t.tenantName,
    van:         t => t.fromMspName || null,
    naar:        t => t.toMspName,
    status:      t => TRANSFER_STATUS_LABEL[t.status] ?? t.status,
    aangevraagd: t => t.requestedAt,
  })

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">MSP Overdrachten</h2>
          <p className="text-xs text-slate-400 mt-0.5">Overzicht van alle client-overdrachten voor deze MSP</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw size={13} />
            Vernieuwen
          </button>
          <button
            onClick={onNewTransfer}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <ArrowLeftRight size={13} />
            Nieuwe overdracht
          </button>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeFilter === f.value
                ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            {f.label}
            {counts[f.value] > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeFilter === f.value
                  ? 'bg-white/20 text-white dark:bg-black/20 dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              }`}>
                {counts[f.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Transfers list */}
      {visible.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <ArrowLeftRight size={20} className="text-slate-300 dark:text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Geen overdrachten</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeFilter === 'all'
                  ? 'Er zijn nog geen overdrachten aangevraagd.'
                  : `Geen overdrachten met status "${TRANSFER_STATUS_LABEL[activeFilter as MspTransferStatus]}".`}
              </p>
            </div>
            {activeFilter === 'all' && (
              <button
                onClick={onNewTransfer}
                className="mt-1 text-xs text-blue-500 hover:underline"
              >
                Nieuwe overdracht initiëren
              </button>
            )}
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1fr_1fr_120px_120px_48px] gap-3 px-4 py-2.5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            {([
              { label: 'Client', key: 'client' },
              { label: 'Van MSP', key: 'van' },
              { label: 'Naar MSP', key: 'naar' },
              { label: 'Status', key: 'status' },
              { label: 'Aangevraagd', key: 'aangevraagd' },
              { label: '' },
            ] as { label: string; key?: string }[]).map((h, i) => (
              <SortHeader key={i} label={h.label} sortKey={h.key} activeKey={sortKey} dir={sortDir} onToggle={toggleSort} />
            ))}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {sorted.map(t => (
              <div
                key={t.id}
                className={`grid grid-cols-[1fr_1fr_1fr_120px_120px_48px] gap-3 px-4 py-3 items-center transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                  t.status === 'Pending' ? 'bg-amber-50/40 dark:bg-amber-950/10' : ''
                }`}
              >
                {/* Client */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0">
                    <Building2 size={12} className="text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{t.tenantName}</p>
                    <p className="text-[10px] text-slate-400 truncate font-mono">{t.tenantId.slice(0, 8)}…</p>
                  </div>
                </div>

                {/* Van MSP */}
                <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                  {t.fromMspName ?? <span className="text-slate-400 italic">Geen MSP</span>}
                </p>

                {/* Naar MSP */}
                <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{t.toMspName}</p>

                {/* Status */}
                <div>
                  <span className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium ${TRANSFER_STATUS_TONE[t.status]}`}>
                    {TRANSFER_STATUS_LABEL[t.status]}
                  </span>
                </div>

                {/* Aangevraagd */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Calendar size={10} className="flex-shrink-0" />
                    {fmt(t.requestedAt)}
                  </div>
                  {t.status === 'Pending' && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                      <Clock size={10} className="flex-shrink-0" />
                      Verloopt {fmt(t.expiresAt)}
                    </div>
                  )}
                  {t.completedAt && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Clock size={10} className="flex-shrink-0" />
                      {fmtTime(t.completedAt)}
                    </div>
                  )}
                </div>

                {/* Actie */}
                <div className="flex justify-end">
                  {t.status === 'Pending' && (
                    <button
                      onClick={() => onCancel(t.id)}
                      disabled={cancellingId === t.id}
                      title="Annuleren"
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      {cancellingId === t.id
                        ? <Loader2 size={14} className="animate-spin" />
                        : <XCircle size={14} />
                      }
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
