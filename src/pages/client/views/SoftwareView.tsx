import { FilterSelect } from '@/components/ui/FilterSelect'
import { useSort, SortHeader } from '@/components/ui/SortHeader'
import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Shield, CreditCard, CheckCircle2, ChevronRight, Archive,
  Plus, Search, Users, Pencil, Trash2, X, StickyNote, History,
  Maximize2, ArrowLeft, Building2, Package, Calendar, Upload,
} from 'lucide-react'
import api from '@/lib/axios'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatCard } from '@/components/portal/PortalUI'
import { LoadingState, LoadingSpinner } from '@/components/ui/LoadingState'
import { HistoryBlock, softwareAuditLabel, softwareDescriptionFn } from '@/components/portal/AuditHistory'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { NotesPanel } from '@/components/NotesPanel'
import { LicenseView } from './LicenseView'
import { ImportWizardModal } from '@/components/import/ImportWizardModal'
import type { ImportSoftwareRow, SoftwareImportPreview } from '@/types/import'
import type { SoftwareListItem } from '@/types/software'
import type { LicenseListItem, LicenseUserDto } from '@/types/license'
import type { ClientUserListItem } from '@/types/clientUser'

// ── Wizard schemas ────────────────────────────────────────────────────────────

const swStep1Schema = z.object({
  name:       z.string().min(1, 'Naam is verplicht'),
  publisher:  z.string().min(1, 'Uitgever is verplicht'),
  vendor:     z.string(),
  isPaid:     z.boolean(),
  trackUsers: z.boolean(),
})
const swStep2Schema = z.object({
  maxUsers:  z.string().min(1, 'Aantal seats is verplicht'),
  vendor:    z.string(),
  supplier:  z.string(),
  startsAt:  z.string(),
  expiresAt: z.string().min(1, 'Vervaldatum is verplicht'),
})
type SwStep1Values = z.infer<typeof swStep1Schema>
type SwStep2Values = z.infer<typeof swStep2Schema>

// ── SoftwareWizard ────────────────────────────────────────────────────────────

