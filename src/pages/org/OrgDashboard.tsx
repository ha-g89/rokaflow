import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Briefcase, Users, Plus, LogOut,
  Building2, Search, UserPlus, User, ExternalLink, Loader2,
  MoreVertical, Pencil, X, Mail, Ban, ShieldCheck, Calendar, ImagePlus,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/axios'
import type { SwitchToClientResponse } from '@/types/auth'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AddClientModal } from '@/components/AddClientModal'
import { AddUserModal } from '@/components/AddUserModal'
import type { ClientListItem } from '@/types/client'
import type { ClientUserListItem, ClientUserDetailResponse } from '@/types/clientUser'

// ── helpers ───────────────────────────────────────────────────────────────────

function fmt(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── small components ──────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number; color: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className={`p-2.5 rounded-lg ${color}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function Avatar({ first, last, size = 8 }: { first: string; last: string; size?: number }) {
  const s = `w-${size} h-${size}`
  return (
    <div className={`${s} rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold flex-shrink-0`}>
      {(first[0] ?? '').toUpperCase()}{(last[0] ?? '').toUpperCase()}
    </div>
  )
}

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-medium ${
      isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
      {isActive ? 'Actief' : 'Inactief'}
    </span>
  )
}

// ── OrgEditUserModal ──────────────────────────────────────────────────────────

function OrgEditUserModal({ user, clientId, onClose, onSaved }: {
  user: ClientUserDetailResponse
  clientId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [firstName, setFirstName] = useState(user.firstName)
  const [lastName, setLastName]   = useState(user.lastName)
  const [email, setEmail]         = useState(user.email)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const overlayRef                = useRef<HTMLDivElement>(null)

  const field = 'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-colors'

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) { setError('Voor- en achternaam zijn verplicht.'); return }
    setSaving(true); setError(null)
    try {
      await api.put(`/clients/${clientId}/users/${user.id}`, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || null,
      })
      onSaved()
      onClose()
    } catch {
      setError('Opslaan mislukt. Probeer het opnieuw.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onMouseDown={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Gebruiker wijzigen</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Voornaam *</label>
              <input value={firstName} onChange={e => setFirstName(e.target.value)} className={field} autoFocus />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Achternaam *</label>
              <input value={lastName} onChange={e => setLastName(e.target.value)} className={field} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">E-mailadres</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={field} placeholder="jan@bedrijf.nl" />
          </div>
          {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-xl bg-violet-600 text-sm font-medium text-white hover:bg-violet-700 transition-colors disabled:opacity-60"
          >
            {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── OrgPortalUserPanel ────────────────────────────────────────────────────────

function OrgPortalUserPanel({ user, clientId, onUserUpdated }: {
  user: ClientUserDetailResponse
  clientId: string
  onUserUpdated: () => void
}) {
  const [blocking, setBlocking]   = useState(false)
  const [editOpen, setEditOpen]   = useState(false)

  const toggleActive = async () => {
    setBlocking(true)
    try {
      await api.put(`/clients/${clientId}/users/${user.id}/active`, { isActive: !user.isActive })
      onUserUpdated()
    } finally {
      setBlocking(false)
    }
  }

  return (
    <>
      {editOpen && (
        <OrgEditUserModal
          user={user}
          clientId={clientId}
          onClose={() => setEditOpen(false)}
          onSaved={onUserUpdated}
        />
      )}

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6">

          {/* Avatar + naam + email + badge */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-2xl flex-shrink-0 select-none">
              {(user.firstName[0] ?? '').toUpperCase()}{(user.lastName[0] ?? '').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-slate-900 leading-tight truncate">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-sm text-slate-500 truncate mt-0.5">{user.email}</p>
              <div className="mt-2">
                <ActiveBadge isActive={user.isActive} />
              </div>
            </div>
          </div>

          {/* Info blok */}
          <div className="mt-5 rounded-xl bg-slate-50 divide-y divide-slate-100">
            <div className="flex items-center gap-3 px-4 py-3">
              <Mail size={14} className="text-slate-400 flex-shrink-0" />
              <span className="text-xs text-slate-400 w-20 flex-shrink-0">E-mail</span>
              <span className="text-xs font-medium text-slate-700 truncate">{user.email || '—'}</span>
            </div>
            {(user.departmentName || user.department) && (
              <div className="flex items-center gap-3 px-4 py-3">
                <Briefcase size={14} className="text-slate-400 flex-shrink-0" />
                <span className="text-xs text-slate-400 w-20 flex-shrink-0">Afdeling</span>
                <span className="text-xs font-medium text-slate-700 truncate">{user.departmentName || user.department}</span>
              </div>
            )}
            <div className="flex items-center gap-3 px-4 py-3">
              <Calendar size={14} className="text-slate-400 flex-shrink-0" />
              <span className="text-xs text-slate-400 w-20 flex-shrink-0">Aangemaakt</span>
              <span className="text-xs font-medium text-slate-700">{fmt(user.createdAt)}</span>
            </div>
          </div>

          {/* Actie knoppen */}
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => setEditOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              <Pencil size={14} />
              Wijzigen
            </button>
            <button
              onClick={toggleActive}
              disabled={blocking}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors disabled:opacity-60 ${
                user.isActive
                  ? 'border-red-200 text-red-600 hover:bg-red-50'
                  : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              {blocking
                ? <Loader2 size={14} className="animate-spin" />
                : user.isActive
                  ? <Ban size={14} />
                  : <ShieldCheck size={14} />
              }
              {user.isActive ? 'Blokkeren' : 'Deblokkeren'}
            </button>
          </div>

        </CardContent>
      </Card>
    </>
  )
}

// ── main component ────────────────────────────────────────────────────────────

type View = 'clients' | 'users' | 'detail'

export default function OrgDashboard() {
  const { user, logout, switchToClient } = useAuthStore()
  const navigate = useNavigate()

  const [clients, setClients]               = useState<ClientListItem[]>([])
  const [selectedClient, setSelectedClient] = useState<ClientListItem | null>(null)
  const [clientUsers, setClientUsers]       = useState<ClientUserListItem[]>([])
  const [selectedUser, setSelectedUser]     = useState<ClientUserDetailResponse | null>(null)
  const [view, setView]                     = useState<View>('clients')
  const [loadingClients, setLoadingClients] = useState(true)
  const [loadingUsers, setLoadingUsers]     = useState(false)
  const [loadingDetail, setLoadingDetail]   = useState(false)
  const [showAddClient, setShowAddClient]   = useState(false)
  const [showAddUser, setShowAddUser]       = useState(false)
  const [clientSearch, setClientSearch]     = useState('')
  const [userSearch, setUserSearch]         = useState('')
  const [switchingClientId, setSwitchingClientId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId]         = useState<string | null>(null)
  const [editClient, setEditClient]         = useState<ClientListItem | null>(null)
  const [editName, setEditName]             = useState('')
  const [editSaving, setEditSaving]         = useState(false)
  const [editLogoFile, setEditLogoFile]     = useState<File | null>(null)
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null)
  const [editLogoDeleted, setEditLogoDeleted] = useState(false)
  const editLogoInputRef                    = useRef<HTMLInputElement>(null)

  const fetchClients = useCallback(async () => {
    try {
      const { data } = await api.get<ClientListItem[]>('/clients')
      setClients(data)
    } finally { setLoadingClients(false) }
  }, [])

  const fetchUsers = useCallback(async (clientId: string) => {
    setLoadingUsers(true)
    setClientUsers([])
    try {
      const { data } = await api.get<ClientUserListItem[]>(`/clients/${clientId}/users`)
      setClientUsers(data)
    } finally { setLoadingUsers(false) }
  }, [])

  const fetchUserDetail = useCallback(async (clientId: string, userId: string) => {
    setLoadingDetail(true)
    try {
      const { data } = await api.get<ClientUserDetailResponse>(`/clients/${clientId}/users/${userId}`)
      setSelectedUser(data)
    } finally { setLoadingDetail(false) }
  }, [])

  useEffect(() => { fetchClients() }, [fetchClients])

  const handleSelectClient = (client: ClientListItem) => {
    setSelectedClient(client)
    setSelectedUser(null)
    setView('users')
    fetchUsers(client.id)
  }

  const handleSelectUser = (userId: string) => {
    if (!selectedClient) return
    setView('detail')
    fetchUserDetail(selectedClient.id, userId)
  }

  const handleUserUpdated = () => {
    if (selectedClient && selectedUser)
      fetchUserDetail(selectedClient.id, selectedUser.id)
  }

  const handleEditClientFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setEditLogoFile(file)
    setEditLogoDeleted(false)
    const reader = new FileReader()
    reader.onload = ev => setEditLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleRenameClient = async () => {
    if (!editClient || !editName.trim()) return
    setEditSaving(true)
    try {
      await api.put(`/clients/${editClient.id}`, { name: editName.trim() })

      let newLogoUrl = editClient.logoDataUrl ?? null
      if (editLogoDeleted) {
        await api.delete(`/clients/${editClient.id}/logo`)
        newLogoUrl = null
      } else if (editLogoFile) {
        const form = new FormData()
        form.append('file', editLogoFile)
        const { data } = await api.post<{ logoDataUrl: string }>(`/clients/${editClient.id}/logo`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        newLogoUrl = data.logoDataUrl
      }

      setClients(prev => prev.map(c =>
        c.id === editClient.id ? { ...c, name: editName.trim(), logoDataUrl: newLogoUrl } : c
      ))
      if (selectedClient?.id === editClient.id)
        setSelectedClient(prev => prev ? { ...prev, name: editName.trim(), logoDataUrl: newLogoUrl } : prev)

      setEditClient(null)
      setEditLogoFile(null)
      setEditLogoPreview(null)
      setEditLogoDeleted(false)
    } finally {
      setEditSaving(false)
    }
  }

  const handleSwitchToClient = async (clientId: string) => {
    setSwitchingClientId(clientId)
    try {
      const { data } = await api.post<SwitchToClientResponse>(`/clients/${clientId}/switch`)
      switchToClient(data.switchToken)
      navigate('/client')
    } catch {
      // handled by global interceptor
    } finally {
      setSwitchingClientId(null)
    }
  }

  const handleLogout = () => { logout(); navigate('/login') }

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()))

  // alleen portal users tonen (niet de employee-only records)
  const portalUsers = clientUsers.filter(u => u.isPortalUser)
  const filteredUsers = portalUsers.filter(u =>
    `${u.firstName} ${u.lastName} ${u.email}`
      .toLowerCase().includes(userSearch.toLowerCase()))

  const totalUsers    = clients.reduce((s, c) => s + c.userCount, 0)
  const activeClients = clients.filter(c => c.isActive).length

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between shadow-md flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <Building2 size={20} className="text-violet-400" />
          <span className="font-bold text-base">{user?.tenantName ?? 'Organisatie'}</span>
          <span className="text-slate-500 text-xs ml-1.5 uppercase tracking-wider">Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 hover:text-white">
            <LogOut size={14} /> Logout
          </Button>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-5 flex flex-col gap-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard icon={<Briefcase size={18} className="text-violet-600" />} label="Totaal clients" value={clients.length} color="bg-violet-50" />
          <StatCard icon={<Briefcase size={18} className="text-emerald-600" />} label="Actieve clients" value={activeClients} color="bg-emerald-50" />
          <StatCard icon={<Users size={18} className="text-violet-600" />} label="Totaal gebruikers" value={totalUsers} color="bg-violet-50" />
        </div>

        {/* Three-column layout */}
        <div className="flex gap-4 flex-1 min-h-0" style={{ minHeight: '560px' }}>

          {/* Col 1 — Clients */}
          <div className="w-60 flex-shrink-0 flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={clientSearch} onChange={e => setClientSearch(e.target.value)}
                  placeholder="Zoek client…"
                  className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-violet-400" />
              </div>
              <Button size="sm" onClick={() => setShowAddClient(true)} title="Client toevoegen">
                <Plus size={13} />
              </Button>
            </div>
            <Card className="flex-1 overflow-hidden flex flex-col">
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Clients</span>
                <span className="text-xs text-slate-400">{filteredClients.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loadingClients
                  ? <div className="p-4 text-center text-xs text-slate-400">Laden…</div>
                  : filteredClients.length === 0
                    ? <div className="p-4 text-center text-xs text-slate-400">Geen clients.</div>
                    : <ul className="divide-y divide-slate-100">
                        {filteredClients.map(c => (
                          <li key={c.id}>
                            <button
                              onClick={() => handleSelectClient(c)}
                              className={`w-full text-left px-3 py-2.5 hover:bg-slate-100 transition-colors flex items-center justify-between gap-2 ${
                                selectedClient?.id === c.id ? 'bg-violet-50 border-l-2 border-violet-500' : ''}`}
                            >
                              {c.logoDataUrl
                                ? <img src={c.logoDataUrl} alt="" className="w-7 h-7 rounded-lg object-contain bg-slate-100 flex-shrink-0" />
                                : <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-bold text-violet-600">{c.name[0]?.toUpperCase()}</span>
                                  </div>
                              }
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-slate-800 truncate">{c.name}</p>
                                <p className="text-xs text-slate-400">{c.userCount} gebruikers</p>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleSwitchToClient(c.id) }}
                                  disabled={switchingClientId === c.id}
                                  title="Beheer portaal"
                                  className="p-1 rounded hover:bg-violet-100 text-violet-400 hover:text-violet-600 transition-colors disabled:opacity-50"
                                >
                                  {switchingClientId === c.id
                                    ? <Loader2 size={13} className="animate-spin" />
                                    : <ExternalLink size={13} />
                                  }
                                </button>
                                <div className="relative">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === c.id ? null : c.id) }}
                                    className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                                  >
                                    <MoreVertical size={13} />
                                  </button>
                                  {openMenuId === c.id && (
                                    <div className="absolute right-0 top-6 z-20 w-36 rounded-xl border border-slate-200 bg-white shadow-lg py-1">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setEditClient(c); setEditName(c.name); setOpenMenuId(null) }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                                      >
                                        <Pencil size={12} /> Wijzigen
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                }
              </div>
            </Card>
          </div>

          {/* Col 2 — Portal users */}
          <div className="w-64 flex-shrink-0 flex flex-col gap-2">
            {!selectedClient
              ? <Card className="flex-1 flex items-center justify-center">
                  <p className="text-xs text-slate-400">Selecteer een client</p>
                </Card>
              : <>
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                        placeholder="Zoek gebruiker…"
                        className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-violet-400" />
                    </div>
                    <Button size="sm" onClick={() => setShowAddUser(true)} title="Gebruiker toevoegen">
                      <UserPlus size={13} />
                    </Button>
                  </div>
                  <Card className="flex-1 overflow-hidden flex flex-col">
                    <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{selectedClient.name}</span>
                      <span className="text-xs text-slate-400 flex-shrink-0 ml-1">{filteredUsers.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {loadingUsers
                        ? <div className="p-4 text-center text-xs text-slate-400">Laden…</div>
                        : filteredUsers.length === 0
                          ? <div className="p-4 text-center">
                              <User size={24} className="mx-auto mb-1 text-slate-200" />
                              <p className="text-xs text-slate-400">Geen portalgebruikers.</p>
                              <button onClick={() => setShowAddUser(true)} className="mt-1 text-xs text-violet-500 hover:underline">Toevoegen</button>
                            </div>
                          : <ul className="divide-y divide-slate-100">
                              {filteredUsers.map(u => (
                                <li key={u.id}>
                                  <button
                                    onClick={() => handleSelectUser(u.id)}
                                    className={`w-full text-left px-3 py-2.5 hover:bg-slate-100 transition-colors ${
                                      selectedUser?.id === u.id ? 'bg-violet-50 border-l-2 border-violet-500' : ''}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Avatar first={u.firstName} last={u.lastName} size={7} />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-slate-800 truncate">
                                          {u.firstName} {u.lastName}
                                        </p>
                                        <p className="text-xs text-slate-400 truncate">{u.email}</p>
                                      </div>
                                      <ActiveBadge isActive={u.isActive} />
                                    </div>
                                  </button>
                                </li>
                              ))}
                            </ul>
                      }
                    </div>
                  </Card>
                </>
            }
          </div>

          {/* Col 3 — Portal user detail */}
          <div className="flex-1 overflow-y-auto min-w-0">
            {loadingDetail ? (
              <Card className="h-40 flex items-center justify-center">
                <Loader2 size={20} className="animate-spin text-slate-300" />
              </Card>
            ) : !selectedUser ? (
              <Card className="h-40 flex items-center justify-center">
                <p className="text-xs text-slate-400">Selecteer een gebruiker</p>
              </Card>
            ) : (
              <OrgPortalUserPanel
                user={selectedUser}
                clientId={selectedClient!.id}
                onUserUpdated={handleUserUpdated}
              />
            )}
          </div>

        </div>
      </div>

      {/* Modals */}
      <AddClientModal
        open={showAddClient}
        onClose={() => setShowAddClient(false)}
        onSuccess={() => { fetchClients(); setSelectedClient(null); setClientUsers([]); setSelectedUser(null) }}
        endpoint="/clients"
      />
      {selectedClient && (
        <AddUserModal
          open={showAddUser}
          onClose={() => setShowAddUser(false)}
          onSuccess={() => { fetchUsers(selectedClient.id); fetchClients() }}
          clientId={selectedClient.id}
          clientName={selectedClient.name}
        />
      )}

      {/* Edit client modal */}
      {editClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">Client wijzigen</h2>
              <button
                onClick={() => { setEditClient(null); setEditLogoFile(null); setEditLogoPreview(null); setEditLogoDeleted(false) }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">

              {/* Logo */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Logo</label>
                <div className="flex items-center gap-3">
                  {(() => {
                    const previewSrc = editLogoPreview ?? (editLogoDeleted ? null : editClient.logoDataUrl)
                    return previewSrc ? (
                      <div className="relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex-shrink-0">
                        <img src={previewSrc} alt="Logo" className="w-full h-full object-contain p-1" />
                        <button
                          type="button"
                          onClick={() => { setEditLogoPreview(null); setEditLogoFile(null); setEditLogoDeleted(true); if (editLogoInputRef.current) editLogoInputRef.current.value = '' }}
                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-slate-700/80 text-white flex items-center justify-center hover:bg-slate-900"
                        >
                          <X size={9} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => editLogoInputRef.current?.click()}
                        className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 hover:border-violet-400 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-violet-500 transition-colors flex-shrink-0"
                      >
                        <ImagePlus size={18} />
                        <span className="text-[10px] leading-none">Upload</span>
                      </button>
                    )
                  })()}
                  <div className="text-xs text-slate-500 leading-relaxed">
                    PNG, JPG of WebP<br />Maximaal 512×512px
                  </div>
                </div>
                <input
                  ref={editLogoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleEditClientFileChange}
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Naam *</label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleRenameClient() }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button
                onClick={() => { setEditClient(null); setEditLogoFile(null); setEditLogoPreview(null); setEditLogoDeleted(false) }}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleRenameClient}
                disabled={editSaving || !editName.trim()}
                className="flex-1 px-4 py-2 rounded-xl bg-violet-600 text-sm font-medium text-white hover:bg-violet-700 transition-colors disabled:opacity-60"
              >
                {editSaving ? 'Opslaan…' : 'Opslaan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
