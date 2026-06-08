import { useEffect, useState, useCallback } from 'react'
import {
  Users, LogOut, Layers, Search, ChevronRight, ArrowLeft,
  Laptop, Shield, CreditCard, Phone as PhoneIcon,
  PackageCheck, BarChart3, History, FileText,
  Settings, Building2, MapPin, UserPlus,
  Plus, Pencil, Trash2,
  Package, Activity, Archive, XCircle, CheckCircle2, Clock,
  MoreVertical, Wifi, Moon, Sun, ArrowLeftCircle,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/axios'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { UserDetailPanel } from '@/components/UserDetailPanel'
import { AddUserModal } from '@/components/AddUserModal'
import { HardwareModal } from '@/components/HardwareModal'
import { LicenseModal } from '@/components/LicenseModal'
import { AddEmployeeModal } from '@/components/AddEmployeeModal'
import { PhoneModal } from '@/components/PhoneModal'
import { SimCardModal } from '@/components/SimCardModal'
import { SubscriptionModal } from '@/components/SubscriptionModal'
import { DepartmentModal } from '@/components/DepartmentModal'
import type { ClientUserListItem, ClientUserDetailResponse } from '@/types/clientUser'
import { STATUS_LABEL, STATUS_TONE } from '@/types/clientUser'
import type { HardwareAssetListItem } from '@/types/hardware'
import { HARDWARE_STATUS_LABEL, HARDWARE_STATUS_TONE, HARDWARE_TYPE_LABEL } from '@/types/hardware'
import type { LicenseListItem } from '@/types/license'
import { LICENSE_TYPE_LABEL, LICENSE_TYPE_TONE } from '@/types/license'
import type { PhoneListItem } from '@/types/phone'
import { PHONE_STATUS_LABEL, PHONE_STATUS_TONE } from '@/types/phone'
import type { SimCardListItem } from '@/types/simcard'
import { SIM_STATUS_LABEL, SIM_STATUS_TONE, SIM_TYPE_LABEL } from '@/types/simcard'
import type { SubscriptionListItem } from '@/types/subscription'
import { SUB_STATUS_LABEL, SUB_STATUS_TONE, SUB_TYPE_LABEL } from '@/types/subscription'
import type { DepartmentListItem, DepartmentDetailResponse } from '@/types/department'

// ── Types ─────────────────────────────────────────────────────────────────────

type View =
  | 'employees' | 'employee-detail'
  | 'departments' | 'locations'
  | 'hardware' | 'software' | 'licenses' | 'phones'
  | 'starter-checklist' | 'leaver-checklist'
  | 'overviews' | 'history' | 'contracts'
  | 'settings' | 'help'

const VIEW_TITLES: Record<View, string> = {
  employees: 'Medewerkers',
  'employee-detail': 'Medewerker details',
  departments: 'Afdelingen',
  locations: 'Locaties',
  hardware: 'Hardware',
  software: 'Software',
  licenses: 'Licenties',
  phones: 'Telefonie',
  'starter-checklist': 'Aantreden checklist',
  'leaver-checklist': 'Weggaan checklist',
  overviews: 'Overzichten',
  history: 'Historie',
  contracts: 'Contracten',
  settings: 'Instellingen',
  help: 'Help',
}

// ── Sidebar helpers ───────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-3 pt-2 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
      {label}
    </p>
  )
}

