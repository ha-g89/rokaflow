import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Briefcase, Users, Plus, LogOut,
  Building2, Search, ExternalLink, Loader2,
  MoreVertical, Pencil, X, ImagePlus,
  Moon, Sun, Settings, ChevronDown, ArrowLeftRight, XCircle,
} from 'lucide-react'
import { ClientDetailPanel } from './ClientDetailPanel'
import { LoadingState } from '@/components/ui/LoadingState'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/axios'
import type { SwitchToClientResponse } from '@/types/auth'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AddClientModal } from '@/components/AddClientModal'
import { AddUserModal } from '@/components/AddUserModal'
import { TakeoverClientModal } from '@/components/TakeoverClientModal'
import type { ClientListItem } from '@/types/client'
import type { ClientUserListItem, ClientUserDetailResponse } from '@/types/clientUser'
import type { MspTransferRequestDto } from '@/types/mspTransfer'
import { TRANSFER_STATUS_LABEL, TRANSFER_STATUS_TONE } from '@/types/mspTransfer'
import type { MyPlanDto } from '@/types/platformPlan'

// ── small components ──────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number; color: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className={`p-2.5 rounded-lg ${color}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function NavItem({ icon, label, active, onClick }: {
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
        active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export default function OrgDashboard() {
  const { user, logout, switchToClient } = useAuthStore()
  const { darkMode, toggleDarkMode } = useThemeStore()
  const navigate = useNavigate()
  const [clients, setClients]               = useState<ClientListItem[]>([])
  const [selectedClient, setSelectedClient] = useState<ClientListItem | null>(null)
  const [clientUsers, setClientUsers]       = useState<ClientUserListItem[]>([])
  const [selectedUser, setSelectedUser]     = useState<ClientUserDetailResponse | null>(null)
  const [loadingClients, setLoadingClients] = useState(true)
  const [loadingUsers, setLoadingUsers]     = useState(false)
  const [loadingDetail, setLoadingDetail]   = useState(false)
  const [showAddClient, setShowAddClient]   = useState(false)
  const [showAddUser, setShowAddUser]       = useState(false)
  const [showTakeover, setShowTakeover]     = useState(false)
  const [transfers, setTransfers]           = useState<MspTransferRequestDto[]>([])
  const [cancellingId, setCancellingId]     = useState<string | null>(null)
  const [clientSearch, setClientSearch]     = useState('')
  const [switchingClientId, setSwitchingClientId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId]         = useState<string | null>(null)
  const [editClient, setEditClient]         = useState<ClientListItem | null>(null)
  const [editName, setEditName]             = useState('')
  const [editSaving, setEditSaving]         = useState(false)
  const [editLogoFile, setEditLogoFile]     = useState<File | null>(null)
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null)
  const [editLogoDeleted, setEditLogoDeleted] = useState(false)
  const [clientPlan, setClientPlan]         = useState<MyPlanDto | null>(null)
  const editLogoInputRef                    = useRef<HTMLInputElement>(null)
  const [showUserMenu, setShowUserMenu]     = useState(false)
  const userMenuRef                         = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showUserMenu) return
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showUserMenu])

  const fetchClients = useCallback(async () => {
    try {
      const { data } = await api.get<ClientListItem[]>('/clients')
      setClients(data)
    } finally { setLoadingClients(false) }
  }, [])

  const fetchTransfers = useCallback(async () => {
    try {
      const { data } = await api.get<MspTransferRequestDto[]>('/msp-transfers')
      setTransfers(data)
    } catch { /* silently ignore */ }
  }, [])

  const handleCancelTransfer = async (id: string) => {
    setCancellingId(id)
    try {
      await api.delete(`/msp-transfers/${id}`)
      setTransfers(prev => prev.filter(t => t.id !== id))
    } finally { setCancellingId(null) }
  }

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

  useEffect(() => { fetchClients(); fetchTransfers() }, [fetchClients, fetchTransfers])

  const handleSelectClient = (client: ClientListItem) => {
    setSelectedClient(client)
    setSelectedUser(null)
    fetchUsers(client.id)
    setClientPlan(null)
    api.get<MyPlanDto>(`/clients/${client.id}/plan`).then(r => setClientPlan(r.data)).catch(() => {})
  }

  const handleSelectUser = (userId: string) => {
    if (!selectedClient) return
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

  const totalUsers    = clients.reduce((s, c) => s + c.userCount, 0)
  const activeClients = clients.filter(c => c.isActive).length

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-950">

      {/* ── Sidebar ── */}
      <aside className="w-56 bg-slate-900 dark:bg-slate-950 flex flex-col flex-shrink-0">
        <div className="h-16 px-4 flex flex-col justify-center border-b border-slate-800 flex-shrink-0">
          <span className="font-bold text-white text-sm truncate">{user?.tenantName ?? 'MSP'}</span>
          <p className="text-xs text-slate-500 mt-0.5">MSP Portal</p>
        </div>
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-1">
          <NavItem icon={<Users size={14} />} label="Clients" active={true} onClick={() => {}} />
        </nav>
        <div className="px-2 pb-3 flex-shrink-0 border-t border-slate-800 pt-2 space-y-1">
          <NavItem icon={<Settings size={14} />} label="Instellingen" active={false} onClick={() => navigate('/org/settings')} />
          <NavItem icon={<LogOut size={14} />} label="Uitloggen" active={false} onClick={handleLogout} />
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between flex-shrink-0">
          <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Clients</h1>
          {/* User avatar + dropdown */}
          <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(v => !v)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-800 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 group-hover:bg-blue-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 transition-colors select-none">
              {(user?.email?.[0] ?? '?').toUpperCase()}
            </div>
            <ChevronDown size={13} className={`text-slate-400 transition-transform duration-150 ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 z-50 w-60 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-4 py-4 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white text-base font-bold flex items-center justify-center flex-shrink-0 select-none">
                    {(user?.email?.[0] ?? '?').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.tenantName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/org/settings') }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <Settings size={15} className="text-slate-400 flex-shrink-0" />
                  Instellingen
                </button>
                <button
                  onClick={toggleDarkMode}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  {darkMode
                    ? <Sun size={15} className="text-slate-400 flex-shrink-0" />
                    : <Moon size={15} className="text-slate-400 flex-shrink-0" />
                  }
                  <span className="flex-1 text-left">{darkMode ? 'Lichte modus' : 'Donkere modus'}</span>
                  <span className={`w-9 h-5 rounded-full flex items-center px-0.5 flex-shrink-0 transition-colors ${darkMode ? 'bg-blue-600' : 'bg-slate-300'}`}>
                    <span className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${darkMode ? 'translate-x-4' : 'translate-x-0'}`} />
                  </span>
                </button>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 py-1">
                <button
                  onClick={() => { setShowUserMenu(false); handleLogout() }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut size={15} className="flex-shrink-0" />
                  Uitloggen
                </button>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5 bg-slate-200 dark:bg-slate-900">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard icon={<Briefcase size={18} className="text-blue-600" />} label="Totaal clients" value={clients.length} color="bg-blue-50" />
          <StatCard icon={<Briefcase size={18} className="text-emerald-600" />} label="Actieve clients" value={activeClients} color="bg-emerald-50" />
          <StatCard icon={<Users size={18} className="text-blue-600" />} label="Totaal gebruikers" value={totalUsers} color="bg-blue-50" />
        </div>

        {/* Transfer requests panel */}
        {transfers.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
              <ArrowLeftRight size={14} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">MSP Overdrachten</span>
              <span className="ml-auto text-xs text-slate-400">{transfers.length}</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {transfers.map(t => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{t.tenantName}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {t.fromMspName ? `Van ${t.fromMspName} → ` : ''}{t.toMspName}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${TRANSFER_STATUS_TONE[t.status]}`}>
                    {TRANSFER_STATUS_LABEL[t.status]}
                  </span>
                  {t.status === 'Pending' && (
                    <button
                      onClick={() => handleCancelTransfer(t.id)}
                      disabled={cancellingId === t.id}
                      title="Annuleren"
                      className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      {cancellingId === t.id
                        ? <Loader2 size={13} className="animate-spin" />
                        : <XCircle size={13} />
                      }
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Two-column layout: client list + detail panel */}
        <div className="flex gap-4 flex-1 min-h-0" style={{ minHeight: '560px' }}>

          {/* Col 1 — Client list */}
          <div className="w-60 flex-shrink-0 flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={clientSearch} onChange={e => setClientSearch(e.target.value)}
                  placeholder="Zoek client…"
                  className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 dark:focus:border-blue-500" />
              </div>
              <Button size="sm" onClick={() => setShowAddClient(true)} title="Nieuwe client aanmaken">
                <Plus size={13} />
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setShowTakeover(true)} title="Bestaande client overnemen">
                <Building2 size={13} />
              </Button>
            </div>
            <Card className="flex-1 overflow-hidden flex flex-col">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Clients</span>
                <span className="text-xs text-slate-400">{filteredClients.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loadingClients
                  ? <LoadingState label="Clients laden…" size="sm" />
                  : filteredClients.length === 0
                    ? <div className="p-4 text-center text-xs text-slate-400">Geen clients.</div>
                    : <ul className="divide-y divide-slate-100">
                        {filteredClients.map(c => (
                          <li key={c.id}>
                            <button
                              onClick={() => handleSelectClient(c)}
                              className={`w-full text-left px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-between gap-2 ${
                                selectedClient?.id === c.id ? 'bg-blue-50 dark:bg-blue-950/40 border-l-2 border-blue-500' : ''}`}
                            >
                              {c.logoDataUrl
                                ? <img src={c.logoDataUrl} alt="" className="w-7 h-7 rounded-lg object-contain bg-slate-100 flex-shrink-0" />
                                : <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-bold text-blue-600">{c.name[0]?.toUpperCase()}</span>
                                  </div>
                              }
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{c.name}</p>
                                <p className="text-xs text-slate-400">{c.userCount} gebruikers</p>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleSwitchToClient(c.id) }}
                                  disabled={switchingClientId === c.id}
                                  title="Beheer portaal"
                                  className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                                >
                                  {switchingClientId === c.id
                                    ? <Loader2 size={13} className="animate-spin" />
                                    : <ExternalLink size={13} />
                                  }
                                </button>
                                <div className="relative">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === c.id ? null : c.id) }}
                                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                  >
                                    <MoreVertical size={13} />
                                  </button>
                                  {openMenuId === c.id && (
                                    <div className="absolute right-0 top-6 z-20 w-36 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg py-1">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setEditClient(c); setEditName(c.name); setOpenMenuId(null) }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
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

          {/* Col 2 — Client detail panel */}
          <div className="flex-1 min-w-0 flex flex-col">
            {!selectedClient ? (
              <Card className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Building2 size={32} className="mx-auto mb-2 text-slate-200 dark:text-slate-700" />
                  <p className="text-xs text-slate-400">Selecteer een client om details te bekijken</p>
                </div>
              </Card>
            ) : (
              <ClientDetailPanel
                key={selectedClient.id}
                client={selectedClient}
                plan={clientPlan}
                users={clientUsers}
                loadingUsers={loadingUsers}
                selectedUser={selectedUser}
                loadingDetail={loadingDetail}
                switchingClientId={switchingClientId}
                onSelectUser={handleSelectUser}
                onAddUser={() => setShowAddUser(true)}
                onUserUpdated={handleUserUpdated}
                onSwitchToClient={handleSwitchToClient}
                onEditClient={() => { setEditClient(selectedClient); setEditName(selectedClient.name) }}
              />
            )}
          </div>

        </div>

      </div>

      {/* ── Modals ── */}
      <AddClientModal
        open={showAddClient}
        onClose={() => setShowAddClient(false)}
        onSuccess={() => { fetchClients(); setSelectedClient(null); setClientUsers([]); setSelectedUser(null) }}
        endpoint="/clients"
      />
      <TakeoverClientModal
        open={showTakeover}
        onClose={() => setShowTakeover(false)}
        onSuccess={() => { fetchClients(); fetchTransfers() }}
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Client wijzigen</h2>
              <button
                onClick={() => { setEditClient(null); setEditLogoFile(null); setEditLogoPreview(null); setEditLogoDeleted(false) }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">Logo</label>
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
                        className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-blue-500 transition-colors flex-shrink-0"
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
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Naam *</label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleRenameClient() }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button
                onClick={() => { setEditClient(null); setEditLogoFile(null); setEditLogoPreview(null); setEditLogoDeleted(false) }}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleRenameClient}
                disabled={editSaving || !editName.trim()}
                className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {editSaving ? 'Opslaan…' : 'Opslaan'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>   {/* end main column */}
    </div>
  )
}
