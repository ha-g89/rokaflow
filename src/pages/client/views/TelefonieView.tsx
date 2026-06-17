import { useState, useEffect, useCallback } from 'react'
import { Phone as PhoneIcon, Layers, CreditCard, Wifi, Search, Plus, Pencil, Trash2, XCircle, StickyNote, History, Maximize2, ArrowLeft, User, Link2Off } from 'lucide-react'
import api from '@/lib/axios'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatCard } from '@/components/portal/PortalUI'
import { ItemHistoryBlock } from '@/components/portal/AuditHistory'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { PhoneModal } from '@/components/PhoneModal'
import { PhoneSetupWizard } from '@/components/PhoneSetupWizard'
import { SimCardModal } from '@/components/SimCardModal'
import { SubscriptionModal } from '@/components/SubscriptionModal'
import { NotesPanel } from '@/components/NotesPanel'
import type { PhoneListItem } from '@/types/phone'
import { PHONE_STATUS_LABEL, PHONE_STATUS_TONE } from '@/types/phone'
import type { SimCardListItem } from '@/types/simcard'
import { SIM_STATUS_LABEL, SIM_STATUS_TONE, SIM_TYPE_LABEL } from '@/types/simcard'
import type { SubscriptionListItem } from '@/types/subscription'
import { SUB_STATUS_LABEL, SUB_STATUS_TONE, SUB_TYPE_LABEL } from '@/types/subscription'
import type { ClientUserListItem } from '@/types/clientUser'

