import { FilterSelect } from '@/components/ui/FilterSelect'
import { useSort, SortHeader } from '@/components/ui/SortHeader'
import { useState, useEffect, useCallback } from 'react'
import { Phone as PhoneIcon, Layers, CreditCard, Wifi, Search, Plus, Pencil, Trash2, StickyNote, History, Maximize2, ArrowLeft, User, Link2Off, Unlink, PackageCheck, Upload } from 'lucide-react'
import api from '@/lib/axios'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatCard } from '@/components/portal/PortalUI'
import { ItemHistoryBlock } from '@/components/portal/AuditHistory'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { PhoneModal } from '@/components/PhoneModal'
import { ReceivePhoneModal } from '@/components/ReceivePhoneModal'
import { PhoneSetupWizard } from '@/components/PhoneSetupWizard'
import { SimCardModal } from '@/components/SimCardModal'
import { NotesPanel } from '@/components/NotesPanel'
import { EntityChecklistCard } from '@/components/EntityChecklistCard'
import { LoadingState } from '@/components/ui/LoadingState'
import { ImportWizardModal } from '@/components/import/ImportWizardModal'
import type { ImportPhoneRow, PhoneImportPreview, ImportSubscriptionRow, SubscriptionImportPreview } from '@/types/import'
import type { PhoneListItem } from '@/types/phone'
import { PHONE_STATUS_LABEL, PHONE_STATUS_TONE } from '@/types/phone'
import type { SimCardListItem } from '@/types/simcard'
import { SIM_STATUS_LABEL, SIM_STATUS_TONE, SIM_TYPE_LABEL } from '@/types/simcard'
import type { SubscriptionListItem } from '@/types/subscription'
import { SUB_STATUS_LABEL, SUB_STATUS_TONE, SUB_TYPE_LABEL } from '@/types/subscription'
import type { ClientUserListItem } from '@/types/clientUser'

type TelefonieTab = 'phones' | 'simcards'

