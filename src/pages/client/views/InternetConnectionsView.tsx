import { useState, useEffect } from 'react'
import {
  ArrowLeft, EthernetPort, Search, Plus, Package, CheckCircle2, Clock, XCircle,
  Pencil, Trash2, Maximize2, StickyNote, History,
} from 'lucide-react'
import api from '@/lib/axios'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LoadingState } from '@/components/ui/LoadingState'
import { StatCard } from '@/components/portal/PortalUI'
import { ItemHistoryBlock } from '@/components/portal/AuditHistory'
import { NotesPanel } from '@/components/NotesPanel'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { ConfirmCancelModal } from '@/components/ui/ConfirmCancelModal'
import { FilterSelect } from '@/components/ui/FilterSelect'
import { useSort, SortHeader } from '@/components/ui/SortHeader'
import { InternetConnectionModal } from '@/components/InternetConnectionModal'
import type { InternetConnectionListItem } from '@/types/internetConnection'
import {
  CONNECTION_TYPE_LABEL,
  INTERNET_CONNECTION_STATUS_LABEL,
  INTERNET_CONNECTION_STATUS_TONE,
} from '@/types/internetConnection'

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtCurrency(v: number | null | undefined) {
  if (v == null) return '—'
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(v)
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  )
}

// ── Compact detail panel (right column) ────────────────────────────────────────

