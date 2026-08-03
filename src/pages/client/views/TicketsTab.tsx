import { useCallback, useEffect, useState } from 'react'
import { Inbox, Loader, CheckCircle2, Clock, Plus, Search } from 'lucide-react'
import api from '@/lib/axios'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LoadingState } from '@/components/ui/LoadingState'
import { StatCard } from '@/components/portal/PortalUI'
import { FilterSelect } from '@/components/ui/FilterSelect'
import { useSort, SortHeader } from '@/components/ui/SortHeader'
import { TicketDetailModal } from '@/components/tickets/TicketDetailModal'
import { NewTicketModal } from '@/components/tickets/NewTicketModal'
import type { TicketListItem } from '@/types/ticket'
import {
  TICKET_STATUS_LABEL, TICKET_STATUS_TONE, TICKET_STATUS_VALUE,
  TICKET_PRIORITY_LABEL, TICKET_PRIORITY_TONE, TICKET_PRIORITY_VALUE,
  TICKET_CATEGORY_LABEL, isTicketOverdue,
} from '@/types/ticket'
import type { HardwareAssetListItem } from '@/types/hardware'
import type { ClientUserListItem } from '@/types/clientUser'

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const STATUS_TABS: { key: string; label: string }[] = [
  { key: '',           label: 'Alle' },
  { key: 'Open',       label: 'Open' },
  { key: 'InProgress', label: 'In behandeling' },
  { key: 'Resolved',   label: 'Opgelost' },
  { key: 'Closed',     label: 'Gesloten' },
]

const GRID = 'grid-cols-[3.5rem_1.2fr_1.8fr_1.1fr_1.1fr_0.9fr_1fr_1fr_0.9fr]'

