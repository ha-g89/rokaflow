import { useEffect, useState, useCallback } from 'react'
import {
  Briefcase, Users, Plus, ChevronRight, LogOut,
  Building2, Search, UserPlus, User, ExternalLink, Loader2,
  MoreVertical, Pencil, X,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/axios'
import type { SwitchToClientResponse } from '@/types/auth'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AddClientModal } from '@/components/AddClientModal'
import { AddUserModal } from '@/components/AddUserModal'
import { UserDetailPanel } from '@/components/UserDetailPanel'
import type { ClientListItem } from '@/types/client'
import type { ClientUserListItem, ClientUserDetailResponse } from '@/types/clientUser'
import { STATUS_LABEL, STATUS_TONE } from '@/types/clientUser'

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

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-200">
      <div className="h-1.5 rounded-full bg-slate-700" style={{ width: `${value}%` }} />
    </div>
  )
}

function Avatar({ first, last, size = 8 }: { first: string; last: string; size?: number }) {
  const s = `w-${size} h-${size}`
  return (
    <div className={`${s} rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0`}>
      {(first[0] ?? '').toUpperCase()}{(last[0] ?? '').toUpperCase()}
    </div>
  )
}

type View = 'clients' | 'users' | 'detail'

export default function OrgDashboard() {
  const { user, logout, switchToClient } = useAuthStore()
  const navigate = useNavigate()

  const [clients, setClients] = useState<ClientListItem[]>([])
  const [selectedClient, setSelectedClient] = useState<ClientListItem | null>(null)
  const [clientUsers, setClientUsers] = useState<ClientUserListItem[]>([])
  const [selectedUser, setSelectedUser] = useState<ClientUserDetailResponse | null>(null)
  const [view, setView] = useState<View>('clients')
  const [loadingClients, setLoadingClients] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [showAddClient, setShowAddClient] = useState(false)
  const [showAddUser, setShowAddUser] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [switchingClientId, setSwitchingClientId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [editClient, setEditClient] = useState<ClientListItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editSaving, setEditSaving] = useState(false)

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

  const handleChecklistToggle = (entryId: string, checked: boolean) => {
    setSelectedUser(prev => {
      if (!prev) return prev
      const patch = (list: typeof prev.starterChecklist) =>
        list.map(e => e.id === entryId ? { ...e, isChecked: checked } : e)
      return {
        ...prev,
        starterChecklist: patch(prev.starterChecklist),
        leaverChecklist: patch(prev.leaverChecklist),
      }
    })
  }

  const handleRenameClient = async () => {
    if (!editClient || !editName.trim()) return
    setEditSaving(true)
    try {
      await api.put(`/clients/${editClient.id}`, { name: editName.trim() })
      setClients(prev => prev.map(c => c.id === editClient.id ? { ...c, name: editName.trim() } : c))
      if (selectedClient?.id === editClient.id) setSelectedClient(prev => prev ? { ...prev, name: editName.trim() } : prev)
      setEditClient(null)
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
      // Error is handled by global interceptor / toast if present
    } finally {
      setSwitchingClientId(null)
    }
  }

  const handleLogout = () => { logout(); navigate('/login') }

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()))
  const filteredUsers = clientUsers.filter(u =>
    `${u.firstName} ${u.lastName} ${u.email} ${u.department}`
      .toLowerCase().includes(userSearch.toLowerCase()))

  const totalUsers = clients.reduce((s, c) => s + c.userCount, 0)
  const activeClients = clients.filter(c => c.isActive).length

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between shadow-md flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <Building2 size={20} className="text-indigo-400" />
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
          <StatCard icon={<Briefcase size={18} className="text-indigo-600" />} label="Totaal clients" value={clients.length} color="bg-indigo-50" />
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
                  className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-indigo-400" />
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
                                selectedClient?.id === c.id ? 'bg-indigo-50 border-l-2 border-indigo-500' : ''}`}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-slate-800 truncate">{c.name}</p>
                                <p className="text-xs text-slate-400">{c.userCount} gebruikers</p>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleSwitchToClient(c.id) }}
                                  disabled={switchingClientId === c.id}
                                  title="Beheer portaal"
                                  className="p-1 rounded hover:bg-indigo-100 text-indigo-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
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

          {/* Col 2 — Users */}
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
                        className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-indigo-400" />
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
                              <p className="text-xs text-slate-400">Geen gebruikers.</p>
                              <button onClick={() => setShowAddUser(true)} className="mt-1 text-xs text-indigo-500 hover:underline">Toevoegen</button>
                            </div>
                          : <ul className="divide-y divide-slate-100">
                              {filteredUsers.map(u => (
                                <li key={u.id}>
                                  <button
                                    onClick={() => handleSelectUser(u.id)}
                                    className={`w-full text-left px-3 py-2.5 hover:bg-slate-100 transition-colors ${
                                      selectedUser?.id === u.id ? 'bg-indigo-50 border-l-2 border-indigo-500' : ''}`}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <Avatar first={u.firstName} last={u.lastName} size={6} />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-slate-800 truncate">
                                          {u.firstName} {u.lastName}
                                        </p>
                                        <p className="text-xs text-slate-400 truncate">{u.department || u.email}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <ProgressBar value={u.completeness} />
                                      <span className="text-xs text-slate-400 flex-shrink-0">{u.completeness}%</span>
                                    </div>
                                    <span className={`mt-1 inline-block text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_TONE[u.status]}`}>
                                      {STATUS_LABEL[u.status]}
                                    </span>
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

          {/* Col 3 — Detail */}
          <div className="flex-1 overflow-y-auto min-w-0">
            {loadingDetail ? (
              <Card className="h-40 flex items-center justify-center">
                <p className="text-sm text-slate-400">Laden…</p>
              </Card>
            ) : !selectedUser ? (
              <Card className="h-40 flex items-center justify-center">
                <p className="text-xs text-slate-400">Selecteer een gebruiker</p>
              </Card>
            ) : (
              <UserDetailPanel
                user={selectedUser}
                canEdit={user?.role === 'org_admin'}
                checklistBasePath={`/clients/${selectedClient?.id}/users/${selectedUser.id}`}
                onChecklistToggle={handleChecklistToggle}
              />
            )}
          </div>
        </div>
      </div>

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

      {/* Rename client modal */}
      {editClient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onMouseDown={e => { if (e.target === e.currentTarget) setEditClient(null) }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">Naam wijzigen</h2>
              <button onClick={() => setEditClient(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Naam organisatie *</label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRenameClient()}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button
                onClick={() => setEditClient(null)}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleRenameClient}
                disabled={editSaving || !editName.trim()}
                className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-60"
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