function InternetConnectionCompactPanel({ c, onEdit, onCancel, onDelete, onExpand, busy, historyKey }: {
  c: InternetConnectionListItem
  onEdit: () => void
  onCancel: () => void
  onDelete: () => void
  onExpand: () => void
  busy: boolean
  historyKey: number
}) {
  const [activeTab, setActiveTab] = useState<'notes' | 'history'>('notes')

  return (
    <Card className="overflow-hidden">
      <div className="px-5 pt-4 pb-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate mb-0.5">{c.product}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
              {[CONNECTION_TYPE_LABEL[c.type] ?? c.type, c.provider].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={onEdit} title="Wijzigen" className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
              <Pencil size={13} />
            </button>
            {c.status !== 'Cancelled' && (
              <button onClick={onCancel} disabled={busy} title="Opzeggen" className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-40">
                <XCircle size={13} />
              </button>
            )}
            <button onClick={onDelete} disabled={busy} title="Verwijderen" className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40">
              <Trash2 size={13} />
            </button>
            <button onClick={onExpand} title="Volledig openen" className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              <Maximize2 size={13} />
            </button>
          </div>
        </div>
        <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${INTERNET_CONNECTION_STATUS_TONE[c.status] ?? 'bg-slate-100 text-slate-600'}`}>
          {INTERNET_CONNECTION_STATUS_LABEL[c.status] ?? c.status}
        </span>
      </div>

      <div className="p-5 grid grid-cols-2 gap-x-6 gap-y-3">
        {c.supplier && <DetailField label="Leverancier" value={c.supplier} />}
        {(c.postalCode || c.houseNumber || c.city) && (
          <DetailField label="Adres" value={[c.postalCode, c.houseNumber, c.city].filter(Boolean).join(' ')} />
        )}
        {c.monthlyCost != null && <DetailField label="Kosten/mnd" value={fmtCurrency(c.monthlyCost)} />}
        <DetailField label="Aanvraagdatum" value={fmtDate(c.requestedAt)} />
        {c.activatedAt && <DetailField label="Activatiedatum" value={fmtDate(c.activatedAt)} />}
        {c.termMonths != null && <DetailField label="Looptijd" value={`${c.termMonths} maanden`} />}
        {c.ipAddress && <DetailField label="IP-adres" value={c.ipAddress} />}
        {c.hostCount != null && <DetailField label="Aantal hosts" value={String(c.hostCount)} />}
      </div>

      <div className="px-5 pb-5">
        <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
          <div className="flex items-center gap-1 mb-4">
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notes' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <StickyNote size={13} /> Notities
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <History size={13} /> Historie
            </button>
          </div>
          {activeTab === 'notes' && (
            <NotesPanel entityType="InternetConnection" entityId={c.id} />
          )}
          {activeTab === 'history' && (
            <ItemHistoryBlock
              key={`${c.id}-${historyKey}`}
              url={`/portal/internet-connections/${c.id}/history`}
              subtitle={c.product}
            />
          )}
        </div>

        <p className="text-[11px] text-slate-400 mt-3">Aangemaakt op {fmtDate(c.createdAt)}</p>
      </div>
    </Card>
  )
}

// ── Main view ────────────────────────────────────────────────────────────────

export function InternetConnectionsView() {
  const [connections, setConnections] = useState<InternetConnectionListItem[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [typeFilter, setTypeFilter]     = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected]       = useState<InternetConnectionListItem | null>(null)
  const [showModal, setShowModal]     = useState(false)
  const [editTarget, setEditTarget]   = useState<InternetConnectionListItem | null>(null)
  const [busyId, setBusyId]           = useState<string | null>(null)
  const [detailTarget, setDetailTarget] = useState<InternetConnectionListItem | null>(null)
  const [historyKey, setHistoryKey]   = useState(0)
  const [detailTab, setDetailTab]     = useState<'notes' | 'history'>('notes')
  const [cancelTarget, setCancelTarget] = useState<InternetConnectionListItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<InternetConnectionListItem | null>(null)

  const fetchConnections = async () => {
    setLoading(true)
    try {
      const { data } = await api.get<InternetConnectionListItem[]>('/portal/internet-connections')
      setConnections(data)
      setDetailTarget(prev => prev ? data.find(c => c.id === prev.id) ?? null : null)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchConnections() }, [])

  useEffect(() => {
    if (selected) {
      const updated = connections.find(c => c.id === selected.id)
      setSelected(updated ?? null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connections])

  const handleCancel = async (id: string) => {
    setBusyId(id)
    try {
      await api.post(`/portal/internet-connections/${id}/cancel`)
      await fetchConnections()
      setHistoryKey(k => k + 1)
    } catch { /* silent */ }
    finally { setBusyId(null) }
  }

  const handleDelete = async (id: string) => {
    setBusyId(id)
    try {
      await api.delete(`/portal/internet-connections/${id}`)
      setConnections(prev => prev.filter(c => c.id !== id))
      if (selected?.id === id) setSelected(null)
      if (detailTarget?.id === id) setDetailTarget(null)
    } catch { /* silent */ }
    finally { setBusyId(null) }
  }

  const filtered = connections.filter(c => {
    if (typeFilter && c.type !== typeFilter) return false
    if (statusFilter && c.status !== statusFilter) return false
    return `${c.product} ${c.provider ?? ''} ${c.supplier ?? ''} ${c.city} ${c.postalCode}`
      .toLowerCase().includes(search.toLowerCase())
  })

  const { sorted, sortKey, sortDir, toggleSort } = useSort(filtered, {
    type:    c => CONNECTION_TYPE_LABEL[c.type] ?? c.type,
    product: c => c.product,
    provider: c => c.provider || null,
    plaats:  c => c.city || null,
    kosten:  c => c.monthlyCost ?? null,
    status:  c => INTERNET_CONNECTION_STATUS_LABEL[c.status] ?? c.status,
  })

  const totaal      = connections.length
  const actief      = connections.filter(c => c.status === 'Active').length
  const aangevraagd = connections.filter(c => c.status === 'Requested').length
  const opgezegd    = connections.filter(c => c.status === 'Cancelled').length

  // ── Volledige detailweergave ─────────────────────────────────────────────────
  if (detailTarget) {
    const c = detailTarget
    const endDate = c.activatedAt && c.termMonths
      ? fmtDate(new Date(new Date(c.activatedAt).setMonth(new Date(c.activatedAt).getMonth() + c.termMonths)).toISOString())
      : null

    return (
      <div className="h-full flex flex-col gap-4 overflow-y-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDetailTarget(null)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft size={14} /> Terug naar overzicht
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-start justify-between gap-3 mb-6">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">{c.product}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {[CONNECTION_TYPE_LABEL[c.type] ?? c.type, c.provider].filter(Boolean).join(' · ')}
              </p>
            </div>
            <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${INTERNET_CONNECTION_STATUS_TONE[c.status] ?? 'bg-slate-100 text-slate-600'}`}>
              {INTERNET_CONNECTION_STATUS_LABEL[c.status] ?? c.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
            <DetailField label="Leverancier" value={c.supplier || '—'} />
            <DetailField label="Adres" value={[c.postalCode, c.houseNumber, c.city].filter(Boolean).join(' ') || '—'} />
            <DetailField label="Maandelijkse kosten" value={fmtCurrency(c.monthlyCost)} />
            <DetailField label="Aanvraagdatum" value={fmtDate(c.requestedAt)} />
            <DetailField label="Activatiedatum" value={fmtDate(c.activatedAt)} />
            <DetailField label="Looptijd" value={c.termMonths ? `${c.termMonths} maanden` : '—'} />
            <DetailField label="Einddatum" value={endDate ?? '—'} />
            <DetailField label="IP-adres" value={c.ipAddress || '—'} />
            <DetailField label="Aantal hosts" value={c.hostCount != null ? String(c.hostCount) : '—'} />
          </div>

          {c.notes && (
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700">
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Opmerkingen</p>
              <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{c.notes}</p>
            </div>
          )}

          <div className="flex gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={() => { setEditTarget(c); setShowModal(true) }}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Pencil size={12} /> Bewerken
            </button>
            {c.status !== 'Cancelled' && (
              <button
                onClick={() => setCancelTarget(c)}
                disabled={busyId === c.id}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-900/40 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-40"
              >
                <XCircle size={12} /> Opzeggen
              </button>
            )}
            <button
              onClick={() => setDeleteTarget(c)}
              disabled={busyId === c.id}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-red-200 dark:border-red-900/40 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
            >
              <Trash2 size={12} /> Verwijderen
            </button>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-700 pt-4 mt-6">
            <div className="flex items-center gap-1 mb-4">
              <button
                onClick={() => setDetailTab('notes')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${detailTab === 'notes' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <StickyNote size={13} /> Notities
              </button>
              <button
                onClick={() => setDetailTab('history')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${detailTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <History size={13} /> Historie
              </button>
            </div>
            {detailTab === 'notes' && (
              <NotesPanel entityType="InternetConnection" entityId={c.id} />
            )}
            {detailTab === 'history' && (
              <ItemHistoryBlock
                key={`${c.id}-${historyKey}`}
                url={`/portal/internet-connections/${c.id}/history`}
                subtitle={c.product}
              />
            )}
          </div>

          <p className="text-[11px] text-slate-400 mt-3">Aangemaakt op {fmtDate(c.createdAt)}</p>
        </div>

        <InternetConnectionModal
          open={showModal}
          onClose={() => { setShowModal(false); setEditTarget(null) }}
          onSuccess={() => { setShowModal(false); fetchConnections(); setHistoryKey(k => k + 1) }}
          connection={editTarget}
        />

        <ConfirmCancelModal
          open={!!cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirm={() => { if (cancelTarget) handleCancel(cancelTarget.id); setCancelTarget(null) }}
          itemName={cancelTarget?.product}
        />
        <ConfirmDeleteModal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget.id); setDeleteTarget(null) }}
          itemName={deleteTarget?.product}
        />
      </div>
    )
  }

  // ── Tabelweergave ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="grid grid-cols-4 gap-3 flex-shrink-0">
        <StatCard label="Totaal"      value={totaal}      icon={<Package size={18} />} />
        <StatCard label="Actief"      value={actief}      icon={<CheckCircle2 size={18} />} tone="emerald" />
        <StatCard label="Aangevraagd" value={aangevraagd} icon={<Clock size={18} />} tone="blue" />
        <StatCard label="Opgezegd"    value={opgezegd}    icon={<XCircle size={18} />} tone="slate" />
      </div>

      <div className="grid grid-cols-[1fr_20%] grid-rows-[auto_1fr] gap-x-4 gap-y-3 flex-1 min-h-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Zoek internetverbinding…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-400 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25"
            />
          </div>
          <FilterSelect label="Type" value={typeFilter} onChange={setTypeFilter}
            options={Object.entries(CONNECTION_TYPE_LABEL).map(([value, label]) => ({ value, label }))} />
          <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter}
            options={Object.entries(INTERNET_CONNECTION_STATUS_LABEL).map(([value, label]) => ({ value, label }))} />
          <Button size="sm" className="py-2" onClick={() => { setEditTarget(null); setShowModal(true) }}>
            <Plus size={13} /> Toevoegen
          </Button>
        </div>
        <div />

        <Card className="overflow-hidden flex flex-col min-h-0">
          <div className="grid grid-cols-[1fr_1.6fr_1.2fr_1.2fr_1fr_1fr] gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
            {([
              { label: 'Type', key: 'type' },
              { label: 'Product', key: 'product' },
              { label: 'Provider', key: 'provider' },
              { label: 'Plaats', key: 'plaats' },
              { label: 'Kosten/mnd', key: 'kosten' },
              { label: 'Status', key: 'status' },
            ] as { label: string; key?: string }[]).map((h, i) => (
              <SortHeader key={i} label={h.label} sortKey={h.key} activeKey={sortKey} dir={sortDir} onToggle={toggleSort} />
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <LoadingState />
            ) : sorted.length === 0 ? (
              <div className="p-10 text-center">
                <EthernetPort size={36} className="mx-auto mb-3 text-slate-200" />
                <p className="text-sm text-slate-400">
                  {search ? 'Geen resultaten gevonden.' : 'Nog geen vaste-internetverbindingen toegevoegd.'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                {sorted.map(c => (
                  <li
                    key={c.id}
                    onClick={() => setSelected(c)}
                    onDoubleClick={() => setDetailTarget(c)}
                    className={`grid grid-cols-[1fr_1.6fr_1.2fr_1.2fr_1fr_1fr] gap-3 px-4 py-3 items-center cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/40 ${
                      selected?.id === c.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500' : ''
                    }`}
                  >
                    <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{CONNECTION_TYPE_LABEL[c.type] ?? c.type}</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{c.product}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{c.provider || '—'}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{c.city || '—'}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 truncate tabular-nums">{fmtCurrency(c.monthlyCost)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium truncate ${INTERNET_CONNECTION_STATUS_TONE[c.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {INTERNET_CONNECTION_STATUS_LABEL[c.status] ?? c.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <div className="min-h-0 overflow-y-auto">
          {selected ? (
            <InternetConnectionCompactPanel
              c={selected}
              onEdit={() => { setEditTarget(selected); setShowModal(true) }}
              onCancel={() => setCancelTarget(selected)}
              onDelete={() => setDeleteTarget(selected)}
              onExpand={() => setDetailTarget(selected)}
              busy={busyId === selected.id}
              historyKey={historyKey}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <EthernetPort size={28} className="text-slate-300" />
                </div>
                <p className="text-sm text-slate-400">Selecteer een item om de details te zien</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <InternetConnectionModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditTarget(null) }}
        onSuccess={() => { setShowModal(false); fetchConnections(); setHistoryKey(k => k + 1) }}
        connection={editTarget}
      />

      <ConfirmCancelModal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => { if (cancelTarget) handleCancel(cancelTarget.id); setCancelTarget(null) }}
        itemName={cancelTarget?.product}
      />
      <ConfirmDeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget.id); setDeleteTarget(null) }}
        itemName={deleteTarget?.product}
      />
    </div>
  )
}
