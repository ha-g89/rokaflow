import { useState, useEffect } from 'react'
import {
  ArrowLeft, Hash, Search, Plus, Package, Phone as PhoneIcon, Layers,
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
import { FilterSelect } from '@/components/ui/FilterSelect'
import { useSort, SortHeader } from '@/components/ui/SortHeader'
import { PhoneNumberModal } from '@/components/PhoneNumberModal'
import type { PhoneNumberListItem } from '@/types/phoneNumber'
import { PHONE_NUMBER_TYPE_LABEL, PHONE_NUMBER_TYPE_TONE } from '@/types/phoneNumber'

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function numberRangeLabel(n: PhoneNumberListItem) {
  return n.endNumber ? `${n.startNumber} t/m ${n.endNumber}` : n.startNumber
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

function PhoneNumberCompactPanel({ n, onEdit, onDelete, onExpand, busy, historyKey }: {
  n: PhoneNumberListItem
  onEdit: () => void
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
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate mb-0.5">{n.startNumber}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
              {PHONE_NUMBER_TYPE_LABEL[n.type] ?? n.type}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={onEdit} title="Wijzigen" className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
              <Pencil size={13} />
            </button>
            <button onClick={onDelete} disabled={busy} title="Verwijderen" className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40">
              <Trash2 size={13} />
            </button>
            <button onClick={onExpand} title="Volledig openen" className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              <Maximize2 size={13} />
            </button>
          </div>
        </div>
        <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${PHONE_NUMBER_TYPE_TONE[n.type] ?? 'bg-slate-100 text-slate-600'}`}>
          {PHONE_NUMBER_TYPE_LABEL[n.type] ?? n.type}
        </span>
      </div>

      <div className="p-5 grid grid-cols-2 gap-x-6 gap-y-3">
        <DetailField label="Beginnummer" value={n.startNumber} />
        {n.endNumber && <DetailField label="Eindnummer" value={n.endNumber} />}
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
            <NotesPanel entityType="PhoneNumber" entityId={n.id} />
          )}
          {activeTab === 'history' && (
            <ItemHistoryBlock
              key={`${n.id}-${historyKey}`}
              url={`/portal/phone-numbers/${n.id}/history`}
              subtitle={numberRangeLabel(n)}
            />
          )}
        </div>

        <p className="text-[11px] text-slate-400 mt-3">Aangemaakt op {fmtDate(n.createdAt)}</p>
      </div>
    </Card>
  )
}

// ── Tab-inhoud ────────────────────────────────────────────────────────────────

export function PhoneNumbersTab({ tabs }: { tabs?: React.ReactNode }) {
  const [numbers, setNumbers]         = useState<PhoneNumberListItem[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [typeFilter, setTypeFilter]   = useState('')
  const [selected, setSelected]       = useState<PhoneNumberListItem | null>(null)
  const [showModal, setShowModal]     = useState(false)
  const [editTarget, setEditTarget]   = useState<PhoneNumberListItem | null>(null)
  const [busyId, setBusyId]           = useState<string | null>(null)
  const [detailTarget, setDetailTarget] = useState<PhoneNumberListItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PhoneNumberListItem | null>(null)
  const [historyKey, setHistoryKey]   = useState(0)
  const [detailTab, setDetailTab]     = useState<'notes' | 'history'>('notes')

  const fetchNumbers = async () => {
    setLoading(true)
    try {
      const { data } = await api.get<PhoneNumberListItem[]>('/portal/phone-numbers')
      setNumbers(data)
      setDetailTarget(prev => prev ? data.find(n => n.id === prev.id) ?? null : null)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchNumbers() }, [])

  useEffect(() => {
    if (selected) {
      const updated = numbers.find(n => n.id === selected.id)
      setSelected(updated ?? null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numbers])

  const handleDelete = async (id: string) => {
    setBusyId(id)
    try {
      await api.delete(`/portal/phone-numbers/${id}`)
      setNumbers(prev => prev.filter(n => n.id !== id))
      if (selected?.id === id) setSelected(null)
      if (detailTarget?.id === id) setDetailTarget(null)
    } catch { /* silent */ }
    finally { setBusyId(null) }
  }

  const filtered = numbers.filter(n => {
    if (typeFilter && n.type !== typeFilter) return false
    return `${n.startNumber} ${n.endNumber ?? ''} ${n.notes ?? ''}`
      .toLowerCase().includes(search.toLowerCase())
  })

  const { sorted, sortKey, sortDir, toggleSort } = useSort(filtered, {
    soort: n => PHONE_NUMBER_TYPE_LABEL[n.type] ?? n.type,
    begin: n => n.startNumber,
    eind:  n => n.endNumber || null,
  })

  const totaal  = numbers.length
  const enkel   = numbers.filter(n => n.type === 'Single').length
  const blokken = numbers.filter(n => n.type === 'Block10' || n.type === 'Block100' || n.type === 'Block1000').length

  // ── Volledige detailweergave ─────────────────────────────────────────────────
  if (detailTarget) {
    const n = detailTarget

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
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">{numberRangeLabel(n)}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {PHONE_NUMBER_TYPE_LABEL[n.type] ?? n.type}
              </p>
            </div>
            <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${PHONE_NUMBER_TYPE_TONE[n.type] ?? 'bg-slate-100 text-slate-600'}`}>
              {PHONE_NUMBER_TYPE_LABEL[n.type] ?? n.type}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
            <DetailField label="Soort" value={PHONE_NUMBER_TYPE_LABEL[n.type] ?? n.type} />
            <DetailField label="Beginnummer" value={n.startNumber} />
            <DetailField label="Eindnummer" value={n.endNumber || '—'} />
          </div>

          {n.notes && (
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700">
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Opmerkingen</p>
              <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{n.notes}</p>
            </div>
          )}

          <div className="flex gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={() => { setEditTarget(n); setShowModal(true) }}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Pencil size={12} /> Bewerken
            </button>
            <button
              onClick={() => setDeleteTarget(n)}
              disabled={busyId === n.id}
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
              <NotesPanel entityType="PhoneNumber" entityId={n.id} />
            )}
            {detailTab === 'history' && (
              <ItemHistoryBlock
                key={`${n.id}-${historyKey}`}
                url={`/portal/phone-numbers/${n.id}/history`}
                subtitle={numberRangeLabel(n)}
              />
            )}
          </div>

          <p className="text-[11px] text-slate-400 mt-3">Aangemaakt op {fmtDate(n.createdAt)}</p>
        </div>

        <PhoneNumberModal
          open={showModal}
          onClose={() => { setShowModal(false); setEditTarget(null) }}
          onSuccess={() => { setShowModal(false); fetchNumbers(); setHistoryKey(k => k + 1) }}
          number={editTarget}
        />

        <ConfirmDeleteModal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget.id); setDeleteTarget(null) }}
          itemName={deleteTarget ? numberRangeLabel(deleteTarget) : undefined}
        />
      </div>
    )
  }

  // ── Tabelweergave ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <div className="grid grid-cols-3 gap-3 flex-shrink-0">
        <StatCard label="Totaal"         value={totaal}  icon={<Package size={18} />} />
        <StatCard label="Enkele nummers" value={enkel}   icon={<PhoneIcon size={18} />} tone="blue" />
        <StatCard label="Nummerblokken"  value={blokken} icon={<Layers size={18} />} tone="blue" />
      </div>

      {tabs}

      <div className="grid grid-cols-[1fr_20%] grid-rows-[auto_1fr] gap-x-4 gap-y-3 flex-1 min-h-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Zoek telefoonnummer…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-400 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25"
            />
          </div>
          <FilterSelect label="Soort" value={typeFilter} onChange={setTypeFilter}
            options={Object.entries(PHONE_NUMBER_TYPE_LABEL).map(([value, label]) => ({ value, label }))} />
          <Button size="sm" className="py-2" onClick={() => { setEditTarget(null); setShowModal(true) }}>
            <Plus size={13} /> Toevoegen
          </Button>
        </div>
        <div />

        <Card className="overflow-hidden flex flex-col min-h-0">
          <div className="grid grid-cols-[1fr_1.4fr_1.4fr] gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
            {([
              { label: 'Soort', key: 'soort' },
              { label: 'Beginnummer', key: 'begin' },
              { label: 'Eindnummer', key: 'eind' },
            ] as { label: string; key?: string }[]).map((h, i) => (
              <SortHeader key={i} label={h.label} sortKey={h.key} activeKey={sortKey} dir={sortDir} onToggle={toggleSort} />
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <LoadingState />
            ) : sorted.length === 0 ? (
              <div className="p-10 text-center">
                <Hash size={36} className="mx-auto mb-3 text-slate-200" />
                <p className="text-sm text-slate-400">
                  {search ? 'Geen resultaten gevonden.' : 'Nog geen telefoonnummers toegevoegd.'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                {sorted.map(n => (
                  <li
                    key={n.id}
                    onClick={() => setSelected(n)}
                    onDoubleClick={() => setDetailTarget(n)}
                    className={`grid grid-cols-[1fr_1.4fr_1.4fr] gap-3 px-4 py-3 items-center cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/40 ${
                      selected?.id === n.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500' : ''
                    }`}
                  >
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium truncate w-fit ${PHONE_NUMBER_TYPE_TONE[n.type] ?? 'bg-slate-100 text-slate-600'}`}>
                      {PHONE_NUMBER_TYPE_LABEL[n.type] ?? n.type}
                    </span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate tabular-nums">{n.startNumber}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 truncate tabular-nums">{n.endNumber || '—'}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <div className="min-h-0 overflow-y-auto">
          {selected ? (
            <PhoneNumberCompactPanel
              n={selected}
              onEdit={() => { setEditTarget(selected); setShowModal(true) }}
              onDelete={() => setDeleteTarget(selected)}
              onExpand={() => setDetailTarget(selected)}
              busy={busyId === selected.id}
              historyKey={historyKey}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Hash size={28} className="text-slate-300" />
                </div>
                <p className="text-sm text-slate-400">Selecteer een item om de details te zien</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <PhoneNumberModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditTarget(null) }}
        onSuccess={() => { setShowModal(false); fetchNumbers(); setHistoryKey(k => k + 1) }}
        number={editTarget}
      />

      <ConfirmDeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget.id); setDeleteTarget(null) }}
        itemName={deleteTarget ? numberRangeLabel(deleteTarget) : undefined}
      />
    </div>
  )
}