type TelefonieTab = 'phones' | 'simcards' | 'subscriptions'

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
  const [confirmUnlink, setConfirmUnlink]   = useState(false)
  const [unlinking, setUnlinking]           = useState(false)

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

  const filtered = phones.filter(p =>
    `${p.brand} ${p.model} ${p.serialNumber} ${p.imeiNumber} ${p.assignedToName ?? ''}`
      .toLowerCase().includes(search.toLowerCase())
  )

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
        status: 0, assignedToUserId: null,
        issuedAt: p.issuedAt ?? null, returnedAt: new Date().toISOString(),
      })
      await fetchPhones()
      setHistoryKey(k => k + 1)
    } finally { setUnlinking(false); setConfirmUnlink(false) }
  }

  const handleUnlinkSim = async (phoneId: string) => {
    const { data } = await api.delete<PhoneListItem>(`/portal/phones/${phoneId}/simcard`)
    setPhones(prev => prev.map(p => p.id === phoneId ? data : p))
    setSelected(data)
    setHistoryKey(k => k + 1)
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
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-400"
            />
          </div>
          <Button size="sm" onClick={() => { setEditTarget(null); setShowModal(true) }}>
            <Plus size={13} /> Toevoegen
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setShowWizard(true)}>
            <Layers size={13} /> Setup
          </Button>
        </div>
        <div />

        <Card className="overflow-hidden flex flex-col min-h-0">
          <div className="grid grid-cols-[1fr_1.2fr_1.3fr_1fr_1.2fr_1.5fr_1fr_0.9fr] gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex-shrink-0">
            {['Merk', 'Model', 'IMEI-nummer', 'Leverancier', 'Telefoonnummer', 'Toegewezen aan', 'Uitgiftedatum', 'Status'].map(h => (
              <span key={h} className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{h}</span>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-10 text-center text-sm text-slate-400">Laden…</div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center">
                <PhoneIcon size={36} className="mx-auto mb-3 text-slate-200" />
                <p className="text-sm text-slate-400">{search ? 'Geen resultaten.' : 'Nog geen telefoons.'}</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filtered.map(p => (
                  <li
                    key={p.id}
                    onClick={() => { setSelected(p); setConfirmDelete(false); setConfirmUnlink(false) }}
                    className={`grid grid-cols-[1fr_1.2fr_1.3fr_1fr_1.2fr_1.5fr_1fr_0.9fr] gap-3 px-4 py-3 items-center cursor-pointer transition-colors hover:bg-slate-100 ${selected?.id === p.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}
                  >
                    <p className="text-sm font-semibold text-slate-800 truncate">{p.brand}</p>
                    <p className="text-xs text-slate-600 truncate">{p.model || '—'}</p>
                    <p className="text-xs text-slate-600 truncate tabular-nums">{p.imeiNumber || '—'}</p>
                    <p className="text-xs text-slate-600 truncate">{p.supplier || '—'}</p>
                    <p className="text-xs text-slate-600 truncate tabular-nums">{p.simPhoneNumber || '—'}</p>
                    <p className="text-xs text-slate-600 truncate">{p.assignedToName || '—'}</p>
                    <p className="text-xs text-slate-600 truncate tabular-nums">{fmt(p.issuedAt)}</p>
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
                      selected.status === 'Decommissioned' ? 'text-red-500' : 'text-slate-500'
                    }`}>{PHONE_STATUS_LABEL[selected.status] ?? selected.status}</span>
                  </p>
                  {selected.issuedAt && <p><span className="text-slate-400">Uitgiftedatum</span><br /><span className="font-medium text-slate-800">{fmt(selected.issuedAt)}</span></p>}
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
                        onClick={() => handleUnlinkSim(selected.id)}
                        title="Simkaart ontkoppelen"
                        className="flex-shrink-0 text-blue-400 hover:text-red-500 transition-colors"
                      >
                        <XCircle size={15} />
                      </button>
                    </div>
                  </div>
                )}
                <ConfirmDeleteModal
                  open={confirmDelete}
                  onClose={() => setConfirmDelete(false)}
                  onConfirm={() => { setConfirmDelete(false); handleDelete(selected.id) }}
                  itemName={`${selected.brand} ${selected.model}`}
                />
                <ItemHistoryBlock
                  key={`${selected.id}-${historyKey}`}
                  url={`/portal/phones/${selected.id}/history`}
                  subtitle={`${selected.brand} ${selected.model}`}
                />
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
    </div>
  )
}

// ── SimCards tab ──────────────────────────────────────────────────────────────

function SimCardsTab({ teammates }: { teammates: ClientUserListItem[] }) {
  const [simCards, setSimCards]     = useState<SimCardListItem[]>([])
  const [phones, setPhones]         = useState<PhoneListItem[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [selected, setSelected]     = useState<SimCardListItem | null>(null)
  const [showModal, setShowModal]   = useState(false)
  const [editTarget, setEditTarget] = useState<SimCardListItem | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [historyKey, setHistoryKey] = useState(0)

  const fetchData = useCallback(async () => {
    try {
      const [simRes, phoneRes] = await Promise.all([
        api.get<SimCardListItem[]>('/portal/simcards'),
        api.get<PhoneListItem[]>('/portal/phones'),
      ])
      setSimCards(simRes.data)
      setPhones(phoneRes.data)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (selected) {
      const updated = simCards.find(s => s.id === selected.id)
      if (updated) setSelected(updated)
    }
  }, [simCards])

  const filtered = simCards.filter(s =>
    `${s.kaartNummer} ${s.phoneNumber} ${s.provider} ${s.assignedToName ?? ''} ${s.phoneName ?? ''}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    await api.delete(`/portal/simcards/${id}`)
    setSimCards(prev => prev.filter(s => s.id !== id))
    setSelected(null)
    setConfirmDelete(false)
  }

  const handleSaved = async () => { await fetchData(); setShowModal(false); setHistoryKey(k => k + 1) }

  return (
    <div className="grid grid-cols-[1fr_22%] grid-rows-[auto_1fr] gap-x-4 gap-y-3 flex-1 min-h-0">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zoek simkaarten…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-400"
          />
        </div>
        <Button size="sm" onClick={() => { setEditTarget(null); setShowModal(true) }}>
          <Plus size={13} /> Toevoegen
        </Button>
      </div>
      <div />

      <Card className="overflow-hidden flex flex-col min-h-0">
        <div className="grid grid-cols-[1.5fr_1.2fr_1fr_1.5fr_1.3fr_0.9fr] gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex-shrink-0">
          {['Kaartnummer', 'Telefoonnummer', 'Type', 'Toegewezen aan', 'Gekoppelde telefoon', 'Status'].map(h => (
            <span key={h} className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{h}</span>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-10 text-center text-sm text-slate-400">Laden…</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <CreditCard size={36} className="mx-auto mb-3 text-slate-200" />
              <p className="text-sm text-slate-400">{search ? 'Geen resultaten.' : 'Nog geen simkaarten.'}</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map(s => (
                <li
                  key={s.id}
                  onClick={() => { setSelected(s); setConfirmDelete(false) }}
                  className={`grid grid-cols-[1.5fr_1.2fr_1fr_1.5fr_1.3fr_0.9fr] gap-3 px-4 py-3 items-center cursor-pointer transition-colors hover:bg-slate-100 ${selected?.id === s.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}
                >
                  <p className="text-sm font-semibold text-slate-800 truncate tabular-nums">{s.kaartNummer}</p>
                  <p className="text-xs text-slate-600 truncate tabular-nums">{s.phoneNumber || '—'}</p>
                  <p className="text-xs text-slate-600 truncate">{SIM_TYPE_LABEL[s.type] ?? s.type}</p>
                  <p className="text-xs text-slate-600 truncate">{s.assignedToName || '—'}</p>
                  <p className="text-xs text-slate-600 truncate">{s.phoneName || '—'}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium truncate ${SIM_STATUS_TONE[s.status] ?? 'bg-slate-100 text-slate-500'}`}>
                    {SIM_STATUS_LABEL[s.status] ?? s.status}
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
              <div className="flex items-start justify-between mb-4 gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{selected.kaartNummer}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{selected.provider || '—'}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${SIM_STATUS_TONE[selected.status] ?? ''}`}>
                  {SIM_STATUS_LABEL[selected.status] ?? selected.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Type',          value: SIM_TYPE_LABEL[selected.type] ?? selected.type },
                  { label: 'Telefoonnummer', value: selected.phoneNumber || '—' },
                  { label: 'Toegewezen aan', value: selected.assignedToName || '—' },
                ].map(row => (
                  <div key={row.label} className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400 mb-0.5">{row.label}</p>
                    <p className="text-sm font-medium text-slate-800 truncate">{row.value}</p>
                  </div>
                ))}
              </div>
              {selected.phoneName && (
                <div className="mt-3 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5">
                  <p className="text-xs text-blue-400 mb-0.5">Gekoppelde telefoon</p>
                  <p className="text-sm font-medium text-blue-700 truncate">{selected.phoneName}</p>
                </div>
              )}
              {selected.subscriptionName && (
                <div className="mt-2 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5">
                  <p className="text-xs text-blue-400 mb-0.5">Gekoppeld abonnement</p>
                  <p className="text-sm font-medium text-blue-700 truncate">{selected.subscriptionName}</p>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => { setEditTarget(selected); setShowModal(true) }}>
                  <Pencil size={13} /> Wijzigen
                </Button>
                <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
                  <Trash2 size={13} /> Verwijderen
                </Button>
              </div>
              <ConfirmDeleteModal
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={() => { setConfirmDelete(false); handleDelete(selected.id) }}
                itemName={selected.kaartNummer}
              />
              <ItemHistoryBlock
                key={`${selected.id}-${historyKey}`}
                url={`/portal/simcards/${selected.id}/history`}
                subtitle={selected.kaartNummer}
              />
            </CardContent>
          </Card>
        ) : (
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
        simCard={editTarget}
      />
    </div>
  )
}

// ── Subscriptions tab ─────────────────────────────────────────────────────────

function SubscriptionsTab() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionListItem[]>([])
  const [simCards, setSimCards]           = useState<SimCardListItem[]>([])
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState('')
  const [selected, setSelected]           = useState<SubscriptionListItem | null>(null)
  const [showModal, setShowModal]         = useState(false)
  const [editTarget, setEditTarget]       = useState<SubscriptionListItem | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [historyKey, setHistoryKey]       = useState(0)
  const [activeTab, setActiveTab]         = useState<'notes' | 'history'>('notes')

  const fetchData = useCallback(async () => {
    try {
      const [subRes, simRes] = await Promise.all([
        api.get<SubscriptionListItem[]>('/portal/subscriptions'),
        api.get<SimCardListItem[]>('/portal/simcards'),
      ])
      setSubscriptions(subRes.data)
      setSimCards(simRes.data)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (selected) {
      const updated = subscriptions.find(s => s.id === selected.id)
      if (updated) setSelected(updated)
    }
  }, [subscriptions])

  const filtered = subscriptions.filter(s =>
    `${s.name} ${s.provider} ${s.bundle} ${s.simCardNumber ?? ''} ${s.assignedToName ?? ''}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    await api.delete(`/portal/subscriptions/${id}`)
    setSubscriptions(prev => prev.filter(s => s.id !== id))
    setSelected(null)
    setConfirmDelete(false)
  }

  const handleSaved = async () => { await fetchData(); setShowModal(false); setHistoryKey(k => k + 1) }

  function fmtCost(cost: number | null) {
    if (cost == null) return '—'
    return `€ ${cost.toFixed(2)}`
  }

  return (
    <div className="grid grid-cols-[1fr_22%] grid-rows-[auto_1fr] gap-x-4 gap-y-3 flex-1 min-h-0">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zoek abonnementen…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-400"
          />
        </div>
        <Button size="sm" onClick={() => { setEditTarget(null); setShowModal(true) }}>
          <Plus size={13} /> Toevoegen
        </Button>
      </div>
      <div />

      <Card className="overflow-hidden flex flex-col min-h-0">
        <div className="grid grid-cols-[1.2fr_2fr_1fr_1fr_1fr_1.5fr_1.3fr_0.9fr] gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex-shrink-0">
          {['Provider', 'Naam', 'Type', 'Kosten/mnd', 'Leverancier', 'Toegewezen aan', 'Simkaart', 'Status'].map(h => (
            <span key={h} className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{h}</span>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-10 text-center text-sm text-slate-400">Laden…</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <Layers size={36} className="mx-auto mb-3 text-slate-200" />
              <p className="text-sm text-slate-400">{search ? 'Geen resultaten.' : 'Nog geen abonnementen.'}</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map(s => (
                <li
                  key={s.id}
                  onClick={() => { setSelected(s); setConfirmDelete(false) }}
                  className={`grid grid-cols-[1.2fr_2fr_1fr_1fr_1fr_1.5fr_1.3fr_0.9fr] gap-3 px-4 py-3 items-center cursor-pointer transition-colors hover:bg-slate-100 ${selected?.id === s.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}
                >
                  <p className="text-sm font-semibold text-slate-800 truncate">{s.provider || '—'}</p>
                  <p className="text-xs text-slate-600 truncate">{s.name}</p>
                  <p className="text-xs text-slate-600 truncate">{SUB_TYPE_LABEL[s.type] ?? s.type}</p>
                  <p className="text-xs text-slate-600 truncate tabular-nums">{s.monthlyCost != null ? `€${s.monthlyCost.toFixed(2)}` : '—'}</p>
                  <p className="text-xs text-slate-600 truncate">{s.supplier || '—'}</p>
                  <p className="text-xs text-slate-600 truncate">{s.assignedToName || '—'}</p>
                  <p className="text-xs text-slate-600 truncate tabular-nums">{s.simPhoneNumber || s.simCardNumber || '—'}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium truncate ${SUB_STATUS_TONE[s.status] ?? 'bg-slate-100 text-slate-500'}`}>
                    {SUB_STATUS_LABEL[s.status] ?? s.status}
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
              <div className="flex items-start justify-between mb-4 gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{selected.name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{selected.provider || '—'}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${SUB_STATUS_TONE[selected.status] ?? ''}`}>
                  {SUB_STATUS_LABEL[selected.status] ?? selected.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Type',         value: SUB_TYPE_LABEL[selected.type] ?? selected.type },
                  { label: 'Bundel',       value: selected.bundle || '—' },
                  { label: 'Maandelijks',  value: fmtCost(selected.monthlyCost) },
                  { label: 'Leverancier',  value: selected.supplier || '—' },
                  { label: 'Toegewezen aan', value: selected.assignedToName || '—' },
                  { label: 'Locatie',      value: selected.location || '—' },
                  { label: 'Startdatum',   value: fmt(selected.startsAt) },
                  { label: 'Einddatum',    value: fmt(selected.expiresAt) },
                ].map(row => (
                  <div key={row.label} className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400 mb-0.5">{row.label}</p>
                    <p className="text-sm font-medium text-slate-800 truncate">{row.value}</p>
                  </div>
                ))}
              </div>
              {selected.simCardNumber && (
                <div className="mt-3 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5">
                  <p className="text-xs text-blue-400 mb-0.5">Gekoppelde simkaart</p>
                  <p className="text-sm font-medium text-blue-700 truncate">
                    {selected.simCardNumber}{selected.simPhoneNumber ? ` · ${selected.simPhoneNumber}` : ''}
                  </p>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => { setEditTarget(selected); setShowModal(true) }}>
                  <Pencil size={13} /> Wijzigen
                </Button>
                <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
                  <Trash2 size={13} /> Verwijderen
                </Button>
              </div>
              <ConfirmDeleteModal
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={() => { setConfirmDelete(false); handleDelete(selected.id) }}
                itemName={selected.name}
              />
              <div className="mt-4 border-t border-slate-100 dark:border-slate-700 pt-4">
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
                  <NotesPanel entityType="Subscription" entityId={selected.id} />
                )}
                {activeTab === 'history' && (
                  <ItemHistoryBlock
                    key={`${selected.id}-${historyKey}`}
                    url={`/portal/subscriptions/${selected.id}/history`}
                    subtitle={selected.name}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Layers size={28} className="text-slate-300" />
              </div>
              <p className="text-sm text-slate-400">Selecteer een abonnement</p>
            </div>
          </div>
        )}
      </div>

      <SubscriptionModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSaved}
        simCards={simCards.filter(s =>
          !subscriptions.some(sub => sub.simCardId === s.id && sub.id !== editTarget?.id)
        )}
        subscription={editTarget}
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
  const [confirmUnlink, setConfirmUnlink] = useState(false)
  const [unlinking, setUnlinking]       = useState(false)
  const [showLinking, setShowLinking]   = useState(false)
  const [linkUserId, setLinkUserId]     = useState('')
  const [linking, setLinking]           = useState(false)
  const [historyKey, setHistoryKey]     = useState(0)
  const [activeTab, setActiveTab]       = useState<'notes' | 'history'>('notes')

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
        status: 0, assignedToUserId: null,
        issuedAt: phone.issuedAt ?? null, returnedAt: new Date().toISOString(),
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
        status: 1, assignedToUserId: linkUserId,
        issuedAt: new Date().toISOString(), returnedAt: null,
      })
      await refresh()
    } finally { setLinking(false); setShowLinking(false); setLinkUserId('') }
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
            {phone.issuedAt && (
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Uitgiftedatum</p>
                <p className="text-sm font-medium text-slate-800">{fmt(phone.issuedAt)}</p>
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
          {phone.simCardNumber && (
            <div className="mt-4 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
              <p className="text-xs text-blue-400 mb-0.5">Gekoppelde simkaart</p>
              <p className="text-sm font-medium text-blue-700">
                {phone.simCardNumber}{phone.simPhoneNumber ? ` · ${phone.simPhoneNumber}` : ''}
              </p>
            </div>
          )}
        </div>

        {/* Toewijzing */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 h-full flex flex-col">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Toewijzing</h3>
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
                      {phone.issuedAt && <p className="text-xs text-slate-400 mt-0.5">Uitgegeven {fmt(phone.issuedAt)}</p>}
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
              <select value={linkUserId} onChange={e => setLinkUserId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400">
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
      </div>

      <PhoneModal open={showModal} onClose={() => setShowModal(false)} onSuccess={handleSaved} teammates={teammates} phone={phone} />
      <ConfirmDeleteModal open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={handleDelete} itemName={`${phone.brand} ${phone.model}`} />
    </div>
  )
}

// ── TelefonieView ─────────────────────────────────────────────────────────────

export function TelefonieView({ teammates, onExpand }: { teammates: ClientUserListItem[]; onExpand?: (phone: PhoneListItem) => void }) {
  const [tab, setTab] = useState<TelefonieTab>('phones')
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
          { key: 'subscriptions', label: 'Abonnementen' },
          { key: 'simcards',      label: 'Simkaarten' },
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
      {tab === 'subscriptions' && <SubscriptionsTab />}
      {tab === 'simcards'      && <SimCardsTab teammates={teammates} />}
    </div>
  )
}
