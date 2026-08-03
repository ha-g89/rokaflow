import { useCallback, useEffect, useState } from 'react'
import { Mail } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { HistoryBlock } from '@/components/portal/AuditHistory'
import type { AuditEntry } from '@/types/auditLog'
import api from '@/lib/axios'
import type { TicketDetailDto } from '@/types/ticket'
import {
  TICKET_STATUS_OPTIONS, TICKET_STATUS_VALUE, TICKET_STATUS_LABEL, TICKET_STATUS_TONE,
  TICKET_PRIORITY_OPTIONS, TICKET_PRIORITY_VALUE, TICKET_PRIORITY_LABEL, TICKET_PRIORITY_TONE,
  TICKET_CATEGORY_LABEL,
  isTicketOverdue, notifyTicketsChanged,
} from '@/types/ticket'

interface Props {
  open: boolean
  ticketId: string | null
  teammates: { id: string; name: string }[]
  onClose: () => void
  onChanged?: () => void
}

const field =
  'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25 transition-colors'

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString('nl-NL', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function ticketAuditLabel(entry: AuditEntry): string {
  switch (entry.action) {
    case 'Created': return 'Ticket aangemaakt'
    case 'Updated': return 'Ticket gewijzigd'
    case 'Deleted': return 'Ticket verwijderd'
    default: return entry.action
  }
}

export function TicketDetailModal({ open, ticketId, teammates, onClose, onChanged }: Props) {
  const [detail, setDetail] = useState<TicketDetailDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // Select-waarden als strings (huisregel: conversie pas bij versturen)
  const [status, setStatus] = useState('0')
  const [priority, setPriority] = useState('1')
  const [assignee, setAssignee] = useState('')
  const [saving, setSaving] = useState(false)

  const [comment, setComment] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)

  const loadDetail = useCallback(async (id: string) => {
    const r = await api.get<TicketDetailDto>(`/portal/tickets/${id}`)
    setDetail(r.data)
    setStatus(String(TICKET_STATUS_VALUE[r.data.status] ?? 0))
    setPriority(String(TICKET_PRIORITY_VALUE[r.data.priority] ?? 1))
    setAssignee(r.data.assignedToUserId ?? '')
  }, [])

  useEffect(() => {
    if (open && ticketId) {
      setDetail(null)
      setApiError(null)
      setComment('')
      setPendingStatus(null)
      setLoading(true)
      loadDetail(ticketId)
        .catch(() => setApiError('Ticket kon niet worden geladen.'))
        .finally(() => setLoading(false))
    }
  }, [open, ticketId, loadDetail])

  const saveUpdate = async (next: { status: string; priority: string; assignee: string }) => {
    if (!detail) return
    setStatus(next.status)
    setPriority(next.priority)
    setAssignee(next.assignee)
    setApiError(null)
    setSaving(true)
    try {
      await api.put(`/portal/tickets/${detail.id}`, {
        status: Number(next.status),
        priority: Number(next.priority),
        assignedToUserId: next.assignee || null,
      })
      await loadDetail(detail.id)
      notifyTicketsChanged()
      onChanged?.()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(msg ?? 'Opslaan mislukt.')
      await loadDetail(detail.id) // selects terugzetten naar de opgeslagen waarden
    } finally {
      setSaving(false)
    }
  }

  const submitComment = async () => {
    if (!detail || !comment.trim()) return
    setApiError(null)
    setSendingComment(true)
    try {
      await api.post(`/portal/tickets/${detail.id}/comments`, { content: comment.trim() })
      setComment('')
      await loadDetail(detail.id)
      notifyTicketsChanged()
      onChanged?.()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(msg ?? 'Reactie versturen mislukt.')
    } finally {
      setSendingComment(false)
    }
  }

  const overdue = detail ? isTicketOverdue(detail) : false
  const closed = detail?.status === 'Closed'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={detail ? `Ticket #${detail.ticketNumber}` : 'Ticket'}
      className="max-w-2xl"
    >
      {loading || !detail ? (
        apiError ? (
          <p className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">{apiError}</p>
        ) : (
          <LoadingState label="Ticket laden…" size="sm" />
        )
      ) : (
        <div className="space-y-5">
          {/* Kop */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {TICKET_CATEGORY_LABEL[detail.category] ?? detail.category}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TICKET_STATUS_TONE[detail.status] ?? ''}`}>
                {TICKET_STATUS_LABEL[detail.status] ?? detail.status}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TICKET_PRIORITY_TONE[detail.priority] ?? ''}`}>
                {TICKET_PRIORITY_LABEL[detail.priority] ?? detail.priority}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gemeld door {detail.createdByName || 'onbekend'} op {fmtDate(detail.createdAt)}
            </p>
            {detail.entityType && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gekoppeld: <span className="font-medium text-slate-700 dark:text-slate-300">{detail.assetName ?? 'Gekoppeld item niet meer beschikbaar'}</span>
              </p>
            )}
            {overdue && detail.dueAt && (
              <p className="text-xs font-medium text-red-600 dark:text-red-400">
                Termijn verstreken · <span className="text-red-600 dark:text-red-400">{fmtDate(detail.dueAt)}</span>
              </p>
            )}
          </div>

          {/* Omschrijving */}
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 px-3 py-2.5">
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{detail.description}</p>
          </div>

          {/* Status / Prioriteit / Behandelaar */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Status</label>
              <select
                className={field}
                value={status}
                disabled={saving}
                onChange={e => { if (e.target.value !== status) setPendingStatus(e.target.value) }}
              >
                {TICKET_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Prioriteit</label>
              <select
                className={field}
                value={priority}
                disabled={saving}
                onChange={e => saveUpdate({ status, priority: e.target.value, assignee })}
              >
                {TICKET_PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Behandelaar</label>
              <select
                className={field}
                value={assignee}
                disabled={saving}
                onChange={e => saveUpdate({ status, priority, assignee: e.target.value })}
              >
                <option value="">Niet toegewezen</option>
                {teammates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          {apiError && (
            <p className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">{apiError}</p>
          )}

          {/* Conversatie */}
          <div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
              Conversatie
            </p>
            {detail.comments.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500">Nog geen reacties.</p>
            ) : (
              <div className="space-y-2">
                {detail.comments.map(c => (
                  <div key={c.id} className={`flex ${c.isFromReporter ? 'justify-start' : 'justify-end'}`}>
                    <div className="max-w-[85%]">
                      <p className={`text-[11px] text-slate-400 dark:text-slate-500 mb-0.5 ${c.isFromReporter ? '' : 'text-right'}`}>
                        {c.createdByName} · {fmtDateTime(c.createdAt)}
                      </p>
                      <div
                        className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                          c.isFromReporter
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-slate-800 dark:text-slate-200'
                            : 'bg-slate-100 dark:bg-slate-700/60 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {c.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {closed ? (
              <p className="mt-3 text-xs text-slate-400 dark:text-slate-500 italic">Dit ticket is gesloten.</p>
            ) : (
              <div className="mt-3 space-y-2">
                <textarea
                  className={field}
                  rows={3}
                  placeholder="Schrijf een reactie…"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={submitComment}
                    disabled={sendingComment || !comment.trim()}
                  >
                    {sendingComment ? 'Versturen…' : 'Versturen'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Historie */}
          <HistoryBlock entityType="Ticket" entityId={detail.id} labelFn={ticketAuditLabel} />
        </div>
      )}

      {/* Bevestiging statuswijziging (overlay binnen de modal) */}
      {pendingStatus !== null && (
        <div className="absolute inset-0 z-10 rounded-2xl bg-white/85 dark:bg-slate-900/85 flex items-start justify-center pt-24 px-6">
          <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-600 shadow-2xl p-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/25 flex items-center justify-center">
                <Mail size={22} className="text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  Weet je zeker dat je de status wilt wijzigen naar{' '}
                  <span className="font-semibold">
                    "{TICKET_STATUS_OPTIONS.find(o => String(o.value) === pendingStatus)?.label ?? pendingStatus}"
                  </span>?
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                  De melder ontvangt hiervan automatisch een e-mail.
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="secondary" className="flex-1" onClick={() => setPendingStatus(null)}>
                Annuleren
              </Button>
              <Button className="flex-1" onClick={() => {
                const s = pendingStatus
                setPendingStatus(null)
                if (s !== null) saveUpdate({ status: s, priority, assignee })
              }}>
                Ja, wijzig status
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
