import { useState, useEffect, useCallback } from 'react'
import { CreditCard, Search, Plus, CheckCircle2, Clock, Users, Pencil, Trash2, StickyNote, History } from 'lucide-react'
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

export function LicenseDetailPanel({ license, teammates, onEdit, onDelete, onAssign, onRevoke }: {
  license: LicenseListItem
  teammates: ClientUserListItem[]
  onEdit: () => void
  onDelete: () => void
  onAssign: (userId: string) => void
  onRevoke: (userId: string) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [assignUserId, setAssignUserId]   = useState('')
  const [activeTab, setActiveTab]         = useState<'notes' | 'history'>('notes')

  const assignableUsers = teammates.filter(t => !license.users.some(u => u.userId === t.id))
  const isUnlimited     = license.maxUsers === 0
  const seatsLeft       = isUnlimited ? null : license.maxUsers - license.assignedUsers
  const isExpired       = license.expiresAt ? new Date(license.expiresAt) < new Date() : false

  return (
    <Card>
      <CardContent className="p-5 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">{license.name}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{license.vendor || '—'}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
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
        </div>

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

        {/* Assign user */}
        {(seatsLeft === null || seatsLeft > 0) && assignableUsers.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1.5">Gebruiker toewijzen</p>
            <div className="flex gap-2">
              <select
                value={assignUserId}
                onChange={e => setAssignUserId(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
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

        {/* Assigned users */}
        {license.users.length > 0 ? (
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1.5">Toegewezen gebruikers ({license.users.length})</p>
            <ul className="space-y-1.5">
              {license.users.map(u => (
                <li key={u.userLicenseId} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{u.fullName}</p>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                  </div>
                  <button
                    onClick={() => onRevoke(u.userId)}
                    className="ml-2 flex-shrink-0 text-xs text-red-600 hover:text-red-800 font-medium"
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

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-1">
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

export function LicenseView({ teammates, tabBar }: { teammates: ClientUserListItem[], tabBar?: React.ReactNode }) {
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

  const filtered = licenses.filter(l =>
    `${l.name} ${l.vendor} ${l.type}`.toLowerCase().includes(search.toLowerCase())
  )

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
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-400"
            />
          </div>
          <Button size="sm" onClick={handleOpenAdd}>
            <Plus size={13} /> Toevoegen
          </Button>
        </div>
        <div />

        <Card className="overflow-hidden flex flex-col min-h-0">
          <div className="grid grid-cols-[2fr_1fr_1.5fr_0.8fr_1fr_0.7fr] gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex-shrink-0">
            {['Naam', 'Leverancier', 'Seats', 'Beschikbaar', 'Vervaldatum', 'Status'].map(h => (
              <span key={h} className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{h}</span>
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
                {filtered.map(l => {
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
