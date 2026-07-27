import { FilterSelect } from '@/components/ui/FilterSelect'
import { useSort, SortHeader } from '@/components/ui/SortHeader'
import { useState, useEffect, useCallback } from 'react'
import {
  Laptop, Search, Plus, Package, Activity, Archive, XCircle,
  Pencil, Trash2, StickyNote, History, Link2Off, User, Maximize2, ArrowLeft, PackageCheck, Upload,
} from 'lucide-react'
import { ImportWizardModal } from '@/components/import/ImportWizardModal'
import type { ImportHardwareRow, HardwareImportPreview } from '@/types/import'
import api from '@/lib/axios'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { StatCard } from '@/components/portal/PortalUI'
import { ItemHistoryBlock } from '@/components/portal/AuditHistory'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { HardwareModal } from '@/components/HardwareModal'
import { ReceiveHardwareModal } from '@/components/ReceiveHardwareModal'
import { EntityChecklistCard } from '@/components/EntityChecklistCard'
import { NotesPanel } from '@/components/NotesPanel'
import type { HardwareAssetListItem } from '@/types/hardware'
import { HARDWARE_STATUS_LABEL, HARDWARE_STATUS_TONE, HARDWARE_TYPE_LABEL, HARDWARE_SPEC_FIELDS } from '@/types/hardware'
import type { ClientUserListItem } from '@/types/clientUser'
import type { LocationListItem } from '@/types/location'

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function typeNameToValue(typeName: string): number {
  const map: Record<string, number> = {
    Laptop: 0, Desktop: 1, Phone: 2, Tablet: 3, Monitor: 4, Other: 5,
  }
  return map[typeName] ?? 0
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function HardwareDetailPanel({ asset, teammates, onEdit, onDelete, onUnlink, onLink, onExpand, onReceived, historyKey }: {
  asset: HardwareAssetListItem
  teammates: ClientUserListItem[]
  onEdit: () => void
  onDelete: () => void
  onUnlink: () => Promise<void>
  onLink: (userId: string) => Promise<void>
  onExpand: () => void
  onReceived: () => void
  historyKey: number
}) {
  const [confirmDelete, setConfirmDelete]   = useState(false)
  const [confirmUnlink, setConfirmUnlink]   = useState(false)
  const [unlinking, setUnlinking]           = useState(false)
  const [showLinking, setShowLinking]       = useState(false)
  const [linkUserId, setLinkUserId]         = useState('')
  const [linking, setLinking]               = useState(false)
  const [showReceive, setShowReceive]       = useState(false)
  const [activeTab, setActiveTab]           = useState<'notes' | 'history'>('notes')

  const handleUnlinkConfirm = async () => {
    setUnlinking(true)
    try { await onUnlink() }
    finally { setUnlinking(false); setConfirmUnlink(false) }
  }

  const handleLinkConfirm = async () => {
    if (!linkUserId) return
    setLinking(true)
    try { await onLink(linkUserId) }
    finally { setLinking(false); setShowLinking(false); setLinkUserId('') }
  }

  // Reset states when a different asset is shown
  useEffect(() => {
    setConfirmDelete(false)
    setConfirmUnlink(false)
    setShowLinking(false)
    setLinkUserId('')
    setShowReceive(false)
  }, [asset.id])

  return (
    <Card className="overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-4 pb-4 border-b border-slate-100">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 truncate mb-0.5">{asset.name}</h2>
            <p className="text-sm text-slate-500 truncate">
              {[asset.brand, HARDWARE_TYPE_LABEL[asset.type] ?? asset.type].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {asset.status === 'OnOrder' && (
              <button onClick={() => setShowReceive(true)} title="Ontvangen" className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                <PackageCheck size={13} />
              </button>
            )}
            <button onClick={onEdit} title="Wijzigen" className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
              <Pencil size={13} />
            </button>
            <button onClick={() => setConfirmDelete(true)} title="Verwijderen" className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <Trash2 size={13} />
            </button>
            <button onClick={onExpand} title="Volledig openen" className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <Maximize2 size={13} />
            </button>
          </div>
        </div>
      </div>

      <CardContent className="p-5 space-y-4">

        {/* ── Info grid ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {asset.assetNumber && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Assetnummer</p>
              <p className="text-sm font-medium text-slate-800 tabular-nums">{asset.assetNumber}</p>
            </div>
          )}
          {asset.serialNumber && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Serienummer</p>
              <p className="text-sm font-medium text-slate-800 tabular-nums">{asset.serialNumber}</p>
            </div>
          )}
          {asset.location && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Locatie</p>
              <p className="text-sm font-medium text-slate-800">{asset.location}</p>
            </div>
          )}
          {asset.purchaseValue != null && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Aanschafwaarde</p>
              <p className="text-sm font-medium text-slate-800">€ {asset.purchaseValue.toFixed(2)}</p>
            </div>
          )}
          {asset.supplier && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Leverancier</p>
              <p className="text-sm font-medium text-slate-800">{asset.supplier}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Status</p>
            <span className={`text-xs font-semibold ${
              asset.status === 'InUse'          ? 'text-emerald-600' :
              asset.status === 'InStock'        ? 'text-blue-600' :
              asset.status === 'UnderRepair'    ? 'text-orange-500' :
              asset.status === 'OnOrder'        ? 'text-amber-600' :
              asset.status === 'Decommissioned' ? 'text-red-500' : 'text-slate-500'
            }`}>
              {HARDWARE_STATUS_LABEL[asset.status] ?? asset.status}
            </span>
          </div>
          {asset.issuedAt && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Uitgiftedatum</p>
              <p className="text-sm font-medium text-slate-800">{fmtDate(asset.issuedAt)}</p>
            </div>
          )}
          {asset.returnedAt && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Inleverdatum</p>
              <p className="text-sm font-medium text-slate-800">{fmtDate(asset.returnedAt)}</p>
            </div>
          )}
          {asset.orderedAt && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Besteldatum</p>
              <p className="text-sm font-medium text-slate-800">{fmtDate(asset.orderedAt)}</p>
            </div>
          )}
        </div>

        {/* ── Toegewezen aan / Koppelen ────────────────────────────────────── */}
        {asset.assignedToName ? (
          /* Gekoppeld */
          <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-blue-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-blue-500 font-medium">Toegewezen aan</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">{asset.assignedToName}</p>
                  {asset.issuedAt && (
                    <p className="text-xs text-slate-400 mt-0.5">Uitgegeven {fmtDate(asset.issuedAt)}</p>
                  )}
                </div>
              </div>
              {confirmUnlink ? (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-slate-600 font-medium">Ontkoppelen?</span>
                  <button onClick={handleUnlinkConfirm} disabled={unlinking} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors">
                    {unlinking ? 'Bezig…' : 'Ja'}
                  </button>
                  <button onClick={() => setConfirmUnlink(false)} className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:bg-white transition-colors">
                    Nee
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmUnlink(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-orange-600 bg-white ring-1 ring-orange-200 hover:bg-orange-50 transition-colors flex-shrink-0">
                  <Link2Off size={12} /> Ontkoppelen
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Niet gekoppeld */
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
            {showLinking ? (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Koppelen aan medewerker</p>
                <select
                  value={linkUserId}
                  onChange={e => setLinkUserId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25 transition-colors"
                >
                  <option value="">— Kies medewerker —</option>
                  {teammates.map(u => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button onClick={() => { setShowLinking(false); setLinkUserId('') }} className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 bg-white ring-1 ring-slate-200 hover:bg-slate-50 transition-colors">
                    Annuleren
                  </button>
                  <button onClick={handleLinkConfirm} disabled={!linkUserId || linking} className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-colors">
                    {linking ? 'Koppelen…' : 'Koppelen'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-400 font-medium">Niet gekoppeld aan medewerker</p>
                </div>
                <button onClick={() => setShowLinking(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-white ring-1 ring-blue-200 hover:bg-blue-50 transition-colors flex-shrink-0">
                  <User size={12} /> Koppelen
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Notes / History tabs ─────────────────────────────────────────── */}
        <div className="border-t border-slate-100 pt-4">
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
            <NotesPanel entityType="Hardware" entityId={asset.id} />
          )}
          {activeTab === 'history' && (
            <ItemHistoryBlock
              key={`${asset.id}-${historyKey}`}
              url={`/portal/hardware/${asset.id}/history`}
              subtitle={`${asset.brand} ${asset.name}`}
            />
          )}
        </div>

        <p className="text-[11px] text-slate-400 mt-3">Aangemaakt op {fmtDate(asset.createdAt)}</p>
      </CardContent>

      <ConfirmDeleteModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => { setConfirmDelete(false); onDelete() }}
        itemName={`${asset.brand} ${asset.name}`}
      />

      <ReceiveHardwareModal
        open={showReceive}
        onClose={() => setShowReceive(false)}
        onSuccess={() => { setShowReceive(false); onReceived() }}
        asset={asset}
      />
    </Card>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function HardwareView({ teammates, onExpand }: { teammates: ClientUserListItem[]; onExpand?: (asset: HardwareAssetListItem) => void }) {
  const [assets, setAssets]         = useState<HardwareAssetListItem[]>([])
  const [locations, setLocations]   = useState<LocationListItem[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [selected, setSelected]     = useState<HardwareAssetListItem | null>(null)
  const [showModal, setShowModal]   = useState(false)
  const [editTarget, setEditTarget] = useState<HardwareAssetListItem | null>(null)
  const [historyKey, setHistoryKey] = useState(0)
  const [showImport, setShowImport] = useState(false)

  const fetchAssets = useCallback(async () => {
    try {
      const [assetsRes, locationsRes] = await Promise.all([
        api.get<HardwareAssetListItem[]>('/portal/hardware'),
        api.get<LocationListItem[]>('/portal/locations'),
      ])
      setAssets(assetsRes.data)
      setLocations(locationsRes.data)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAssets() }, [fetchAssets])

  useEffect(() => {
    if (selected) {
      const updated = assets.find(a => a.id === selected.id)
      if (updated) setSelected(updated)
    }
  }, [assets]) // eslint-disable-line react-hooks/exhaustive-deps

  const [typeFilter, setTypeFilter]     = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = assets.filter(a => {
    if (typeFilter && a.type !== typeFilter) return false
    if (statusFilter && a.status !== statusFilter) return false
    const spec = a.specifications
    const specText = spec
      ? `${spec.operatingSystem ?? ''} ${spec.processor ?? ''} ${spec.buildYear ?? ''}`
      : ''
    return `${a.name} ${a.brand} ${a.assetNumber} ${a.serialNumber} ${a.assignedToName ?? ''} ${a.location} ${specText}`
      .toLowerCase().includes(search.toLowerCase())
  })

  const { sorted, sortKey, sortDir, toggleSort } = useSort(filtered, {
    type:       a => HARDWARE_TYPE_LABEL[a.type] ?? a.type,
    merk:       a => a.brand || null,
    naam:       a => a.name,
    serie:      a => a.serialNumber || null,
    leverancier: a => a.supplier || null,
    toegewezen: a => a.assignedToName || null,
    status:     a => HARDWARE_STATUS_LABEL[a.status] ?? a.status,
  })

  const totaal       = assets.length
  const inGebruik    = assets.filter(a => a.status === 'InUse').length
  const opVoorraad   = assets.filter(a => a.status === 'InStock').length
  const afgeschreven = assets.filter(a => a.status === 'Decommissioned').length

  const handleDelete = async (id: string) => {
    await api.delete(`/portal/hardware/${id}`)
    setAssets(prev => prev.filter(a => a.id !== id))
    if (selected?.id === id) setSelected(null)
    setHistoryKey(k => k + 1)
  }

  const handleUnlink = async (asset: HardwareAssetListItem) => {
    await api.put(`/portal/hardware/${asset.id}`, {
      name:             asset.name,
      brand:            asset.brand || '',
      type:             typeNameToValue(asset.type),
      assetNumber:      asset.assetNumber || '',
      serialNumber:     asset.serialNumber || '',
      status:           0, // InStock
      location:         asset.location || '',
      locationId:       asset.locationId || null,
      purchaseValue:    asset.purchaseValue ?? null,
      supplier:         asset.supplier ?? null,
      assignedToUserId: null,
      issuedAt:         asset.issuedAt ?? null,
      returnedAt:       new Date().toISOString(),
    })
    await fetchAssets()
    setHistoryKey(k => k + 1)
  }

  const handleLink = async (asset: HardwareAssetListItem, userId: string) => {
    await api.put(`/portal/hardware/${asset.id}`, {
      name:             asset.name,
      brand:            asset.brand || '',
      type:             typeNameToValue(asset.type),
      assetNumber:      asset.assetNumber || '',
      serialNumber:     asset.serialNumber || '',
      status:           1, // InUse
      location:         asset.location || '',
      locationId:       asset.locationId || null,
      purchaseValue:    asset.purchaseValue ?? null,
      supplier:         asset.supplier ?? null,
      assignedToUserId: userId,
      issuedAt:         new Date().toISOString(),
      returnedAt:       null,
    })
    await fetchAssets()
    setHistoryKey(k => k + 1)
  }

  const handleOpenAdd  = () => { setEditTarget(null); setShowModal(true) }
  const handleOpenEdit = (asset: HardwareAssetListItem) => { setEditTarget(asset); setShowModal(true) }
  const handleSaved    = async () => { await fetchAssets(); setShowModal(false); setHistoryKey(k => k + 1) }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="grid grid-cols-4 gap-3 flex-shrink-0">
        <StatCard label="Totaal"       value={totaal}       icon={<Package size={18} />} />
        <StatCard label="In gebruik"   value={inGebruik}    icon={<Activity size={18} />} tone="emerald" />
        <StatCard label="Op voorraad"  value={opVoorraad}   icon={<Archive size={18} />}  tone="blue" />
        <StatCard label="Afgeschreven" value={afgeschreven} icon={<XCircle size={18} />}  tone="slate" />
      </div>

      <div className="grid grid-cols-[1fr_20%] grid-rows-[auto_1fr] gap-x-4 gap-y-3 flex-1 min-h-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Zoek hardware…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-400 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25"
            />
          </div>
          <FilterSelect label="Type" value={typeFilter} onChange={setTypeFilter}
            options={Object.entries(HARDWARE_TYPE_LABEL).map(([value, label]) => ({ value, label }))} />
          <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter}
            options={Object.entries(HARDWARE_STATUS_LABEL).map(([value, label]) => ({ value, label }))} />
          <Button size="sm" variant="secondary" className="py-2" onClick={() => setShowImport(true)}>
            <Upload size={13} /> Importeren
          </Button>
          <Button size="sm" className="py-2" onClick={handleOpenAdd}>
            <Plus size={13} /> Toevoegen
          </Button>
        </div>
        <div />

        <Card className="overflow-hidden flex flex-col min-h-0">
          <div className="grid grid-cols-[1fr_1.2fr_2fr_1.2fr_1fr_1.5fr_0.9fr] gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex-shrink-0">
            {([
              { label: 'Type', key: 'type' },
              { label: 'Merk', key: 'merk' },
              { label: 'Naam', key: 'naam' },
              { label: 'Serienummer', key: 'serie' },
              { label: 'Leverancier', key: 'leverancier' },
              { label: 'Toegewezen aan', key: 'toegewezen' },
              { label: 'Status', key: 'status' },
            ] as { label: string; key?: string }[]).map((h, i) => (
              <SortHeader key={i} label={h.label} sortKey={h.key} activeKey={sortKey} dir={sortDir} onToggle={toggleSort} />
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <LoadingState />
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center">
                <Laptop size={36} className="mx-auto mb-3 text-slate-200" />
                <p className="text-sm text-slate-400">
                  {search ? 'Geen resultaten gevonden.' : 'Nog geen hardware toegevoegd.'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {sorted.map(a => (
                  <li
                    key={a.id}
                    onClick={() => setSelected(a)}
                    onDoubleClick={() => onExpand?.(a)}
                    className={`grid grid-cols-[1fr_1.2fr_2fr_1.2fr_1fr_1.5fr_0.9fr] gap-3 px-4 py-3 items-center cursor-pointer transition-colors hover:bg-slate-100 ${
                      selected?.id === a.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                    }`}
                  >
                    <p className="text-xs text-slate-600 truncate">{HARDWARE_TYPE_LABEL[a.type] ?? a.type}</p>
                    <p className="text-xs text-slate-600 truncate">{a.brand || '—'}</p>
                    <p className="text-sm font-semibold text-slate-800 truncate">{a.name}</p>
                    <p className="text-xs text-slate-600 truncate tabular-nums">{a.serialNumber || '—'}</p>
                    <p className="text-xs text-slate-600 truncate">{a.supplier || '—'}</p>
                    <p className="text-xs text-slate-600 truncate">{a.assignedToName || '—'}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium truncate ${HARDWARE_STATUS_TONE[a.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {HARDWARE_STATUS_LABEL[a.status] ?? a.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <div className="min-h-0 overflow-y-auto">
          {selected ? (
            <HardwareDetailPanel
              asset={selected}
              teammates={teammates}
              onEdit={() => handleOpenEdit(selected)}
              onDelete={() => handleDelete(selected.id)}
              onUnlink={() => handleUnlink(selected)}
              onLink={(userId) => handleLink(selected, userId)}
              onExpand={() => onExpand?.(selected)}
              onReceived={fetchAssets}
              historyKey={historyKey}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <Laptop size={28} className="text-slate-300" />
                </div>
                <p className="text-sm text-slate-400">Selecteer een item om de details te zien</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <HardwareModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSaved}
        teammates={teammates}
        locations={locations}
        asset={editTarget}
      />

      <ImportWizardModal<ImportHardwareRow, HardwareImportPreview>
        open={showImport}
        title="Hardware importeren"
        templateUrl="/portal/hardware/import-template"
        templateFileName="hardware-import-template.xlsx"
        columnsUrl="/portal/hardware/import/columns"
        validateUrl="/portal/hardware/import/validate"
        confirmUrl="/portal/hardware/import/confirm"
        columns={[
          { key: 'name', label: 'Naam' },
          { key: 'brand', label: 'Merk' },
          { key: 'type', label: 'Type' },
          { key: 'serialNumber', label: 'Serienummer' },
          { key: 'locationName', label: 'Locatie' },
          { key: 'assignedToEmail', label: 'Toegewezen aan' },
        ]}
        onClose={() => setShowImport(false)}
        onDone={() => { setShowImport(false); fetchAssets() }}
      />
    </div>
  )
}

// ── Full-screen detail view ───────────────────────────────────────────────────

function HardwareSpecificationsCard({ asset, onSaved }: {
  asset: HardwareAssetListItem
  onSaved: () => void
}) {
  const fields = HARDWARE_SPEC_FIELDS[asset.type] ?? []
  const [editing, setEditing] = useState(false)
  const [values, setValues]   = useState<Record<string, string>>({})
  const [saving, setSaving]   = useState(false)

  if (fields.length === 0) return null

  const startEditing = () => {
    const initial: Record<string, string> = {}
    for (const f of fields) {
      const current = asset.specifications?.[f.key]
      initial[f.key] = current != null ? String(current) : ''
    }
    setValues(initial)
    setEditing(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const body: Record<string, string | number | null> = {}
      for (const f of fields) {
        const raw = (values[f.key] ?? '').trim()
        body[f.key] = raw === '' ? null : f.type === 'number' ? Number(raw) : raw
      }
      await api.put(`/portal/hardware/${asset.id}/specifications`, body)
      setEditing(false)
      onSaved()
    } finally { setSaving(false) }
  }

  const hasAnyValue = fields.some(f => asset.specifications?.[f.key] != null)

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Specificaties</h3>
          {!editing && (
            <button
              onClick={startEditing}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
            >
              <Pencil size={11} /> {hasAnyValue ? 'Bewerken' : 'Aanvullen'}
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {fields.map(f => (
                <div key={f.key}>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{f.label}</label>
                  <input
                    type={f.type === 'number' ? 'number' : 'text'}
                    value={values[f.key] ?? ''}
                    onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-400 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setEditing(false)} disabled={saving}>Annuleren</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Opslaan…' : 'Opslaan'}</Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {fields.map(f => {
              const value = asset.specifications?.[f.key]
              const Icon = f.icon
              return (
                <div key={f.key} className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/60 p-3">
                  <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-400">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{f.label}</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {value != null && value !== '' ? `${value}${f.unit ?? ''}` : '—'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function HardwareDetailFullView({ initialAsset, teammates, onBack, onDeleted, backLabel = 'Terug naar hardware' }: {
  initialAsset: HardwareAssetListItem
  teammates: ClientUserListItem[]
  onBack: () => void
  onDeleted: () => void
  backLabel?: string
}) {
  const [asset, setAsset]           = useState<HardwareAssetListItem>(initialAsset)
  const [locations, setLocations]   = useState<LocationListItem[]>([])
  const [showModal, setShowModal]   = useState(false)
  const [showReceive, setShowReceive] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmUnlink, setConfirmUnlink] = useState(false)
  const [unlinking, setUnlinking]   = useState(false)
  const [showLinking, setShowLinking] = useState(false)
  const [linkUserId, setLinkUserId] = useState('')
  const [linking, setLinking]       = useState(false)
  const [historyKey, setHistoryKey] = useState(0)
  const [activeTab, setActiveTab]   = useState<'notes' | 'history'>('notes')

  useEffect(() => {
    api.get<LocationListItem[]>('/portal/locations')
      .then(r => setLocations(r.data))
      .catch(() => {})
  }, [])

  const refresh = async () => {
    const { data } = await api.get<HardwareAssetListItem[]>('/portal/hardware')
    const updated = data.find(a => a.id === asset.id)
    if (updated) setAsset(updated)
    setHistoryKey(k => k + 1)
  }

  const handleUnlink = async () => {
    setUnlinking(true)
    try {
      await api.put(`/portal/hardware/${asset.id}`, {
        name: asset.name, brand: asset.brand || '', type: typeNameToValue(asset.type),
        assetNumber: asset.assetNumber || '', serialNumber: asset.serialNumber || '',
        status: 0, location: asset.location || '', locationId: asset.locationId || null,
        purchaseValue: asset.purchaseValue ?? null, supplier: asset.supplier ?? null,
        assignedToUserId: null, issuedAt: asset.issuedAt ?? null, returnedAt: new Date().toISOString(),
      })
      await refresh()
    } finally { setUnlinking(false); setConfirmUnlink(false) }
  }

  const handleLink = async () => {
    if (!linkUserId) return
    setLinking(true)
    try {
      await api.put(`/portal/hardware/${asset.id}`, {
        name: asset.name, brand: asset.brand || '', type: typeNameToValue(asset.type),
        assetNumber: asset.assetNumber || '', serialNumber: asset.serialNumber || '',
        status: 1, location: asset.location || '', locationId: asset.locationId || null,
        purchaseValue: asset.purchaseValue ?? null, supplier: asset.supplier ?? null,
        assignedToUserId: linkUserId, issuedAt: new Date().toISOString(), returnedAt: null,
      })
      await refresh()
    } finally { setLinking(false); setShowLinking(false); setLinkUserId('') }
  }

  const handleDelete = async () => {
    await api.delete(`/portal/hardware/${asset.id}`)
    onDeleted()
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Back button */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={15} />
          {backLabel}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
        {/* ── Header card ── */}
        <Card>
          <div className="px-6 pt-5 pb-5">
            <div className="flex justify-end gap-1 mb-3">
              {asset.status === 'OnOrder' && (
                <button onClick={() => setShowReceive(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                  <PackageCheck size={12} /> Ontvangen
                </button>
              )}
              <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <Pencil size={12} /> Wijzigen
              </button>
              <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <Trash2 size={12} /> Verwijderen
              </button>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-0.5">{asset.name}</h1>
            <p className="text-sm text-slate-500">
              {[asset.brand, HARDWARE_TYPE_LABEL[asset.type] ?? asset.type].filter(Boolean).join(' · ')}
            </p>
          </div>
        </Card>

        {/* ── Details + Toewijzing naast elkaar ── */}
        <div className="grid grid-cols-[1fr_360px] gap-4 items-stretch">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Details</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                {asset.assetNumber && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Assetnummer</p>
                    <p className="text-sm font-medium text-slate-800 tabular-nums">{asset.assetNumber}</p>
                  </div>
                )}
                {asset.serialNumber && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Serienummer</p>
                    <p className="text-sm font-medium text-slate-800 tabular-nums">{asset.serialNumber}</p>
                  </div>
                )}
                {asset.location && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Locatie</p>
                    <p className="text-sm font-medium text-slate-800">{asset.location}</p>
                  </div>
                )}
                {asset.purchaseValue != null && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Aanschafwaarde</p>
                    <p className="text-sm font-medium text-slate-800">€ {asset.purchaseValue.toFixed(2)}</p>
                  </div>
                )}
                {asset.supplier && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Leverancier</p>
                    <p className="text-sm font-medium text-slate-800">{asset.supplier}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Status</p>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${HARDWARE_STATUS_TONE[asset.status] ?? 'bg-slate-100 text-slate-600'}`}>
                    {HARDWARE_STATUS_LABEL[asset.status] ?? asset.status}
                  </span>
                </div>
                {asset.issuedAt && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Uitgiftedatum</p>
                    <p className="text-sm font-medium text-slate-800">{fmtDate(asset.issuedAt)}</p>
                  </div>
                )}
                {asset.returnedAt && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Inleverdatum</p>
                    <p className="text-sm font-medium text-slate-800">{fmtDate(asset.returnedAt)}</p>
                  </div>
                )}
                {asset.orderedAt && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Besteldatum</p>
                    <p className="text-sm font-medium text-slate-800">{fmtDate(asset.orderedAt)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        {/* ── Toewijzing ── */}
        <Card className="h-full">
            <CardContent className="p-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Toewijzing</h3>
              {asset.assignedToName ? (
                <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
                        <User size={14} className="text-blue-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-blue-500 font-medium">Toegewezen aan</p>
                        <p className="text-sm font-semibold text-slate-800 truncate">{asset.assignedToName}</p>
                        {asset.issuedAt && <p className="text-xs text-slate-400 mt-0.5">Uitgegeven {fmtDate(asset.issuedAt)}</p>}
                      </div>
                    </div>
                    {confirmUnlink ? (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-slate-600 font-medium">Ontkoppelen?</span>
                        <button onClick={handleUnlink} disabled={unlinking} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors">
                          {unlinking ? 'Bezig…' : 'Ja'}
                        </button>
                        <button onClick={() => setConfirmUnlink(false)} className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:bg-white transition-colors">Nee</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmUnlink(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-orange-600 bg-white ring-1 ring-orange-200 hover:bg-orange-50 transition-colors flex-shrink-0">
                        <Link2Off size={12} /> Ontkoppelen
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                  {showLinking ? (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Koppelen aan medewerker</p>
                      <select value={linkUserId} onChange={e => setLinkUserId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25 transition-colors">
                        <option value="">— Kies medewerker —</option>
                        {teammates.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                      </select>
                      <div className="flex gap-2">
                        <button onClick={() => { setShowLinking(false); setLinkUserId('') }} className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 bg-white ring-1 ring-slate-200 hover:bg-slate-50 transition-colors">Annuleren</button>
                        <button onClick={handleLink} disabled={!linkUserId || linking} className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-colors">{linking ? 'Koppelen…' : 'Koppelen'}</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                          <User size={14} className="text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-400 font-medium">Niet gekoppeld</p>
                      </div>
                      <button onClick={() => setShowLinking(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-white ring-1 ring-blue-200 hover:bg-blue-50 transition-colors flex-shrink-0">
                        <User size={12} /> Koppelen
                      </button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <HardwareSpecificationsCard asset={asset} onSaved={refresh} />

        <EntityChecklistCard entityType="Hardware" entityId={asset.id} />

        {/* ── Notities + Historie — volle breedte onderaan ── */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-1 mb-4">
              <button onClick={() => setActiveTab('notes')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notes' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                <StickyNote size={13} /> Notities
              </button>
              <button onClick={() => setActiveTab('history')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                <History size={13} /> Historie
              </button>
            </div>
            {activeTab === 'notes' && <NotesPanel entityType="Hardware" entityId={asset.id} />}
            {activeTab === 'history' && (
              <ItemHistoryBlock
                key={`${asset.id}-${historyKey}`}
                url={`/portal/hardware/${asset.id}/history`}
                subtitle={`${asset.brand} ${asset.name}`}
              />
            )}
            <p className="text-[11px] text-slate-400 mt-3">Aangemaakt op {fmtDate(asset.createdAt)}</p>
          </CardContent>
        </Card>
      </div>

      <HardwareModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={async () => { await refresh(); setShowModal(false) }}
        teammates={teammates}
        locations={locations}
        asset={asset}
      />

      <ConfirmDeleteModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => { setConfirmDelete(false); handleDelete() }}
        itemName={`${asset.brand} ${asset.name}`}
      />

      <ReceiveHardwareModal
        open={showReceive}
        onClose={() => setShowReceive(false)}
        onSuccess={async () => { setShowReceive(false); await refresh() }}
        asset={asset}
      />
    </div>
  )
}
