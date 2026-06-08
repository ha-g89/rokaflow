import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Building2, Users, Plus, LogOut, Shield,
  Briefcase, Search, Moon, Sun, Upload, Trash2,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/axios'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AddOrganisationModal } from '@/components/AddOrganisationModal'
import { AddClientModal } from '@/components/AddClientModal'
import type { OrganisationListItem, OrganisationDetailResponse } from '@/types/organisation'

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, tone }: {
  icon: React.ReactNode
  label: string
  value: number
  tone: string
}) {
  return (
    <div className={`rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm px-5 py-4 flex items-center gap-4`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tone}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

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
    setError(null)
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post<{ logoDataUrl: string }>(
        `/organisations/${orgId}/logo`, form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      onUploaded(data.logoDataUrl)
    } catch {
      setError('Uploaden mislukt. Probeer een andere afbeelding.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    setError(null)
    try {
      await api.delete(`/organisations/${orgId}/logo`)
      onDeleted()
    } catch {
      setError('Verwijderen mislukt.')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="flex items-center gap-3">
      {/* Preview / dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative w-16 h-16 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors overflow-hidden group ${
          currentDataUrl
            ? 'border-transparent'
            : 'border-slate-300 dark:border-slate-600 hover:border-violet-400 dark:hover:border-violet-500'
        }`}
      >
        {currentDataUrl ? (
          <>
            <img
              src={currentDataUrl}
              alt="Logo"
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
              <Upload size={16} className="text-white" />
            </div>
          </>
        ) : (
          <div className="text-center">
            {uploading
              ? <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
              : <Upload size={18} className="text-slate-400 dark:text-slate-500 mx-auto" />
            }
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
        />
      </div>

      {/* Tekst + knoppen */}
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Logo</p>
        <p className="text-xs text-slate-400 mt-0.5">Max 5 MB · JPEG, PNG, WebP · 512×512px</p>
        <div className="flex items-center gap-2 mt-1.5">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="text-xs text-violet-600 dark:text-violet-400 hover:underline disabled:opacity-50"
          >
            {currentDataUrl ? 'Vervangen' : 'Uploaden'}
          </button>
          {currentDataUrl && (
            <button
              onClick={handleDelete}
              className="text-xs text-red-500 hover:underline flex items-center gap-0.5"
            >
              <Trash2 size={11} /> Verwijderen
            </button>
          )}
        </div>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    </div>
  )
}

// ── Org avatar ────────────────────────────────────────────────────────────────

function OrgAvatar({ name, active }: { name: string; active: boolean }) {
  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
      active
        ? 'bg-violet-600 text-white'
        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
    }`}>
      {name[0]?.toUpperCase()}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function SuperUserDashboard() {
  const { user, logout } = useAuthStore()
  const { darkMode, toggleDarkMode } = useThemeStore()
  const navigate = useNavigate()

  const [orgs, setOrgs] = useState<OrganisationListItem[]>([])
  const [detail, setDetail] = useState<OrganisationDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showAddOrg, setShowAddOrg] = useState(false)
  const [showAddClient, setShowAddClient] = useState(false)
  const [search, setSearch] = useState('')
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)

  const fetchOrgs = useCallback(async () => {
    try {
      const { data } = await api.get<OrganisationListItem[]>('/organisations')
      setOrgs(data)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true)
    try {
      const { data } = await api.get<OrganisationDetailResponse>(`/organisations/${id}`)
      setDetail(data)
      setLogoDataUrl(data.logoDataUrl ?? null)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrgs() }, [fetchOrgs])

  const handleLogout = () => { logout(); navigate('/superuser/login') }

  const filtered = orgs.filter(
    o =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.slug.toLowerCase().includes(search.toLowerCase())
  )

  const totalClients = orgs.reduce((s, o) => s + o.clientCount, 0)
  const totalUsers   = orgs.reduce((s, o) => s + o.userCount, 0)
  const activeOrgs   = orgs.filter(o => o.isActive).length

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className="w-72 flex-shrink-0 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">

        {/* Merk */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Shield size={17} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">RokaFlow</p>
              <p className="text-xs text-slate-400 leading-tight">Beheerpaneel</p>
            </div>
          </div>
        </div>

        {/* Zoek + toevoegen */}
        <div className="px-3 py-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Zoek organisaties…"
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-colors"
              />
            </div>
            <button
              onClick={() => setShowAddOrg(true)}
              title="Organisatie toevoegen"
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors flex-shrink-0"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Organisatie lijst header */}
        <div className="px-4 pt-3 pb-1 flex items-center justify-between flex-shrink-0">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Organisaties</span>
          <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
            {filtered.length}
          </span>
        </div>

        {/* Organisatie lijst */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="p-6 text-center text-sm text-slate-400">Laden…</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">Geen organisaties gevonden.</div>
          ) : (
            <ul className="px-2 pb-2 space-y-0.5">
              {filtered.map(org => {
                const isSelected = detail?.id === org.id
                return (
                  <li key={org.id}>
                    <button
                      onClick={() => fetchDetail(org.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${
                        isSelected
                          ? 'bg-violet-50 dark:bg-violet-950/50'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {org.hasLogo
                          ? <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-800">
                              {/* Logo thumbnail wordt geladen bij selectie */}
                              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                                {org.name[0]?.toUpperCase()}
                              </div>
                            </div>
                          : <OrgAvatar name={org.name} active={isSelected} />
                        }
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <p className={`text-sm font-medium truncate leading-tight ${
                              isSelected
                                ? 'text-violet-700 dark:text-violet-300'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}>
                              {org.name}
                            </p>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                              org.isActive
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-400'
                            }`}>
                              {org.isActive ? 'Actief' : 'Inactief'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">
                            {org.clientCount} clients · {org.userCount} gebruikers
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-3 flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {(user?.email?.[0] ?? '').toUpperCase()}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={toggleDarkMode}
                title={darkMode ? 'Lichte modus' : 'Donkere modus'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {darkMode ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              <button
                onClick={handleLogout}
                title="Uitloggen"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Hoofdinhoud ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbalk */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex-shrink-0 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            {/* Logo preview in topbar */}
            {logoDataUrl && (
              <img
                src={logoDataUrl}
                alt="Logo"
                className="h-9 w-auto max-w-[120px] object-contain flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {detail ? detail.name : 'Organisatieoverzicht'}
              </h1>
              {detail ? (
                <p className="text-xs text-slate-400 mt-0.5">
                  /{detail.slug} · Aangemaakt{' '}
                  {new Date(detail.createdAt).toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              ) : (
                <p className="text-xs text-slate-400 mt-0.5">Beheer al uw organisaties op één plek</p>
              )}
            </div>
          </div>
          {detail && (
            <div className="flex items-center gap-4 flex-shrink-0">
              <LogoUploader
                orgId={detail.id}
                currentDataUrl={logoDataUrl}
                onUploaded={url => {
                  setLogoDataUrl(url)
                  setOrgs(prev => prev.map(o => o.id === detail.id ? { ...o, hasLogo: true } : o))
                }}
                onDeleted={() => {
                  setLogoDataUrl(null)
                  setOrgs(prev => prev.map(o => o.id === detail.id ? { ...o, hasLogo: false } : o))
                }}
              />
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  detail.isActive
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                }`}>
                  {detail.isActive ? 'Actief' : 'Inactief'}
                </span>
                <Button size="sm" onClick={() => setShowAddClient(true)}>
                  <Plus size={13} /> Client toevoegen
                </Button>
              </div>
            </div>
          )}
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 flex flex-col gap-5">

          {/* Stat cards — altijd zichtbaar */}
          <div className="grid grid-cols-4 gap-4 flex-shrink-0">
            <StatCard
              icon={<Building2 size={18} className="text-violet-600" />}
              label="Organisaties"
              value={orgs.length}
              tone="bg-violet-50 dark:bg-violet-950/50"
            />
            <StatCard
              icon={<Building2 size={18} className="text-emerald-600" />}
              label="Actief"
              value={activeOrgs}
              tone="bg-emerald-50 dark:bg-emerald-950/50"
            />
            <StatCard
              icon={<Briefcase size={18} className="text-violet-600" />}
              label="Clients"
              value={totalClients}
              tone="bg-violet-50 dark:bg-violet-950/50"
            />
            <StatCard
              icon={<Users size={18} className="text-amber-600" />}
              label="Gebruikers"
              value={totalUsers}
              tone="bg-amber-50 dark:bg-amber-950/50"
            />
          </div>

          {/* Detail of lege staat */}
          {!detail ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Building2 size={28} className="text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Selecteer een organisatie</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Kies een organisatie uit de lijst links</p>
              </div>
            </div>
          ) : detailLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-slate-400">Laden…</p>
            </div>
          ) : (
            <div className="flex gap-4 flex-1 min-h-0">

              {/* Clients paneel */}
              <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Briefcase size={14} className="text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Clients</span>
                    <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">
                      {detail.clients.length}
                    </span>
                  </div>
                  <Button size="sm" onClick={() => setShowAddClient(true)}>
                    <Plus size={13} /> Toevoegen
                  </Button>
                </CardHeader>
                <div className="flex-1 overflow-y-auto">
                  {detail.clients.length === 0 ? (
                    <div className="p-8 text-center">
                      <Briefcase size={28} className="mx-auto mb-2 text-slate-200 dark:text-slate-700" />
                      <p className="text-sm text-slate-400 dark:text-slate-500">Nog geen clients</p>
                      <button
                        onClick={() => setShowAddClient(true)}
                        className="mt-1.5 text-xs text-violet-500 hover:underline"
                      >
                        Eerste client toevoegen
                      </button>
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                      {detail.clients.map(c => (
                        <li
                          key={c.id}
                          className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {c.name[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{c.name}</p>
                              <p className="text-xs text-slate-400">{c.userCount} gebruikers</p>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                            c.isActive
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                          }`}>
                            {c.isActive ? 'Actief' : 'Inactief'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Card>

              {/* Gebruikers paneel */}
              <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Gebruikers</span>
                    <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">
                      {detail.users.length}
                    </span>
                  </div>
                </CardHeader>
                <div className="flex-1 overflow-y-auto">
                  {detail.users.length === 0 ? (
                    <div className="p-8 text-center">
                      <Users size={28} className="mx-auto mb-2 text-slate-200 dark:text-slate-700" />
                      <p className="text-sm text-slate-400 dark:text-slate-500">Nog geen gebruikers</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                      {detail.users.map(u => (
                        <li
                          key={u.id}
                          className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {u.email[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{u.email}</p>
                              <p className="text-xs text-slate-400 capitalize">{u.role}</p>
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
          )}
        </div>
      </div>

      {/* Modals */}
      <AddOrganisationModal
        open={showAddOrg}
        onClose={() => setShowAddOrg(false)}
        onSuccess={fetchOrgs}
      />
      {detail && (
        <AddClientModal
          open={showAddClient}
          onClose={() => setShowAddClient(false)}
          onSuccess={() => fetchDetail(detail.id)}
          endpoint={`/organisations/${detail.id}/clients`}
        />
      )}
    </div>
  )
}
