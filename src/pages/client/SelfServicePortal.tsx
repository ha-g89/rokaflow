import { useCallback, useEffect, useState } from 'react'
import {
  Laptop, ClipboardList, History, Ticket, FileText,
  Mail, Phone as PhoneIcon, LogOut, CheckCircle2, Smartphone, ShieldCheck, KeyRound, ChevronDown, Plus,
} from 'lucide-react'
import api from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'
import { LoadingState } from '@/components/ui/LoadingState'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Card, CardContent } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { MyTicketModal } from '@/components/tickets/MyTicketModal'
import type { TicketListItem, TicketDetailDto } from '@/types/ticket'
import { TICKET_STATUS_LABEL, TICKET_STATUS_TONE, TICKET_CATEGORY_LABEL } from '@/types/ticket'
import type { ClientUserDetailResponse } from '@/types/clientUser'
import { STATUS_LABEL } from '@/types/clientUser'
import { HARDWARE_STATUS_LABEL, HARDWARE_STATUS_TONE, HARDWARE_TYPE_LABEL } from '@/types/hardware'
import { LICENSE_TYPE_LABEL, LICENSE_TYPE_TONE } from '@/types/license'
import { PHONE_STATUS_LABEL, PHONE_STATUS_TONE } from '@/types/phone'
import logo from '@/assets/RokaFlow_icon_dark_transparent.png'

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString('nl-NL', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const field =
  'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25 transition-colors'

function TicketRow({ ticket, onClick, compact = false }: { ticket: TicketListItem; onClick: () => void; compact?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 text-left transition-colors ${
        compact
          ? 'rounded-lg px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          : 'rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/60 px-3 py-2.5 hover:border-blue-300 dark:hover:border-blue-700'
      }`}
    >
      <span className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-slate-800 dark:text-slate-100 flex-shrink-0`}>
        #{ticket.ticketNumber}
      </span>
      <span className={`${compact ? 'text-xs' : 'text-sm'} text-slate-600 dark:text-slate-300 truncate`}>
        {TICKET_CATEGORY_LABEL[ticket.category] ?? ticket.category}
      </span>
      <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${TICKET_STATUS_TONE[ticket.status] ?? 'bg-slate-100 text-slate-600'}`}>
        {TICKET_STATUS_LABEL[ticket.status] ?? ticket.status}
      </span>
      <span className="ml-auto flex-shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
        {compact ? `door ${ticket.createdByName}` : fmtDate(ticket.createdAt)}
      </span>
    </button>
  )
}

function MyTicketDetailModal({ ticketId, onClose, onChanged }: {
  ticketId: string | null
  onClose: () => void
  onChanged: () => void
}) {
  const [detail, setDetail]     = useState<TicketDetailDto | null>(null)
  const [loading, setLoading]   = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [comment, setComment]   = useState('')
  const [sending, setSending]   = useState(false)

  const load = useCallback(async (id: string) => {
    const r = await api.get<TicketDetailDto>(`/portal/me/tickets/${id}`)
    setDetail(r.data)
  }, [])

  useEffect(() => {
    if (ticketId) {
      setDetail(null)
      setApiError(null)
      setComment('')
      setLoading(true)
      load(ticketId)
        .catch(() => setApiError('Ticket kon niet worden geladen.'))
        .finally(() => setLoading(false))
    }
  }, [ticketId, load])

  const submitComment = async () => {
    if (!detail || !comment.trim()) return
    setApiError(null)
    setSending(true)
    try {
      await api.post(`/portal/me/tickets/${detail.id}/comments`, { content: comment.trim() })
      setComment('')
      await load(detail.id)
      onChanged()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(msg ?? 'Reactie versturen mislukt.')
    } finally {
      setSending(false)
    }
  }

  const closed = detail?.status === 'Closed'

  return (
    <Modal
      open={!!ticketId}
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
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aangemaakt op {fmtDate(detail.createdAt)}
            </p>
            {detail.entityType && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gekoppeld: <span className="font-medium text-slate-700 dark:text-slate-300">{detail.assetName ?? 'Gekoppeld item niet meer beschikbaar'}</span>
              </p>
            )}
          </div>

          {/* Omschrijving */}
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 px-3 py-2.5">
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{detail.description}</p>
          </div>

          {apiError && (
            <p className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">{apiError}</p>
          )}

          {/* Conversatie — de medewerker (reporter) is hier de gebruiker: rechts/blauw */}
          <div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
              Conversatie
            </p>
            {detail.comments.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500">Nog geen reacties.</p>
            ) : (
              <div className="space-y-2">
                {detail.comments.map(c => (
                  <div key={c.id} className={`flex ${c.isFromReporter ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[85%]">
                      <p className={`text-[11px] text-slate-400 dark:text-slate-500 mb-0.5 ${c.isFromReporter ? 'text-right' : ''}`}>
                        {c.isFromReporter ? 'U' : c.createdByName} · {fmtDateTime(c.createdAt)}
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
                    disabled={sending || !comment.trim()}
                  >
                    {sending ? 'Versturen…' : 'Versturen'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

function Pill({ children, tone = 'default' }: { children: React.ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
    good:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    info:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    warn:    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    bad:     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${tones[tone] ?? tones.default}`}>
      {children}
    </span>
  )
}

function FieldBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  )
}

function ContactRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 flex-shrink-0">
        {icon}
      </div>
      <span className="text-sm text-slate-700 dark:text-slate-200 truncate">{value}</span>
    </div>
  )
}

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3 text-center">
      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
    </div>
  )
}

function AssetSection({ title, icon, children, collapsible = false, defaultOpen = true, badge }: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  collapsible?: boolean
  defaultOpen?: boolean
  badge?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-5">
        <h3
          className={`flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100 ${open ? 'mb-4' : ''} ${collapsible ? 'cursor-pointer select-none' : ''}`}
          onClick={collapsible ? () => setOpen(o => !o) : undefined}
        >
          {icon}
          {title}
          {badge && <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{badge}</span>}
          {collapsible && (
            <ChevronDown size={14} className={`ml-auto text-slate-400 transition-transform duration-300 ease-in-out ${open ? 'rotate-180' : ''}`} />
          )}
        </h3>
        <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="overflow-hidden">
            {children}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyTab({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
        {icon}
      </div>
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  )
}

type Tab = 'assets' | 'checklist' | 'tickets' | 'history' | 'documents'

export default function SelfServicePortal() {
  const { user, logout } = useAuthStore()
  const [me, setMe]           = useState<ClientUserDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState<Tab>('assets')

  const [myTickets, setMyTickets]       = useState<TicketListItem[]>([])
  const [assetTickets, setAssetTickets] = useState<Record<string, TicketListItem[]>>({})
  const [ticketAsset, setTicketAsset]   = useState<{ id: string; label: string } | null>(null)
  const [detailTicketId, setDetailTicketId] = useState<string | null>(null)

  const fetchMyTickets = useCallback(async () => {
    try {
      const r = await api.get<TicketListItem[]>('/portal/me/tickets')
      setMyTickets(r.data)
    } catch { /* stil negeren */ }
  }, [])

  const fetchAssetTickets = useCallback(async (hardwareIds: string[]) => {
    const entries = await Promise.all(hardwareIds.map(async id => {
      try {
        const r = await api.get<TicketListItem[]>(`/portal/me/tickets?entityId=${id}`)
        return [id, r.data] as const
      } catch {
        return [id, []] as const
      }
    }))
    setAssetTickets(Object.fromEntries(entries))
  }, [])

  useEffect(() => {
    api.get<ClientUserDetailResponse>('/portal/me/profile')
      .then(r => {
        setMe(r.data)
        fetchAssetTickets(r.data.hardware.map(h => h.id))
      })
      .finally(() => setLoading(false))
    fetchMyTickets()
  }, [fetchMyTickets, fetchAssetTickets])

  const refreshTickets = useCallback(() => {
    fetchMyTickets()
    if (me) fetchAssetTickets(me.hardware.map(h => h.id))
  }, [me, fetchMyTickets, fetchAssetTickets])

  const status = me?.status as 'InService' | 'LeavePlanned' | 'Left' | 'StartPlanned' | undefined
  const statusTone = status === 'InService' ? 'good' : status === 'StartPlanned' ? 'info' : status === 'LeavePlanned' ? 'warn' : 'bad'

  const softwareLicenses = me?.licenses.filter(l => l.isSoftwareLicense) ?? []
  const pureLicenses     = me?.licenses.filter(l => !l.isSoftwareLicense) ?? []
  const softwareItems    = [
    ...(me?.software ?? []).map(s => ({ key: `sw-${s.id}`, name: s.name, sub: `${s.account ? s.account + ' · ' : ''}vanaf ${fmtDate(s.issuedAt)}` })),
    ...softwareLicenses.map(l => ({ key: `lic-${l.userLicenseId}`, name: l.name, sub: `${l.vendor || 'Freeware'} · toegewezen ${fmtDate(l.assignedAt)}` })),
  ]
  const licenseCount     = softwareItems.length + pureLicenses.length
  const assetCount       = (me?.hardware.length ?? 0) + (me?.phones.length ?? 0) + licenseCount
  const checklistCount   = (me?.starterChecklist.length ?? 0) + (me?.leaverChecklist.length ?? 0)
  const historyCount     = me?.history.length ?? 0
  const openTicketCount  = myTickets.filter(t => t.status === 'Open').length

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'assets',    label: 'Assets',     count: assetCount },
    { key: 'checklist', label: 'Checklist',  count: checklistCount },
    { key: 'tickets',   label: 'Tickets',    count: openTicketCount },
    { key: 'history',   label: 'Historie',   count: historyCount },
    { key: 'documents', label: 'Documenten', count: 0 },
  ]

  return (
    <div className="h-screen flex flex-col bg-slate-100 dark:bg-slate-950">
      {/* ── Header: geen sidebar, geen breadcrumb — dit is de enige oriëntatie ── */}
      <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="RokaFlow" className="w-7 h-7 rounded-lg" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {user?.tenantName ?? 'RokaFlow'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle
              size={15}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
            />
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
            >
              <LogOut size={13} /> Uitloggen
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 max-w-6xl w-full mx-auto px-6 py-6 flex flex-col">
        {loading || !me ? (
          <div className="flex-1 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center">
            <LoadingState label="Gegevens laden…" />
          </div>
        ) : (
          <div className="flex-1 min-h-0 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex items-stretch">

            {/* ── Linkerpaneel: profiel (read-only) ── */}
            <div className="w-80 flex-shrink-0 border-r border-slate-100 dark:border-slate-800 p-6 flex flex-col overflow-y-auto">
              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-4xl">
                  {(me.firstName[0] ?? '').toUpperCase()}{(me.lastName[0] ?? '').toUpperCase()}
                </div>
                <h1 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {me.firstName} {me.lastName}
                </h1>
                {me.jobTitle && <p className="text-sm text-slate-500 dark:text-slate-400">{me.jobTitle}</p>}
                <div className="mt-3">
                  {status && <Pill tone={statusTone}>{STATUS_LABEL[status]}</Pill>}
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-4">
                {me.departmentName && <FieldBlock label="Afdeling" value={me.departmentName} />}
                {me.locationName && <FieldBlock label="Locatie" value={me.locationName} />}
                {me.managerName && <FieldBlock label="Manager" value={me.managerName} />}
                {me.startDate && <FieldBlock label="In dienst sinds" value={fmtDate(me.startDate)} />}
              </div>

              {(me.email || me.phone) && (
                <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  {me.email && <ContactRow icon={<Mail size={14} />} value={me.email} />}
                  {me.phone && <ContactRow icon={<PhoneIcon size={14} />} value={me.phone} />}
                </div>
              )}

              <div className="flex-1" />

              <div className="pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3">
                <StatBox value={assetCount} label="Assets" />
                <StatBox value={openTicketCount} label="Open tickets" />
              </div>
            </div>

            {/* ── Rechterpaneel: tabs ── */}
            <div className="flex-1 min-w-0 min-h-0 flex flex-col">
              <div className="flex items-center gap-1 px-6 pt-4 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
                {TABS.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      tab === t.key
                        ? 'text-slate-900 dark:text-slate-100 font-semibold border-blue-600'
                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 border-transparent'
                    }`}
                  >
                    {t.label}
                    <span className={`text-xs rounded-full px-1.5 py-0.5 leading-none ${
                      tab === t.key
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                    }`}>
                      {t.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="p-6 flex-1 overflow-y-auto">
                {tab === 'assets' && (
                  me.hardware.length === 0 && me.phones.length === 0 && softwareItems.length === 0 && pureLicenses.length === 0 ? (
                    <EmptyTab icon={<Laptop size={22} />} label="Geen assets toegewezen." />
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-4">
                        <AssetSection title="Mijn hardware" icon={<Laptop size={16} />}>
                          {me.hardware.length === 0 ? (
                            <p className="text-sm text-slate-400">Geen hardware toegewezen.</p>
                          ) : (
                            <div className="space-y-3">
                              {me.hardware.map(h => (
                                <div key={h.id} className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/60 p-3">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{h.name}</p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {[h.brand, HARDWARE_TYPE_LABEL[h.type] ?? h.type, h.serialNumber ? `S/N: ${h.serialNumber}` : null].filter(Boolean).join(' · ')}
                                      </p>
                                    </div>
                                    <div className="flex-shrink-0 flex items-center gap-2.5">
                                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${HARDWARE_STATUS_TONE[h.status] ?? 'bg-slate-100 text-slate-600'}`}>
                                        {HARDWARE_STATUS_LABEL[h.status] ?? h.status}
                                      </span>
                                      <button
                                        onClick={() => setTicketAsset({ id: h.id, label: `${h.brand ?? ''} ${h.name}`.trim() })}
                                        className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                      >
                                        <Plus size={12} /> Ticket
                                      </button>
                                    </div>
                                  </div>
                                  {(assetTickets[h.id]?.length ?? 0) > 0 && (
                                    <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/60">
                                      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                                        Tickets op dit apparaat
                                      </p>
                                      <div className="space-y-1">
                                        {assetTickets[h.id].map(t => (
                                          <TicketRow key={t.id} ticket={t} compact onClick={() => setDetailTicketId(t.id)} />
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </AssetSection>

                        <AssetSection title="Mijn telefonie" icon={<Smartphone size={16} />}>
                          {me.phones.length === 0 ? (
                            <p className="text-sm text-slate-400">Geen telefoons toegewezen.</p>
                          ) : (
                            <div className="space-y-3">
                              {me.phones.map(p => (
                                <div key={p.id} className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/60 p-3">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{p.brand} {p.model}</p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{p.simPhoneNumber || p.serialNumber || '—'}</p>
                                    </div>
                                    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${PHONE_STATUS_TONE[p.status as keyof typeof PHONE_STATUS_TONE] ?? 'bg-slate-100 text-slate-600'}`}>
                                      {PHONE_STATUS_LABEL[p.status as keyof typeof PHONE_STATUS_LABEL] ?? p.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </AssetSection>
                      </div>

                      <div className="space-y-4">
                        <AssetSection title="Mijn software" icon={<ShieldCheck size={16} />}>
                          {softwareItems.length === 0 ? (
                            <p className="text-sm text-slate-400">Geen software gekoppeld.</p>
                          ) : (
                            <div className="space-y-3">
                              {softwareItems.map(s => (
                                <div key={s.key} className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/60 p-3">
                                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{s.name}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">{s.sub}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </AssetSection>

                        <AssetSection title="Mijn licenties" icon={<KeyRound size={16} />}>
                          {pureLicenses.length === 0 ? (
                            <p className="text-sm text-slate-400">Geen licenties gekoppeld.</p>
                          ) : (
                            <div className="space-y-3">
                              {pureLicenses.map(l => (
                                <div key={l.userLicenseId} className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/60 p-3">
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{l.name}</p>
                                    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${LICENSE_TYPE_TONE[l.type] ?? 'bg-slate-100 text-slate-600'}`}>
                                      {LICENSE_TYPE_LABEL[l.type] ?? l.type}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">{l.vendor || 'Freeware'} · toegewezen {fmtDate(l.assignedAt)}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </AssetSection>
                      </div>
                    </div>
                  )
                )}

                {tab === 'checklist' && (
                  me.starterChecklist.length === 0 && me.leaverChecklist.length === 0 ? (
                    <EmptyTab icon={<ClipboardList size={22} />} label="Geen checklist beschikbaar." />
                  ) : (
                    <div className="space-y-4">
                      {me.starterChecklist.length > 0 && (
                        <AssetSection
                          title="Checklist aantreden"
                          icon={<ClipboardList size={16} />}
                          collapsible
                          badge={`${me.starterChecklist.filter(i => i.isChecked).length}/${me.starterChecklist.length} afgevinkt`}
                        >
                          <div className="space-y-2">
                            {[...me.starterChecklist].sort((a, b) => a.sortOrder - b.sortOrder).map(item => (
                              <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/60 px-3 py-2.5">
                                <CheckCircle2 size={16} className={item.isChecked ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'} />
                                <span className={`text-sm ${item.isChecked ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                                  {item.item}
                                </span>
                              </div>
                            ))}
                          </div>
                        </AssetSection>
                      )}

                      {me.leaverChecklist.length > 0 && (
                        <AssetSection
                          title="Checklist aftreden"
                          icon={<LogOut size={16} />}
                          collapsible
                          badge={`${me.leaverChecklist.filter(i => i.isChecked).length}/${me.leaverChecklist.length} afgevinkt`}
                        >
                          <div className="space-y-2">
                            {[...me.leaverChecklist].sort((a, b) => a.sortOrder - b.sortOrder).map(item => (
                              <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/60 px-3 py-2.5">
                                <CheckCircle2 size={16} className={item.isChecked ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'} />
                                <span className={`text-sm ${item.isChecked ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                                  {item.item}
                                </span>
                              </div>
                            ))}
                          </div>
                        </AssetSection>
                      )}
                    </div>
                  )
                )}

                {tab === 'history' && (
                  me.history.length === 0 ? (
                    <EmptyTab icon={<History size={22} />} label="Geen historie beschikbaar." />
                  ) : (
                    <div className="space-y-2">
                      {me.history.map(h => (
                        <div key={h.id} className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/60 px-3 py-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-slate-700 dark:text-slate-200">{h.description}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{fmtDate(h.occurredAt)} · {h.processedBy}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {tab === 'tickets' && (
                  myTickets.length === 0 ? (
                    <EmptyTab icon={<Ticket size={22} />} label="Geen tickets. Maak een ticket aan via een apparaat onder Assets." />
                  ) : (
                    <div className="space-y-2">
                      {myTickets.map(t => (
                        <TicketRow key={t.id} ticket={t} onClick={() => setDetailTicketId(t.id)} />
                      ))}
                    </div>
                  )
                )}

                {tab === 'documents' && (
                  <EmptyTab icon={<FileText size={22} />} label="Binnenkort beschikbaar." />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {ticketAsset && (
        <MyTicketModal
          open={!!ticketAsset}
          onClose={() => setTicketAsset(null)}
          onSuccess={() => { setTicketAsset(null); refreshTickets() }}
          asset={ticketAsset}
        />
      )}

      <MyTicketDetailModal
        ticketId={detailTicketId}
        onClose={() => setDetailTicketId(null)}
        onChanged={refreshTickets}
      />
    </div>
  )
}
