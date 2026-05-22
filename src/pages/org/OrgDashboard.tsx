import { useEffect, useState, useCallback } from 'react'
import {
  Briefcase, Users, Plus, ChevronRight, LogOut,
  Building2, Search, UserPlus, User,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/axios'
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
  const { user, logout } = useAuthStore()
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
                              className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 ${
                                selectedClient?.id === c.id ? 'bg-indigo-50 border-l-2 border-indigo-500' : ''}`}
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-800 truncate">{c.name}</p>
                                <p className="text-xs text-slate-400">{c.userCount} gebruikers</p>
                              </div>
                              <ChevronRight size={11} className="text-slate-300 flex-shrink-0" />
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
                                    className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors ${
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
    </div>
  )
}
