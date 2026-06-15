import { useState, useEffect, useCallback } from 'react'
import { Laptop, Search, Plus, Package, Activity, Archive, XCircle, Pencil, Trash2, StickyNote, History } from 'lucide-react'
import api from '@/lib/axios'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatCard } from '@/components/portal/PortalUI'
import { ItemHistoryBlock } from '@/components/portal/AuditHistory'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { HardwareModal } from '@/components/HardwareModal'
import { NotesPanel } from '@/components/NotesPanel'
import type { HardwareAssetListItem } from '@/types/hardware'
import { HARDWARE_STATUS_LABEL, HARDWARE_STATUS_TONE, HARDWARE_TYPE_LABEL } from '@/types/hardware'
import type { ClientUserListItem } from '@/types/clientUser'
import type { LocationListItem } from '@/types/location'

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function HardwareDetailPanel({ asset, onEdit, onDelete, historyKey }: {
  asset: HardwareAssetListItem
  onEdit: () => void
  onDelete: () => void
  historyKey: number
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [activeTab, setActiveTab]         = useState<'notes' | 'history'>('notes')

  return (
    <>
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-5 gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">{asset.name}</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {asset.brand || '—'} • {HARDWARE_TYPE_LABEL[asset.type] ?? asset.type}
              </p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${HARDWARE_STATUS_TONE[asset.status] ?? 'bg-slate-100 text-slate-600'}`}>
              {HARDWARE_STATUS_LABEL[asset.status] ?? asset.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs text-slate-600">
            {asset.assetNumber   && <p><span className="text-slate-400">Assetnummer</span><br /><span className="font-medium text-slate-800">{asset.assetNumber}</span></p>}
            {asset.serialNumber  && <p><span className="text-slate-400">Serienummer</span><br /><span className="font-medium text-slate-800">{asset.serialNumber}</span></p>}
            {asset.location      && <p><span className="text-slate-400">Locatie</span><br /><span className="font-medium text-slate-800">{asset.location}</span></p>}
            {asset.purchaseValue != null && <p><span className="text-slate-400">Aanschafwaarde</span><br /><span className="font-medium text-slate-800">€ {asset.purchaseValue.toFixed(2)}</span></p>}
            {asset.supplier      && <p><span className="text-slate-400">Leverancier</span><br /><span className="font-medium text-slate-800">{asset.supplier}</span></p>}
            {asset.assignedToName && <p className="col-span-2"><span className="text-slate-400">Toegewezen aan</span><br /><span className="font-medium text-slate-800">{asset.assignedToName}</span></p>}
            {asset.issuedAt      && <p><span className="text-slate-400">Uitgiftedatum</span><br /><span className="font-medium text-slate-800">{fmtDate(asset.issuedAt)}</span></p>}
            {asset.returnedAt    && <p><span className="text-slate-400">Inleverdatum</span><br /><span className="font-medium text-slate-800">{fmtDate(asset.returnedAt)}</span></p>}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={onEdit}>
              <Pencil size={13} /> Wijzigen
            </Button>
            <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={13} /> Verwijderen
            </Button>
          </div>
          <ConfirmDeleteModal
            open={confirmDelete}
            onClose={() => setConfirmDelete(false)}
            onConfirm={() => { setConfirmDelete(false); onDelete() }}
            itemName={`${asset.brand} ${asset.name}`}
          />

          <div className="mt-5 border-t border-slate-100 dark:border-slate-700 pt-4">
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
        </CardContent>
      </Card>
    </>
  )
}

export function HardwareView({ teammates }: { teammates: ClientUserListItem[] }) {
  const [assets, setAssets]         = useState<HardwareAssetListItem[]>([])
  const [locations, setLocations]   = useState<LocationListItem[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [selected, setSelected]     = useState<HardwareAssetListItem | null>(null)
  const [showModal, setShowModal]   = useState(false)
  const [editTarget, setEditTarget] = useState<HardwareAssetListItem | null>(null)
  const [historyKey, setHistoryKey] = useState(0)

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
  }, [assets])

  const filtered = assets.filter(a =>
    `${a.name} ${a.brand} ${a.assetNumber} ${a.serialNumber} ${a.assignedToName ?? ''} ${a.location}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const totaal      = assets.length
  const inGebruik   = assets.filter(a => a.status === 'InUse').length
  const opVoorraad  = assets.filter(a => a.status === 'InStock').length
  const afgeschreven = assets.filter(a => a.status === 'Decommissioned').length

  const handleDelete = async (id: string) => {
    await api.delete(`/portal/hardware/${id}`)
    setAssets(prev => prev.filter(a => a.id !== id))
    if (selected?.id === id) setSelected(null)
    setHistoryKey(k => k + 1)
  }

  const handleOpenAdd  = () => { setEditTarget(null); setShowModal(true) }
  const handleOpenEdit = (asset: HardwareAssetListItem) => { setEditTarget(asset); setShowModal(true) }
  const handleSaved    = async () => { await fetchAssets(); setShowModal(false); setHistoryKey(k => k + 1) }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="grid grid-cols-4 gap-3 flex-shrink-0">
        <StatCard label="Totaal"      value={totaal}      icon={<Package size={18} />} />
        <StatCard label="In gebruik"  value={inGebruik}   icon={<Activity size={18} />} tone="emerald" />
        <StatCard label="Op voorraad" value={opVoorraad}  icon={<Archive size={18} />}  tone="blue" />
        <StatCard label="Afgeschreven" value={afgeschreven} icon={<XCircle size={18} />} tone="slate" />
      </div>

      <div className="grid grid-cols-[1fr_20%] grid-rows-[auto_1fr] gap-x-4 gap-y-3 flex-1 min-h-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Zoek hardware…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-400"
            />
          </div>
          <Button size="sm" onClick={handleOpenAdd}>
            <Plus size={13} /> Toevoegen
          </Button>
        </div>
        <div />

        <Card className="overflow-hidden flex flex-col min-h-0">
          <div className="grid grid-cols-[1fr_1.2fr_2fr_1.2fr_1fr_1.5fr_0.9fr] gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex-shrink-0">
            {['Type', 'Merk', 'Naam', 'Serienummer', 'Leverancier', 'Toegewezen aan', 'Status'].map(h => (
              <span key={h} className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{h}</span>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-10 text-center text-sm text-slate-400">Laden…</div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center">
                <Laptop size={36} className="mx-auto mb-3 text-slate-200" />
                <p className="text-sm text-slate-400">
                  {search ? 'Geen resultaten gevonden.' : 'Nog geen hardware toegevoegd.'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filtered.map(a => (
                  <li
                    key={a.id}
                    onClick={() => setSelected(a)}
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
              onEdit={() => handleOpenEdit(selected)}
              onDelete={() => handleDelete(selected.id)}
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
    </div>
  )
}