function fmt(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── Phones tab ────────────────────────────────────────────────────────────────

function PhonesTab({ teammates, onExpand }: { teammates: ClientUserListItem[]; onExpand?: (phone: PhoneListItem) => void }) {
  const [phones, setPhones]         = useState<PhoneListItem[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [selected, setSelected]     = useState<PhoneListItem | null>(null)
  const [showModal, setShowModal]   = useState(false)
  const [editTarget, setEditTarget] = useState<PhoneListItem | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [historyKey, setHistoryKey] = useState(0)
  const [showWizard, setShowWizard]         = useState(false)
  const [showImport, setShowImport]         = useState(false)
  const [confirmUnlink, setConfirmUnlink]       = useState(false)
  const [unlinking, setUnlinking]               = useState(false)
  const [confirmUnlinkSim, setConfirmUnlinkSim] = useState(false)
  const [unlinkingSim, setUnlinkingSim]         = useState(false)
  const [showReceive, setShowReceive]           = useState(false)

  const fetchPhones = useCallback(async () => {
    try {
      const { data } = await api.get<PhoneListItem[]>('/portal/phones')
      setPhones(data)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchPhones() }, [fetchPhones])

  useEffect(() => {
    if (selected) {
      const updated = phones.find(p => p.id === selected.id)
      if (updated) setSelected(updated)
    }
  }, [phones])

  const [statusFilter, setStatusFilter] = useState('')

  const filtered = phones.filter(p =>
    (!statusFilter || p.status === statusFilter) &&
    `${p.brand} ${p.model} ${p.serialNumber} ${p.imeiNumber} ${p.assignedToName ?? ''}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const { sorted, sortKey, sortDir, toggleSort } = useSort(filtered, {
    merk:       p => p.brand || null,
    model:      p => p.model || null,
    serienummer: p => p.serialNumber || null,
    imei:       p => p.imeiNumber || null,
    leverancier: p => p.supplier || null,
    toegewezen: p => p.assignedToName || null,
    aanschaf:   p => p.purchasedAt || null,
    status:     p => PHONE_STATUS_LABEL[p.status] ?? p.status,
  })

  const handleDelete = async (id: string) => {
    await api.delete(`/portal/phones/${id}`)
    setPhones(prev => prev.filter(p => p.id !== id))
    setSelected(null)
    setConfirmDelete(false)
  }

  const handleSaved = async () => {
    await fetchPhones()
    setShowModal(false)
    setHistoryKey(k => k + 1)
  }

  const handleUnlink = async (p: PhoneListItem) => {
    setUnlinking(true)
    try {
      await api.put(`/portal/phones/${p.id}`, {
        brand: p.brand, model: p.model || '',
        serialNumber: p.serialNumber || '', imeiNumber: p.imeiNumber || '',
        status: p.status === 'OnOrder' ? 4 : 0, assignedToUserId: null,
        purchaseValue: p.purchaseValue ?? null,
        purchasedAt: p.purchasedAt ?? null, returnedAt: new Date().toISOString(),
        orderedAt: p.orderedAt ?? null,
      })
      await fetchPhones()
      setHistoryKey(k => k + 1)
    } finally { setUnlinking(false); setConfirmUnlink(false) }
  }

  const handleUnlinkSim = async () => {
    if (!selected) return
    setUnlinkingSim(true)
    try {
      const { data } = await api.delete<PhoneListItem>(`/portal/phones/${selected.id}/simcard`)
      setPhones(prev => prev.map(p => p.id === selected.id ? data : p))
      setSelected(data)
      setHistoryKey(k => k + 1)
    } finally {
      setUnlinkingSim(false)
      setConfirmUnlinkSim(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <div className="grid grid-cols-[1fr_22%] grid-rows-[auto_1fr] gap-x-4 gap-y-3 flex-1 min-h-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Zoek telefoons…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-400 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25"
            />
          </div>
          <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter}
            options={Object.entries(PHONE_STATUS_LABEL).map(([value, label]) => ({ value, label }))} />
          <Button size="sm" variant="secondary" className="py-2" onClick={() => setShowWizard(true)}>
            <Layers size={13} /> Setup
          </Button>
          <Button size="sm" variant="secondary" className="py-2" onClick={() => setShowImport(true)}>
            <Upload size={13} /> Importeren
          </Button>
          <Button size="sm" className="py-2 ml-auto" onClick={() => { setEditTarget(null); setShowModal(true) }}>
            <Plus size={13} /> Toevoegen
          </Button>
        </div>
        <div />

        <Card className="overflow-hidden flex flex-col min-h-0">
          <div className="grid grid-cols-[1fr_1.2fr_1.3fr_1fr_1.2fr_1.5fr_1fr_0.9fr] gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex-shrink-0">
            {([
              { label: 'Merk', key: 'merk' },
              { label: 'Model', key: 'model' },
              { label: 'Serienummer', key: 'serienummer' },
              { label: 'IMEI-nummer', key: 'imei' },
              { label: 'Leverancier', key: 'leverancier' },
              { label: 'Toegewezen aan', key: 'toegewezen' },
              { label: 'Aanschafdatum', key: 'aanschaf' },
              { label: 'Status', key: 'status' },
            ] as { label: string; key?: string }[]).map((h, i) => (
              <SortHeader key={i} label={h.label} sortKey={h.key} activeKey={sortKey} dir={sortDir} onToggle={toggleSort} />
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-10 flex justify-center"><LoadingState label="Telefoons laden…" /></div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center">
                <PhoneIcon size={36} className="mx-auto mb-3 text-slate-200" />
                <p className="text-sm text-slate-400">{search ? 'Geen resultaten.' : 'Nog geen telefoons.'}</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {sorted.map(p => (
                  <li
                    key={p.id}
                    onClick={() => { setSelected(p); setConfirmDelete(false); setConfirmUnlink(false) }}
                    onDoubleClick={() => onExpand?.(p)}
                    className={`grid grid-cols-[1fr_1.2fr_1.3fr_1fr_1.2fr_1.5fr_1fr_0.9fr] gap-3 px-4 py-3 items-center cursor-pointer transition-colors hover:bg-slate-100 ${selected?.id === p.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}
                  >
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{p.brand}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{p.model || '—'}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate tabular-nums">{p.serialNumber || '—'}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate tabular-nums">{p.imeiNumber || '—'}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{p.supplier || '—'}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{p.assignedToName || '—'}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate tabular-nums">{fmt(p.purchasedAt)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium truncate ${PHONE_STATUS_TONE[p.status] ?? 'bg-slate-100 text-slate-500'}`}>
                      {PHONE_STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <div className="min-h-0">
          {selected ? (
            <Card className="h-full overflow-y-auto">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4 gap-2">
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-slate-900 truncate">{selected.brand} {selected.model}</h2>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{selected.simPhoneNumber || selected.serialNumber || '—'}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {selected.status === 'OnOrder' && (
                      <button onClick={() => setShowReceive(true)} title="Ontvangen" className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                        <PackageCheck size={13} />
                      </button>
                    )}
                    <button onClick={() => { setEditTarget(selected); setShowModal(true) }} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Wijzigen">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Verwijderen">
                      <Trash2 size={13} />
                    </button>
                    {onExpand && (
                      <button onClick={() => onExpand(selected)} title="Volledig openen" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                        <Maximize2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs text-slate-600">
                  {selected.serialNumber && <p><span className="text-slate-400">Serienummer</span><br /><span className="font-medium text-slate-800">{selected.serialNumber}</span></p>}
                  {selected.imeiNumber   && <p><span className="text-slate-400">IMEI</span><br /><span className="font-medium text-slate-800">{selected.imeiNumber}</span></p>}
                  <p>
                    <span className="text-slate-400">Status</span><br />
                    <span className={`font-semibold ${
                      selected.status === 'InUse'          ? 'text-emerald-600' :
                      selected.status === 'InStock'        ? 'text-blue-600' :
                      selected.status === 'UnderRepair'    ? 'text-orange-500' :
                      selected.status === 'OnOrder'        ? 'text-amber-600' :
                      selected.status === 'Decommissioned' ? 'text-red-500' : 'text-slate-500'
                    }`}>{PHONE_STATUS_LABEL[selected.status] ?? selected.status}</span>
                  </p>
                  {selected.purchasedAt && <p><span className="text-slate-400">Aanschafdatum</span><br /><span className="font-medium text-slate-800">{fmt(selected.purchasedAt)}</span></p>}
                  {selected.purchaseValue != null && <p><span className="text-slate-400">Aanschafwaarde</span><br /><span className="font-medium text-slate-800">€ {selected.purchaseValue.toFixed(2)}</span></p>}
                  {selected.orderedAt && <p><span className="text-slate-400">Besteldatum</span><br /><span className="font-medium text-slate-800">{fmt(selected.orderedAt)}</span></p>}
                  {selected.supplier     && <p className="col-span-2"><span className="text-slate-400">Leverancier</span><br /><span className="font-medium text-slate-800">{selected.supplier}</span></p>}
                  {selected.returnedAt && <p><span className="text-slate-400">Inleverdatum</span><br /><span className="font-medium text-slate-800">{fmt(selected.returnedAt)}</span></p>}
                </div>
                {selected.assignedToName && (
                  <div className="mt-3 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
                          <User size={12} className="text-blue-700" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-blue-400">Toegewezen aan</p>
                          <p className="text-sm font-semibold text-slate-800 truncate">{selected.assignedToName}</p>
                        </div>
                      </div>
                      {confirmUnlink ? (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-xs text-slate-600 font-medium">Ontkoppelen?</span>
                          <button onClick={() => handleUnlink(selected)} disabled={unlinking} className="px-2 py-1 rounded-lg text-xs font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors">
                            {unlinking ? '…' : 'Ja'}
                          </button>
                          <button onClick={() => setConfirmUnlink(false)} className="px-2 py-1 rounded-lg text-xs font-medium text-slate-500 hover:bg-white transition-colors">Nee</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmUnlink(true)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-orange-600 bg-white ring-1 ring-orange-200 hover:bg-orange-50 transition-colors flex-shrink-0">
                          <Link2Off size={11} /> Ontkoppelen
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {selected.simCardNumber && (
                  <div className="mt-2 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-blue-400 mb-0.5">Gekoppelde simkaart</p>
                        <p className="text-sm font-medium text-blue-700 truncate">
                          {selected.simCardNumber}{selected.simPhoneNumber ? ` · ${selected.simPhoneNumber}` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => setConfirmUnlinkSim(true)}
                        title="Simkaart ontkoppelen"
                        className="flex-shrink-0 p-1.5 rounded-lg text-blue-400 hover:text-orange-500 hover:bg-white transition-colors"
                      >
                        <Link2Off size={14} />
                      </button>
                    </div>
                  </div>
                )}
                <Modal open={confirmUnlinkSim} onClose={() => setConfirmUnlinkSim(false)} title="Simkaart ontkoppelen" className="max-w-sm">
                  <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-3">
                      <Unlink size={22} className="text-orange-500" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 mb-1">{selected?.simCardNumber}</h3>
                    <p className="text-sm text-slate-500">De simkaart wordt losgekoppeld van deze telefoon.</p>
                  </div>
                  <div className="flex gap-3">
                    <Button type="button" variant="secondary" className="flex-1" onClick={() => setConfirmUnlinkSim(false)}>Annuleren</Button>
                    <Button type="button" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white" disabled={unlinkingSim} onClick={handleUnlinkSim}>
                      {unlinkingSim ? 'Bezig…' : 'Ontkoppelen'}
                    </Button>
                  </div>
                </Modal>
                <ConfirmDeleteModal
                  open={confirmDelete}
                  onClose={() => setConfirmDelete(false)}
                  onConfirm={() => { setConfirmDelete(false); handleDelete(selected.id) }}
                  itemName={`${selected.brand} ${selected.model}`}
                />
                <ReceivePhoneModal
                  open={showReceive}
                  onClose={() => setShowReceive(false)}
                  onSuccess={async () => { setShowReceive(false); await fetchPhones(); setHistoryKey(k => k + 1) }}
                  phone={selected}
                />
                <ItemHistoryBlock
                  key={`${selected.id}-${historyKey}`}
                  url={`/portal/phones/${selected.id}/history`}
                  subtitle={`${selected.brand} ${selected.model}`}
                />
                <p className="text-[11px] text-slate-400 mt-3">Aangemaakt op {fmt(selected.createdAt)}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <PhoneIcon size={28} className="text-slate-300" />
                </div>
                <p className="text-sm text-slate-400">Selecteer een telefoon</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <PhoneModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSaved}
        teammates={teammates}
        phone={editTarget}
      />
      <PhoneSetupWizard
        open={showWizard}
        onClose={() => setShowWizard(false)}
        onSuccess={handleSaved}
        teammates={teammates}
      />

      <ImportWizardModal<ImportPhoneRow, PhoneImportPreview>
        open={showImport}
        title="Telefonie importeren"
        templateUrl="/portal/phones/import-template"
        templateFileName="telefonie-import-template.xlsx"
        columnsUrl="/portal/phones/import/columns"
        validateUrl="/portal/phones/import/validate"
        confirmUrl="/portal/phones/import/confirm"
        columns={[
          { key: 'brand', label: 'Merk' },
          { key: 'model', label: 'Model' },
          { key: 'serialNumber', label: 'Serienummer' },
          { key: 'imeiNumber', label: 'IMEI' },
          { key: 'purchaseValue', label: 'Aanschafwaarde' },
          { key: 'assignedToEmail', label: 'Toegewezen aan' },
        ]}
        onClose={() => setShowImport(false)}
        onDone={() => { setShowImport(false); fetchPhones() }}
      />
    </div>
  )
}

// ── SimCards tab ──────────────────────────────────────────────────────────────

interface AbonnementRow {
  key: string
  simCard: SimCardListItem | null
  subscription: SubscriptionListItem | null
}

function SimCardsTab({ teammates, onExpand }: { teammates: ClientUserListItem[]; onExpand?: (simCard: SimCardListItem | null, subscription: SubscriptionListItem | null) => void }) {
  const [simCards, setSimCards]         = useState<SimCardListItem[]>([])
  const [phones, setPhones]             = useState<PhoneListItem[]>([])
  const [subscriptions, setSubscriptions] = useState<SubscriptionListItem[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [selected, setSelected]         = useState<AbonnementRow | null>(null)
  const [showModal, setShowModal]       = useState(false)
  const [editTarget, setEditTarget]     = useState<AbonnementRow | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [historyKey, setHistoryKey]     = useState(0)
  const [activeTab, setActiveTab]       = useState<'notes' | 'history'>('notes')
  const [showImport, setShowImport]     = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [simRes, phoneRes, subRes] = await Promise.all([
        api.get<SimCardListItem[]>('/portal/simcards'),
        api.get<PhoneListItem[]>('/portal/phones'),
        api.get<SubscriptionListItem[]>('/portal/subscriptions'),
      ])
      setSimCards(simRes.data)
      setPhones(phoneRes.data)
      setSubscriptions(subRes.data)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Elke simkaart is een rij (met haar gekoppelde abonnement, indien aanwezig), aangevuld met
  // abonnementen die geen simkaart hebben (bv. via de losse abonnementen-import) — die zouden
  // anders nergens in deze lijst verschijnen.
  const rows: AbonnementRow[] = [
    ...simCards.map(s => ({ key: `sim-${s.id}`, simCard: s, subscription: subscriptions.find(sub => sub.simCardId === s.id) ?? null })),
    ...subscriptions.filter(sub => !sub.simCardId).map(sub => ({ key: `sub-${sub.id}`, simCard: null, subscription: sub })),
  ]

  useEffect(() => {
    if (selected) {
      const updated = rows.find(r => r.key === selected.key)
      if (updated) setSelected(updated)
    }
  }, [simCards, subscriptions])

  useEffect(() => {
    setConfirmDelete(false)
    setActiveTab('notes')
  }, [selected?.key])

  const [typeFilter, setTypeFilter]         = useState('')
  const [statusFilter, setStatusFilter]     = useState('')
  const [subStatusFilter, setSubStatusFilter] = useState('')

  const filtered = rows.filter(({ simCard: s, subscription: sub }) => {
    return (!typeFilter || s?.type === typeFilter) &&
      (!statusFilter || s?.status === statusFilter) &&
      (!subStatusFilter || sub?.status === subStatusFilter) &&
      `${s?.kaartNummer ?? ''} ${s?.phoneNumber ?? sub?.simPhoneNumber ?? ''} ${s?.assignedToName ?? sub?.assignedToName ?? ''} ${s?.phoneName ?? ''} ${sub?.provider ?? ''} ${sub?.name ?? ''} ${sub?.supplier ?? ''}`
        .toLowerCase().includes(search.toLowerCase())
  })

  const { sorted, sortKey, sortDir, toggleSort } = useSort(filtered, {
    provider:      r => r.subscription?.provider || null,
    naam:          r => r.subscription?.name || null,
    telefoonnummer: r => r.simCard?.phoneNumber || r.subscription?.simPhoneNumber || null,
    persoon:       r => r.simCard?.assignedToName || r.subscription?.assignedToName || null,
    leverancier:   r => r.subscription?.supplier || null,
    kaartnummer:   r => r.simCard?.kaartNummer || null,
    status:        r => r.simCard ? (SIM_STATUS_LABEL[r.simCard.status] ?? r.simCard.status) : null,
  })

  const handleDelete = async (row: AbonnementRow) => {
    if (row.simCard) {
      await api.delete(`/portal/simcards/${row.simCard.id}`)
    } else if (row.subscription) {
      await api.delete(`/portal/subscriptions/${row.subscription.id}`)
    }
    await fetchData()
    setSelected(null)
    setConfirmDelete(false)
  }

  const handleSaved = async () => { await fetchData(); setShowModal(false); setHistoryKey(k => k + 1) }

  function fmtCost(cost: number | null) {
    if (cost == null) return '—'
    return `€ ${cost.toFixed(2)}`
  }

  const SIM_COLS = 'grid-cols-[1fr_1.2fr_1fr_1.1fr_1fr_1.2fr_0.8fr]'

  return (
    <div className="grid grid-cols-[1fr_22%] grid-rows-[auto_1fr] gap-x-4 gap-y-3 flex-1 min-h-0">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zoek simkaarten…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-400 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25"
          />
        </div>
        <FilterSelect label="Type" value={typeFilter} onChange={setTypeFilter}
          options={Object.entries(SIM_TYPE_LABEL).map(([value, label]) => ({ value, label }))} />
        <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter}
          options={Object.entries(SIM_STATUS_LABEL).map(([value, label]) => ({ value, label }))} />
        <FilterSelect label="Abonnement" value={subStatusFilter} onChange={setSubStatusFilter}
          options={Object.entries(SUB_STATUS_LABEL).map(([value, label]) => ({ value, label }))} />
        <Button size="sm" variant="secondary" className="py-2" onClick={() => setShowImport(true)}>
          <Upload size={13} /> Importeren
        </Button>
        <Button size="sm" className="py-2" onClick={() => { setEditTarget(null); setShowModal(true) }}>
          <Plus size={13} /> Toevoegen
        </Button>
      </div>
      <div />

      <Card className="overflow-hidden flex flex-col min-h-0">
        <div className={`grid ${SIM_COLS} gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex-shrink-0`}>
          {([
            { label: 'Provider', key: 'provider' },
            { label: 'Abonnement', key: 'naam' },
            { label: 'Telefoonnummer', key: 'telefoonnummer' },
            { label: 'Persoon', key: 'persoon' },
            { label: 'Leverancier', key: 'leverancier' },
            { label: 'SIM nummer', key: 'kaartnummer' },
            { label: 'Status', key: 'status' },
          ] as { label: string; key?: string; right?: boolean }[]).map((h, i) => (
            <SortHeader key={i} label={h.label} sortKey={h.key} activeKey={sortKey} dir={sortDir} onToggle={toggleSort} className={h.right ? 'justify-end' : ''} />
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-10 flex justify-center"><LoadingState label="SIM-kaarten laden…" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <CreditCard size={36} className="mx-auto mb-3 text-slate-200" />
              <p className="text-sm text-slate-400">{search ? 'Geen resultaten.' : 'Nog geen simkaarten.'}</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {sorted.map(row => {
                const s = row.simCard
                const sub = row.subscription
                return (
                  <li
                    key={row.key}
                    onClick={() => { setSelected(row); setConfirmDelete(false) }}
                    onDoubleClick={() => onExpand?.(s, sub)}
                    className={`grid ${SIM_COLS} gap-3 px-4 py-3 items-center cursor-pointer transition-colors hover:bg-slate-100 ${selected?.key === row.key ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}
                  >
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{sub?.provider || '—'}</p>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{sub?.name || '—'}</p>
                      {sub?.status === 'Incomplete' && (
                        <span title="Prijs nog niet ingevuld" className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${SUB_STATUS_TONE.Incomplete}`}>
                          Nog af te maken
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate tabular-nums">{s?.phoneNumber || sub?.simPhoneNumber || '—'}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{s?.assignedToName || sub?.assignedToName || '—'}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{sub?.supplier || '—'}</p>
                    <p className="text-sm font-semibold text-slate-800 truncate tabular-nums">{s?.kaartNummer || '—'}</p>
                    {s ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium truncate ${SIM_STATUS_TONE[s.status] ?? 'bg-slate-100 text-slate-500'}`}>
                        {SIM_STATUS_LABEL[s.status] ?? s.status}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </Card>

      <div className="min-h-0">
        {selected ? (() => {
          const s = selected.simCard
          const sub = selected.subscription
          return (
          <Card className="h-full overflow-y-auto">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4 gap-2">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-900 truncate tabular-nums">{sub?.name ?? s?.kaartNummer ?? '—'}</h2>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{s?.assignedToName || sub?.assignedToName || 'Niet toegewezen'}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => { setEditTarget(selected); setShowModal(true) }} title="Wijzigen" className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => setConfirmDelete(true)} title="Verwijderen" className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={13} />
                  </button>
                  {onExpand && (
                    <button onClick={() => onExpand(s, sub)} title="Volledig openen" className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                      <Maximize2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Simkaart</p>
              {s ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Type',           value: SIM_TYPE_LABEL[s.type] ?? s.type },
                      { label: 'Status',         value: SIM_STATUS_LABEL[s.status] ?? s.status },
                      { label: 'Telefoonnummer', value: s.phoneNumber || '—' },
                    ].map(row => (
                      <div key={row.label} className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-400 mb-0.5">{row.label}</p>
                        <p className="text-sm font-medium text-slate-800 truncate">{row.value}</p>
                      </div>
                    ))}
                  </div>
                  {s.phoneName && (
                    <div className="mt-2 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5">
                      <p className="text-xs text-blue-400 mb-0.5">Gekoppelde telefoon</p>
                      <p className="text-sm font-medium text-blue-700 truncate">{s.phoneName}</p>
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => { setEditTarget(selected); setShowModal(true) }}
                  className="w-full flex items-center justify-between gap-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2.5 text-left hover:border-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <span className="text-xs text-slate-500 dark:text-slate-400">Nog geen simkaart gekoppeld</span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                    <Plus size={13} /> Toevoegen
                  </span>
                </button>
              )}

              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mt-4 mb-2">Abonnement</p>
              {sub ? (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Provider',      value: sub.provider || '—' },
                    { label: 'Type',          value: SUB_TYPE_LABEL[sub.type] ?? sub.type },
                    { label: 'Kosten / mnd',  value: fmtCost(sub.monthlyCost) },
                    { label: 'Status',        value: SUB_STATUS_LABEL[sub.status] ?? sub.status },
                  ].map(row => (
                    <div key={row.label} className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400 mb-0.5">{row.label}</p>
                      <p className="text-sm font-medium text-slate-800 truncate">{row.value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => { setEditTarget(selected); setShowModal(true) }}
                  className="w-full flex items-center justify-between gap-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2.5 text-left hover:border-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <span className="text-xs text-slate-500 dark:text-slate-400">Nog geen abonnement — simkaart in voorraad</span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                    <Plus size={13} /> Toevoegen
                  </span>
                </button>
              )}

              <ConfirmDeleteModal
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={() => { setConfirmDelete(false); handleDelete(selected) }}
                itemName={s?.kaartNummer ?? sub?.name ?? ''}
              />
              <div className="border-t border-slate-100 mt-4 pt-4">
                <div className="flex items-center gap-1 mb-4">
                  <button onClick={() => setActiveTab('notes')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notes' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                    <StickyNote size={13} /> Notities
                  </button>
                  <button onClick={() => setActiveTab('history')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                    <History size={13} /> Historie
                  </button>
                </div>
                {s ? (
                  <>
                    {activeTab === 'notes' && <NotesPanel entityType="SimCard" entityId={s.id} />}
                    {activeTab === 'history' && (
                      <ItemHistoryBlock
                        key={`${s.id}-${historyKey}`}
                        url={`/portal/simcards/${s.id}/history`}
                        subtitle={s.kaartNummer}
                      />
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-400">Notities en historie zijn beschikbaar zodra er een simkaart gekoppeld is.</p>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-3">Aangemaakt op {fmt(s?.createdAt ?? sub?.createdAt ?? '')}</p>
            </CardContent>
          </Card>
          )
        })() : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                <CreditCard size={28} className="text-slate-300" />
              </div>
              <p className="text-sm text-slate-400">Selecteer een simkaart</p>
            </div>
          </div>
        )}
      </div>

      <SimCardModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSaved}
        teammates={teammates}
        phones={phones}
        simCard={editTarget?.simCard ?? null}
        subscription={editTarget?.subscription ?? null}
      />

      <ImportWizardModal<ImportSubscriptionRow, SubscriptionImportPreview>
        open={showImport}
        title="Abonnementen importeren"
        templateUrl="/portal/subscriptions/import-template"
        templateFileName="abonnementen-import-template.xlsx"
        columnsUrl="/portal/subscriptions/import/columns"
        validateUrl="/portal/subscriptions/import/validate"
        confirmUrl="/portal/subscriptions/import/confirm"
        columns={[
          { key: 'name', label: 'Naam' },
          { key: 'provider', label: 'Provider' },
          { key: 'supplier', label: 'Leverancier' },
          { key: 'type', label: 'Type' },
          { key: 'phoneNumber', label: 'Telefoonnummer' },
          { key: 'monthlyCost', label: 'Kosten' },
          { key: 'status', label: 'Status' },
          { key: 'assignedToEmail', label: 'Toegewezen aan' },
          { key: 'simKaartNummer', label: 'SIM kaartnummer' },
          { key: 'simType', label: 'SIM type' },
          { key: 'simStatus', label: 'SIM status' },
        ]}
        onClose={() => setShowImport(false)}
        onDone={() => { setShowImport(false); fetchData() }}
      />
    </div>
  )
}

// ── PhoneDetailFullView ───────────────────────────────────────────────────────

export function PhoneDetailFullView({ initialPhone, teammates, onBack, onDeleted, backLabel = 'Terug naar telefonie' }: {
  initialPhone: PhoneListItem
  teammates: ClientUserListItem[]
  onBack: () => void
  onDeleted: () => void
  backLabel?: string
}) {
  const [phone, setPhone]               = useState<PhoneListItem>(initialPhone)
  const [showModal, setShowModal]       = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmUnlink, setConfirmUnlink]       = useState(false)
  const [unlinking, setUnlinking]               = useState(false)
  const [confirmUnlinkSim, setConfirmUnlinkSim] = useState(false)
  const [unlinkingSim, setUnlinkingSim]         = useState(false)
  const [showLinking, setShowLinking]           = useState(false)
  const [linkUserId, setLinkUserId]     = useState('')
  const [linking, setLinking]           = useState(false)
  const [historyKey, setHistoryKey]     = useState(0)
  const [activeTab, setActiveTab]       = useState<'notes' | 'history'>('notes')
  const [showReceive, setShowReceive]   = useState(false)

  const refresh = async () => {
    const { data } = await api.get<PhoneListItem[]>('/portal/phones')
    const updated = data.find(p => p.id === phone.id)
    if (updated) setPhone(updated)
    setHistoryKey(k => k + 1)
  }

  const handleUnlink = async () => {
    setUnlinking(true)
    try {
      await api.put(`/portal/phones/${phone.id}`, {
        brand: phone.brand, model: phone.model || '',
        serialNumber: phone.serialNumber || '', imeiNumber: phone.imeiNumber || '',
        status: phone.status === 'OnOrder' ? 4 : 0, assignedToUserId: null,
        purchaseValue: phone.purchaseValue ?? null,
        purchasedAt: phone.purchasedAt ?? null, returnedAt: new Date().toISOString(),
        orderedAt: phone.orderedAt ?? null,
      })
      await refresh()
    } finally { setUnlinking(false); setConfirmUnlink(false) }
  }

  const handleLink = async () => {
    if (!linkUserId) return
    setLinking(true)
    try {
      await api.put(`/portal/phones/${phone.id}`, {
        brand: phone.brand, model: phone.model || '',
        serialNumber: phone.serialNumber || '', imeiNumber: phone.imeiNumber || '',
        status: phone.status === 'OnOrder' ? 4 : 1, assignedToUserId: linkUserId,
        purchaseValue: phone.purchaseValue ?? null,
        purchasedAt: phone.purchasedAt ?? null, returnedAt: null,
        orderedAt: phone.orderedAt ?? null,
      })
      await refresh()
    } finally { setLinking(false); setShowLinking(false); setLinkUserId('') }
  }

  const handleUnlinkSim = async () => {
    setUnlinkingSim(true)
    try {
      const { data } = await api.delete<PhoneListItem>(`/portal/phones/${phone.id}/simcard`)
      setPhone(data)
      setHistoryKey(k => k + 1)
    } finally { setUnlinkingSim(false); setConfirmUnlinkSim(false) }
  }

  const handleDelete = async () => {
    await api.delete(`/portal/phones/${phone.id}`)
    onDeleted()
  }

  const handleSaved = async () => { setShowModal(false); await refresh() }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Back */}
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft size={15} /> {backLabel}
        </button>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 truncate">{phone.brand} {phone.model}</h1>
            <p className="text-sm text-slate-400 mt-0.5 truncate">{phone.serialNumber || phone.imeiNumber || '—'}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {phone.status === 'OnOrder' && (
              <button onClick={() => setShowReceive(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition-colors">
                <PackageCheck size={12} /> Ontvangen
              </button>
            )}
            <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <Pencil size={12} /> Wijzigen
            </button>
            <button onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
              <Trash2 size={12} /> Verwijderen
            </button>
          </div>
        </div>
      </div>

      {/* Details + Toewijzing */}
      <div className="grid grid-cols-[1fr_360px] gap-4 items-stretch">
        {/* Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Details</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Status</p>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${PHONE_STATUS_TONE[phone.status] ?? 'bg-slate-100 text-slate-600'}`}>
                {PHONE_STATUS_LABEL[phone.status] ?? phone.status}
              </span>
            </div>
            {phone.purchasedAt && (
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Aanschafdatum</p>
                <p className="text-sm font-medium text-slate-800">{fmt(phone.purchasedAt)}</p>
              </div>
            )}
            {phone.purchaseValue != null && (
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Aanschafwaarde</p>
                <p className="text-sm font-medium text-slate-800">€ {phone.purchaseValue.toFixed(2)}</p>
              </div>
            )}
            {phone.orderedAt && (
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Besteldatum</p>
                <p className="text-sm font-medium text-slate-800">{fmt(phone.orderedAt)}</p>
              </div>
            )}
            {phone.serialNumber && (
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Serienummer</p>
                <p className="text-sm font-medium text-slate-800 tabular-nums">{phone.serialNumber}</p>
              </div>
            )}
            {phone.imeiNumber && (
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">IMEI</p>
                <p className="text-sm font-medium text-slate-800 tabular-nums">{phone.imeiNumber}</p>
              </div>
            )}
            {phone.supplier && (
              <div className="col-span-2">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Leverancier</p>
                <p className="text-sm font-medium text-slate-800">{phone.supplier}</p>
              </div>
            )}
            {phone.returnedAt && (
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Inleverdatum</p>
                <p className="text-sm font-medium text-slate-800">{fmt(phone.returnedAt)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Koppelingen */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 h-full flex flex-col">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Koppelingen</h3>

          {/* Simkaart */}
          {phone.simCardNumber && (
            <div className="mb-3 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-blue-400 mb-0.5">Gekoppelde simkaart</p>
                  <p className="text-sm font-medium text-blue-700 truncate">
                    {phone.simCardNumber}{phone.simPhoneNumber ? ` · ${phone.simPhoneNumber}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => setConfirmUnlinkSim(true)}
                  title="Simkaart ontkoppelen"
                  className="flex-shrink-0 p-1.5 rounded-lg text-blue-400 hover:text-orange-500 hover:bg-white transition-colors"
                >
                  <Link2Off size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Toewijzing aan medewerker */}
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Toegewezen aan</p>
          {phone.assignedToName ? (
            <div className="flex-1">
              <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
                      <User size={14} className="text-blue-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-blue-500 font-medium">Toegewezen aan</p>
                      <p className="text-sm font-semibold text-slate-800 truncate">{phone.assignedToName}</p>
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
            </div>
          ) : showLinking ? (
            <div className="flex flex-col gap-3 flex-1">
              <select value={linkUserId} onChange={e => setLinkUserId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] dark:text-slate-100 text-sm focus:outline-none focus:border-blue-400 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25">
                <option value="">— Selecteer medewerker —</option>
                {teammates.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
              </select>
              <div className="flex gap-2">
                <button onClick={() => { setShowLinking(false); setLinkUserId('') }} className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-white ring-1 ring-slate-200 hover:bg-slate-50 transition-colors">Annuleren</button>
                <button onClick={handleLink} disabled={!linkUserId || linking} className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-colors">{linking ? 'Koppelen…' : 'Koppelen'}</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <User size={20} className="text-slate-300" />
              </div>
              <p className="text-sm text-slate-400">Niet toegewezen</p>
              <button onClick={() => setShowLinking(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">
                <Plus size={11} /> Koppelen
              </button>
            </div>
          )}
        </div>
      </div>

      <EntityChecklistCard entityType="Phone" entityId={phone.id} />

      {/* Notes / History */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center gap-1 mb-4 border-b border-slate-100 -mx-5 px-5 pb-3">
          <button onClick={() => setActiveTab('notes')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notes' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
            <StickyNote size={13} /> Notities
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
            <History size={13} /> Historie
          </button>
        </div>
        {activeTab === 'notes' && <NotesPanel entityType="Phone" entityId={phone.id} canEdit />}
        {activeTab === 'history' && (
          <ItemHistoryBlock key={`${phone.id}-${historyKey}`} url={`/portal/phones/${phone.id}/history`} subtitle={`${phone.brand} ${phone.model}`} />
        )}
        <p className="text-[11px] text-slate-400 mt-3">Aangemaakt op {fmt(phone.createdAt)}</p>
      </div>

      <PhoneModal open={showModal} onClose={() => setShowModal(false)} onSuccess={handleSaved} teammates={teammates} phone={phone} />
      <ReceivePhoneModal open={showReceive} onClose={() => setShowReceive(false)} onSuccess={async () => { setShowReceive(false); await refresh() }} phone={phone} />
      <ConfirmDeleteModal open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={handleDelete} itemName={`${phone.brand} ${phone.model}`} />
      <Modal open={confirmUnlinkSim} onClose={() => setConfirmUnlinkSim(false)} title="Simkaart ontkoppelen" className="max-w-sm">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-3">
            <Unlink size={22} className="text-orange-500" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">{phone.simCardNumber}</h3>
          <p className="text-sm text-slate-500">De simkaart wordt losgekoppeld van deze telefoon.</p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" className="flex-1" onClick={() => setConfirmUnlinkSim(false)}>Annuleren</Button>
          <Button type="button" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white" disabled={unlinkingSim} onClick={handleUnlinkSim}>
            {unlinkingSim ? 'Bezig…' : 'Ontkoppelen'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

// ── TelefonieView ─────────────────────────────────────────────────────────────

export function TelefonieView({ teammates, onExpand, onExpandSimCard, initialTab }: {
  teammates: ClientUserListItem[]
  onExpand?: (phone: PhoneListItem) => void
  onExpandSimCard?: (simCard: SimCardListItem | null, subscription: SubscriptionListItem | null) => void
  initialTab?: TelefonieTab
}) {
  const [tab, setTab] = useState<TelefonieTab>(initialTab ?? 'phones')
  const [totals, setTotals] = useState({ subscriptions: 0, phonesInUse: 0, simCardsInUse: 0 })

  const fetchTotals = useCallback(async () => {
    try {
      const [phoneRes, simRes, subRes] = await Promise.all([
        api.get<PhoneListItem[]>('/portal/phones'),
        api.get<SimCardListItem[]>('/portal/simcards'),
        api.get<SubscriptionListItem[]>('/portal/subscriptions'),
      ])
      setTotals({
        subscriptions: subRes.data.length,
        phonesInUse:   phoneRes.data.filter(p => p.status === 'InUse').length,
        simCardsInUse: simRes.data.filter(s => s.status === 'InUse').length,
      })
    } catch { /* negeer */ }
  }, [])

  useEffect(() => { fetchTotals() }, [fetchTotals])

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="grid grid-cols-3 gap-3 flex-shrink-0">
        <StatCard label="Telefoons in gebruik"  value={totals.phonesInUse}   icon={<PhoneIcon size={18} />} tone="emerald" />
        <StatCard label="Abonnementen"           value={totals.subscriptions} icon={<Layers size={18} />}    tone="blue" />
        <StatCard label="Simkaarten in gebruik"  value={totals.simCardsInUse} icon={<Wifi size={18} />}      tone="blue" />
      </div>

      <div className="flex gap-1 flex-shrink-0 bg-slate-100 p-1 rounded-xl w-fit">
        {([
          { key: 'phones',        label: 'Mobiele Telefoons' },
          { key: 'simcards',      label: 'Abonnementen' },
        ] as { key: TelefonieTab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'phones'        && <PhonesTab teammates={teammates} onExpand={onExpand} />}
      {tab === 'simcards'      && <SimCardsTab teammates={teammates} onExpand={onExpandSimCard} />}
    </div>
  )
}

// ── SimCardDetailFullView ─────────────────────────────────────────────────────

export function SimCardDetailFullView({ initialSimCard, initialSubscription, teammates, onBack, onDeleted, backLabel = 'Terug naar telefonie' }: {
  initialSimCard: SimCardListItem | null
  initialSubscription: SubscriptionListItem | null
  teammates: ClientUserListItem[]
  onBack: () => void
  onDeleted: () => void
  backLabel?: string
}) {
  const [simCard, setSimCard]           = useState<SimCardListItem | null>(initialSimCard)
  const [subscription, setSubscription] = useState<SubscriptionListItem | null>(initialSubscription)
  const [phones, setPhones]             = useState<PhoneListItem[]>([])
  const [showModal, setShowModal]       = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [historyKey, setHistoryKey]     = useState(0)
  const [activeTab, setActiveTab]       = useState<'notes' | 'history'>('notes')

  const refresh = async () => {
    const [simRes, phoneRes, subRes] = await Promise.all([
      api.get<SimCardListItem[]>('/portal/simcards'),
      api.get<PhoneListItem[]>('/portal/phones'),
      api.get<SubscriptionListItem[]>('/portal/subscriptions'),
    ])
    setPhones(phoneRes.data)

    // Welke van de twee de stabiele "anker" is, hangt af van waarmee dit scherm is geopend —
    // een losstaand abonnement (nog) zonder simkaart heeft geen SimCard-rij om op te zoeken.
    if (simCard) {
      setSimCard(simRes.data.find(s => s.id === simCard.id) ?? null)
      setSubscription(subRes.data.find(s => s.simCardId === simCard.id) ?? null)
    } else if (subscription) {
      const updatedSub = subRes.data.find(s => s.id === subscription.id) ?? null
      setSubscription(updatedSub)
      setSimCard(updatedSub?.simCardId ? (simRes.data.find(s => s.id === updatedSub.simCardId) ?? null) : null)
    }
    setHistoryKey(k => k + 1)
  }

  useEffect(() => { refresh() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async () => {
    if (simCard) {
      await api.delete(`/portal/simcards/${simCard.id}`)
    } else if (subscription) {
      await api.delete(`/portal/subscriptions/${subscription.id}`)
    }
    onDeleted()
  }

  const handleSaved = async () => { setShowModal(false); await refresh() }

  function fmtCost(cost: number | null) {
    if (cost == null) return '—'
    return `€ ${cost.toFixed(2)}`
  }

  const title    = subscription?.name || simCard?.kaartNummer || '—'
  const subtitle = subscription?.name
    ? (simCard?.kaartNummer || 'Geen simkaart gekoppeld')
    : (simCard?.phoneNumber || 'Op voorraad')

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Back */}
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft size={15} /> {backLabel}
        </button>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 truncate tabular-nums">{title}</h1>
            <p className="text-sm text-slate-400 mt-0.5 truncate">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <Pencil size={12} /> Wijzigen
            </button>
            <button onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
              <Trash2 size={12} /> Verwijderen
            </button>
          </div>
        </div>
      </div>

      {/* Details + Abonnement */}
      <div className="grid grid-cols-[1fr_360px] gap-4 items-stretch">
        {/* Simkaart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Simkaart</h3>
          {simCard ? (
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Type</p>
                <p className="text-sm font-medium text-slate-800">{SIM_TYPE_LABEL[simCard.type] ?? simCard.type}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Status</p>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${SIM_STATUS_TONE[simCard.status] ?? 'bg-slate-100 text-slate-600'}`}>
                  {SIM_STATUS_LABEL[simCard.status] ?? simCard.status}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Telefoonnummer</p>
                <p className="text-sm font-medium text-slate-800 tabular-nums">{simCard.phoneNumber || '—'}</p>
              </div>
              {simCard.phoneName && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Gekoppelde telefoon</p>
                  <p className="text-sm font-medium text-slate-800 truncate">{simCard.phoneName}</p>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="w-full flex items-center justify-between gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-left hover:border-blue-400 hover:bg-blue-50/40 transition-colors"
            >
              <span className="text-sm text-slate-400">Nog geen simkaart gekoppeld</span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white">
                <Plus size={11} /> Toevoegen
              </span>
            </button>
          )}
        </div>

        {/* Abonnement */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 h-full flex flex-col">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Abonnement</h3>
          {subscription ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-800 truncate">{subscription.name}</p>
                {subscription.status === 'Incomplete' && (
                  <span title="Prijs nog niet ingevuld" className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${SUB_STATUS_TONE.Incomplete}`}>
                    Nog af te maken
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Provider</p>
                  <p className="text-sm font-medium text-slate-800">{subscription.provider || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Type</p>
                  <p className="text-sm font-medium text-slate-800">{SUB_TYPE_LABEL[subscription.type] ?? subscription.type}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Kosten / mnd</p>
                <p className="text-sm font-medium text-slate-800">{fmtCost(subscription.monthlyCost)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Status</p>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${SUB_STATUS_TONE[subscription.status] ?? 'bg-slate-100 text-slate-500'}`}>
                  {SUB_STATUS_LABEL[subscription.status] ?? subscription.status}
                </span>
              </div>
              {subscription.assignedToName && (
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Toegewezen aan</p>
                  <p className="text-sm font-medium text-slate-800">{subscription.assignedToName}</p>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="flex-1 flex flex-col items-center justify-center gap-3 text-center rounded-xl border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/40 transition-colors"
            >
              <p className="text-sm text-slate-400">Nog geen abonnement — simkaart in voorraad</p>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white">
                <Plus size={11} /> Toevoegen
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Notes / History */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center gap-1 mb-4 border-b border-slate-100 -mx-5 px-5 pb-3">
          <button onClick={() => setActiveTab('notes')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notes' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
            <StickyNote size={13} /> Notities
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
            <History size={13} /> Historie
          </button>
        </div>
        {simCard ? (
          <>
            {activeTab === 'notes' && <NotesPanel entityType="SimCard" entityId={simCard.id} canEdit />}
            {activeTab === 'history' && (
              <ItemHistoryBlock key={`${simCard.id}-${historyKey}`} url={`/portal/simcards/${simCard.id}/history`} subtitle={simCard.kaartNummer} />
            )}
          </>
        ) : (
          <p className="text-sm text-slate-400">Notities en historie zijn beschikbaar zodra er een simkaart gekoppeld is.</p>
        )}
        <p className="text-[11px] text-slate-400 mt-3">Aangemaakt op {fmt(simCard?.createdAt ?? subscription?.createdAt ?? '')}</p>
      </div>

      <SimCardModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSaved}
        teammates={teammates}
        phones={phones}
        simCard={simCard}
        subscription={subscription}
      />
      <ConfirmDeleteModal open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={handleDelete} itemName={simCard?.kaartNummer ?? subscription?.name ?? ''} />
    </div>
  )
}
