import { useState, useEffect, useRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, Moon, Sun, User, Shield, Briefcase, Upload } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/axios'

const ROLE_META: Record<string, { label: string; badge: string; icon: ReactNode; description: string }> = {
  msp_admin:    {
    label: 'MSP Admin',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
    icon: <Shield size={15} />,
    description: 'Beheert organisaties en clients vanuit het MSP-platform',
  },
  msp_member:   {
    label: 'MSP Beheerder',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
    icon: <Shield size={15} />,
    description: 'Toegang tot het MSP-platform als beheerder',
  },
  portal_admin: {
    label: 'Portal Beheerder',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
    icon: <User size={15} />,
    description: 'Beheert het klantportaal van uw eigen organisatie',
  },
  employee:     {
    label: 'Medewerker',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    icon: <Briefcase size={15} />,
    description: 'Medewerker zonder inlogrechten op het portaal',
  },
}

const MAX_LOGO_BYTES = 2 * 1024 * 1024

function LogoCard() {
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)
  const [logoLoading, setLogoLoading] = useState(true)
  const [uploading, setUploading]     = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchLogo = () => {
    setLogoLoading(true)
    api.get<{ logoDataUrl: string | null }>('/msp/logo')
      .then(r => setLogoDataUrl(r.data.logoDataUrl))
      .catch(() => {})
      .finally(() => setLogoLoading(false))
  }

  useEffect(() => { fetchLogo() }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setError(null)
    if (file.size > MAX_LOGO_BYTES) {
      setError('Bestand is te groot. Maximaal 2 MB toegestaan.')
      return
    }

    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      await api.post('/msp/logo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      fetchLogo()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg ?? 'Uploaden mislukt. Probeer het opnieuw.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Bedrijfslogo</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Dit logo wordt getoond in het MSP-portaal en op documenten</p>
      </div>

      <div className="px-5 py-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {logoLoading ? (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : logoDataUrl ? (
            <img src={logoDataUrl} alt="Bedrijfslogo" className="w-full h-full object-contain p-1" />
          ) : (
            <Building2 size={20} className="text-slate-300 dark:text-slate-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={13} /> {uploading ? 'Bezig…' : 'Logo wijzigen'}
          </button>
          {error && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{error}</p>}
          <p className="text-xs text-slate-400 mt-2">PNG, JPEG, SVG of WebP · max 2 MB</p>
        </div>
      </div>
    </div>
  )
}

export default function OrgSettings() {
  const navigate = useNavigate()
  const { darkMode, toggleDarkMode } = useThemeStore()
  const { user } = useAuthStore()

  const roleMeta = ROLE_META[user?.role ?? ''] ?? {
    label: user?.role ?? '—',
    badge: 'bg-slate-100 text-slate-500',
    icon: <User size={15} />,
    description: '',
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col">

      {/* Header */}
      <header className="bg-slate-900 dark:bg-slate-950 border-b border-slate-800 text-white px-6 py-3.5 flex items-center gap-3 shadow-md flex-shrink-0">
        <button
          onClick={() => navigate('/org')}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Terug"
        >
          <ArrowLeft size={16} />
        </button>
        <Building2 size={18} className="text-blue-400 flex-shrink-0" />
        <span className="font-bold text-sm truncate">{user?.tenantName ?? 'Organisatie'}</span>
        <span className="text-slate-500 text-xs uppercase tracking-wider">/ Instellingen</span>
      </header>

      {/* Content */}
      <div className="flex-1 max-w-2xl w-full mx-auto px-6 py-8 flex flex-col gap-6">

        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Instellingen</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Beheer jouw portaalvoorkeuren</p>
        </div>

        {/* Account card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Account</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Ingelogde gebruiker en toegangsniveau</p>
          </div>

          <div className="px-5 py-5 flex items-center gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white text-lg font-bold flex items-center justify-center flex-shrink-0 select-none">
              {(user?.email?.[0] ?? '?').toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.email}</p>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${roleMeta.badge}`}>
                  {roleMeta.icon}
                  {roleMeta.label}
                </span>
              </div>
              {roleMeta.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{roleMeta.description}</p>
              )}
            </div>
          </div>

          {/* Organisatie / Tenant info */}
          <div className="px-5 pb-4 flex flex-col gap-2.5">
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl px-4 py-3">
              <Briefcase size={14} className="text-slate-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-slate-400">Organisatie / Bedrijf</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate mt-0.5">
                  {user?.tenantName ?? '—'}
                </p>
              </div>
            </div>

            {user?.switchedFromOrgName && (
              <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl px-4 py-3">
                <Shield size={14} className="text-amber-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-amber-600 dark:text-amber-400">Ingelogd via MSP</p>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300 truncate mt-0.5">
                    {user.switchedFromOrgName}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Logo card */}
        <LogoCard />

        {/* Appearance card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Weergave</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pas het uiterlijk van het portaal aan</p>
          </div>

          <div className="px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  darkMode ? 'bg-slate-700 text-blue-400' : 'bg-amber-50 text-amber-500'
                }`}>
                  {darkMode ? <Moon size={16} /> : <Sun size={16} />}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {darkMode ? 'Donkere modus' : 'Lichte modus'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {darkMode ? 'Schakel over naar lichte weergave' : 'Schakel over naar donkere weergave'}
                  </p>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                onClick={toggleDarkMode}
                aria-label="Thema wisselen"
                className={`relative w-12 h-6 rounded-full flex-shrink-0 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
                  darkMode ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  darkMode ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
