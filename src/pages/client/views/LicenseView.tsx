import { FilterSelect } from '@/components/ui/FilterSelect'
import { useSort, SortHeader } from '@/components/ui/SortHeader'
import { useState, useEffect, useCallback } from 'react'
import { CreditCard, Search, Plus, CheckCircle2, Clock, Users, Pencil, Trash2, StickyNote, History, Maximize2, ArrowLeft } from 'lucide-react'
import api from '@/lib/axios'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { StatCard } from '@/components/portal/PortalUI'
import { HistoryBlock, licenseAuditLabel, licenseDescriptionFn } from '@/components/portal/AuditHistory'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { LicenseModal } from '@/components/LicenseModal'
import { NotesPanel } from '@/components/NotesPanel'
import type { LicenseListItem } from '@/types/license'
import { LICENSE_TYPE_LABEL, LICENSE_TYPE_TONE } from '@/types/license'
import type { ClientUserListItem } from '@/types/clientUser'

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function daysUntil(d: string | null | undefined): number | null {
  if (!d) return null
  const diff = new Date(d).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)
  return Math.ceil(diff / 86_400_000)
}

// ── LicenseUsersSection — gedeeld tussen klein paneel en volledige weergave ────

function LicenseUsersSection({ license, teammates, onAssign, onRevoke }: {
  license: LicenseListItem
  teammates: ClientUserListItem[]
  onAssign: (userId: string) => void
  onRevoke: (userId: string) => void
}) {
  const [assignUserId, setAssignUserId] = useState('')
  const assignableUsers = teammates.filter(t => !license.users.some(u => u.userId === t.id))
  const isUnlimited     = license.maxUsers === 0
  const seatsLeft       = isUnlimited ? null : license.maxUsers - license.assignedUsers

  return (
    <div className="space-y-4">
      {(seatsLeft === null || seatsLeft > 0) && assignableUsers.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Gebruiker toewijzen</p>
          <div className="flex gap-2">
            <select
              value={assignUserId}
              onChange={e => setAssignUserId(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25"
            >
              <option value="">— Selecteer medewerker —</option>
              {assignableUsers.map(u => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
            <Button
              size="sm"
              disabled={!assignUserId}
              onClick={() => { if (assignUserId) { onAssign(assignUserId); setAssignUserId('') } }}
            >
              <Plus size={13} /> Toewijzen
            </Button>
          </div>
        </div>
      )}

      {license.users.length > 0 ? (
        <div>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Toegewezen gebruikers ({license.users.length})</p>
          <ul className="space-y-1.5">
            {license.users.map(u => (
              <li key={u.userLicenseId} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-700/50 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{u.fullName}</p>
                  <p className="text-xs text-slate-400 truncate">{u.email}</p>
                </div>
                <button
                  onClick={() => onRevoke(u.userId)}
                  className="ml-2 flex-shrink-0 text-xs text-red-600 hover:text-red-800 dark:text-red-400 font-medium"
                >
                  Intrekken
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-slate-400">Nog geen gebruikers toegewezen.</p>
      )}
    </div>
  )
}

export function LicenseDetailPanel({ license, teammates, onEdit, onDelete, onAssign, onRevoke, onExpand }: {
  license: LicenseListItem
  teammates: ClientUserListItem[]
  onEdit: () => void
  onDelete: () => void
  onAssign: (userId: string) => void
  onRevoke: (userId: string) => void
  onExpand: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [activeTab, setActiveTab]         = useState<'notes' | 'history'>('notes')

  const isUnlimited = license.maxUsers === 0
  const isExpired   = license.expiresAt ? new Date(license.expiresAt) < new Date() : false

  return (
    <Card className="overflow-hidden">
      <div className="px-5 pt-4 pb-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate mb-0.5">{license.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{license.vendor || '—'}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium mr-1 ${LICENSE_TYPE_TONE[license.type] ?? 'bg-slate-100 text-slate-600'}`}>
              {LICENSE_TYPE_LABEL[license.type] ?? license.type}
            </span>
            <button onClick={onEdit} title="Wijzigen" className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
              <Pencil size={13} />
            </button>
            <button onClick={() => setConfirmDelete(true)} title="Verwijderen" className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 size={13} />
            </button>
            <button onClick={onExpand} title="Volledig openen" className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <Maximize2 size={13} />
            </button>
          </div>
        </div>
        {(!license.isActive || isExpired) && (
          <div className="flex gap-1.5 mt-2">
            {!license.isActive && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Inactief</span>
            )}
            {isExpired && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Verlopen</span>
            )}
          </div>
        )}
      </div>

      <CardContent className="p-5 space-y-5">
        {/* Seats bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Gebruikers</span>
            {isUnlimited
              ? <span className="font-semibold">{license.assignedUsers} <span className="font-normal text-slate-400">/ onbeperkt</span></span>
              : <span className="font-semibold">{license.assignedUsers} / {license.maxUsers}</span>
            }
          </div>
          {!isUnlimited && (
            <div className="h-2 rounded-full bg-slate-200">
              <div
                className={`h-2 rounded-full transition-all ${license.assignedUsers >= license.maxUsers ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(100, (license.assignedUsers / license.maxUsers) * 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-400 mb-0.5">Startdatum</p>
            <p className="text-sm font-medium text-slate-800">{fmtDate(license.startsAt)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-400 mb-0.5">Vervaldatum</p>
            <p className={`text-sm font-medium ${isExpired ? 'text-red-600 dark:text-red-400' : 'text-slate-800'}`}>{fmtDate(license.expiresAt)}</p>
            {license.expiresAt && (() => {
              const days = daysUntil(license.expiresAt)
              if (days === null) return null
              const soon = days >= 0 && days <= 30
              return (
                <p className={`text-xs mt-0.5 ${days < 0 ? 'text-red-500' : soon ? 'text-amber-500' : 'text-slate-400'}`}>
                  {days < 0
                    ? `Verlopen (${Math.abs(days)} dagen geleden)`
                    : days === 0 ? 'Verloopt vandaag'
                    : `Nog ${days} dag${days === 1 ? '' : 'en'}`}
                </p>
              )
            })()}
          </div>
          {license.supplier && (
            <div className="rounded-xl bg-slate-50 p-3 col-span-2">
              <p className="text-xs text-slate-400 mb-0.5">Leverancier</p>
              <p className="text-sm font-medium text-slate-800">{license.supplier}</p>
            </div>
          )}
        </div>

        <LicenseUsersSection license={license} teammates={teammates} onAssign={onAssign} onRevoke={onRevoke} />

        <ConfirmDeleteModal
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => { setConfirmDelete(false); onDelete() }}
          itemName={license.name}
        />

        {/* Notities / Historie tabs */}
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
            <NotesPanel entityType="License" entityId={license.id} />
          )}
          {activeTab === 'history' && (
            <HistoryBlock entityType="License" entityId={license.id} labelFn={licenseAuditLabel} descriptionFn={licenseDescriptionFn} />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ── LicenseDetailFullView ────────────────────────────────────────────────────

export function LicenseDetailFullView({ initialLicense, teammates, onBack, onDeleted, backLabel = 'Terug naar licenties' }: {
  initialLicense: LicenseListItem
  teammates: ClientUserListItem[]
  onBack: () => void
  onDeleted: () => void
  backLabel?: string
}) {
  const [license, setLicense]       = useState<LicenseListItem>(initialLicense)
  const [showModal, setShowModal]   = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [activeTab, setActiveTab]   = useState<'notes' | 'history'>('notes')

  const isUnlimited = license.maxUsers === 0
  const isExpired   = license.expiresAt ? new Date(license.expiresAt) < new Date() : false

  const refresh = async () => {
    const { data } = await api.get<LicenseListItem[]>('/portal/licenses')
    const updated = data.find(l => l.id === license.id)
    if (updated) setLicense(updated)
  }

  const handleAssign = async (userId: string) => {
    await api.post(`/portal/licenses/${license.id}/assign`, { userId })
    await refresh()
  }

  const handleRevoke = async (userId: string) => {
    await api.delete(`/portal/licenses/${license.id}/users/${userId}`)
    await refresh()
  }

  const handleDelete = async () => {
    await api.delete(`/portal/licenses/${license.id}`)
    onDeleted()
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
          <ArrowLeft size={15} />
          {backLabel}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
        <Card>
          <div className="px-6 pt-5 pb-5">
            <div className="flex justify-end gap-1 mb-3">
              <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <Pencil size={12} /> Wijzigen
              </button>
              <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <Trash2 size={12} /> Verwijderen
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{license.name}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${LICENSE_TYPE_TONE[license.type] ?? 'bg-slate-100 text-slate-600'}`}>
                {LICENSE_TYPE_LABEL[license.type] ?? license.type}
              </span>
              {!license.isActive && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Inactief</span>
              )}
              {isExpired && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Verlopen</span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{license.vendor || '—'}</p>
          </div>
        </Card>

        <div className="grid grid-cols-[1fr_360px] gap-4 items-start">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Details</h3>
              <div className="mb-5">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Gebruikers</span>
                  {isUnlimited
                    ? <span className="font-semibold">{license.assignedUsers} <span className="font-normal text-slate-400">/ onbeperkt</span></span>
                    : <span className="font-semibold">{license.assignedUsers} / {license.maxUsers}</span>
                  }
                </div>
                {!isUnlimited && (
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-600">
                    <div
                      className={`h-2 rounded-full transition-all ${license.assignedUsers >= license.maxUsers ? 'bg-red-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(100, (license.assignedUsers / license.maxUsers) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Startdatum</p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{fmtDate(license.startsAt)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Vervaldatum</p>
                  <p className={`text-sm font-medium ${isExpired ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'}`}>{fmtDate(license.expiresAt)}</p>
                  {license.expiresAt && (() => {
                    const days = daysUntil(license.expiresAt)
                    if (days === null) return null
                    const soon = days >= 0 && days <= 30
                    return (
                      <p className={`text-xs mt-0.5 ${days < 0 ? 'text-red-500' : soon ? 'text-amber-500' : 'text-slate-400'}`}>
                        {days < 0
                          ? `Verlopen (${Math.abs(days)} dagen geleden)`
                          : days === 0 ? 'Verloopt vandaag'
                          : `Nog ${days} dag${days === 1 ? '' : 'en'}`}
                      </p>
                    )
                  })()}
                </div>
                {license.supplier && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Leverancier</p>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{license.supplier}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardContent className="p-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Gebruikers</h3>
              <LicenseUsersSection license={license} teammates={teammates} onAssign={handleAssign} onRevoke={handleRevoke} />
            </CardContent>
          </Card>
        </div>

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
            {activeTab === 'notes' && <NotesPanel entityType="License" entityId={license.id} />}
            {activeTab === 'history' && (
              <HistoryBlock entityType="License" entityId={license.id} labelFn={licenseAuditLabel} descriptionFn={licenseDescriptionFn} />
            )}
          </CardContent>
        </Card>
      </div>

      <LicenseModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={async () => { setShowModal(false); await refresh() }}
        teammates={teammates}
        license={license}
      />

      <ConfirmDeleteModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => { setConfirmDelete(false); handleDelete() }}
        itemName={license.name}
      />
    </div>
  )
}

export function LicenseView({ teammates, tabBar, onExpand }: { teammates: ClientUserListItem[]; tabBar?: React.ReactNode; onExpand?: (item: LicenseListItem) => void }) {
  const [licenses, setLicenses]     = useState<LicenseListItem[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [selected, setSelected]     = useState<LicenseListItem | null>(null)
  const [showModal, setShowModal]   = useState(false)
  const [editTarget, setEditTarget] = useState<LicenseListItem | null>(null)

  const fetchLicenses = useCallback(async () => {
    try {
      const { data } = await api.get<LicenseListItem[]>('/portal/licenses')
      setLicenses(data)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchLicenses() }, [fetchLicenses])

  useEffect(() => {
    if (selected) {
      const updated = licenses.find(l => l.id === selected.id)
      if (updated) setSelected(updated)
    }
  }, [licenses])

  const [statusFilter, setStatusFilter] = useState('')

  const filtered = licenses.filter(l => {
    if (statusFilter) {
      const verlopen = !!l.expiresAt && new Date(l.expiresAt) < new Date()
      const st = verlopen ? 'verlopen' : l.isActive ? 'actief' : 'inactief'
      if (st !== statusFilter) return false
    }
    return `${l.name} ${l.vendor} ${l.type}`.toLowerCase().includes(search.toLowerCase())
  })

  const { sorted, sortKey, sortDir, toggleSort } = useSort(filtered, {
    naam:        l => l.name,
    leverancier: l => l.supplier || null,
    seats:       l => l.maxUsers === 0 ? -1 : (l.maxUsers ? l.assignedUsers / l.maxUsers : 0),
    beschikbaar: l => l.maxUsers === 0 ? Number.MAX_SAFE_INTEGER : l.maxUsers - l.assignedUsers,
    vervaldatum: l => l.expiresAt || null,
    status:      l => (l.expiresAt && new Date(l.expiresAt) < new Date()) ? 2 : (l.isActive ? 0 : 1),
  })

  const totaal      = licenses.length
  const actief      = licenses.filter(l => l.isActive).length
  const verlopen    = licenses.filter(l => l.expiresAt && new Date(l.expiresAt) < new Date()).length
  const beschikbaar = licenses.reduce((sum, l) => l.maxUsers === 0 ? sum : sum + Math.max(0, l.maxUsers - l.assignedUsers), 0)

  const handleDelete = async (id: string) => {
    await api.delete(`/portal/licenses/${id}`)
    setLicenses(prev => prev.filter(l => l.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const handleAssign = async (licenseId: string, userId: string) => {
    await api.post(`/portal/licenses/${licenseId}/assign`, { userId })
    await fetchLicenses()
  }

  const handleRevoke = async (licenseId: string, userId: string) => {
    await api.delete(`/portal/licenses/${licenseId}/users/${userId}`)
    await fetchLicenses()
  }

  const handleOpenAdd  = () => { setEditTarget(null); setShowModal(true) }
  const handleOpenEdit = (l: LicenseListItem) => { setEditTarget(l); setShowModal(true) }
  const handleSaved    = async () => { await fetchLicenses(); setShowModal(false) }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="grid grid-cols-4 gap-3 flex-shrink-0">
        <StatCard label="Totaal"             value={totaal}      icon={<CreditCard size={18} />} />
        <StatCard label="Actief"             value={actief}      icon={<CheckCircle2 size={18} />} tone="emerald" />
        <StatCard label="Verlopen"           value={verlopen}    icon={<Clock size={18} />}        tone="amber" />
        <StatCard label="Seats beschikbaar"  value={beschikbaar} icon={<Users size={18} />}        tone="blue" />
      </div>

      {tabBar}

      <div className="grid grid-cols-[1fr_20%] grid-rows-[auto_1fr] gap-x-4 gap-y-3 flex-1 min-h-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Zoek licenties…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-400 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25"
            />
          </div>
          <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter}
            options={[
              { value: 'actief', label: 'Actief' },
              { value: 'verlopen', label: 'Verlopen' },
              { value: 'inactief', label: 'Inactief' },
            ]} />
          <Button size="sm" className="py-2" onClick={handleOpenAdd}>
            <Plus size={13} /> Toevoegen
          </Button>
        </div>
        <div />

        <Card className="overflow-hidden flex flex-col min-h-0">
          <div className="grid grid-cols-[2fr_1fr_1.5fr_0.8fr_1fr_0.7fr] gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex-shrink-0">
            {([
              { label: 'Naam', key: 'naam' },
              { label: 'Leverancier', key: 'leverancier' },
              { label: 'Seats', key: 'seats' },
              { label: 'Beschikbaar', key: 'beschikbaar' },
              { label: 'Vervaldatum', key: 'vervaldatum' },
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
                <CreditCard size={36} className="mx-auto mb-3 text-slate-200" />
                <p className="text-sm text-slate-400">
                  {search ? 'Geen resultaten gevonden.' : 'Nog geen licenties toegevoegd.'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {sorted.map(l => {
                  const isExpired   = l.expiresAt ? new Date(l.expiresAt) < new Date() : false
                  const isUnlimited = l.maxUsers === 0
                  const seatsLeft   = isUnlimited ? null : l.maxUsers - l.assignedUsers
                  const pct         = isUnlimited ? 0 : Math.min(100, (l.assignedUsers / l.maxUsers) * 100)
                  const barColor    = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-emerald-500'
                  return (
                    <li
                      key={l.id}
                      onClick={() => setSelected(l)}
                      className={`grid grid-cols-[2fr_1fr_1.5fr_0.8fr_1fr_0.7fr] gap-3 px-4 py-3 items-center cursor-pointer transition-colors hover:bg-slate-100 ${
                        selected?.id === l.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{l.name}</p>
                        <p className="text-xs text-slate-400 truncate">{l.vendor || '—'}</p>
                      </div>
                      <p className="text-xs text-slate-600 truncate">{l.supplier || '—'}</p>
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isUnlimited ? (
                          <span className="text-xs text-emerald-600 font-medium">Onbeperkt</span>
                        ) : (
                          <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                            <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                          </div>
                        )}
                      </div>
                      <p className={`text-xs tabular-nums font-medium ${seatsLeft === 0 ? 'text-red-600' : 'text-slate-700'}`}>
                        {isUnlimited ? `${l.assignedUsers} / ∞` : `${seatsLeft} / ${l.maxUsers}`}
                      </p>
                      <p className={`text-xs tabular-nums ${isExpired ? 'text-red-500' : 'text-slate-500'}`}>
                        {l.expiresAt
                          ? new Date(l.expiresAt).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
                          : '—'}
                      </p>
                      {!l.isActive
                        ? <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-medium w-fit">Inactief</span>
                        : isExpired
                          ? <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium w-fit">Verlopen</span>
                          : <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium w-fit">Actief</span>
                      }
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </Card>

        <div className="min-h-0 overflow-y-auto">
          {selected ? (
            <LicenseDetailPanel
              license={selected}
              teammates={teammates}
              onEdit={() => handleOpenEdit(selected)}
              onDelete={() => handleDelete(selected.id)}
              onAssign={userId => handleAssign(selected.id, userId)}
              onRevoke={userId => handleRevoke(selected.id, userId)}
              onExpand={() => onExpand?.(selected)}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <CreditCard size={28} className="text-slate-300" />
                </div>
                <p className="text-sm text-slate-400">Selecteer een licentie</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <LicenseModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSaved}
        teammates={teammates}
        license={editTarget}
      />
    </div>
  )
}
