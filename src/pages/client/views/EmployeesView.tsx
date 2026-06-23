import { useState, useEffect } from 'react'
import {
  Users, ArrowLeft, Laptop, CreditCard, Smartphone,
  CheckCircle2, AlertTriangle, Trash2, UserPlus,
  Search, MoreVertical, ChevronRight,
} from 'lucide-react'
import api from '@/lib/axios'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingState, SkeletonRow } from '@/components/ui/LoadingState'
import { Avatar, StatCard } from '@/components/portal/PortalUI'
import { UserDetailPanel } from '@/components/UserDetailPanel'
import type { ClientUserListItem, ClientUserDetailResponse } from '@/types/clientUser'
import { STATUS_LABEL, STATUS_TONE } from '@/types/clientUser'
import type { LocationListItem } from '@/types/location'

export function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── Delete employee modal ─────────────────────────────────────────────────────

type Blocker = { icon: React.ReactNode; type: string; name: string }

export function DeleteEmployeeModal({ userId, userName, onClose, onDeleted }: {
  userId: string
  userName: string
  onClose: () => void
  onDeleted: () => void
}) {
  const [detail, setDetail]             = useState<ClientUserDetailResponse | null>(null)
  const [loading, setLoading]           = useState(true)
  const [deleting, setDeleting]         = useState(false)
  const [apiError, setApiError]         = useState<string | null>(null)
  const [acknowledged, setAcknowledged] = useState(false)

  useEffect(() => {
    api.get<ClientUserDetailResponse>(`/portal/users/${userId}`)
      .then(r => setDetail(r.data))
      .catch(() => setApiError('Kan medewerkergegevens niet ophalen.'))
      .finally(() => setLoading(false))
  }, [userId])

  const blockers: Blocker[] = detail ? [
    ...detail.hardware
      .filter(h => !h.isReturned)
      .map(h => ({ icon: <Laptop size={12} />, type: 'Hardware', name: `${h.brand} ${h.name}`.trim() || h.name })),
    ...detail.licenses
      .filter(l => l.isActive)
      .map(l => ({ icon: <CreditCard size={12} />, type: 'Licentie', name: l.name })),
    ...detail.phones
      .map(p => ({ icon: <Smartphone size={12} />, type: 'Telefoon', name: `${p.brand} ${p.model}`.trim() })),
  ] : []

  const isBlocked = blockers.length > 0
  const canDelete = !loading && !isBlocked && !apiError && acknowledged

  const handleDelete = async () => {
    setDeleting(true)
    setApiError(null)
    try {
      await api.delete(`/portal/employees/${userId}`)
      onDeleted()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(msg ?? 'Verwijderen mislukt. Controleer of alle zaken zijn ontkoppeld.')
      setDeleting(false)
    }
  }

  const grouped = blockers.reduce<Record<string, Blocker[]>>((acc, b) => {
    ;(acc[b.type] ??= []).push(b)
    return acc
  }, {})

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 modal-backdrop-animated">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden modal-panel-animated">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isBlocked ? 'bg-amber-100' : 'bg-red-100'}`}>
              {isBlocked
                ? <AlertTriangle size={18} className="text-amber-600" />
                : <Trash2 size={18} className="text-red-600" />
              }
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Medewerker verwijderen</h2>
              <p className="text-sm text-slate-500 mt-0.5">{userName}</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : apiError && !detail ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
              <AlertTriangle size={14} className="flex-shrink-0" /> {apiError}
            </div>
          ) : isBlocked ? (
            <>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100 mb-4">
                <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">Verwijderen geblokkeerd.</span> Ontkoppel eerst alle gekoppelde zaken van deze medewerker.
                </p>
              </div>
              <div className="space-y-3">
                {Object.entries(grouped).map(([type, items]) => (
                  <div key={type}>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      {items[0].icon}
                      {type} <span className="font-normal text-slate-400">({items.length})</span>
                    </p>
                    <div className="space-y-1">
                      {items.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                          <p className="text-sm text-slate-700 truncate">{item.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-100 mb-4">
                <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-600">
                  Alle zaken zijn ontkoppeld. Deze medewerker kan definitief worden verwijderd.
                </p>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Het account van <span className="font-medium text-slate-500">{userName}</span> en alle bijbehorende gegevens worden permanent verwijderd.
              </p>
              <label className="flex items-start gap-3 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={e => setAcknowledged(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-red-600 cursor-pointer flex-shrink-0"
                />
                <span className="text-sm text-slate-400 group-hover:text-slate-600 transition-colors">
                  Ik begrijp dat dit <span className="font-medium text-red-400">niet ongedaan kan worden gemaakt</span>.
                </span>
              </label>
            </>
          )}
          {apiError && detail && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700 mt-3">
              <AlertTriangle size={14} className="flex-shrink-0" /> {apiError}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <Button variant="secondary" size="sm" onClick={onClose}>Annuleren</Button>
          <Button variant="danger" size="sm" disabled={!canDelete || deleting} onClick={handleDelete}>
            {deleting ? (
              <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Verwijderen…</>
            ) : (
              <><Trash2 size={13} /> Definitief verwijderen</>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Employee list view ────────────────────────────────────────────────────────

export function EmployeeListView({ teammates, loading, search, currentUserId, onSearch, onSelect, onAddEmployee, onDelete }: {
  teammates: ClientUserListItem[]
  loading: boolean
  search: string
  currentUserId: string | undefined
  onSearch: (v: string) => void
  onSelect: (id: string) => void
  onAddEmployee: () => void
  onDelete: (id: string, name: string) => void
}) {
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const filtered = teammates.filter(t =>
    `${t.firstName} ${t.lastName} ${t.email} ${t.departmentName} ${t.jobTitle}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const cols = 'grid-cols-[2.5fr_1fr_1fr_1fr_1fr_1fr_80px_90px_40px]'

  const totaalMedewerkers = teammates.length
  const inDienst          = teammates.filter(t => t.status === 'InService').length
  const totaleAssets      = teammates.reduce((s, t) => s + t.hardwareCount, 0)
  const totaleLicenties   = teammates.reduce((s, t) => s + t.licenseCount, 0)

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="grid grid-cols-4 gap-3 flex-shrink-0">
        <StatCard label="Medewerkers"      value={totaalMedewerkers} icon={<Users size={18} />} />
        <StatCard label="In dienst"        value={inDienst}          icon={<CheckCircle2 size={18} />} tone="emerald" />
        <StatCard label="Totale assets"    value={totaleAssets}      icon={<Laptop size={18} />}       tone="blue" />
        <StatCard label="Totale licenties" value={totaleLicenties}   icon={<CreditCard size={18} />}   tone="blue" />
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Zoek op naam, e-mail of afdeling…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-400"
          />
        </div>
        <span className="text-xs text-slate-400 flex-1">{filtered.length} medewerker{filtered.length !== 1 ? 's' : ''}</span>
        <Button size="sm" onClick={onAddEmployee}>
          <UserPlus size={13} /> Medewerker toevoegen
        </Button>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col">
        <div className={`grid ${cols} gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100`}>
          {['Naam', 'Manager', 'Afdeling', 'Functie', 'Startdatum', 'Status', 'Assets', 'Licenties', ''].map(h => (
            <span key={h} className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{h}</span>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <Users size={36} className="mx-auto mb-3 text-slate-200" />
              <p className="text-sm text-slate-400">Geen medewerkers gevonden.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map(u => (
                <li key={u.id} className={`grid ${cols} gap-3 px-5 py-3.5 hover:bg-slate-100 transition-colors items-center`}>
                  <button className="flex items-center gap-3 min-w-0 text-left" onClick={() => onSelect(u.id)}>
                    <Avatar first={u.firstName} last={u.lastName} size={48} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800 truncate">{u.firstName} {u.lastName}</p>
                        {u.id === currentUserId && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full font-medium">Jij</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">{u.email || '—'}</p>
                    </div>
                  </button>
                  <p className="text-sm text-slate-500 truncate">{u.managerName || ''}</p>
                  {u.departmentName ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium truncate w-fit max-w-full">
                      {u.departmentName}
                    </span>
                  ) : <span />}
                  <p className="text-sm text-slate-500 truncate">{u.jobTitle || '—'}</p>
                  <p className="text-sm text-slate-500">{fmtDate(u.startDate)}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${STATUS_TONE[u.status]}`}
                    title={
                      u.status === 'StartPlanned' && u.startDate ? `In dienst per ${fmtDate(u.startDate)}`
                      : u.status === 'LeavePlanned' && u.leaveDate ? `Uit dienst per ${fmtDate(u.leaveDate)}`
                      : undefined
                    }
                  >
                    {STATUS_LABEL[u.status]}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Laptop size={12} className="text-slate-400 flex-shrink-0" />
                    <span>{u.hardwareCount}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <CreditCard size={12} className="text-slate-400 flex-shrink-0" />
                    <span>{u.licenseCount}</span>
                  </div>
                  <div className="relative flex justify-end">
                    <button
                      onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}
                      onBlur={() => setTimeout(() => setOpenMenu(null), 150)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <MoreVertical size={15} />
                    </button>
                    {openMenu === u.id && (
                      <div className="absolute right-0 top-7 z-20 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 text-sm">
                        <button
                          onClick={() => { setOpenMenu(null); onSelect(u.id) }}
                          className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                        >
                          <ChevronRight size={13} className="text-slate-400" /> Details bekijken
                        </button>
                        <div className="my-1 border-t border-slate-100" />
                        <button
                          onClick={() => { setOpenMenu(null); onDelete(u.id, `${u.firstName} ${u.lastName}`) }}
                          className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 size={13} /> Verwijderen
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

// ── Employee detail view ──────────────────────────────────────────────────────

export function EmployeeDetailView({ user, loading, onBack, onUserUpdated, onDelete, departments, managers, locations, teammates, onHardwareClick, onPhoneClick }: {
  user: ClientUserDetailResponse | null
  loading: boolean
  onBack: () => void
  onUserUpdated?: () => void
  onDelete?: (id: string, name: string) => void
  departments?: { id: string; name: string; managerId: string | null }[]
  managers?: { id: string; fullName: string }[]
  locations?: LocationListItem[]
  teammates?: ClientUserListItem[]
  onHardwareClick?: (asset: import('@/types/hardware').HardwareAssetListItem) => void
  onPhoneClick?: (phone: import('@/types/phone').PhoneListItem) => void
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
          <Card className="flex items-center justify-center py-16">
            <LoadingState label="Medewerker laden…" />
          </Card>
        ) : !user ? null : (
          <UserDetailPanel
            user={user}
            canEdit
            departments={departments}
            managers={managers}
            locations={locations}
            teammates={teammates}
            checklistBasePath={`/portal/users/${user.id}`}
            historyPath={`/portal/history/User/${user.id}`}
            softwarePath="/portal/software"
            onUserUpdated={onUserUpdated}
            onDelete={onDelete ? () => onDelete(user.id, `${user.firstName} ${user.lastName}`) : undefined}
            onHardwareClick={onHardwareClick}
            onPhoneClick={onPhoneClick}
          />
        )}
      </div>
    </div>
  )
}
