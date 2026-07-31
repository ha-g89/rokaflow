import { useEffect, useState } from 'react'
import { Plus, MessageSquare } from 'lucide-react'
import api from '@/lib/axios'
import type { TicketListItem } from '@/types/ticket'
import { TICKET_STATUS_TONE, TICKET_STATUS_LABEL, TICKET_CATEGORY_LABEL } from '@/types/ticket'
import { TicketDetailModal } from '@/components/tickets/TicketDetailModal'

interface Props {
  entityId: string
  teammates: { id: string; name: string }[]
  onCreateTicket: () => void
  refreshKey?: number
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function AssetTicketsBlock({ entityId, teammates, onCreateTicket, refreshKey }: Props) {
  const [tickets, setTickets] = useState<TicketListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [listKey, setListKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api.get<TicketListItem[]>(`/portal/tickets?entityType=0&entityId=${entityId}`)
      .then(r => { if (!cancelled) setTickets(r.data) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [entityId, refreshKey, listKey])

  return (
    <div>
      <div className="flex items-center justify-end mb-3">
        <button
          onClick={onCreateTicket}
          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded-lg transition-colors"
        >
          <Plus size={12} /> Ticket
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-slate-400">Laden…</p>
      ) : tickets.length === 0 ? (
        <p className="text-xs text-slate-400">Geen tickets op dit item.</p>
      ) : (
        <ul className="space-y-2">
          {tickets.map(t => (
            <li
              key={t.id}
              onClick={() => setDetailId(t.id)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 cursor-pointer transition-colors hover:border-blue-200 hover:bg-blue-50/30 dark:hover:border-blue-800/50 dark:hover:bg-blue-900/10"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                  #{t.ticketNumber} · {TICKET_CATEGORY_LABEL[t.category] ?? t.category}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-slate-400">{fmtDate(t.createdAt)}</p>
                  {t.commentCount > 0 && (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <MessageSquare size={11} /> {t.commentCount}
                    </span>
                  )}
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${TICKET_STATUS_TONE[t.status] ?? 'bg-slate-100 text-slate-600'}`}>
                {TICKET_STATUS_LABEL[t.status] ?? t.status}
              </span>
            </li>
          ))}
        </ul>
      )}

      <TicketDetailModal
        open={detailId !== null}
        ticketId={detailId}
        teammates={teammates}
        onClose={() => setDetailId(null)}
        onChanged={() => setListKey(k => k + 1)}
      />
    </div>
  )
}