function NavItem({ icon, label, active, onClick }: {
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
        active ? 'bg-violet-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  )
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function Avatar({ first, last, size = 32 }: { first: string; last: string; size?: number }) {
  return (
    <div
      className="rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold flex-shrink-0"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {(first[0] ?? '').toUpperCase()}{(last[0] ?? '').toUpperCase()}
    </div>
  )
}

function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Layers size={28} className="text-slate-300" />
        </div>
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <p className="text-xs text-slate-400 mt-1">Komt binnenkort beschikbaar</p>
      </div>
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, tone = 'default' }: {
  label: string; value: number; icon: React.ReactNode; tone?: string
}) {
  const iconTones: Record<string, string> = {
    default: 'bg-slate-100 text-slate-500',
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    slate: 'bg-slate-100 text-slate-400',
    violet: 'bg-violet-100 text-violet-600',
  }
  return (
    <div className="bg-white rounded-2xl px-5 py-4 border border-slate-200 shadow-sm flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconTones[tone] ?? iconTones.default}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 leading-tight">{value}</p>
        <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ── History helpers ───────────────────────────────────────────────────────────

interface AuditEntry {
  id: string
  action: string
  changes: string | null
  userName: string | null
  createdAt: string
}

function parseAuditChanges(raw: string | null): Record<string, unknown> {
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { return {} }
}

function hardwareAuditLabel(entry: AuditEntry): string {
  const c = parseAuditChanges(entry.changes)
  switch (entry.action) {
    case 'Created': return 'Hardware aangemaakt'
    case 'Deleted': return 'Hardware verwijderd'
    case 'Updated':
      if ('Status' in c) return 'Status gewijzigd'
      if ('AssignedToUserId' in c) return 'Toewijzing gewijzigd'
      return 'Hardware bijgewerkt'
    default: return entry.action
  }
}

function licenseAuditLabel(entry: AuditEntry): string {
  switch (entry.action) {
    case 'Created':      return 'Licentie aangemaakt'
    case 'Deleted':      return 'Licentie verwijderd'
    case 'Updated':      return 'Licentie bijgewerkt'
    case 'UserAssigned': return 'Gebruiker toegewezen'
    case 'UserRevoked':  return 'Gebruiker ingetrokken'
    default: return entry.action
  }
}

function fmtAuditDate(d: string) {
  return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function HistoryBlock({ entityType, entityId, labelFn }: {
  entityType: string
  entityId: string
  labelFn: (entry: AuditEntry) => string
}) {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get<AuditEntry[]>(`/portal/history/${entityType}/${entityId}`)
      .then(r => setEntries(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [entityType, entityId])

  return (
    <div className="pt-4 border-t border-slate-100">
      <p className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
        <History size={12} /> Historie
      </p>
      {loading ? (
        <p className="text-xs text-slate-400">Laden…</p>
      ) : entries.length === 0 ? (
        <p className="text-xs text-slate-400">Nog geen activiteiten.</p>
      ) : (
        <div className="space-y-1.5">
          {entries.map(e => (
            <div key={e.id} className="rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-xs font-medium text-slate-700">{labelFn(e)}</p>
              <p className="text-xs text-slate-400">{fmtAuditDate(e.createdAt)}{e.userName ? ` • ${e.userName}` : ''}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Hardware detail panel ─────────────────────────────────────────────────────

function HardwareDetailPanel({ asset, onEdit, onDelete }: {
  asset: HardwareAssetListItem
  onEdit: () => void
  onDelete: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  function fmt(d: string | null | undefined) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
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

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Assetnummer', value: asset.assetNumber || '—' },
            { label: 'Serienummer', value: asset.serialNumber || '—' },
            { label: 'Locatie', value: asset.location || '—' },
            {
              label: 'Aanschafwaarde',
              value: asset.purchaseValue != null ? `€ ${asset.purchaseValue.toFixed(2)}` : '—',
            },
            { label: 'Toegewezen aan', value: asset.assignedToName || '—' },
            { label: 'Uitgiftedatum', value: fmt(asset.issuedAt) },
            ...(asset.returnedAt ? [{ label: 'Inleverdatum', value: fmt(asset.returnedAt) }] : []),
          ].map(row => (
            <div key={row.label} className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-400 mb-0.5">{row.label}</p>
              <p className="text-sm font-medium text-slate-800 truncate">{row.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={onEdit}>
            <Pencil size={13} /> Wijzigen
          </Button>
          {!confirmDelete ? (
            <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={13} /> Verwijderen
            </Button>
          ) : (
            <>
              <span className="flex items-center text-xs text-red-700 font-medium">Zeker weten?</span>
              <Button size="sm" variant="danger" onClick={() => { setConfirmDelete(false); onDelete() }}>
                Ja, verwijder
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(false)}>
                Nee
              </Button>
            </>
          )}
        </div>

        <HistoryBlock entityType="HardwareAsset" entityId={asset.id} labelFn={hardwareAuditLabel} />
      </CardContent>
    </Card>
  )
}

// ── Hardware view ─────────────────────────────────────────────────────────────

function HardwareView({ teammates }: { teammates: ClientUserListItem[] }) {
  const [assets, setAssets] = useState<HardwareAssetListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<HardwareAssetListItem | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<HardwareAssetListItem | null>(null)

  const fetchAssets = useCallback(async () => {
    try {
      const { data } = await api.get<HardwareAssetListItem[]>('/portal/hardware')
      setAssets(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAssets() }, [fetchAssets])

  const filtered = assets.filter(a =>
    `${a.name} ${a.brand} ${a.assetNumber} ${a.serialNumber} ${a.assignedToName ?? ''} ${a.location}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const totaal = assets.length
  const inGebruik = assets.filter(a => a.status === 'InUse').length
  const opVoorraad = assets.filter(a => a.status === 'InStock').length
  const afgeschreven = assets.filter(a => a.status === 'Decommissioned').length

  const handleDelete = async (id: string) => {
    await api.delete(`/portal/hardware/${id}`)
    setAssets(prev => prev.filter(a => a.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const handleOpenAdd = () => { setEditTarget(null); setShowModal(true) }
  const handleOpenEdit = (asset: HardwareAssetListItem) => { setEditTarget(asset); setShowModal(true) }
  const handleSaved = async () => { await fetchAssets(); setShowModal(false) }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3 flex-shrink-0">
        <StatCard label="Totaal" value={totaal} icon={<Package size={18} />} />
        <StatCard label="In gebruik" value={inGebruik} icon={<Activity size={18} />} tone="emerald" />
        <StatCard label="Op voorraad" value={opVoorraad} icon={<Archive size={18} />} tone="blue" />
        <StatCard label="Afgeschreven" value={afgeschreven} icon={<XCircle size={18} />} tone="slate" />
      </div>

      {/* List + Detail split */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left: list */}
        <div className="flex flex-col flex-1 min-h-0 min-w-0">
          <div className="flex items-center gap-2 mb-3 flex-shrink-0">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Zoek hardware…"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-violet-400"
              />
            </div>
            <Button size="sm" onClick={handleOpenAdd}>
              <Plus size={13} /> Toevoegen
            </Button>
          </div>

          <Card className="flex-1 overflow-hidden flex flex-col">
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
                    <li key={a.id}>
                      <button
                        onClick={() => setSelected(a)}
                        className={`w-full text-left px-4 py-3.5 transition-colors hover:bg-slate-100 ${
                          selected?.id === a.id ? 'bg-violet-50 border-l-2 border-violet-500' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{a.name}</p>
                            <p className="text-xs text-slate-500 truncate">
                              {a.brand || '—'} • {HARDWARE_TYPE_LABEL[a.type] ?? a.type}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${HARDWARE_STATUS_TONE[a.status] ?? 'bg-slate-100 text-slate-600'}`}>
                            {HARDWARE_STATUS_LABEL[a.status] ?? a.status}
                          </span>
                        </div>
                        {a.assignedToName && (
                          <p className="mt-1 text-xs text-slate-400 truncate">{a.assignedToName}</p>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>

        {/* Right: detail */}
        <div className="w-[20%] flex-shrink-0 min-h-0 overflow-y-auto">
          {selected ? (
            <HardwareDetailPanel
              asset={selected}
              onEdit={() => handleOpenEdit(selected)}
              onDelete={() => handleDelete(selected.id)}
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
        asset={editTarget}
      />
    </div>
  )
}

// ── License detail panel ──────────────────────────────────────────────────────

function LicenseDetailPanel({ license, teammates, onEdit, onDelete, onAssign, onRevoke }: {
  license: LicenseListItem
  teammates: ClientUserListItem[]
  onEdit: () => void
  onDelete: () => void
  onAssign: (userId: string) => void
  onRevoke: (userId: string) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [assignUserId, setAssignUserId] = useState('')

  const assignableUsers = teammates.filter(t => !license.users.some(u => u.userId === t.id))
  const seatsLeft = license.maxUsers - license.assignedUsers
  const isExpired = license.expiresAt ? new Date(license.expiresAt) < new Date() : false

  function fmt(d: string | null | undefined) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-5">
        {/* Header */}
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
            <span>Seats gebruikt</span>
            <span className="font-semibold">{license.assignedUsers} / {license.maxUsers}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200">
            <div
              className={`h-2 rounded-full transition-all ${license.assignedUsers >= license.maxUsers ? 'bg-red-500' : 'bg-violet-500'}`}
              style={{ width: `${Math.min(100, (license.assignedUsers / license.maxUsers) * 100)}%` }}
            />
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-400 mb-0.5">Startdatum</p>
            <p className="text-sm font-medium text-slate-800">{fmt(license.startsAt)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-400 mb-0.5">Vervaldatum</p>
            <p className={`text-sm font-medium ${isExpired ? 'text-red-600' : 'text-slate-800'}`}>{fmt(license.expiresAt)}</p>
          </div>
        </div>

        {/* Assign user */}
        {seatsLeft > 0 && assignableUsers.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1.5">Gebruiker toewijzen</p>
            <div className="flex gap-2">
              <select
                value={assignUserId}
                onChange={e => setAssignUserId(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-violet-500"
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
        {license.users.length > 0 && (
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
        )}

        {license.users.length === 0 && (
          <p className="text-sm text-slate-400">Nog geen gebruikers toegewezen.</p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" variant="secondary" onClick={onEdit}>
            <Pencil size={13} /> Wijzigen
          </Button>
          {!confirmDelete ? (
            <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={13} /> Verwijderen
            </Button>
          ) : (
            <>
              <span className="flex items-center text-xs text-red-700 font-medium">Zeker weten?</span>
              <Button size="sm" variant="danger" onClick={() => { setConfirmDelete(false); onDelete() }}>
                Ja, verwijder
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(false)}>
                Nee
              </Button>
            </>
          )}
        </div>

        <HistoryBlock entityType="License" entityId={license.id} labelFn={licenseAuditLabel} />
      </CardContent>
    </Card>
  )
}

// ── License view ──────────────────────────────────────────────────────────────

function LicenseView({ teammates }: { teammates: ClientUserListItem[] }) {
  const [licenses, setLicenses] = useState<LicenseListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<LicenseListItem | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<LicenseListItem | null>(null)

  const fetchLicenses = useCallback(async () => {
    try {
      const { data } = await api.get<LicenseListItem[]>('/portal/licenses')
      setLicenses(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLicenses() }, [fetchLicenses])

  // Keep selected in sync after refresh
  useEffect(() => {
    if (selected) {
      const updated = licenses.find(l => l.id === selected.id)
      if (updated) setSelected(updated)
    }
  }, [licenses])

  const filtered = licenses.filter(l =>
    `${l.name} ${l.vendor} ${l.type}`.toLowerCase().includes(search.toLowerCase())
  )

  const totaal = licenses.length
  const actief = licenses.filter(l => l.isActive).length
  const verlopen = licenses.filter(l => l.expiresAt && new Date(l.expiresAt) < new Date()).length
  const beschikbaar = licenses.reduce((sum, l) => sum + Math.max(0, l.maxUsers - l.assignedUsers), 0)

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

  const handleOpenAdd = () => { setEditTarget(null); setShowModal(true) }
  const handleOpenEdit = (l: LicenseListItem) => { setEditTarget(l); setShowModal(true) }
  const handleSaved = async () => { await fetchLicenses(); setShowModal(false) }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3 flex-shrink-0">
        <StatCard label="Totaal" value={totaal} icon={<CreditCard size={18} />} />
        <StatCard label="Actief" value={actief} icon={<CheckCircle2 size={18} />} tone="emerald" />
        <StatCard label="Verlopen" value={verlopen} icon={<Clock size={18} />} tone="amber" />
        <StatCard label="Seats beschikbaar" value={beschikbaar} icon={<Users size={18} />} tone="blue" />
      </div>

      {/* List + Detail split */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left: list */}
        <div className="flex flex-col flex-1 min-h-0 min-w-0">
          <div className="flex items-center gap-2 mb-3 flex-shrink-0">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Zoek licenties…"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-violet-400"
              />
            </div>
            <Button size="sm" onClick={handleOpenAdd}>
              <Plus size={13} /> Toevoegen
            </Button>
          </div>

          <Card className="flex-1 overflow-hidden flex flex-col">
            <div className="grid grid-cols-[2fr_1.5fr_0.8fr_1fr_0.7fr] gap-3 px-4 py-2.5 border-b border-slate-100 bg-slate-50 flex-shrink-0">
              {['Naam', 'Seats', 'Beschikbaar', 'Vervaldatum', 'Status'].map(h => (
                <span key={h} className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{h}</span>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-10 text-center text-sm text-slate-400">Laden…</div>
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
                    const isExpired = l.expiresAt ? new Date(l.expiresAt) < new Date() : false
                    const seatsLeft = l.maxUsers - l.assignedUsers
                    const pct = l.maxUsers > 0 ? Math.min(100, (l.assignedUsers / l.maxUsers) * 100) : 0
                    const barColor = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-violet-500'
                    return (
                      <li
                        key={l.id}
                        onClick={() => setSelected(l)}
                        className={`grid grid-cols-[2fr_1.5fr_0.8fr_1fr_0.7fr] gap-3 px-4 py-3 items-center cursor-pointer transition-colors hover:bg-slate-100 ${
                          selected?.id === l.id ? 'bg-violet-50 border-l-2 border-violet-500' : ''
                        }`}
                      >
                        {/* Naam + vendor */}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{l.name}</p>
                          <p className="text-xs text-slate-400 truncate">{l.vendor || '—'}</p>
                        </div>

                        {/* Seats bar */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                            <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>

                        {/* Beschikbaar */}
                        <p className={`text-xs tabular-nums font-medium ${seatsLeft === 0 ? 'text-red-600' : 'text-slate-700'}`}>
                          {seatsLeft} / {l.maxUsers}
                        </p>

                        {/* Vervaldatum */}
                        <p className={`text-xs tabular-nums ${isExpired ? 'text-red-500' : 'text-slate-500'}`}>
                          {l.expiresAt
                            ? new Date(l.expiresAt).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
                            : '—'}
                        </p>

                        {/* Status */}
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
        </div>

        {/* Right: detail */}
        <div className="w-[20%] flex-shrink-0 min-h-0 overflow-y-auto">
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

// ── Telefonie view (3 tabs) ───────────────────────────────────────────────────

type TelefonieTab = 'phones' | 'simcards' | 'subscriptions'

function TelefonieView({ teammates }: { teammates: ClientUserListItem[] }) {
  const [tab, setTab] = useState<TelefonieTab>('phones')
  const [totals, setTotals] = useState({
    subscriptions: 0,
    phonesInUse: 0,
    simCardsInUse: 0,
  })

  const fetchTotals = useCallback(async () => {
    try {
      const [phoneRes, simRes, subRes] = await Promise.all([
        api.get<PhoneListItem[]>('/portal/phones'),
        api.get<SimCardListItem[]>('/portal/simcards'),
        api.get<SubscriptionListItem[]>('/portal/subscriptions'),
      ])
      setTotals({
        subscriptions: subRes.data.length,
        phonesInUse: phoneRes.data.filter(p => p.status === 'InUse').length,
        simCardsInUse: simRes.data.filter(s => s.status === 'InUse').length,
      })
    } catch { /* negeer */ }
  }, [])

  useEffect(() => { fetchTotals() }, [fetchTotals])

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Totalen */}
      <div className="grid grid-cols-3 gap-3 flex-shrink-0">
        <StatCard label="Abonnementen" value={totals.subscriptions} icon={<Layers size={18} />} tone="violet" />
        <StatCard label="Telefoons in gebruik" value={totals.phonesInUse} icon={<PhoneIcon size={18} />} tone="emerald" />
        <StatCard label="Simkaarten in gebruik" value={totals.simCardsInUse} icon={<Wifi size={18} />} tone="blue" />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 flex-shrink-0 bg-slate-100 p-1 rounded-xl w-fit">
        {([
          { key: 'phones', label: 'Mobiele Telefoons' },
          { key: 'subscriptions', label: 'Abonnementen' },
          { key: 'simcards', label: 'Simkaarten' },
        ] as { key: TelefonieTab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              tab === t.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'phones' && <PhonesTab teammates={teammates} />}
      {tab === 'subscriptions' && <SubscriptionsTab />}
      {tab === 'simcards' && <SimCardsTab teammates={teammates} />}
    </div>
  )
}

// ── Phones tab ────────────────────────────────────────────────────────────────

function PhonesTab({ teammates }: { teammates: ClientUserListItem[] }) {
  const [phones, setPhones] = useState<PhoneListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<PhoneListItem | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<PhoneListItem | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const fetchPhones = useCallback(async () => {
    try {
      const { data } = await api.get<PhoneListItem[]>('/portal/phones')
      setPhones(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPhones() }, [fetchPhones])

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

  const handleSaved = async () => { await fetchPhones(); setShowModal(false) }

  const handleUnlinkSim = async (phoneId: string) => {
    const { data } = await api.delete<PhoneListItem>(`/portal/phones/${phoneId}/simcard`)
    setPhones(prev => prev.map(p => p.id === phoneId ? data : p))
    setSelected(data)
  }

  function fmt(d: string | null | undefined) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <div className="flex gap-4 flex-1 min-h-0">
        <div className="flex flex-col flex-1 min-h-0 min-w-0">
          <div className="flex items-center gap-2 mb-3 flex-shrink-0">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Zoek telefoons…"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-violet-400"
              />
            </div>
            <Button size="sm" onClick={() => { setEditTarget(null); setShowModal(true) }}>
              <Plus size={13} /> Toevoegen
            </Button>
          </div>

          <Card className="flex-1 overflow-hidden flex flex-col">
            <div className="grid grid-cols-[2fr_1.3fr_1.5fr_1.5fr_0.9fr] gap-3 px-4 py-2.5 border-b border-slate-100 bg-slate-50 flex-shrink-0">
              {['Merk & model', 'Serienummer', 'Toegewezen aan', 'Simkaart', 'Status'].map(h => (
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
                      onClick={() => { setSelected(p); setConfirmDelete(false) }}
                      className={`grid grid-cols-[2fr_1.3fr_1.5fr_1.5fr_0.9fr] gap-3 px-4 py-3 items-center cursor-pointer transition-colors hover:bg-slate-100 ${selected?.id === p.id ? 'bg-violet-50 border-l-2 border-violet-500' : ''}`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{p.brand} {p.model || ''}</p>
                      </div>
                      <p className="text-xs text-slate-600 truncate tabular-nums">{p.serialNumber || '—'}</p>
                      <p className="text-xs text-slate-600 truncate">{p.assignedToName || '—'}</p>
                      <p className="text-xs text-slate-600 truncate">{p.simPhoneNumber || p.simCardNumber || '—'}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium truncate ${PHONE_STATUS_TONE[p.status] ?? 'bg-slate-100 text-slate-500'}`}>
                        {PHONE_STATUS_LABEL[p.status] ?? p.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>

        <div className="w-[22%] flex-shrink-0 min-h-0">
          {selected ? (
            <Card className="h-full overflow-y-auto">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4 gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{selected.brand} {selected.model}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">{selected.simPhoneNumber || selected.serialNumber || '—'}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${PHONE_STATUS_TONE[selected.status] ?? ''}`}>
                    {PHONE_STATUS_LABEL[selected.status] ?? selected.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs text-slate-600">
                  {selected.serialNumber && (
                    <p><span className="text-slate-400">Serienummer</span><br /><span className="font-medium text-slate-800">{selected.serialNumber}</span></p>
                  )}
                  {selected.imeiNumber && (
                    <p><span className="text-slate-400">IMEI</span><br /><span className="font-medium text-slate-800">{selected.imeiNumber}</span></p>
                  )}
                  {selected.assignedToName && (
                    <p className="col-span-2"><span className="text-slate-400">Toegewezen aan</span><br /><span className="font-medium text-slate-800">{selected.assignedToName}</span></p>
                  )}
                  {selected.issuedAt && (
                    <p><span className="text-slate-400">Uitgiftedatum</span><br /><span className="font-medium text-slate-800">{fmt(selected.issuedAt)}</span></p>
                  )}
                  {selected.returnedAt && (
                    <p><span className="text-slate-400">Inleverdatum</span><br /><span className="font-medium text-slate-800">{fmt(selected.returnedAt)}</span></p>
                  )}
                </div>
                {selected.simCardNumber && (
                  <div className="mt-3 rounded-xl bg-violet-50 border border-violet-100 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-violet-400 mb-0.5">Gekoppelde simkaart</p>
                        <p className="text-sm font-medium text-violet-700 truncate">
                          {selected.simCardNumber}
                          {selected.simPhoneNumber ? ` · ${selected.simPhoneNumber}` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => handleUnlinkSim(selected.id)}
                        title="Simkaart ontkoppelen"
                        className="flex-shrink-0 text-violet-400 hover:text-red-500 transition-colors"
                      >
                        <XCircle size={15} />
                      </button>
                    </div>
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => { setEditTarget(selected); setShowModal(true) }}>
                    <Pencil size={13} /> Wijzigen
                  </Button>
                  {!confirmDelete ? (
                    <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
                      <Trash2 size={13} /> Verwijderen
                    </Button>
                  ) : (
                    <>
                      <span className="flex items-center text-xs text-red-700 font-medium">Zeker weten?</span>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(selected.id)}>Ja</Button>
                      <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(false)}>Nee</Button>
                    </>
                  )}
                </div>
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
    </div>
  )
}

// ── SimCards tab ──────────────────────────────────────────────────────────────

function SimCardsTab({ teammates }: { teammates: ClientUserListItem[] }) {
  const [simCards, setSimCards] = useState<SimCardListItem[]>([])
  const [phones, setPhones] = useState<PhoneListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<SimCardListItem | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<SimCardListItem | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [simRes, phoneRes] = await Promise.all([
        api.get<SimCardListItem[]>('/portal/simcards'),
        api.get<PhoneListItem[]>('/portal/phones'),
      ])
      setSimCards(simRes.data)
      setPhones(phoneRes.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

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

  const handleSaved = async () => { await fetchData(); setShowModal(false) }

  return (
    <div className="flex gap-4 flex-1 min-h-0">
      <div className="flex flex-col flex-1 min-h-0 min-w-0">
        <div className="flex items-center gap-2 mb-3 flex-shrink-0">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Zoek simkaarten…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-violet-400"
            />
          </div>
          <Button size="sm" onClick={() => { setEditTarget(null); setShowModal(true) }}>
            <Plus size={13} /> Toevoegen
          </Button>
        </div>

        <Card className="flex-1 overflow-hidden flex flex-col">
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
                  <li key={s.id}>
                    <button
                      onClick={() => { setSelected(s); setConfirmDelete(false) }}
                      className={`w-full text-left px-4 py-3.5 transition-colors hover:bg-slate-100 ${selected?.id === s.id ? 'bg-violet-50 border-l-2 border-violet-500' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{s.kaartNummer}</p>
                          <p className="text-xs text-slate-400 truncate">
                            {s.phoneNumber || '—'} · {SIM_TYPE_LABEL[s.type] ?? s.type}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${SIM_STATUS_TONE[s.status] ?? 'bg-slate-100 text-slate-500'}`}>
                          {SIM_STATUS_LABEL[s.status] ?? s.status}
                        </span>
                      </div>
                      {(s.assignedToName || s.phoneName) && (
                        <p className="mt-1 text-xs text-slate-400 truncate">
                          {[s.assignedToName, s.phoneName].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      {s.subscriptionName && (
                        <p className="mt-0.5 text-xs text-violet-500 truncate">Abonnement: {s.subscriptionName}</p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <div className="w-[22%] flex-shrink-0 min-h-0">
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
                  { label: 'Type', value: SIM_TYPE_LABEL[selected.type] ?? selected.type },
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
                <div className="mt-3 rounded-xl bg-violet-50 border border-violet-100 px-3 py-2.5">
                  <p className="text-xs text-violet-400 mb-0.5">Gekoppelde telefoon</p>
                  <p className="text-sm font-medium text-violet-700 truncate">{selected.phoneName}</p>
                </div>
              )}
              {selected.subscriptionName && (
                <div className="mt-2 rounded-xl bg-violet-50 border border-violet-100 px-3 py-2.5">
                  <p className="text-xs text-violet-400 mb-0.5">Gekoppeld abonnement</p>
                  <p className="text-sm font-medium text-violet-700 truncate">{selected.subscriptionName}</p>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => { setEditTarget(selected); setShowModal(true) }}>
                  <Pencil size={13} /> Wijzigen
                </Button>
                {!confirmDelete ? (
                  <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
                    <Trash2 size={13} /> Verwijderen
                  </Button>
                ) : (
                  <>
                    <span className="flex items-center text-xs text-red-700 font-medium">Zeker weten?</span>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(selected.id)}>Ja</Button>
                    <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(false)}>Nee</Button>
                  </>
                )}
              </div>
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
  const [simCards, setSimCards] = useState<SimCardListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<SubscriptionListItem | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<SubscriptionListItem | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [subRes, simRes] = await Promise.all([
        api.get<SubscriptionListItem[]>('/portal/subscriptions'),
        api.get<SimCardListItem[]>('/portal/simcards'),
      ])
      setSubscriptions(subRes.data)
      setSimCards(simRes.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

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

  const handleSaved = async () => { await fetchData(); setShowModal(false) }

  function fmt(d: string | null | undefined) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  function fmtCost(cost: number | null) {
    if (cost == null) return '—'
    return `€ ${cost.toFixed(2)}`
  }

  return (
    <div className="flex gap-4 flex-1 min-h-0">
      <div className="flex flex-col flex-1 min-h-0 min-w-0">
        <div className="flex items-center gap-2 mb-3 flex-shrink-0">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Zoek abonnementen…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-violet-400"
            />
          </div>
          <Button size="sm" onClick={() => { setEditTarget(null); setShowModal(true) }}>
            <Plus size={13} /> Toevoegen
          </Button>
        </div>

        <Card className="flex-1 overflow-hidden flex flex-col">
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
                  <li key={s.id}>
                    <button
                      onClick={() => { setSelected(s); setConfirmDelete(false) }}
                      className={`w-full text-left px-4 py-3.5 transition-colors hover:bg-slate-100 ${selected?.id === s.id ? 'bg-violet-50 border-l-2 border-violet-500' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{s.name}</p>
                          <p className="text-xs text-slate-400 truncate">
                            {s.provider} · {SUB_TYPE_LABEL[s.type] ?? s.type}
                            {s.monthlyCost != null ? ` · €${s.monthlyCost.toFixed(2)}/mnd` : ''}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${SUB_STATUS_TONE[s.status] ?? 'bg-slate-100 text-slate-500'}`}>
                          {SUB_STATUS_LABEL[s.status] ?? s.status}
                        </span>
                      </div>
                      {s.assignedToName && (
                        <p className="mt-1 text-xs text-slate-400 truncate">{s.assignedToName}</p>
                      )}
                      {s.simCardNumber && (
                        <p className="mt-0.5 text-xs text-violet-500 truncate">Simkaart: {s.simPhoneNumber || s.simCardNumber}</p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <div className="w-[22%] flex-shrink-0 min-h-0">
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
                  { label: 'Type', value: SUB_TYPE_LABEL[selected.type] ?? selected.type },
                  { label: 'Bundel', value: selected.bundle || '—' },
                  { label: 'Maandelijks', value: fmtCost(selected.monthlyCost) },
                  { label: 'Toegewezen aan', value: selected.assignedToName || '—' },
                  { label: 'Locatie', value: selected.location || '—' },
                  { label: 'Startdatum', value: fmt(selected.startsAt) },
                  { label: 'Einddatum', value: fmt(selected.expiresAt) },
                ].map(row => (
                  <div key={row.label} className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400 mb-0.5">{row.label}</p>
                    <p className="text-sm font-medium text-slate-800 truncate">{row.value}</p>
                  </div>
                ))}
              </div>
              {selected.simCardNumber && (
                <div className="mt-3 rounded-xl bg-violet-50 border border-violet-100 px-3 py-2.5">
                  <p className="text-xs text-violet-400 mb-0.5">Gekoppelde simkaart</p>
                  <p className="text-sm font-medium text-violet-700 truncate">
                    {selected.simCardNumber}
                    {selected.simPhoneNumber ? ` · ${selected.simPhoneNumber}` : ''}
                  </p>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => { setEditTarget(selected); setShowModal(true) }}>
                  <Pencil size={13} /> Wijzigen
                </Button>
                {!confirmDelete ? (
                  <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
                    <Trash2 size={13} /> Verwijderen
                  </Button>
                ) : (
                  <>
                    <span className="flex items-center text-xs text-red-700 font-medium">Zeker weten?</span>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(selected.id)}>Ja</Button>
                    <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(false)}>Nee</Button>
                  </>
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
          // Toon alleen simkaarten zonder abonnement, of de simkaart die al aan dit abonnement gekoppeld is
          !subscriptions.some(sub => sub.simCardId === s.id && sub.id !== editTarget?.id)
        )}
        subscription={editTarget}
      />
    </div>
  )
}

// ── Employee list view (full-width) ───────────────────────────────────────────

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function EmployeeListView({ teammates, loading, search, currentUserId, departmentOptions, onSearch, onSelect, onAddEmployee }: {
  teammates: ClientUserListItem[]
  loading: boolean
  search: string
  currentUserId: string | undefined
  departmentOptions: { id: string; name: string; managerName: string }[]
  onSearch: (v: string) => void
  onSelect: (id: string) => void
  onAddEmployee: () => void
}) {
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const filtered = teammates.filter(t =>
    `${t.firstName} ${t.lastName} ${t.email} ${t.departmentName} ${t.jobTitle}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const cols = 'grid-cols-[2.5fr_1fr_1fr_1fr_1fr_1fr_80px_90px_40px]'

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Zoek op naam, e-mail of afdeling…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-violet-400"
          />
        </div>
        <span className="text-xs text-slate-400 flex-1">{filtered.length} medewerker{filtered.length !== 1 ? 's' : ''}</span>
        <Button size="sm" onClick={onAddEmployee}>
          <UserPlus size={13} /> Medewerker toevoegen
        </Button>
      </div>

      {/* Table card */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        <div className={`grid ${cols} gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50`}>
          {['Naam', 'Manager', 'Afdeling', 'Functie', 'Startdatum', 'Status', 'Assets', 'Licenties', ''].map(h => (
            <span key={h} className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{h}</span>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-10 text-center text-sm text-slate-400">Laden…</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <Users size={36} className="mx-auto mb-3 text-slate-200" />
              <p className="text-sm text-slate-400">Geen medewerkers gevonden.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map(u => (
                <li key={u.id} className={`grid ${cols} gap-3 px-5 py-3.5 hover:bg-slate-100 transition-colors items-center`}>
                  {/* Naam + email */}
                  <button className="flex items-center gap-3 min-w-0 text-left" onClick={() => onSelect(u.id)}>
                    <Avatar first={u.firstName} last={u.lastName} size={48} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {u.firstName} {u.lastName}
                        </p>
                        {u.id === currentUserId && (
                          <span className="text-xs px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded-full font-medium">Jij</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">{u.email || '—'}</p>
                    </div>
                  </button>

                  {/* Manager */}
                  <p className="text-sm text-slate-500 truncate">
                    {u.managerName || ''}
                  </p>

                  {/* Afdeling */}
                  {u.departmentName ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium truncate w-fit max-w-full">
                      {u.departmentName}
                    </span>
                  ) : (
                    <span />
                  )}

                  {/* Functie */}
                  <p className="text-sm text-slate-500 truncate">{u.jobTitle || '—'}</p>

                  {/* Startdatum */}
                  <p className="text-sm text-slate-500">{fmtDate(u.startDate)}</p>

                  {/* Status */}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${STATUS_TONE[u.status]}`}>
                    {STATUS_LABEL[u.status]}
                  </span>

                  {/* Hardware count */}
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Laptop size={12} className="text-slate-400 flex-shrink-0" />
                    <span>{u.hardwareCount}</span>
                  </div>

                  {/* License count */}
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <CreditCard size={12} className="text-slate-400 flex-shrink-0" />
                    <span>{u.licenseCount}</span>
                  </div>

                  {/* 3-dot menu */}
                  <div className="relative flex justify-end">
                    <button
                      onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}
                      onBlur={() => setTimeout(() => setOpenMenu(null), 150)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <MoreVertical size={15} />
                    </button>
                    {openMenu === u.id && (
                      <div className="absolute right-0 top-7 z-20 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 text-sm">
                        <button
                          onClick={() => { setOpenMenu(null); onSelect(u.id) }}
                          className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                        >
                          <ChevronRight size={13} className="text-slate-400" /> Details bekijken
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  )
}

// ── Employee detail view (full-page) ──────────────────────────────────────────

function EmployeeDetailView({ user, loading, onBack, onUserUpdated, departments, managers }: {
  user: ClientUserDetailResponse | null
  loading: boolean
  onBack: () => void
  onUserUpdated?: () => void
  departments?: { id: string; name: string; managerId: string | null }[]
  managers?: { id: string; fullName: string }[]
}) {
  return (
    <div className="flex flex-col gap-4 h-full">
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={15} />
          Terug naar medewerkers
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <Card className="h-40 flex items-center justify-center">
            <p className="text-sm text-slate-400">Laden…</p>
          </Card>
        ) : !user ? null : (
          <UserDetailPanel
            user={user}
            canEdit
            departments={departments}
            managers={managers}
            checklistBasePath={`/portal/users/${user.id}`}
            historyPath={`/portal/history/ClientUser/${user.id}`}
            onUserUpdated={onUserUpdated}
          />
        )}
      </div>
    </div>
  )
}

// ── Settings view ─────────────────────────────────────────────────────────────

function SettingsView({ teammates, tenantName, onAddUser }: {
  teammates: ClientUserListItem[]
  tenantName: string
  onAddUser: () => void
}) {
  const { darkMode, toggleDarkMode } = useThemeStore()

  return (
    <div className="max-w-2xl space-y-6">

      {/* Weergave */}
      <Card>
        <CardContent className="p-5">
          <h2 className="text-sm font-bold text-slate-800 mb-4">Weergave</h2>
          <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                {darkMode ? <Moon size={15} className="text-violet-400" /> : <Sun size={15} className="text-amber-500" />}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">Donkere modus</p>
                <p className="text-xs text-slate-400 mt-0.5">Schakel tussen licht en donker thema</p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                darkMode ? 'bg-violet-600' : 'bg-slate-200 dark:bg-slate-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Gebruikersbeheer</h2>
              <p className="text-xs text-slate-500 mt-0.5">Voeg medewerkers toe aan {tenantName}</p>
            </div>
            <Button size="sm" onClick={onAddUser}>
              <UserPlus size={13} /> Gebruiker toevoegen
            </Button>
          </div>
          <div className="rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 grid grid-cols-[1fr_1fr_auto] gap-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Naam</span>
              <span>Afdeling</span>
              <span>Status</span>
            </div>
            {teammates.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">Geen gebruikers gevonden.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {teammates.map(u => (
                  <li key={u.id} className="px-4 py-3 grid grid-cols-[1fr_1fr_auto] gap-4 items-center">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar first={u.firstName} last={u.lastName} size={28} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-slate-400 truncate">{u.email}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 truncate">{u.department || '—'}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_TONE[u.status]}`}>
                      {STATUS_LABEL[u.status]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Departments view ──────────────────────────────────────────────────────────

function DepartmentsView() {
  const [departments, setDepartments] = useState<DepartmentListItem[]>([])
  const [loading, setLoading]         = useState(true)
  const [showModal, setShowModal]     = useState(false)
  const [editTarget, setEditTarget]   = useState<DepartmentListItem | null>(null)
  const [detailDept, setDetailDept]   = useState<DepartmentDetailResponse | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [deletingId, setDeletingId]   = useState<string | null>(null)

  const fetchDepartments = async () => {
    setLoading(true)
    try {
      const { data } = await api.get<DepartmentListItem[]>('/portal/departments')
      setDepartments(data)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchDepartments() }, [])

  const openDetail = async (id: string) => {
    setLoadingDetail(true)
    setDetailDept(null)
    try {
      const { data } = await api.get<DepartmentDetailResponse>(`/portal/departments/${id}`)
      setDetailDept(data)
    } finally { setLoadingDetail(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Afdeling verwijderen?')) return
    setDeletingId(id)
    try {
      await api.delete(`/portal/departments/${id}`)
      setDepartments(prev => prev.filter(d => d.id !== id))
      if (detailDept?.id === id) setDetailDept(null)
    } finally { setDeletingId(null) }
  }

  const handleSuccess = (dept: DepartmentListItem) => {
    setDepartments(prev => {
      const idx = prev.findIndex(d => d.id === dept.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = dept; return next }
      return [...prev, dept]
    })
    fetchDepartments() // refresh to get updated counts
  }

  const USER_STATUS_LABEL: Record<string, string> = {
    InService: 'In dienst', LeavePlanned: 'Uitdienst gepland', Left: 'Uit dienst',
  }

  // ── Detail panel ───────────────────────────────────────────────────────────
  if (detailDept) {
    return (
      <div className="h-full flex flex-col gap-4 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDetailDept(null)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft size={14} /> Terug naar overzicht
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{detailDept.name}</h2>
              {detailDept.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{detailDept.description}</p>
              )}
              {detailDept.managerName && (
                <p className="text-xs text-slate-400 mt-1">Manager: <span className="text-slate-600 dark:text-slate-300 font-medium">{detailDept.managerName}</span></p>
              )}
            </div>
            <button
              onClick={() => { setEditTarget(departments.find(d => d.id === detailDept.id) ?? null); setShowModal(true) }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Pencil size={12} /> Bewerken
            </button>
          </div>

          {/* Aggregate stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Hardware items', value: detailDept.hardwareCount, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
              { label: 'Licenties',      value: detailDept.licenseCount,  color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' },
              { label: 'Software',       value: detailDept.softwareCount, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl px-4 py-3 flex items-center gap-3 ${s.color}`}>
                <span className="text-2xl font-bold">{s.value}</span>
                <span className="text-xs font-medium leading-tight">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Members table */}
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Medewerkers ({detailDept.members.length})
          </h3>

          {detailDept.members.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">Geen medewerkers in deze afdeling.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    {['Naam', 'Functie', 'Status', 'HW', 'Lic', 'SW'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-400 pb-2 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {detailDept.members.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="py-2.5 pr-4">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{m.firstName} {m.lastName}</p>
                        {m.email && <p className="text-xs text-slate-400">{m.email}</p>}
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-slate-500 dark:text-slate-400">{m.jobTitle || '—'}</td>
                      <td className="py-2.5 pr-4">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {USER_STATUS_LABEL[m.status] ?? m.status}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-xs font-medium text-slate-700 dark:text-slate-300">{m.hardwareCount}</td>
                      <td className="py-2.5 pr-4 text-xs font-medium text-slate-700 dark:text-slate-300">{m.licenseCount}</td>
                      <td className="py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">{m.softwareCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <DepartmentModal
          open={showModal}
          onClose={() => { setShowModal(false); setEditTarget(null) }}
          onSuccess={dept => { handleSuccess(dept); openDetail(dept.id) }}
          editTarget={editTarget}
        />
      </div>
    )
  }

  // ── List view ──────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {loading ? 'Laden…' : `${departments.length} afdeling${departments.length !== 1 ? 'en' : ''}`}
        </p>
        <Button size="sm" onClick={() => { setEditTarget(null); setShowModal(true) }}>
          <Plus size={14} /> Afdeling toevoegen
        </Button>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-slate-400">Laden…</p>
        </div>
      ) : departments.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Building2 size={28} className="text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Nog geen afdelingen</p>
            <p className="text-xs text-slate-400 mt-1">Voeg een afdeling toe om te beginnen</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto">
          {departments.map(d => (
            <div
              key={d.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col gap-3 shadow-sm"
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{d.name}</h3>
                  {d.description && (
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{d.description}</p>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => { setEditTarget(d); setShowModal(true) }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                    title="Bewerken"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    disabled={deletingId === d.id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
                    title="Verwijderen"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Manager */}
              {d.managerName && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manager: <span className="font-medium text-slate-700 dark:text-slate-300">{d.managerName}</span>
                </p>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Medewerkers', value: d.memberCount,   color: 'text-slate-600 dark:text-slate-300' },
                  { label: 'Hardware',    value: d.hardwareCount, color: 'text-blue-600 dark:text-blue-400' },
                  { label: 'Licenties',  value: d.licenseCount,  color: 'text-violet-600 dark:text-violet-400' },
                  { label: 'Software',   value: d.softwareCount, color: 'text-emerald-600 dark:text-emerald-400' },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className={`text-lg font-bold leading-tight ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-slate-400 leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* View button */}
              <button
                onClick={() => openDetail(d.id)}
                disabled={loadingDetail}
                className="mt-auto w-full py-2 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 text-xs font-semibold hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors flex items-center justify-center gap-1.5"
              >
                {loadingDetail ? 'Laden…' : 'Bekijken →'}
              </button>
            </div>
          ))}
        </div>
      )}

      <DepartmentModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditTarget(null) }}
        onSuccess={handleSuccess}
        editTarget={editTarget}
      />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ClientPortal() {
  const { user, logout, switchBack } = useAuthStore()
  const { darkMode, toggleDarkMode } = useThemeStore()
  const navigate = useNavigate()

  // MSP context-switch: true when an org-admin is managing this client portal
  const isMspMode = user?.switchedFromOrgId !== null && user?.switchedFromOrgId !== undefined

  const handleSwitchBack = () => {
    switchBack()
    navigate('/org')
  }

  const [view, setView] = useState<View>('employees')
  const [teammates, setTeammates] = useState<ClientUserListItem[]>([])
  const [selectedUser, setSelectedUser] = useState<ClientUserDetailResponse | null>(null)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [search, setSearch] = useState('')
  const [showAddUser, setShowAddUser] = useState(false)
  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [clientLogoUrl, setClientLogoUrl] = useState<string | null>(null)
  const [departmentOptions, setDepartmentOptions] = useState<{ id: string; name: string; managerName: string; managerId: string | null }[]>([])
  const [managers, setManagers] = useState<{ id: string; fullName: string }[]>([])

  const fetchDepartmentOptions = useCallback(async () => {
    try {
      const { data } = await api.get<DepartmentListItem[]>('/portal/departments')
      setDepartmentOptions(data.map(d => ({ id: d.id, name: d.name, managerName: d.managerName, managerId: d.managerUserId })))
    } catch { /* non-critical */ }
  }, [])

  const fetchManagers = useCallback(async () => {
    try {
      const { data } = await api.get<{ id: string; fullName: string }[]>('/portal/managers')
      setManagers(data)
    } catch { /* non-critical */ }
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await api.get<ClientUserListItem[]>('/portal/users')
      setTeammates(data)
    } finally {
      setLoadingUsers(false)
    }
  }, [])

  const fetchUserDetail = useCallback(async (userId: string) => {
    setLoadingDetail(true)
    setSelectedUser(null)
    try {
      const { data } = await api.get<ClientUserDetailResponse>(`/portal/users/${userId}`)
      setSelectedUser(data)
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])
  useEffect(() => { fetchDepartmentOptions() }, [fetchDepartmentOptions])
  useEffect(() => { fetchManagers() }, [fetchManagers])

  const handleSelectEmployee = (id: string) => {
    fetchUserDetail(id)
    setView('employee-detail')
  }

  const handleBackToList = () => {
    setView('employees')
    setSelectedUser(null)
  }

  const handleNavClick = (v: View) => {
    setView(v)
    if (v !== 'employee-detail') setSelectedUser(null)
    // herlaad gedeelde portaaldata zodat andere secties altijd actuele lijsten zien
    fetchUsers()
    fetchDepartmentOptions()
    fetchManagers()
  }

  useEffect(() => {
    api.get<{ logoDataUrl: string | null }>('/portal/logo')
      .then(r => setClientLogoUrl(r.data.logoDataUrl))
      .catch(() => {})
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }
  const tenantName = user?.tenantName ?? 'Portal'

  // "Medewerkers" nav item is active for both list and detail views
  const employeesActive = view === 'employees' || view === 'employee-detail'

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-950">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-56 bg-slate-900 dark:bg-slate-950 flex flex-col flex-shrink-0">

        <div className="px-4 py-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm truncate">{tenantName}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Portaal</p>
        </div>

        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-1">
          <SectionLabel label="Medewerkers" />
          <NavItem icon={<Users size={14} />} label="Medewerkers" active={employeesActive} onClick={() => handleNavClick('employees')} />
          <NavItem icon={<Building2 size={14} />} label="Afdelingen" active={view === 'departments'} onClick={() => handleNavClick('departments')} />
          <NavItem icon={<MapPin size={14} />} label="Locaties" active={view === 'locations'} onClick={() => handleNavClick('locations')} />

          <SectionLabel label="Assets" />
          <NavItem icon={<Laptop size={14} />} label="Hardware" active={view === 'hardware'} onClick={() => handleNavClick('hardware')} />
          <NavItem icon={<Shield size={14} />} label="Software" active={view === 'software'} onClick={() => handleNavClick('software')} />
          <NavItem icon={<CreditCard size={14} />} label="Licenties" active={view === 'licenses'} onClick={() => handleNavClick('licenses')} />
          <NavItem icon={<PhoneIcon size={14} />} label="Telefonie" active={view === 'phones'} onClick={() => handleNavClick('phones')} />

          <SectionLabel label="Processen" />
          <NavItem icon={<PackageCheck size={14} />} label="Aantreden checklist" active={view === 'starter-checklist'} onClick={() => handleNavClick('starter-checklist')} />
          <NavItem icon={<LogOut size={14} />} label="Weggaan checklist" active={view === 'leaver-checklist'} onClick={() => handleNavClick('leaver-checklist')} />

          <SectionLabel label="Rapportages" />
          <NavItem icon={<BarChart3 size={14} />} label="Overzichten" active={view === 'overviews'} onClick={() => handleNavClick('overviews')} />
          <NavItem icon={<History size={14} />} label="Historie" active={view === 'history'} onClick={() => handleNavClick('history')} />
          <NavItem icon={<FileText size={14} />} label="Contracten" active={view === 'contracts'} onClick={() => handleNavClick('contracts')} />
        </nav>

        <div className="px-2 pb-3 flex-shrink-0 border-t border-slate-800 pt-2 space-y-1">
          {clientLogoUrl && (
            <div className="px-3 py-2">
              <img src={clientLogoUrl} alt="Logo" className="h-8 max-w-full object-contain opacity-90" />
            </div>
          )}
          <NavItem icon={<Settings size={14} />} label="Instellingen" active={view === 'settings'} onClick={() => handleNavClick('settings')} />
          <div className="mt-2 px-3 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-violet-700 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              {(user?.email?.[0] ?? '').toUpperCase()}
            </div>
            <p className="text-xs text-slate-400 truncate flex-1">{user?.email}</p>
            <button
              onClick={toggleDarkMode}
              title={darkMode ? 'Lichte modus' : 'Donkere modus'}
              className="text-slate-500 hover:text-white transition-colors flex-shrink-0"
            >
              {darkMode ? <Sun size={13} /> : <Moon size={13} />}
            </button>
            <button onClick={handleLogout} title="Uitloggen" className="text-slate-500 hover:text-white transition-colors flex-shrink-0">
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* MSP banner — only visible when an org-admin has switched context */}
        {isMspMode && (
          <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700 px-6 py-2 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <ArrowLeftCircle size={15} />
              <span className="text-xs font-medium">
                MSP beheer modus — je beheert <strong>{user?.tenantName}</strong> namens{' '}
                <strong>{user?.switchedFromOrgName}</strong>
              </span>
            </div>
            <button
              onClick={handleSwitchBack}
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
            >
              <ArrowLeft size={13} />
              Terug naar {user?.switchedFromOrgName}
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 flex-shrink-0">
          <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{VIEW_TITLES[view]}</h1>
        </div>

        <div className="flex-1 overflow-hidden p-6">
          {view === 'employees' && (
            <EmployeeListView
              teammates={teammates}
              loading={loadingUsers}
              search={search}
              currentUserId={user?.id}
              departmentOptions={departmentOptions}
              onSearch={setSearch}
              onSelect={handleSelectEmployee}
              onAddEmployee={() => { fetchDepartmentOptions(); setShowAddEmployee(true) }}
            />
          )}

          {view === 'employee-detail' && (
            <EmployeeDetailView
              user={selectedUser}
              loading={loadingDetail}
              onBack={handleBackToList}
              onUserUpdated={() => { if (selectedUser) { fetchUserDetail(selectedUser.id); fetchUsers() } }}
              departments={departmentOptions}
              managers={managers}
            />
          )}

          {view === 'settings' && (
            <SettingsView
              teammates={teammates}
              tenantName={tenantName}
              onAddUser={() => setShowAddUser(true)}
            />
          )}

          {view === 'hardware' && (
            <HardwareView teammates={teammates} />
          )}

          {view === 'licenses' && (
            <LicenseView teammates={teammates} />
          )}

          {view === 'phones' && (
            <TelefonieView teammates={teammates} />
          )}

          {view === 'departments' && (
            <DepartmentsView />
          )}

          {(view === 'locations' ||
            view === 'software' ||
            view === 'starter-checklist' || view === 'leaver-checklist' ||
            view === 'overviews' || view === 'history' ||
            view === 'contracts' || view === 'help') && (
            <PlaceholderView title={VIEW_TITLES[view]} />
          )}
        </div>
      </div>

      <AddUserModal
        open={showAddUser}
        onClose={() => setShowAddUser(false)}
        onSuccess={() => { fetchUsers(); setShowAddUser(false) }}
        clientName={tenantName}
        apiEndpoint="/portal/users"
        departments={departmentOptions}
      />

      <AddEmployeeModal
        open={showAddEmployee}
        onClose={() => setShowAddEmployee(false)}
        onSuccess={() => { fetchUsers(); setShowAddEmployee(false) }}
        departments={departmentOptions}
        managers={managers}
      />
    </div>
  )
}