export function TicketsTab() {
  const [tickets, setTickets]     = useState<TicketListItem[]>([])
  const [loading, setLoading]     = useState(true)
  const [hardware, setHardware]   = useState<{ id: string; label: string }[]>([])
  const [teammates, setTeammates] = useState<{ id: string; name: string }[]>([])

  const [search, setSearch]                 = useState('')
  const [statusTab, setStatusTab]           = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  const [showNew, setShowNew]   = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

  const fetchTickets = useCallback(async () => {
    try {
      const { data } = await api.get<TicketListItem[]>('/portal/tickets')
      setTickets(data)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchTickets()
    api.get<HardwareAssetListItem[]>('/portal/hardware')
      .then(({ data }) => setHardware(data.map(h => ({ id: h.id, label: `${h.brand} ${h.name}`.trim() }))))
      .catch(() => { /* silent */ })
    api.get<ClientUserListItem[]>('/portal/users')
      .then(({ data }) => setTeammates(data.map(u => ({ id: u.id, name: `${u.firstName} ${u.lastName}`.trim() }))))
      .catch(() => { /* silent */ })
  }, [fetchTickets])

  const filtered = tickets.filter(t => {
    if (statusTab && t.status !== statusTab) return false
    if (priorityFilter && t.priority !== priorityFilter) return false
    if (!search) return true
    return `${t.description} ${t.createdByName} ${t.assetName ?? ''} #${t.ticketNumber}`
      .toLowerCase().includes(search.toLowerCase())
  })

  const { sorted, sortKey, sortDir, toggleSort } = useSort(filtered, {
    nr:          t => t.ticketNumber,
    category:    t => TICKET_CATEGORY_LABEL[t.category] ?? t.category,
    description: t => t.description,
    reporter:    t => t.createdByName || null,
    asset:       t => t.assetName ?? null,
    priority:    t => TICKET_PRIORITY_VALUE[t.priority] ?? null,
    status:      t => TICKET_STATUS_VALUE[t.status] ?? null,
    assignee:    t => t.assignedToName ?? null,
    created:     t => t.createdAt,
  })

  const openCount       = tickets.filter(t => t.status === 'Open').length
  const inProgressCount = tickets.filter(t => t.status === 'InProgress').length
  const resolvedCount   = tickets.filter(t => t.status === 'Resolved').length
  const overdueCount    = tickets.filter(isTicketOverdue).length

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <div className="grid grid-cols-4 gap-3 flex-shrink-0">
        <StatCard label="Open"           value={openCount}       icon={<Inbox size={18} />}        tone="blue" />
        <StatCard label="In behandeling" value={inProgressCount} icon={<Loader size={18} />}       tone="amber" />
        <StatCard label="Opgelost"       value={resolvedCount}   icon={<CheckCircle2 size={18} />} tone="emerald" />
        <StatCard label="Over termijn"   value={overdueCount}    icon={<Clock size={18} />}        tone="red" />
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
        <div className="flex gap-1 flex-shrink-0 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
          {STATUS_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setStatusTab(t.key)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                statusTab === t.key
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zoek ticket…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-400 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25"
          />
        </div>
        <FilterSelect label="Prioriteit" value={priorityFilter} onChange={setPriorityFilter}
          options={Object.entries(TICKET_PRIORITY_LABEL).map(([value, label]) => ({ value, label }))} />
        <Button size="sm" className="py-2" onClick={() => setShowNew(true)}>
          <Plus size={13} /> Ticket
        </Button>
      </div>

      <Card className="overflow-hidden flex flex-col flex-1 min-h-0">
        <div className={`grid ${GRID} gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700 flex-shrink-0`}>
          {([
            { label: '#',            key: 'nr' },
            { label: 'Categorie',    key: 'category' },
            { label: 'Omschrijving', key: 'description' },
            { label: 'Melder',       key: 'reporter' },
            { label: 'Asset',        key: 'asset' },
            { label: 'Prioriteit',   key: 'priority' },
            { label: 'Status',       key: 'status' },
            { label: 'Behandelaar',  key: 'assignee' },
            { label: 'Aangemaakt',   key: 'created' },
          ] as { label: string; key?: string }[]).map((h, i) => (
            <SortHeader key={i} label={h.label} sortKey={h.key} activeKey={sortKey} dir={sortDir} onToggle={toggleSort} />
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <LoadingState />
          ) : sorted.length === 0 ? (
            <div className="p-10 text-center">
              <Inbox size={36} className="mx-auto mb-3 text-slate-200 dark:text-slate-600" />
              <p className="text-sm text-slate-400">
                {search || statusTab || priorityFilter ? 'Geen resultaten gevonden.' : 'Nog geen tickets.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
              {sorted.map(t => {
                const overdue = isTicketOverdue(t)
                return (
                  <li
                    key={t.id}
                    onClick={() => setDetailId(t.id)}
                    className={`grid ${GRID} gap-3 px-4 py-3 items-center cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/40`}
                  >
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">#{t.ticketNumber}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{TICKET_CATEGORY_LABEL[t.category] ?? t.category}</p>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{t.description}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{t.createdByName || '—'}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{t.assetName ?? '—'}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium truncate w-fit ${TICKET_PRIORITY_TONE[t.priority] ?? 'bg-slate-100 text-slate-600'}`}>
                      {TICKET_PRIORITY_LABEL[t.priority] ?? t.priority}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium truncate w-fit ${TICKET_STATUS_TONE[t.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {TICKET_STATUS_LABEL[t.status] ?? t.status}
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{t.assignedToName ?? '—'}</p>
                    <p className={`text-xs truncate tabular-nums flex items-center gap-1 ${overdue ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-300'}`}>
                      {overdue && <Clock size={12} className="flex-shrink-0 text-red-500" />}
                      {fmtDate(t.createdAt)}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </Card>

      <TicketDetailModal
        open={!!detailId}
        ticketId={detailId}
        teammates={teammates}
        onClose={() => setDetailId(null)}
        onChanged={fetchTickets}
      />

      <NewTicketModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onSuccess={() => { setShowNew(false); fetchTickets() }}
        hardware={hardware}
      />
    </div>
  )
}
