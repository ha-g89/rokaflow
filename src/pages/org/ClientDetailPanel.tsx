import { useState, useRef } from 'react'
import {
  ExternalLink, Pencil, Package, Users, Shield, CreditCard,
  CheckCircle2, AlertTriangle, Zap, Lock, Ban, ShieldCheck,
  Loader2, Search, UserPlus, User, Mail, Calendar, X,
  Building2,
} from 'lucide-react'
import api from '@/lib/axios'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import type { ClientListItem } from '@/types/client'
import type { ClientUserListItem, ClientUserDetailResponse } from '@/types/clientUser'
import type { MyPlanDto, TenantPlanStatus } from '@/types/platformPlan'

// ── helpers ───────────────────────────────────────────────────────────────────

function fmt(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function trialDaysLeft(iso: string | null) {
  if (!iso) return null
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
}

const STATUS_META: Record<TenantPlanStatus, { label: string; icon: React.ReactNode; cls: string; bg: string }> = {
  Trial:       { label: 'Trial',        icon: <Zap size={14} />,           cls: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' },
  GracePeriod: { label: 'Grace period', icon: <AlertTriangle size={14} />, cls: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800' },
  Active:      { label: 'Actief',       icon: <CheckCircle2 size={14} />,  cls: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' },
  Blocked:     { label: 'Geblokkeerd',  icon: <Lock size={14} />,          cls: 'text-red-600 dark:text-red-400',     bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' },
}

// ── EditUserModal ─────────────────────────────────────────────────────────────

function EditUserModal({ user, clientId, onClose, onSaved }: {
  user: ClientUserDetailResponse; clientId: string; onClose: () => void; onSaved: () => void
}) {
  const [firstName, setFirstName] = useState(user.firstName)
  const [lastName,  setLastName]  = useState(user.lastName)
  const [email,     setEmail]     = useState(user.email)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const overlayRef                = useRef<HTMLDivElement>(null)

  const field = 'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25 transition-colors'

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) { setError('Voor- en achternaam zijn verplicht.'); return }
    setSaving(true); setError(null)
    try {
      await api.put(`/clients/${clientId}/users/${user.id}`, {
        firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() || null,
      })
      onSaved(); onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg ?? 'Opslaan mislukt.')
    } finally { setSaving(false) }
  }

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onMouseDown={e => { if (e.target === overlayRef.current) onClose() }}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Gebruiker wijzigen</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Voornaam *</label>
              <input value={firstName} onChange={e => setFirstName(e.target.value)} className={field} autoFocus />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Achternaam *</label>
              <input value={lastName} onChange={e => setLastName(e.target.value)} className={field} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">E-mailadres</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={field} placeholder="jan@bedrijf.nl" />
          </div>
          {error && <p className="text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            Annuleren
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-60">
            {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── PortalUserPanel ───────────────────────────────────────────────────────────

function PortalUserPanel({ user, clientId, onUserUpdated }: {
  user: ClientUserDetailResponse; clientId: string; onUserUpdated: () => void
}) {
  const [blocking, setBlocking] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const toggleActive = async () => {
    setBlocking(true)
    try {
      await api.put(`/clients/${clientId}/users/${user.id}/active`, { isActive: !user.isActive })
      onUserUpdated()
    } finally { setBlocking(false) }
  }

  return (
    <>
      {editOpen && <EditUserModal user={user} clientId={clientId} onClose={() => setEditOpen(false)} onSaved={onUserUpdated} />}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xl flex-shrink-0 select-none">
              {(user.firstName[0] ?? '').toUpperCase()}{(user.lastName[0] ?? '').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">{user.firstName} {user.lastName}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{user.email || '—'}</p>
              <span className={`inline-flex items-center gap-1 mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {user.isActive ? 'Actief' : 'Inactief'}
              </span>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 divide-y divide-slate-100 dark:divide-slate-700">
            {[
              { icon: <Mail size={13} />, label: 'E-mail', val: user.email || '—' },
              { icon: <Calendar size={13} />, label: 'Aangemaakt', val: fmt(user.createdAt) },
            ].map(r => (
              <div key={r.label} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-slate-400 flex-shrink-0">{r.icon}</span>
                <span className="text-xs text-slate-400 w-20 flex-shrink-0">{r.label}</span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{r.val}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2.5">
            <button onClick={() => setEditOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <Pencil size={13} /> Wijzigen
            </button>
            <button onClick={toggleActive} disabled={blocking}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-colors disabled:opacity-60 ${
                user.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>
              {blocking ? <Loader2 size={13} className="animate-spin" /> : user.isActive ? <Ban size={13} /> : <ShieldCheck size={13} />}
              {user.isActive ? 'Blokkeren' : 'Deblokkeren'}
            </button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

// ── UsageBar ──────────────────────────────────────────────────────────────────

function UsageBar({ used, max, label, icon }: { used: number; max: number | null; label: string; icon: React.ReactNode }) {
  const unlimited = !max || max === 0
  const pct       = unlimited ? 0 : Math.min(100, Math.round((used / max) * 100))
  const fillColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-blue-500'

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="text-slate-400">{icon}</span>
          {label}
        </div>
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          {used}{unlimited ? '' : ` / ${max}`}
          {!unlimited && <span className="text-slate-400 font-normal ml-1">({pct}%)</span>}
          {unlimited && <span className="text-slate-400 font-normal ml-1">gebruikers</span>}
        </span>
      </div>
      {!unlimited && (
        <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${fillColor}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  )
}

// ── DetailsTab ────────────────────────────────────────────────────────────────

function DetailsTab({ client, onSwitchToClient, switchingClientId, onEditClient }: {
  client: ClientListItem
  onSwitchToClient: (id: string) => void
  switchingClientId: string | null
  onEditClient: () => void
}) {
  return (
    <div className="p-5 space-y-5">
      {/* Logo + naam */}
      <div className="flex items-center gap-4">
        {client.logoDataUrl ? (
          <img src={client.logoDataUrl} alt="" className="w-16 h-16 rounded-2xl object-contain bg-slate-100 dark:bg-slate-700 p-1 flex-shrink-0 border border-slate-200 dark:border-slate-600" />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-2xl font-bold text-white">{client.name[0]?.toUpperCase()}</span>
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">{client.name}</h2>
          <span className={`inline-flex items-center gap-1 mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
            client.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${client.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
            {client.isActive ? 'Actief' : 'Inactief'}
          </span>
        </div>
      </div>

      {/* Info rows */}
      <div className="rounded-xl border border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden">
        {[
          { icon: <Building2 size={13} />, label: 'Bedrijfsnaam', val: client.name },
          { icon: <Users size={13} />,     label: 'Gebruikers',   val: `${client.userCount} portaalgebruiker${client.userCount !== 1 ? 's' : ''}` },
          { icon: <Calendar size={13} />,  label: 'Aangemaakt',   val: fmt(client.createdAt) },
        ].map(r => (
          <div key={r.label} className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50">
            <span className="text-slate-400 flex-shrink-0">{r.icon}</span>
            <span className="text-xs text-slate-400 w-28 flex-shrink-0">{r.label}</span>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{r.val}</span>
          </div>
        ))}
      </div>

      {/* Acties */}
      <div className="flex gap-3">
        <button
          onClick={() => onSwitchToClient(client.id)}
          disabled={switchingClientId === client.id}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {switchingClientId === client.id
            ? <Loader2 size={14} className="animate-spin" />
            : <ExternalLink size={14} />}
          Portaal openen
        </button>
        <button
          onClick={onEditClient}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <Pencil size={14} />
          Wijzigen
        </button>
      </div>
    </div>
  )
}

// ── AbonnementTab ─────────────────────────────────────────────────────────────

function AbonnementTab({ plan }: { plan: MyPlanDto | null }) {
  if (!plan) return (
    <div className="p-5 flex flex-col items-center justify-center gap-2 text-center min-h-[200px]">
      <CreditCard size={28} className="text-slate-300 dark:text-slate-600" />
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Geen abonnement gekoppeld</p>
      <p className="text-xs text-slate-400">Ga naar Abonnementen om een plan te koppelen.</p>
    </div>
  )

  const meta = STATUS_META[plan.status]
  const days = plan.status === 'Trial' ? trialDaysLeft(plan.trialEndsAt) : plan.status === 'GracePeriod' ? trialDaysLeft(plan.graceEndsAt) : null

  return (
    <div className="p-5 space-y-5">
      {/* Status card */}
      <div className={`rounded-xl border p-4 ${meta.bg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className={meta.cls}>{meta.icon}</span>
            <div>
              <p className={`text-sm font-bold ${meta.cls}`}>
                {plan.status === 'Active' ? (plan.planName ?? 'Actief abonnement') : meta.label}
              </p>
              {plan.status === 'Active' && plan.planName && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Actief abonnement</p>
              )}
            </div>
          </div>
          {days !== null && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
              days <= 7 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
              {days > 0 ? `${days} dag${days !== 1 ? 'en' : ''} resterend` : 'Verlopen'}
            </span>
          )}
        </div>
      </div>

      {/* Usage bars */}
      <div>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Verbruik</p>
        <div className="space-y-4">
          <UsageBar used={plan.usedAssets}      max={plan.maxAssets ?? null}      label="Assets"            icon={<Package size={12} />} />
          <UsageBar used={plan.usedEmployees}   max={plan.maxEmployees ?? null}   label="Medewerkers"       icon={<Users size={12} />} />
          <UsageBar used={plan.usedPortalUsers} max={plan.maxPortalUsers ?? null} label="Portaalgebruikers" icon={<Shield size={12} />} />
        </div>
      </div>

      {/* Datums */}
      <div>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Datums</p>
        <div className="rounded-xl border border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden">
          {[
            { label: 'Trial verloopt',  val: fmt(plan.trialEndsAt),  show: !!plan.trialEndsAt },
            { label: 'Grace verloopt',  val: fmt(plan.graceEndsAt),  show: !!plan.graceEndsAt },
            { label: 'Geactiveerd op',  val: fmt(plan.activatedAt),  show: !!plan.activatedAt },
          ].filter(r => r.show).map(r => (
            <div key={r.label} className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50">
              <Calendar size={13} className="text-slate-400 flex-shrink-0" />
              <span className="text-xs text-slate-400 w-28 flex-shrink-0">{r.label}</span>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{r.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── GebruikersTab ─────────────────────────────────────────────────────────────

function GebruikersTab({ client, users, loadingUsers, selectedUser, loadingDetail, onSelectUser, onAddUser, onUserUpdated }: {
  client: ClientListItem
  users: ClientUserListItem[]
  loadingUsers: boolean
  selectedUser: ClientUserDetailResponse | null
  loadingDetail: boolean
  onSelectUser: (id: string) => void
  onAddUser: () => void
  onUserUpdated: () => void
}) {
  const [search, setSearch] = useState('')
  const portalUsers  = users.filter(u => u.isPortalUser)
  const filtered     = portalUsers.filter(u =>
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex h-full min-h-0">
      {/* User list */}
      <div className="w-56 flex-shrink-0 flex flex-col border-r border-slate-100 dark:border-slate-700">
        <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Zoeken…"
              className="w-full pl-6 pr-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-400 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25" />
          </div>
          <button onClick={onAddUser} title="Toevoegen"
            className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex-shrink-0">
            <UserPlus size={12} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingUsers ? (
            <LoadingState label="Laden…" size="sm" />
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center">
              <User size={22} className="mx-auto mb-1.5 text-slate-200 dark:text-slate-700" />
              <p className="text-xs text-slate-400">
                {portalUsers.length === 0 ? 'Geen portaalgebruikers.' : 'Geen resultaten.'}
              </p>
              {portalUsers.length === 0 && (
                <button onClick={onAddUser} className="mt-1 text-xs text-blue-500 hover:underline">Toevoegen</button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filtered.map(u => (
                <li key={u.id}>
                  <button onClick={() => onSelectUser(u.id)}
                    className={`w-full text-left px-3 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                      selectedUser?.id === u.id ? 'bg-blue-50 dark:bg-blue-950/30 border-l-2 border-blue-500' : ''}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {u.firstName[0]?.toUpperCase()}{u.lastName[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-slate-400 truncate">{u.email}</p>
                      </div>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${u.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* User detail */}
      <div className="flex-1 overflow-y-auto p-4">
        {loadingDetail ? (
          <Card className="flex items-center justify-center h-40">
            <LoadingState label="Laden…" size="sm" />
          </Card>
        ) : !selectedUser ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-center min-h-[200px]">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <User size={20} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-sm font-medium text-slate-400">Selecteer een gebruiker</p>
          </div>
        ) : (
          <PortalUserPanel user={selectedUser} clientId={client.id} onUserUpdated={onUserUpdated} />
        )}
      </div>
    </div>
  )
}

// ── ClientDetailPanel ─────────────────────────────────────────────────────────

type DetailTab = 'details' | 'abonnement' | 'gebruikers'

export interface ClientDetailPanelProps {
  client: ClientListItem
  plan: MyPlanDto | null
  users: ClientUserListItem[]
  loadingUsers: boolean
  selectedUser: ClientUserDetailResponse | null
  loadingDetail: boolean
  switchingClientId: string | null
  onSelectUser: (userId: string) => void
  onAddUser: () => void
  onUserUpdated: () => void
  onSwitchToClient: (clientId: string) => void
  onEditClient: () => void
}

const TABS: { id: DetailTab; label: string; icon: React.ReactNode }[] = [
  { id: 'details',      label: 'Details',      icon: <Building2 size={13} /> },
  { id: 'abonnement',   label: 'Abonnement',   icon: <CreditCard size={13} /> },
  { id: 'gebruikers',   label: 'Gebruikers',   icon: <Users size={13} /> },
]

export function ClientDetailPanel({
  client, plan, users, loadingUsers, selectedUser, loadingDetail,
  switchingClientId, onSelectUser, onAddUser, onUserUpdated, onSwitchToClient, onEditClient,
}: ClientDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('details')
  const portalUserCount = users.filter(u => u.isPortalUser).length

  return (
    <Card className="flex-1 flex flex-col overflow-hidden h-full">

      {/* ── Panel header ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {client.logoDataUrl ? (
            <img src={client.logoDataUrl} alt="" className="w-9 h-9 rounded-xl object-contain bg-white border border-slate-200 dark:border-slate-600 p-0.5 flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-sm font-bold text-white">{client.name[0]?.toUpperCase()}</span>
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{client.name}</h2>
            {plan && (
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <Shield size={10} />
                {plan.status === 'Active' ? (plan.planName ?? 'Actief') : STATUS_META[plan.status].label}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex border-b border-slate-100 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-800">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-5 py-3 text-xs font-semibold transition-colors relative border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.id === 'gebruikers' && portalUserCount > 0 && (
              <span className="ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium">
                {portalUserCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className={`flex-1 min-h-0 ${activeTab === 'gebruikers' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {activeTab === 'details' && (
          <DetailsTab
            client={client}
            onSwitchToClient={onSwitchToClient}
            switchingClientId={switchingClientId}
            onEditClient={onEditClient}
          />
        )}
        {activeTab === 'abonnement' && <AbonnementTab plan={plan} />}
        {activeTab === 'gebruikers' && (
          <GebruikersTab
            client={client}
            users={users}
            loadingUsers={loadingUsers}
            selectedUser={selectedUser}
            loadingDetail={loadingDetail}
            onSelectUser={onSelectUser}
            onAddUser={onAddUser}
            onUserUpdated={onUserUpdated}
          />
        )}
      </div>

    </Card>
  )
}
