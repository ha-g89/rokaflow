import { useState, useEffect, useRef } from 'react'
import {
  Moon, Sun, Shield, CheckCircle2, ArrowLeftCircle,
  AlertTriangle, UserPlus, ArrowLeftRight, Copy,
  Package, Users, CreditCard, Zap, Lock, Receipt,
  Building2, Upload,
} from 'lucide-react'
import api from '@/lib/axios'
import { useThemeStore } from '@/store/themeStore'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/portal/PortalUI'
import { BillingProfileForm } from '@/components/billing/BillingProfileForm'
import { InvoiceList } from '@/components/billing/InvoiceList'
import type { ClientUserListItem } from '@/types/clientUser'
import type { MyPlanDto } from '@/types/platformPlan'

interface MspStatus {
  hasMspAccount: boolean
  orgName?: string
  hasMspManager: boolean
  mspManagerName?: string
  transferCode?: string
  hasPendingTransfer?: boolean
}

interface Props {
  teammates: ClientUserListItem[]
  tenantName: string
  onAddUser: () => void
  mspStatus: MspStatus | null
  onMspStatusRefresh: () => void
  onSwitchToMsp: () => void
  mspSwitching: boolean
  onLogoChanged?: () => void
}

const MAX_LOGO_BYTES = 2 * 1024 * 1024