function SoftwareWizard({ editTarget, onClose, onSaved }: {
  editTarget: SoftwareListItem | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!editTarget
  const [step, setStep]                       = useState<1 | 2>(1)
  const [step1Data, setStep1Data]             = useState<SwStep1Values | null>(null)
  const [saving, setSaving]                   = useState(false)
  const [apiError, setApiError]               = useState<string | null>(null)
  const [licenseMode, setLicenseMode]         = useState<'select' | 'create' | null>(null)
  const [licenses, setLicenses]               = useState<LicenseListItem[]>([])
  const [selectedLicense, setSelectedLicense] = useState<LicenseListItem | null>(null)
  const [licenseSearch, setLicenseSearch]     = useState('')
  const [loadingLicenses, setLoadingLicenses] = useState(false)

  const form1 = useForm<SwStep1Values>({
    resolver: zodResolver(swStep1Schema),
    defaultValues: {
      name:       editTarget?.name ?? '',
      publisher:  editTarget?.publisher ?? '',
      vendor:     editTarget?.vendor ?? '',
      isPaid:     editTarget?.isPaid ?? false,
      trackUsers: false,
    },
  })
  const form2 = useForm<SwStep2Values>({
    resolver: zodResolver(swStep2Schema),
    defaultValues: {
      maxUsers:  '',
      vendor:    '',
      supplier:  '',
      startsAt:  new Date().toISOString().slice(0, 10),
      expiresAt: '',
    },
  })

  const isPaid = form1.watch('isPaid')

  const handleStep1 = form1.handleSubmit(async (values) => {
    setApiError(null)
    if (isEdit) {
      setSaving(true)
      try {
        await api.put(`/portal/software/${editTarget!.id}`, {
          name:      values.name.trim(),
          publisher: values.publisher.trim(),
          vendor:    values.vendor.trim() || null,
        })
        onSaved()
      } catch (err: unknown) {
        setApiError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Er is iets misgegaan.')
      } finally { setSaving(false) }
      return
    }
    if (!values.isPaid) {
      setSaving(true)
      try {
        await api.post('/portal/software', {
          name:       values.name.trim(),
          publisher:  values.publisher.trim(),
          vendor:     values.vendor.trim() || null,
          isPaid:     false,
          trackUsers: true,
        })
        onSaved()
      } catch (err: unknown) {
        setApiError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Er is iets misgegaan.')
      } finally { setSaving(false) }
      return
    }
    setStep1Data(values)
    setStep(2)
  })

  const handleStep2 = form2.handleSubmit(async (values) => {
    if (!step1Data) return
    setSaving(true)
    setApiError(null)
    try {
      await api.post('/portal/software', {
        name:             step1Data.name.trim(),
        publisher:        step1Data.publisher.trim(),
        vendor:           step1Data.vendor.trim() || null,
        isPaid:           true,
        licenseMaxUsers:  Number(values.maxUsers),
        licenseVendor:    values.vendor.trim() || null,
        licenseSupplier:  values.supplier.trim() || null,
        licenseStartsAt:  values.startsAt,
        licenseExpiresAt: values.expiresAt || null,
      })
      onSaved()
    } catch (err: unknown) {
      setApiError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Er is iets misgegaan.')
    } finally { setSaving(false) }
  })

  const handleSelectExistingLicense = async () => {
    if (!step1Data || !selectedLicense) return
    setSaving(true)
    setApiError(null)
    try {
      await api.post('/portal/software', {
        name:              step1Data.name.trim(),
        publisher:         step1Data.publisher.trim(),
        vendor:            step1Data.vendor.trim() || null,
        isPaid:            true,
        existingLicenseId: selectedLicense.id,
      })
      onSaved()
    } catch (err: unknown) {
      setApiError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Er is iets misgegaan.')
    } finally { setSaving(false) }
  }

  useEffect(() => {
    if (step !== 2) return
    setLoadingLicenses(true)
    api.get<LicenseListItem[]>('/portal/licenses')
      .then(r => setLicenses(r.data))
      .catch(() => {})
      .finally(() => setLoadingLicenses(false))
  }, [step])

  const filteredLicenses = licenses.filter(l =>
    `${l.name} ${l.vendor}`.toLowerCase().includes(licenseSearch.toLowerCase())
  )

  const inputCls = 'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-400 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25'
  const labelCls = 'block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 modal-backdrop-animated">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md flex flex-col modal-panel-animated">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              {isEdit ? 'Software bewerken' : step === 1 ? 'Software toevoegen' : 'Licentie koppelen'}
            </h2>
            {!isEdit && isPaid && (
              <div className="flex items-center gap-2 mt-2">
                {[{ n: 1, l: 'Software' }, { n: 2, l: 'Licentie' }].map((s, i) => (
                  <div key={s.n} className="flex items-center gap-1.5">
                    {i > 0 && <ChevronRight size={12} className="text-slate-300" />}
                    <div className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                      step >= s.n ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-500'
                    }`}>{s.n}</div>
                    <span className={`text-xs ${step >= s.n ? 'text-blue-600 font-medium' : 'text-slate-400'}`}>{s.l}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mt-0.5">
            <X size={18} />
          </button>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="px-6 py-5 space-y-4">
            <div>
              <label className={labelCls}>Naam <span className="text-red-500">*</span></label>
              <input {...form1.register('name')} placeholder="bijv. Microsoft Office" className={inputCls} />
              {form1.formState.errors.name && <p className="mt-1 text-xs text-red-500">{form1.formState.errors.name.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Uitgever <span className="text-red-500">*</span></label>
              <input {...form1.register('publisher')} placeholder="bijv. Microsoft" className={inputCls} />
              {form1.formState.errors.publisher && <p className="mt-1 text-xs text-red-500">{form1.formState.errors.publisher.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Leverancier <span className="text-slate-400">(optioneel)</span></label>
              <input {...form1.register('vendor')} placeholder="bijv. SoftwareOne" className={inputCls} />
            </div>

            {!isEdit && (
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Type</label>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <button type="button" onClick={() => { form1.setValue('isPaid', false); form1.setValue('trackUsers', true) }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        !isPaid ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                      }`}>
                      <CheckCircle2 size={22} className={!isPaid ? 'text-emerald-600' : 'text-slate-300'} />
                      <span className={`text-sm font-medium ${!isPaid ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}`}>Gratis</span>
                      <span className="text-xs text-slate-400 text-center">Freeware / gratis tier</span>
                    </button>
                    <button type="button" onClick={() => { form1.setValue('isPaid', true); form1.setValue('trackUsers', false) }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        isPaid ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                      }`}>
                      <CreditCard size={22} className={isPaid ? 'text-blue-600' : 'text-slate-300'} />
                      <span className={`text-sm font-medium ${isPaid ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500'}`}>Betaald</span>
                      <span className="text-xs text-slate-400 text-center">Licentie koppelen</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

            {apiError && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-4 py-3">
                <p className="text-sm text-red-700 dark:text-red-400">{apiError}</p>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>Annuleren</Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Opslaan…' : isEdit ? 'Opslaan' : isPaid ? 'Volgende →' : 'Toevoegen'}
              </Button>
            </div>
          </form>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="px-6 py-5">
            {!licenseMode && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">Wil je een bestaande licentie koppelen of een nieuwe aanmaken?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setLicenseMode('select')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                    <Archive size={22} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Bestaande koppelen</span>
                    <span className="text-xs text-slate-400 text-center">Kies uit de bestaande licenties</span>
                  </button>
                  <button type="button" onClick={() => setLicenseMode('create')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                    <Plus size={22} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Nieuwe aanmaken</span>
                    <span className="text-xs text-slate-400 text-center">Maak een nieuwe licentie aan</span>
                  </button>
                </div>
                <div className="flex justify-between pt-1">
                  <Button variant="secondary" type="button" onClick={() => setStep(1)}>← Terug</Button>
                  <Button variant="secondary" type="button" onClick={onClose}>Annuleren</Button>
                </div>
              </div>
            )}

            {licenseMode === 'select' && (
              <div className="space-y-3">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={licenseSearch}
                    onChange={e => setLicenseSearch(e.target.value)}
                    placeholder="Zoek licentie…"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-400 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-600 divide-y divide-slate-100 dark:divide-slate-700">
                  {loadingLicenses ? (
                    <div className="p-4 flex justify-center"><LoadingSpinner size="sm" /></div>
                  ) : filteredLicenses.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center p-4">Geen licenties gevonden.</p>
                  ) : filteredLicenses.map(l => (
                    <button type="button" key={l.id}
                      onClick={() => setSelectedLicense(prev => prev?.id === l.id ? null : l)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                        selectedLicense?.id === l.id ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium truncate ${selectedLicense?.id === l.id ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>{l.name}</p>
                        <p className="text-xs text-slate-400 truncate">{l.vendor || '—'}{l.expiresAt ? ` · tot ${new Date(l.expiresAt).toLocaleDateString('nl-NL')}` : ''}</p>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0 ml-3 tabular-nums">
                        {l.assignedUsers} / {l.maxUsers}
                      </span>
                    </button>
                  ))}
                </div>
                {apiError && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-4 py-3">
                    <p className="text-sm text-red-700 dark:text-red-400">{apiError}</p>
                  </div>
                )}
                <div className="flex justify-between pt-1">
                  <Button variant="secondary" type="button" onClick={() => { setLicenseMode(null); setSelectedLicense(null) }} disabled={saving}>← Terug</Button>
                  <div className="flex gap-2">
                    <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>Annuleren</Button>
                    <Button type="button" disabled={!selectedLicense || saving} onClick={handleSelectExistingLicense}>
                      {saving ? 'Opslaan…' : 'Koppelen'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {licenseMode === 'create' && (
              <form onSubmit={handleStep2} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Aantal seats <span className="text-red-500">*</span></label>
                    <input {...form2.register('maxUsers')} type="number" min="1" placeholder="bijv. 25" className={inputCls} />
                    {form2.formState.errors.maxUsers && <p className="mt-1 text-xs text-red-500">{form2.formState.errors.maxUsers.message}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Startdatum <span className="text-slate-400">(optioneel)</span></label>
                    <input {...form2.register('startsAt')} type="date" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Vervaldatum <span className="text-red-500">*</span></label>
                  <input {...form2.register('expiresAt')} type="date" className={inputCls} />
                  {form2.formState.errors.expiresAt && <p className="mt-1 text-xs text-red-500">{form2.formState.errors.expiresAt.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Uitgever <span className="text-slate-400">(optioneel)</span></label>
                  <input {...form2.register('vendor')} placeholder="bijv. Microsoft" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Leverancier <span className="text-slate-400">(optioneel)</span></label>
                  <input {...form2.register('supplier')} placeholder="bijv. SoftwareOne" className={inputCls} />
                </div>
                {apiError && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-4 py-3">
                    <p className="text-sm text-red-700 dark:text-red-400">{apiError}</p>
                  </div>
                )}
                <div className="flex justify-between pt-1">
                  <Button variant="secondary" type="button" onClick={() => setLicenseMode(null)} disabled={saving}>← Terug</Button>
                  <div className="flex gap-2">
                    <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>Annuleren</Button>
                    <Button type="submit" disabled={saving}>{saving ? 'Opslaan…' : 'Software aanmaken'}</Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── SoftwareDetailPanel ───────────────────────────────────────────────────────

function fmt(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function daysUntil(d: string | null | undefined): number | null {
  if (!d) return null
  const diff = new Date(d).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)
  return Math.ceil(diff / 86_400_000)
}

// ── SoftwareLicenseCard — gebruikt door het compacte SoftwareDetailPanel ──────

function SoftwareLicenseCard({ software, teammates, onUsersChanged }: {
  software: SoftwareListItem
  teammates: ClientUserListItem[]
  onUsersChanged: () => void
}) {
  const [licenseUsers, setLicenseUsers]   = useState<LicenseUserDto[]>([])
  const [loadingUsers, setLoadingUsers]   = useState(false)
  const [assignUserId, setAssignUserId]   = useState('')
  const [assigning, setAssigning]         = useState(false)

  const fetchLicenseUsers = useCallback(async () => {
    if (!software.licenseId) { setLicenseUsers([]); return }
    setLoadingUsers(true)
    try {
      const { data } = await api.get<LicenseListItem[]>('/portal/licenses')
      const match = data.find(l => l.id === software.licenseId)
      setLicenseUsers(match?.users ?? [])
    } finally { setLoadingUsers(false) }
  }, [software.licenseId])

  useEffect(() => { fetchLicenseUsers() }, [fetchLicenseUsers])

  const handleAssign = async (userId: string) => {
    if (!software.licenseId) return
    setAssigning(true)
    try {
      await api.post(`/portal/licenses/${software.licenseId}/assign`, { userId })
      setAssignUserId('')
      await fetchLicenseUsers()
      onUsersChanged()
    } finally { setAssigning(false) }
  }

  const handleRevoke = async (userId: string) => {
    if (!software.licenseId) return
    await api.delete(`/portal/licenses/${software.licenseId}/users/${userId}`)
    await fetchLicenseUsers()
    onUsersChanged()
  }

  const assignableUsers = teammates.filter(t => !licenseUsers.some(u => u.userId === t.id))
  const isUnlimited = software.maxUsers === 0
  const canAssign = isUnlimited || (software.maxUsers ?? 0) > (software.assignedUsers ?? 0)
  const usedPct = software.maxUsers
    ? Math.min(100, ((software.assignedUsers ?? 0) / software.maxUsers) * 100)
    : 0

  if (!software.isPaid && !software.licenseId) return null

  return (
    <div className="space-y-4">
      <p className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
        <CreditCard size={12} /> {software.isPaid ? 'Gekoppelde licentie' : 'Gebruikers bijhouden'}
      </p>
      {software.licenseId ? (
        <>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{software.licenseName || '—'}</p>
            {software.maxUsers === 0 ? (
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Gebruikers</span>
                <span className="font-semibold">{software.assignedUsers ?? 0} <span className="font-normal text-slate-400">/ onbeperkt</span></span>
              </div>
            ) : (
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Seats gebruikt</span>
                  <span className="font-semibold">{software.assignedUsers ?? 0} / {software.maxUsers ?? 0}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-600">
                  <div
                    className={`h-1.5 rounded-full transition-all ${usedPct >= 100 ? 'bg-red-500' : usedPct >= 80 ? 'bg-amber-400' : 'bg-blue-500'}`}
                    style={{ width: `${usedPct}%` }}
                  />
                </div>
              </div>
            )}
            {software.licenseExpiresAt && (() => {
              const days    = daysUntil(software.licenseExpiresAt)
              const expired = days !== null && days < 0
              const soon    = days !== null && days >= 0 && days <= 30
              return (
                <div className="pt-1 border-t border-slate-100 dark:border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Vervaldatum</span>
                    <span className="text-xs text-slate-500">{fmt(software.licenseExpiresAt)}</span>
                  </div>
                  {days !== null && (
                    <p className={`text-xs mt-0.5 ${expired ? 'text-red-500' : soon ? 'text-amber-500' : 'text-slate-400'}`}>
                      {expired ? `Verlopen (${Math.abs(days)} dagen geleden)`
                        : days === 0 ? 'Verloopt vandaag'
                        : `Nog ${days} dag${days === 1 ? '' : 'en'}`}
                    </p>
                  )}
                </div>
              )
            })()}
          </div>

          <div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
              Toegewezen gebruikers
            </p>
            {canAssign && assignableUsers.length > 0 && (
              <div className="flex gap-2 mb-3">
                <select
                  value={assignUserId}
                  onChange={e => setAssignUserId(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-400 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25"
                >
                  <option value="">— Selecteer medewerker —</option>
                  {assignableUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                  ))}
                </select>
                <Button size="sm" disabled={!assignUserId || assigning} onClick={() => handleAssign(assignUserId)}>
                  <Plus size={13} /> {assigning ? '…' : 'Toewijzen'}
                </Button>
              </div>
            )}
            {loadingUsers ? (
              <div className="flex items-center gap-2 text-xs text-slate-400"><LoadingSpinner size="xs" />Laden…</div>
            ) : licenseUsers.length === 0 ? (
              <p className="text-sm text-slate-400">Nog geen gebruikers toegewezen.</p>
            ) : (
              <ul className="space-y-1.5">
                {licenseUsers.map(u => (
                  <li key={u.userLicenseId} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-700/50 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{u.fullName}</p>
                      <p className="text-xs text-slate-400 truncate">{u.email}</p>
                    </div>
                    <button
                      onClick={() => handleRevoke(u.userId)}
                      className="ml-2 flex-shrink-0 text-xs text-red-600 hover:text-red-800 dark:text-red-400 font-medium"
                    >
                      Intrekken
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-400">Geen licentie gekoppeld.</p>
      )}
    </div>
  )
}

function SoftwareDetailPanel({ software, teammates, onEdit, onDelete, onUsersChanged, onExpand }: {
  software: SoftwareListItem
  teammates: ClientUserListItem[]
  onEdit: () => void
  onDelete: () => void
  onUsersChanged: () => void
  onExpand: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [activeTab, setActiveTab]         = useState<'notes' | 'history'>('notes')

  return (
    <Card className="overflow-hidden">
      <div className="px-5 pt-4 pb-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate mb-0.5">{software.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{software.publisher}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium mr-1 ${
              software.isPaid
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
            }`}>
              {software.isPaid ? 'Betaald' : 'Gratis'}
            </span>
            <button onClick={onEdit} title="Wijzigen" className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
              <Pencil size={13} />
            </button>
            <button onClick={() => setConfirmDelete(true)} title="Verwijderen" className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 size={13} />
            </button>
            <button onClick={onExpand} title="Volledig openen" className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <Maximize2 size={13} />
            </button>
          </div>
        </div>
      </div>

      <CardContent className="p-5 space-y-5">
        {software.vendor && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Leverancier</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{software.vendor}</p>
            </div>
          </div>
        )}

        <SoftwareLicenseCard software={software} teammates={teammates} onUsersChanged={onUsersChanged} />

        <ConfirmDeleteModal
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => { setConfirmDelete(false); onDelete() }}
          itemName={software.name}
        />

        <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
          <div className="flex items-center gap-1 mb-4">
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notes' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <StickyNote size={13} /> Notities
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <History size={13} /> Historie
            </button>
          </div>
          {activeTab === 'notes' && <NotesPanel entityType="Software" entityId={software.id} />}
          {activeTab === 'history' && (
            <HistoryBlock entityType="Software" entityId={software.id} labelFn={softwareAuditLabel} descriptionFn={softwareDescriptionFn} />
          )}
        </div>

        <p className="text-[11px] text-slate-400 dark:text-slate-500">Aangemaakt op {fmt(software.createdAt)}</p>
      </CardContent>
    </Card>
  )
}

// ── SoftwareDetailFullView ──────────────────────────────────────────────────────

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}

export function SoftwareDetailFullView({ initialSoftware, teammates, onBack, onDeleted, backLabel = 'Terug naar software' }: {
  initialSoftware: SoftwareListItem
  teammates: ClientUserListItem[]
  onBack: () => void
  onDeleted: () => void
  backLabel?: string
}) {
  const [software, setSoftware]     = useState<SoftwareListItem>(initialSoftware)
  const [showModal, setShowModal]   = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [activeTab, setActiveTab]   = useState<'notes' | 'history'>('notes')

  const [licenseUsers, setLicenseUsers] = useState<LicenseUserDto[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [showAssignRow, setShowAssignRow] = useState(false)
  const [assignUserId, setAssignUserId]   = useState('')
  const [assigning, setAssigning]         = useState(false)

  const fetchLicenseUsers = useCallback(async () => {
    if (!software.licenseId) { setLicenseUsers([]); return }
    setLoadingUsers(true)
    try {
      const { data } = await api.get<LicenseListItem[]>('/portal/licenses')
      const match = data.find(l => l.id === software.licenseId)
      setLicenseUsers(match?.users ?? [])
    } finally { setLoadingUsers(false) }
  }, [software.licenseId])

  useEffect(() => { fetchLicenseUsers() }, [fetchLicenseUsers])

  const refresh = async () => {
    const { data } = await api.get<SoftwareListItem[]>('/portal/software')
    const updated = data.find(s => s.id === software.id)
    if (updated) setSoftware(updated)
  }

  const handleDelete = async () => {
    await api.delete(`/portal/software/${software.id}`)
    onDeleted()
  }

  const handleAssign = async (userId: string) => {
    if (!software.licenseId) return
    setAssigning(true)
    try {
      await api.post(`/portal/licenses/${software.licenseId}/assign`, { userId })
      setAssignUserId('')
      setShowAssignRow(false)
      await fetchLicenseUsers()
      await refresh()
    } finally { setAssigning(false) }
  }

  const handleRevoke = async (userId: string) => {
    if (!software.licenseId) return
    await api.delete(`/portal/licenses/${software.licenseId}/users/${userId}`)
    await fetchLicenseUsers()
    await refresh()
  }

  const isUnlimited    = software.maxUsers === 0
  const usedCount      = software.assignedUsers ?? 0
  const usedPct        = software.licenseId
    ? isUnlimited ? Math.min(100, usedCount * 10) : Math.min(100, (usedCount / (software.maxUsers || 1)) * 100)
    : 0
  const assignableUsers = teammates.filter(t => !licenseUsers.some(u => u.userId === t.id))
  const canAssign       = !!software.licenseId && (isUnlimited || (software.maxUsers ?? 0) > usedCount)
  const usageLabel      = `${usedCount} / ${isUnlimited ? 'onbeperkt' : software.maxUsers}`

  return (
    <div className="flex flex-col gap-4 h-full">
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
          <ArrowLeft size={15} />
          {backLabel}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
        <Card>
          <div className="px-6 pt-5 pb-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {initials(software.name)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">{software.name}</h1>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                      software.isPaid
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    }`}>
                      {software.isPaid ? 'Betaald' : 'Gratis'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">{software.publisher}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <Pencil size={13} /> Wijzigen
                </button>
                <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <Trash2 size={13} /> Verwijderen
                </button>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-[1fr_360px] gap-4 items-start">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/60 p-3">
                  <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-400">
                    <Building2 size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Uitgever</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{software.publisher || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/60 p-3">
                  <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-400">
                    <Package size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Leverancier</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{software.vendor || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/60 p-3">
                  <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-400">
                    <CreditCard size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Type</p>
                    <p className={`text-sm font-semibold truncate ${software.isPaid ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {software.isPaid ? 'Betaald' : 'Gratis'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/60 p-3">
                  <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-400">
                    <Calendar size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Aangemaakt op</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{fmt(software.createdAt)}</p>
                  </div>
                </div>
              </div>

              {software.licenseId && (
                <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/60 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Licentiegebruik</span>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 tabular-nums">{usageLabel}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all ${!isUnlimited && usedPct >= 100 ? 'bg-red-500' : !isUnlimited && usedPct >= 80 ? 'bg-amber-400' : 'bg-blue-500'}`}
                      style={{ width: `${usedPct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                    {isUnlimited
                      ? `Onbeperkt aantal zitplaatsen — ${usedCount} gebruiker${usedCount === 1 ? '' : 's'} momenteel toegewezen.`
                      : `${Math.max(0, (software.maxUsers ?? 0) - usedCount)} zitplaats${(software.maxUsers ?? 0) - usedCount === 1 ? '' : 'en'} beschikbaar van de ${software.maxUsers}.`}
                  </p>
                  {software.licenseExpiresAt && (() => {
                    const days    = daysUntil(software.licenseExpiresAt)
                    const expired = days !== null && days < 0
                    const soon    = days !== null && days >= 0 && days <= 30
                    return (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                        <span className="text-xs text-slate-400">Vervaldatum</span>
                        <span className={`text-xs font-medium ${expired ? 'text-red-500' : soon ? 'text-amber-500' : 'text-slate-500 dark:text-slate-400'}`}>
                          {fmt(software.licenseExpiresAt)}
                        </span>
                      </div>
                    )
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardContent className="p-5">
              <h3 className="flex items-center gap-2 text-xs font-semibold text-violet-500 dark:text-violet-400 uppercase tracking-wider mb-4">
                <Users size={14} /> Gebruikers bijhouden
              </h3>

              {software.licenseId ? (
                <>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/60 p-3 mb-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{software.name}</p>
                      <p className="text-xs text-slate-400">Gebruikers</p>
                    </div>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex-shrink-0 tabular-nums">{usageLabel}</span>
                  </div>

                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Toegewezen gebruikers</p>

                  {loadingUsers ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400 py-2"><LoadingSpinner size="xs" />Laden…</div>
                  ) : licenseUsers.length === 0 ? (
                    <p className="text-sm text-slate-400 mb-3">Nog geen gebruikers toegewezen.</p>
                  ) : (
                    <ul className="space-y-2 mb-3">
                      {licenseUsers.map(u => (
                        <li key={u.userLicenseId} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/60 p-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {initials(u.fullName)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{u.fullName}</p>
                              <p className="text-xs text-slate-400 truncate">{u.email}</p>
                            </div>
                          </div>
                          <button onClick={() => handleRevoke(u.userId)} className="text-xs font-medium text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0">
                            Intrekken
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {canAssign && assignableUsers.length > 0 && (
                    showAssignRow ? (
                      <div className="flex gap-2">
                        <select
                          value={assignUserId}
                          onChange={e => setAssignUserId(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-400 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25"
                        >
                          <option value="">— Selecteer medewerker —</option>
                          {assignableUsers.map(u => (
                            <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                          ))}
                        </select>
                        <Button size="sm" disabled={!assignUserId || assigning} onClick={() => handleAssign(assignUserId)}>
                          {assigning ? '…' : 'OK'}
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAssignRow(true)}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 py-2.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
                      >
                        <Plus size={14} /> Gebruiker toewijzen
                      </button>
                    )
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-400">Geen licentie gekoppeld.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-1 mb-4">
              <button onClick={() => setActiveTab('notes')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notes' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                <StickyNote size={13} /> Notities
              </button>
              <button onClick={() => setActiveTab('history')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                <History size={13} /> Historie
              </button>
            </div>
            {activeTab === 'notes' && <NotesPanel entityType="Software" entityId={software.id} />}
            {activeTab === 'history' && (
              <HistoryBlock entityType="Software" entityId={software.id} labelFn={softwareAuditLabel} descriptionFn={softwareDescriptionFn} />
            )}
          </CardContent>
        </Card>
      </div>

      {showModal && (
        <SoftwareWizard
          editTarget={software}
          onClose={() => setShowModal(false)}
          onSaved={async () => { setShowModal(false); await refresh() }}
        />
      )}

      <ConfirmDeleteModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => { setConfirmDelete(false); handleDelete() }}
        itemName={software.name}
      />
    </div>
  )
}

// ── SoftwareCatalogTab ────────────────────────────────────────────────────────

function SoftwareCatalogTab({ teammates, tabBar, onExpand }: { teammates: ClientUserListItem[]; tabBar: React.ReactNode; onExpand?: (item: SoftwareListItem) => void }) {
  const [software, setSoftware]     = useState<SoftwareListItem[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [showModal, setShowModal]   = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editTarget, setEditTarget] = useState<SoftwareListItem | null>(null)
  const [selected, setSelected]     = useState<SoftwareListItem | null>(null)

  const fetchSoftware = useCallback(async () => {
    try {
      const { data } = await api.get<SoftwareListItem[]>('/portal/software')
      setSoftware(data)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchSoftware() }, [fetchSoftware])

  useEffect(() => {
    if (selected) {
      const updated = software.find(s => s.id === selected.id)
      if (updated) setSelected(updated)
    }
  }, [software])

  const [typeFilter, setTypeFilter] = useState('')

  const filtered = software.filter(s =>
    (!typeFilter || (typeFilter === 'paid') === s.isPaid) &&
    `${s.name} ${s.publisher} ${s.vendor ?? ''}`.toLowerCase().includes(search.toLowerCase())
  )

  const { sorted, sortKey, sortDir, toggleSort } = useSort(filtered, {
    software:    s => s.name,
    uitgever:    s => s.publisher || null,
    leverancier: s => s.vendor || null,
    type:        s => s.isPaid ? 'Betaald' : 'Gratis',
    seats:       s => s.licenseId ? (s.assignedUsers ?? 0) : null,
  })

  const handleDelete = async (id: string) => {
    await api.delete(`/portal/software/${id}`)
    setSoftware(prev => prev.filter(s => s.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const cols = 'grid-cols-[2fr_1fr_1fr_90px_90px]'

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="grid grid-cols-3 gap-3 flex-shrink-0">
        <StatCard label="Totaal"  value={software.length}                        icon={<Shield size={18} />} />
        <StatCard label="Betaald" value={software.filter(s => s.isPaid).length}  icon={<CreditCard size={18} />} tone="blue" />
        <StatCard label="Gratis"  value={software.filter(s => !s.isPaid).length} icon={<CheckCircle2 size={18} />} tone="emerald" />
      </div>

      {tabBar}

      <div className="grid grid-cols-[1fr_20%] grid-rows-[auto_1fr] gap-x-4 gap-y-3 flex-1 min-h-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Zoek software…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-400 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25"
            />
          </div>
          <FilterSelect label="Type" value={typeFilter} onChange={setTypeFilter}
            options={[
              { value: 'paid', label: 'Betaald' },
              { value: 'free', label: 'Gratis' },
            ]} />
          <Button size="sm" variant="secondary" className="py-2" onClick={() => setShowImport(true)}>
            <Upload size={13} /> Importeren
          </Button>
          <Button size="sm" className="py-2" onClick={() => { setEditTarget(null); setShowModal(true) }}>
            <Plus size={13} /> Software toevoegen
          </Button>
        </div>
        <div />

        <Card className="overflow-hidden flex flex-col min-h-0">
          <div className={`grid ${cols} gap-3 px-5 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 flex-shrink-0`}>
            {([
              { label: 'Software', key: 'software' },
              { label: 'Uitgever', key: 'uitgever' },
              { label: 'Leverancier', key: 'leverancier' },
              { label: 'Type', key: 'type' },
              { label: 'Seats', key: 'seats' },
            ] as { label: string; key?: string }[]).map((h, i) => (
              <SortHeader key={i} label={h.label} sortKey={h.key} activeKey={sortKey} dir={sortDir} onToggle={toggleSort} />
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-10 flex justify-center"><LoadingState label="Software laden…" /></div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center">
                <Shield size={36} className="mx-auto mb-3 text-slate-200" />
                <p className="text-sm text-slate-400">
                  {search ? 'Geen software gevonden.' : 'Nog geen software toegevoegd.'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                {sorted.map(s => (
                  <li
                    key={s.id}
                    onClick={() => setSelected(s)}
                    onDoubleClick={() => onExpand?.(s)}
                    className={`grid ${cols} gap-3 px-5 py-3.5 items-center cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                      selected?.id === s.id ? 'bg-blue-50 dark:bg-blue-900/10 border-l-2 border-blue-500' : ''
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{s.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{s.publisher || '—'}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{s.vendor || '—'}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${
                      s.isPaid
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    }`}>
                      {s.isPaid ? 'Betaald' : 'Gratis'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {s.licenseId
                        ? s.maxUsers === 0 ? `${s.assignedUsers ?? 0} / ∞` : `${s.assignedUsers ?? 0} / ${s.maxUsers ?? 0}`
                        : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <div className="min-h-0 overflow-y-auto">
          {selected ? (
            <SoftwareDetailPanel
              software={selected}
              teammates={teammates}
              onEdit={() => { setEditTarget(selected); setShowModal(true) }}
              onDelete={() => handleDelete(selected.id)}
              onUsersChanged={fetchSoftware}
              onExpand={() => onExpand?.(selected)}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Shield size={28} className="text-slate-300" />
                </div>
                <p className="text-sm text-slate-400">Selecteer software</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <SoftwareWizard
          editTarget={editTarget}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchSoftware() }}
        />
      )}

      <ImportWizardModal<ImportSoftwareRow, SoftwareImportPreview>
        open={showImport}
        title="Software importeren"
        templateUrl="/portal/software/import-template"
        templateFileName="software-import-template.xlsx"
        columnsUrl="/portal/software/import/columns"
        validateUrl="/portal/software/import/validate"
        confirmUrl="/portal/software/import/confirm"
        columns={[
          { key: 'name', label: 'Naam' },
          { key: 'publisher', label: 'Uitgever' },
          { key: 'vendor', label: 'Leverancier' },
          { key: 'isPaid', label: 'Betaald' },
          { key: 'assignedToEmail', label: 'Toegewezen aan' },
        ]}
        onClose={() => setShowImport(false)}
        onDone={() => { setShowImport(false); fetchSoftware() }}
      />
    </div>
  )
}

// ── SoftwareView ──────────────────────────────────────────────────────────────

type SoftwareTab = 'catalog' | 'licenties'

export function SoftwareView({ teammates, onExpandSoftware, onExpandLicense }: {
  teammates: ClientUserListItem[]
  onExpandSoftware?: (item: SoftwareListItem) => void
  onExpandLicense?: (item: LicenseListItem) => void
}) {
  const [tab, setTab] = useState<SoftwareTab>('catalog')

  const tabBar = (
    <div className="flex gap-1 flex-shrink-0 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
      {([
        { key: 'catalog',    label: 'Software' },
        { key: 'licenties',  label: 'Licenties' },
      ] as { key: SoftwareTab; label: string }[]).map(t => (
        <button
          key={t.key}
          onClick={() => setTab(t.key)}
          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            tab === t.key
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )

  return (
    <div className="h-full">
      {tab === 'catalog'    && <SoftwareCatalogTab teammates={teammates} tabBar={tabBar} onExpand={onExpandSoftware} />}
      {tab === 'licenties'  && <LicenseView teammates={teammates} tabBar={tabBar} onExpand={onExpandLicense} />}
    </div>
  )
}
