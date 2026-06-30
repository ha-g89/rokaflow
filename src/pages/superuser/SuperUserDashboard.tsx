import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Building2, Users, Plus, LogOut, Shield,
  Briefcase, Search, Moon, Sun, Upload, Trash2, CreditCard, Bell,
} from 'lucide-react'
import { SubscriptionsView } from './views/SubscriptionsView'
import { NotificationsView } from './views/NotificationsView'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/axios'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AddOrganisationModal } from '@/components/AddOrganisationModal'
import { AddClientModal } from '@/components/AddClientModal'
import type { OrganisationListItem, OrganisationDetailResponse } from '@/types/organisation'
import type { ClientListItem } from '@/types/client'
import type { ClientUserListItem } from '@/types/clientUser'
import rokaLogo from '@/assets/RokaFlow_icon_dark_transparent.png'

// ── Logo uploader ─────────────────────────────────────────────────────────────

function LogoUploader({
  orgId, currentDataUrl, onUploaded, onDeleted,
}: {
  orgId: string
  currentDataUrl: string | null
  onUploaded: (dataUrl: string) => void
  onDeleted: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    setError(null); setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post<{ logoDataUrl: string }>(
        `/organisations/${orgId}/logo`, form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      onUploaded(data.logoDataUrl)
    } catch { setError('Uploaden mislukt.') } finally { setUploading(false) }
  }

  const handleDelete = async () => {
    setError(null)
    try { await api.delete(`/organisations/${orgId}/logo`); onDeleted() }
    catch { setError('Verwijderen mislukt.') }
  }

  return (
    <div className="flex items-center gap-3">
      <div
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        onDragOver={e => e.preventDefault()}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative w-12 h-12 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors overflow-hidden group ${
          currentDataUrl ? 'border-transparent' : 'border-slate-300 dark:border-slate-600 hover:border-blue-400'
        }`}
      >
        {currentDataUrl ? (
          <>
            <img src={currentDataUrl} alt="Logo" className="w-full h-full object-contain" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
              <Upload size={14} className="text-white" />
            </div>
          </>
        ) : (
          uploading
            ? <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            : <Upload size={15} className="text-slate-400" />
        )}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <button onClick={() => inputRef.current?.click()} disabled={uploading}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50">
            {currentDataUrl ? 'Vervangen' : 'Logo uploaden'}
          </button>
          {currentDataUrl && (
            <button onClick={handleDelete} className="text-xs text-red-500 hover:underline flex items-center gap-0.5">
              <Trash2 size={10} /> Verwijderen
            </button>
          )}
        </div>
        {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
      </div>
    </div>
  )
}

// ── Column list item ──────────────────────────────────────────────────────────

function OrgListItem({ org, isSelected, onClick, sub }: {
  org: OrganisationListItem
  isSelected: boolean
  onClick: () => void
  sub: string
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors ${
        isSelected ? 'bg-blue-50 dark:bg-blue-950/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
          isSelected
            ? 'bg-blue-600 text-white'
            : 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
        }`}>
          {org.name[0]?.toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-medium truncate leading-tight ${
            isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'
          }`}>{org.name}</p>
          <p className="text-xs text-slate-400 leading-tight mt-0.5">{sub}</p>
        </div>
      </div>
    </button>
  )
}

// ── Column header ─────────────────────────────────────────────────────────────

function ColHeader({ label, count, search, onSearch, onAdd }: {
  label: string; count: number
  search: string; onSearch: (v: string) => void
  onAdd?: () => void
}) {
  return (
    <div className="px-3 pt-3 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">{count}</span>
          {onAdd && (
            <button onClick={onAdd}
              className="w-5 h-5 flex items-center justify-center rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors">
              <Plus size={11} />
            </button>
          )}
        </div>
      </div>
      <div className="relative">
        <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input value={search} onChange={e => onSearch(e.target.value)} placeholder="Zoeken…"
          className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 transition-colors" />
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function SuperUserDashboard() {
  const { user, logout } = useAuthStore()
  const { darkMode, toggleDarkMode } = useThemeStore()
  const navigate = useNavigate()

  const [activeSection, setActiveSection] = useState<'organisations' | 'subscriptions' | 'notifications'>('organisations')

  const [orgs, setOrgs]                               = useState<OrganisationListItem[]>([])
  const [allClients, setAllClients]                   = useState<ClientListItem[]>([])
  const [detail, setDetail]                           = useState<OrganisationDetailResponse | null>(null)
  const [loading, setLoading]                         = useState(true)
  const [detailLoading, setDetailLoading]             = useState(false)
  const [logoDataUrl, setLogoDataUrl]                 = useState<string | null>(null)
  // MSP detail: selected client within an org's client list
  const [selectedMspClientId, setSelectedMspClientId] = useState<string | null>(null)
  // All-clients col: selected client
  const [selectedDirectClient, setSelectedDirectClient] = useState<ClientListItem | null>(null)
  const [directClientUsers, setDirectClientUsers]     = useState<ClientUserListItem[]>([])
  const [directUsersLoading, setDirectUsersLoading]   = useState(false)
  const [portalUsers, setPortalUsers]                 = useState<ClientUserListItem[]>([])
  const [portalUsersLoading, setPortalUsersLoading]   = useState(false)
  const [mspSearch, setMspSearch]                     = useState('')
  const [clientSearch, setClientSearch]               = useState('')
  const [showAddOrg, setShowAddOrg]                   = useState(false)
  const [showAddClient, setShowAddClient]             = useState(false)

  const fetchOrgs = useCallback(async () => {
    try {
      const { data } = await api.get<OrganisationListItem[]>('/organisations')
      setOrgs(data)
    } finally { setLoading(false) }
  }, [])

  const fetchAllClients = useCallback(async () => {
    try {
      const { data } = await api.get<ClientListItem[]>('/organisations/all-clients')
      setAllClients(data)
    } catch { /* ignore */ }
  }, [])

  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true)
    setSelectedMspClientId(null)
    setPortalUsers([])
    setSelectedDirectClient(null)
    try {
      const { data } = await api.get<OrganisationDetailResponse>(`/organisations/${id}`)
      setDetail(data)
      setLogoDataUrl(data.logoDataUrl ?? null)
    } finally { setDetailLoading(false) }
  }, [])

  const fetchPortalUsers = useCallback(async (clientId: string) => {
    setPortalUsersLoading(true)
    setPortalUsers([])
    try {
      const { data } = await api.get<ClientUserListItem[]>(`/organisations/all-clients/${clientId}/users`)
      setPortalUsers(data.filter(u => u.isPortalUser))
    } finally { setPortalUsersLoading(false) }
  }, [])

  const fetchDirectClientUsers = useCallback(async (clientId: string) => {
    setDirectUsersLoading(true)
    setDirectClientUsers([])
    try {
      const { data } = await api.get<ClientUserListItem[]>(`/organisations/all-clients/${clientId}/users`)
      setDirectClientUsers(data.filter(u => u.isPortalUser))
    } finally { setDirectUsersLoading(false) }
  }, [])

  useEffect(() => { fetchOrgs(); fetchAllClients() }, [fetchOrgs, fetchAllClients])

  const handleSelectMspClient = (clientId: string) => {
    setSelectedMspClientId(clientId)
    fetchPortalUsers(clientId)
    setSelectedDirectClient(null)
  }

  const handleSelectDirectClient = (client: ClientListItem) => {
    setSelectedDirectClient(client)
    fetchDirectClientUsers(client.id)
    setDetail(null)
  }

  const handleLogout = () => { logout(); navigate('/superuser/login') }

  // ── Computed ───────────────────────────────────────────────────────────────
  const mspOrgs = orgs.filter(o => o.userCount > 0)
  const filteredMsp = mspOrgs.filter(o =>
    o.name.toLowerCase().includes(mspSearch.toLowerCase()) ||
    o.slug.toLowerCase().includes(mspSearch.toLowerCase())
  )
  const filteredClients = allClients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase())
  )

  const activeOrgs = orgs.filter(o => o.isActive).length
  const isMsp      = (detail?.users.length ?? 0) > 0
  const selectedMspClient = detail?.clients.find(c => c.id === selectedMspClientId)

  return (
    <div className="flex h-screen overflow-hidden flex-col bg-slate-50 dark:bg-slate-950">

      {/* ── Top header ── */}
      <header className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 h-12 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src={rokaLogo} alt="RokaFlow" className="h-8 w-auto object-contain flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">RokaFlow</p>
            <p className="text-[10px] text-slate-400 leading-tight">Beheerpaneel</p>
          </div>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
          {/* Nav tabs */}
          <nav className="flex items-center gap-1">
            {([
              ['organisations', Building2, 'Organisaties'],
              ['subscriptions', CreditCard, 'Abonnementen'],
              ['notifications', Bell, 'Notificaties'],
            ] as const).map(([key, Icon, label]) => (
              <button key={key} onClick={() => setActiveSection(key)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  activeSection === key
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}>
                <Icon size={11} />
                {label}
              </button>
            ))}
          </nav>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
          {/* Inline stats */}
          {activeSection === 'organisations' && [
            { label: "MSP's",   value: mspOrgs.length,    color: 'text-blue-600' },
            { label: 'Clients', value: allClients.length,  color: '' },
            { label: 'Actief',  value: activeOrgs,         color: 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="text-center px-2">
              <p className={`text-sm font-bold leading-tight ${s.color || 'text-slate-900 dark:text-slate-100'}`}>{s.value}</p>
              <p className="text-[10px] text-slate-400 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
            {(user?.email?.[0] ?? '').toUpperCase()}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[160px] hidden sm:block">{user?.email}</p>
          <button onClick={toggleDarkMode}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            {darkMode ? <Sun size={13} /> : <Moon size={13} />}
          </button>
          <button onClick={handleLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <LogOut size={13} />
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      {activeSection === 'subscriptions' && <SubscriptionsView />}
      {activeSection === 'notifications' && <NotificationsView />}

      {/* ── Three columns (organisations) ── */}
      <div className={`flex flex-1 overflow-hidden ${activeSection !== 'organisations' ? 'hidden' : ''}`}>

        {/* Col 1 — MSP's */}
        <div className="w-52 flex-shrink-0 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
          <ColHeader label="MSP's" count={filteredMsp.length}
            search={mspSearch} onSearch={setMspSearch}
            onAdd={() => setShowAddOrg(true)} />
          <div className="flex-1 overflow-y-auto min-h-0">
            {loading ? (
              <div className="p-4 text-center text-xs text-slate-400">Laden…</div>
            ) : filteredMsp.length === 0 ? (
              <div className="p-5 text-center text-xs text-slate-400">Geen MSP's</div>
            ) : (
              <ul className="px-2 py-2 space-y-0.5">
                {filteredMsp.map(org => (
                  <li key={org.id}>
                    <OrgListItem
                      org={org}
                      isSelected={detail?.id === org.id}
                      onClick={() => fetchDetail(org.id)}
                      sub={`${org.clientCount} client${org.clientCount !== 1 ? 's' : ''} · ${org.userCount} beheerder${org.userCount !== 1 ? 's' : ''}`}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Col 2 — Alle clients */}
        <div className="w-52 flex-shrink-0 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
          <ColHeader label="Organisaties" count={filteredClients.length}
            search={clientSearch} onSearch={setClientSearch} />
          <div className="flex-1 overflow-y-auto min-h-0">
            {loading ? (
              <div className="p-4 text-center text-xs text-slate-400">Laden…</div>
            ) : filteredClients.length === 0 ? (
              <div className="p-5 text-center text-xs text-slate-400">Geen clients</div>
            ) : (
              <ul className="px-2 py-2 space-y-0.5">
                {filteredClients.map(c => (
                  <li key={c.id}>
                    <button
                      onClick={() => handleSelectDirectClient(c)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors ${
                        selectedDirectClient?.id === c.id
                          ? 'bg-blue-50 dark:bg-blue-950/50'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          selectedDirectClient?.id === c.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                        }`}>
                          {c.name[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-medium truncate leading-tight ${
                            selectedDirectClient?.id === c.id ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'
                          }`}>{c.name}</p>
                          <p className="text-xs text-slate-400 leading-tight mt-0.5">
                            {c.organisationName
                              ? <span className="text-blue-500 dark:text-blue-400">{c.organisationName}</span>
                              : <span className="text-slate-400">Geen MSP</span>
                            }
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Detail area */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {selectedDirectClient ? (
            /* ── Direct client selected from Col 2 ── */
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-3 flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {selectedDirectClient.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedDirectClient.name}</h1>
                  <p className="text-xs text-slate-400">{selectedDirectClient.userCount} portal gebruiker{selectedDirectClient.userCount !== 1 ? 's' : ''}</p>
                </div>
                {/* MSP badge */}
                {selectedDirectClient.organisationName ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/40 flex-shrink-0">
                    <Building2 size={12} className="text-blue-500 flex-shrink-0" />
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                      MSP: {selectedDirectClient.organisationName}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <Building2 size={12} className="text-slate-400 flex-shrink-0" />
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Geen MSP</span>
                  </div>
                )}
              </div>
              <Card className="flex-1 flex flex-col overflow-hidden m-4">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users size={13} className="text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Gebruikers</span>
                    <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">{directClientUsers.length}</span>
                  </div>
                </CardHeader>
                <div className="flex-1 overflow-y-auto">
                  {directUsersLoading ? (
                    <div className="p-6 text-center text-xs text-slate-400">Laden…</div>
                  ) : directClientUsers.length === 0 ? (
                    <div className="p-8 text-center">
                      <Users size={24} className="mx-auto mb-2 text-slate-200 dark:text-slate-700" />
                      <p className="text-sm text-slate-400 dark:text-slate-500">Geen portal gebruikers</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                      {directClientUsers.map(u => (
                        <li key={u.id} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {(u.firstName?.[0] ?? u.email?.[0] ?? '?').toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{u.firstName} {u.lastName}</p>
                              <p className="text-xs text-slate-400 truncate">{u.email}</p>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                            u.isActive
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                          }`}>
                            {u.isActive ? 'Actief' : 'Inactief'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Card>
            </div>
          ) : !detail ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Building2 size={24} className="text-slate-300 dark:text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Selecteer een MSP of client</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Kies uit de lijst links</p>
              </div>
            </div>
          ) : detailLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Org detail header */}
              <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  {logoDataUrl && (
                    <img src={logoDataUrl} alt="" className="h-8 w-auto max-w-[96px] object-contain flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100">{detail.name}</h1>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0 ${
                        isMsp
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                      }`}>
                        {isMsp ? 'MSP' : 'Zelfstandig'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0 ${
                        detail.isActive
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                      }`}>
                        {detail.isActive ? 'Actief' : 'Inactief'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">/{detail.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <LogoUploader
                    orgId={detail.id}
                    currentDataUrl={logoDataUrl}
                    onUploaded={url => { setLogoDataUrl(url); setOrgs(prev => prev.map(o => o.id === detail.id ? { ...o, hasLogo: true } : o)) }}
                    onDeleted={() => { setLogoDataUrl(null); setOrgs(prev => prev.map(o => o.id === detail.id ? { ...o, hasLogo: false } : o)) }}
                  />
                  <Button size="sm" onClick={() => setShowAddClient(true)}>
                    <Plus size={13} /> Client
                  </Button>
                </div>
              </div>

              {/* Two panels */}
              <div className="flex-1 overflow-hidden flex gap-4 p-4">

                {/* Clients panel */}
                <Card className="w-64 flex-shrink-0 flex flex-col overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Briefcase size={13} className="text-slate-400" />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Clients</span>
                      <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">{detail.clients.length}</span>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => setShowAddClient(true)}>
                      <Plus size={12} />
                    </Button>
                  </CardHeader>
                  <div className="flex-1 overflow-y-auto">
                    {detail.clients.length === 0 ? (
                      <div className="p-6 text-center">
                        <Briefcase size={22} className="mx-auto mb-2 text-slate-200 dark:text-slate-700" />
                        <p className="text-xs text-slate-400">Geen clients</p>
                        <button onClick={() => setShowAddClient(true)} className="mt-1 text-xs text-blue-500 hover:underline">Toevoegen</button>
                      </div>
                    ) : (
                      <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                        {detail.clients.map(c => {
                          const isSel = selectedMspClientId === c.id
                          return (
                            <li key={c.id}>
                              <button
                                onClick={() => handleSelectMspClient(c.id)}
                                className={`w-full text-left px-4 py-3 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors ${
                                  isSel ? 'bg-blue-50 dark:bg-blue-950/30 border-l-2 border-blue-500' : ''
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                                    isSel ? 'bg-blue-600 text-white' : 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                                  }`}>
                                    {c.name[0]?.toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className={`text-xs font-medium truncate ${isSel ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                                      {c.name}
                                    </p>
                                    <p className="text-xs text-slate-400">{c.userCount} gebruikers</p>
                                  </div>
                                </div>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                                  c.isActive
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                }`}>
                                  {c.isActive ? 'Actief' : 'Inactief'}
                                </span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                </Card>

                {/* Right panel — context-sensitive */}
                <Card className="flex-1 flex flex-col overflow-hidden">

                  {selectedMspClientId ? (
                    /* Portal users for selected client */
                    <>
                      <CardHeader>
                        <div className="flex items-center gap-2 min-w-0">
                          <Users size={13} className="text-slate-400 flex-shrink-0" />
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                            Gebruikers — {selectedMspClient?.name}
                          </span>
                          <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
                            {portalUsers.length}
                          </span>
                        </div>
                      </CardHeader>

                      {/* MSP / zelfstandig banner */}
                      <div className={`mx-4 mt-3 mb-2 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border ${
                        isMsp
                          ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800/40'
                          : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/40'
                      }`}>
                        <Shield size={13} className="flex-shrink-0" />
                        {isMsp
                          ? `Beheerd door MSP: ${detail?.name}`
                          : 'Zelfstandig beheerd — geen MSP'
                        }
                      </div>

                      <div className="flex-1 overflow-y-auto">
                        {portalUsersLoading ? (
                          <div className="p-6 text-center text-xs text-slate-400">Laden…</div>
                        ) : portalUsers.length === 0 ? (
                          <div className="p-8 text-center">
                            <Users size={24} className="mx-auto mb-2 text-slate-200 dark:text-slate-700" />
                            <p className="text-sm text-slate-400 dark:text-slate-500">Geen portal gebruikers</p>
                          </div>
                        ) : (
                          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                            {portalUsers.map(u => (
                              <li key={u.id} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                    {(u.firstName?.[0] ?? u.email?.[0] ?? '?').toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                                      {u.firstName} {u.lastName}
                                    </p>
                                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                                  </div>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                                  u.isActive
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                }`}>
                                  {u.isActive ? 'Actief' : 'Inactief'}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </>
                  ) : isMsp ? (
                    /* MSP users when no client selected */
                    <>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Users size={13} className="text-slate-400" />
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">MSP Gebruikers</span>
                          <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">{detail.users.length}</span>
                        </div>
                      </CardHeader>
                      <div className="flex-1 overflow-y-auto">
                        {detail.users.length === 0 ? (
                          <div className="p-8 text-center">
                            <Users size={24} className="mx-auto mb-2 text-slate-200 dark:text-slate-700" />
                            <p className="text-sm text-slate-400 dark:text-slate-500">Geen MSP gebruikers</p>
                          </div>
                        ) : (
                          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                            {detail.users.map(u => {
                              const isAdmin = u.role.toLowerCase() === 'admin'
                              return (
                                <li key={u.id} className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                      {u.email[0]?.toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{u.email}</p>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0 ${
                                          isAdmin
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                            : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                        }`}>
                                          MSP {isAdmin ? 'Admin' : 'Beheerder'}
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-400 mt-0.5">
                                        Beheert {detail.clients.length} client{detail.clients.length !== 1 ? 's' : ''}
                                      </p>
                                    </div>
                                  </div>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                                    u.isActive
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                      : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                  }`}>
                                    {u.isActive ? 'Actief' : 'Inactief'}
                                  </span>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </div>
                    </>
                  ) : (
                    /* Standalone org, no client selected */
                    <CardContent className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
                      <Briefcase size={22} className="text-slate-200 dark:text-slate-700" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">Selecteer een client</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">om de gebruikers te zien</p>
                    </CardContent>
                  )}

                </Card>

              </div>
            </>
          )}
        </div>

      </div>

      {/* Modals */}
      <AddOrganisationModal open={showAddOrg} onClose={() => setShowAddOrg(false)} onSuccess={() => { fetchOrgs(); fetchAllClients() }} />
      {detail && (
        <AddClientModal
          open={showAddClient}
          onClose={() => setShowAddClient(false)}
          onSuccess={() => { fetchDetail(detail.id); fetchAllClients() }}
          endpoint={`/organisations/${detail.id}/clients`}
        />
      )}
    </div>
  )
}