function LogoCard({ onLogoChanged }: { onLogoChanged?: () => void }) {
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)
  const [logoLoading, setLogoLoading] = useState(true)
  const [uploading, setUploading]     = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchLogo = () => {
    setLogoLoading(true)
    api.get<{ logoDataUrl: string | null }>('/portal/logo')
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
      await api.post('/portal/logo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      fetchLogo()
      onLogoChanged?.()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg ?? 'Uploaden mislukt. Probeer het opnieuw.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={15} className="text-slate-400" />
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Bedrijfslogo</h2>
        </div>
        <div className="flex items-center gap-4">
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
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Dit logo wordt getoond in het portaal en op documenten.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload size={13} /> {uploading ? 'Bezig…' : 'Logo wijzigen'}
            </Button>
            {error && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{error}</p>}
            <p className="text-xs text-slate-400 mt-2">PNG, JPEG, SVG of WebP · max 2 MB</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function UsageBar({ used, max, label, icon }: { used: number; max: number | null; label: string; icon: React.ReactNode }) {
  const unlimited = max === 0 || max === null
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / max!) * 100))
  const warning = !unlimited && pct >= 80
  const full    = !unlimited && pct >= 100
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
          {icon}
          {label}
        </div>
        <span className={`text-xs font-semibold ${full ? 'text-red-600' : warning ? 'text-amber-600' : 'text-slate-500 dark:text-slate-400'}`}>
          {used}{unlimited ? '' : ` / ${max}`}
          {unlimited && <span className="font-normal text-slate-400"> (onbeperkt)</span>}
        </span>
      </div>
      {!unlimited && (
        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${full ? 'bg-red-500' : warning ? 'bg-amber-400' : 'bg-blue-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}

export function SettingsView({ teammates, tenantName, onAddUser, mspStatus, onMspStatusRefresh, onSwitchToMsp, mspSwitching, onLogoChanged }: Props) {
  const { darkMode, toggleDarkMode } = useThemeStore()

  const [plan, setPlan] = useState<MyPlanDto | null>(null)
  const [planNotFound, setPlanNotFound] = useState(false)

  useEffect(() => {
    api.get<MyPlanDto>('/portal/my-plan').then(r => setPlan(r.data)).catch((err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 404) setPlanNotFound(true)
    })
  }, [])

  const [upgradeLoading, setUpgradeLoading]   = useState(false)
  const [upgradeError, setUpgradeError]       = useState<string | null>(null)
  const [upgradeSuccess, setUpgradeSuccess]   = useState(false)

  const handleUpgrade = async () => {
    setUpgradeLoading(true)
    setUpgradeError(null)
    try {
      await api.post('/portal/upgrade-to-msp')
      setUpgradeSuccess(true)
      onMspStatusRefresh()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setUpgradeError(msg ?? 'Er is een fout opgetreden. Probeer het opnieuw.')
    } finally {
      setUpgradeLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">

      {mspStatus?.hasPendingTransfer && (
        <div className="flex items-start gap-3 px-4 py-3.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">MSP-overdracht in behandeling</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Er is een openstaand overdrachtverzoek voor uw omgeving. Controleer uw e-mail voor de goedkeuringslink, of neem contact op met uw huidige MSP.
            </p>
          </div>
        </div>
      )}

      {/* Bedrijfslogo */}
      <LogoCard onLogoChanged={onLogoChanged} />

      {/* Abonnement */}
      {planNotFound && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={15} className="text-slate-400" />
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Abonnement</h2>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={15} className="text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Geen abonnement gekoppeld</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Alles is alleen-lezen totdat {mspStatus?.hasMspManager ? 'uw MSP' : 'een beheerder'} een abonnement toewijst.
                  Neem contact op met{' '}
                  <a href="mailto:support@rokaflow.nl" className="text-blue-600 hover:underline">support@rokaflow.nl</a>
                  {' '}als u vragen heeft.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {plan && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={15} className="text-slate-400" />
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Abonnement</h2>
            </div>

            {mspStatus?.hasMspManager ? (
              /* MSP beheert dit account — toon alleen status, geen bewerkbare details */
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <Shield size={15} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    Beheerd door{' '}
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {mspStatus.mspManagerName ?? 'uw MSP'}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Uw abonnement wordt beheerd door uw MSP-partner.
                    Neem contact met hen op voor wijzigingen.
                  </p>
                  {plan.planName && (
                    <span className="inline-flex mt-2 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium">
                      {plan.planName}
                    </span>
                  )}
                  {plan.status === 'Trial' && (
                    <span className="inline-flex mt-2 ml-1.5 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium">
                      Trial
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Status header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {plan.status === 'Trial' && <Zap size={14} className="text-blue-500" />}
                    {plan.status === 'GracePeriod' && <AlertTriangle size={14} className="text-amber-500" />}
                    {plan.status === 'Active' && <CheckCircle2 size={14} className="text-emerald-500" />}
                    {plan.status === 'Blocked' && <Lock size={14} className="text-red-500" />}
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {plan.status === 'Trial' && 'Gratis proefperiode'}
                      {plan.status === 'GracePeriod' && 'Grace period'}
                      {plan.status === 'Active' && (plan.planName ?? 'Actief abonnement')}
                      {plan.status === 'Blocked' && 'Account geblokkeerd'}
                    </span>
                  </div>
                  {plan.planName && plan.status === 'Active' && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium">
                      {plan.planName}
                    </span>
                  )}
                  {plan.status === 'Trial' && plan.trialEndsAt && (() => {
                    const days = Math.ceil((new Date(plan.trialEndsAt).getTime() - Date.now()) / 86400000)
                    return (
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${days <= 7 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                        {days > 0 ? `${days} dag${days !== 1 ? 'en' : ''} resterend` : 'Verlopen'}
                      </span>
                    )
                  })()}
                </div>

                {/* Usage bars */}
                <div className="space-y-3">
                  <UsageBar used={plan.usedAssets}      max={plan.maxAssets ?? null}      label="Assets"             icon={<Package size={11} />} />
                  <UsageBar used={plan.usedEmployees}   max={plan.maxEmployees ?? null}   label="Medewerkers"        icon={<Users size={11} />} />
                  <UsageBar used={plan.usedPortalUsers} max={plan.maxPortalUsers ?? null} label="Portaalgebruikers"  icon={<Shield size={11} />} />
                </div>

                {(plan.status === 'Trial' || plan.status === 'GracePeriod') && (
                  <p className="mt-4 text-xs text-slate-400">
                    Neem contact op met{' '}
                    <a href="mailto:support@rokaflow.nl" className="text-blue-600 hover:underline">support@rokaflow.nl</a>
                    {' '}om een abonnement te activeren.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Facturatie (directe klant) */}
      {mspStatus !== null && !mspStatus.hasMspManager && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Receipt size={15} className="text-slate-400" />
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Facturatie</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Deze gegevens worden gebruikt voor de facturen van RokaFlow.
            </p>
            <BillingProfileForm baseUrl="/portal/billing" mode="full" />

            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-6 mb-3">Facturen</h3>
            <InvoiceList baseUrl="/portal/billing" />
          </CardContent>
        </Card>
      )}

      {/* Bedrijfsgegevens (MSP-beheerde klant) */}
      {mspStatus !== null && mspStatus.hasMspManager && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={15} className="text-slate-400" />
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Bedrijfsgegevens</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Deze gegevens (KvK, BTW, IBAN, adres) horen bij uw organisatie. Facturatie verloopt via uw MSP.
            </p>
            <BillingProfileForm baseUrl="/portal/billing" mode="company" />
          </CardContent>
        </Card>
      )}

      {/* Weergave */}
      <Card>
        <CardContent className="p-5">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Weergave</h2>
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                {darkMode ? <Moon size={15} className="text-blue-400" /> : <Sun size={15} className="text-amber-500" />}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Donkere modus</p>
                <p className="text-xs text-slate-400 mt-0.5">Schakel tussen licht en donker thema</p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                darkMode ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Portaalgebruikers */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Portaalgebruikers</h2>
              <p className="text-xs text-slate-500 mt-0.5">Medewerkers met toegang tot het portaal van {tenantName}</p>
            </div>
            <Button size="sm" onClick={onAddUser}>
              <UserPlus size={13} /> Gebruiker toevoegen
            </Button>
          </div>
          {(() => {
            const portalUsers = teammates.filter(u => u.isPortalUser)
            return (
              <div className="rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 grid grid-cols-[1fr_auto] gap-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <span>Gebruiker</span>
                  <span>Status</span>
                </div>
                {portalUsers.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">Nog geen portaalgebruikers aangemaakt.</div>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                    {portalUsers.map(u => (
                      <li key={u.id} className="px-4 py-3 grid grid-cols-[1fr_auto] gap-4 items-center">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar first={u.firstName} last={u.lastName} size={28} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-slate-400 truncate">{u.email}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {u.isActive ? 'Actief' : 'Inactief'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* Transfer code */}
      {mspStatus?.transferCode && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ArrowLeftRight size={15} className="text-slate-500 dark:text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">MSP Transfer-code</p>
                <p className="text-xs text-slate-500 mt-0.5 mb-3">
                  Deel deze code met een nieuwe MSP als u van beheerder wilt wisselen.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-mono tracking-widest text-slate-800 dark:text-slate-100 text-center select-all">
                    {mspStatus.transferCode}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(mspStatus.transferCode!)}
                    title="Kopiëren"
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MSP Partner */}
      {mspStatus !== null && (
        <Card>
          <CardContent className="p-5">
            {mspStatus.hasMspAccount ? (
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 size={15} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">MSP Partner</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Uw account is gekoppeld aan <span className="font-medium text-blue-600 dark:text-blue-400">{mspStatus.orgName}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">U kunt vanuit het MSP-portaal klanten beheren en toevoegen.</p>
                  </div>
                </div>
                <button
                  onClick={onSwitchToMsp}
                  disabled={mspSwitching}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  <ArrowLeftCircle size={13} className="rotate-180" />
                  {mspSwitching ? 'Even wachten…' : 'Naar MSP Portaal'}
                </button>
              </div>
            ) : mspStatus.hasMspManager ? (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield size={15} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Beheerd door MSP</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dit portaal wordt al beheerd door{' '}
                    <span className="font-medium text-amber-600 dark:text-amber-400">
                      {mspStatus.mspManagerName ?? 'een MSP'}
                    </span>. Het is niet mogelijk om een eigen MSP-account aan te maken.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Shield size={15} className="text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Wordt MSP Partner</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Upgrade uw account om meerdere klanten te beheren vanuit een eigen MSP-omgeving.
                    </p>
                  </div>
                </div>

                {upgradeSuccess ? (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                    <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">MSP account aangemaakt!</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Log nu in op het MSP Portaal met hetzelfde e-mailadres en wachtwoord.</p>
                    </div>
                    <button
                      onClick={onSwitchToMsp}
                      disabled={mspSwitching}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <ArrowLeftCircle size={13} className="rotate-180" />
                      {mspSwitching ? 'Even wachten…' : 'Naar MSP Portaal'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upgradeError && (
                      <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400">
                        <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                        {upgradeError}
                      </div>
                    )}
                    <button
                      onClick={handleUpgrade}
                      disabled={upgradeLoading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl transition-colors disabled:opacity-50"
                    >
                      <ArrowLeftCircle size={14} className="rotate-180" />
                      {upgradeLoading ? 'Bezig…' : 'MSP account aanmaken'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
