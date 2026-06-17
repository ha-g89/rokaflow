import { Fragment, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, ChevronLeft, Layers, Loader2, Lock, Package, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import api from '@/lib/axios'
import type { ClientUserListItem } from '@/types/clientUser'
import type { PhoneListItem } from '@/types/phone'
import { PHONE_STATUS_OPTIONS, PHONE_STATUS_LABEL, PHONE_STATUS_TONE } from '@/types/phone'
import { SIM_TYPE_OPTIONS, SIM_STATUS_OPTIONS } from '@/types/simcard'
import { SUB_STATUS_OPTIONS } from '@/types/subscription'

// ── Schemas ───────────────────────────────────────────────────────────────────

const phoneSchema = z.object({
  brand:            z.string().min(1, 'Merk is verplicht').max(200),
  model:            z.string().max(200),
  serialNumber:     z.string().max(100),
  imeiNumber:       z.string().max(20),
  supplier:         z.string().max(200),
  status:           z.string(),
  assignedToUserId: z.string(),
  issuedAt:         z.string(),
  returnedAt:       z.string(),
})

const subSchema = z.object({
  name:        z.string().min(1, 'Naam is verplicht').max(256),
  provider:    z.string().max(200),
  supplier:    z.string().max(200),
  bundle:      z.string().max(200),
  monthlyCost: z.string(),
  startsAt:    z.string(),
  expiresAt:   z.string(),
  status:      z.string(),
})

const simSchema = z.object({
  kaartNummer:      z.string().min(1, 'Kaartnummer is verplicht').max(100),
  type:             z.string(),
  phoneNumber:      z.string().max(50),
  provider:         z.string().max(200),
  status:           z.string(),
  assignedToUserId: z.string(),
})

type PhoneValues = z.infer<typeof phoneSchema>
type SubValues   = z.infer<typeof subSchema>
type SimValues   = z.infer<typeof simSchema>

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  open:        boolean
  onClose:     () => void
  onSuccess:   () => void
  teammates:   ClientUserListItem[]
  lockedUser?: { id: string; name: string }
}

// ── Shared field style ────────────────────────────────────────────────────────

const f = 'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors bg-white'

// ── Small components ──────────────────────────────────────────────────────────

function LockedField({ name }: { name: string }) {
  return (
    <div className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm flex items-center justify-between gap-2">
      <span className="font-medium text-slate-700 truncate">{name}</span>
      <Lock size={12} className="text-slate-400 flex-shrink-0" />
    </div>
  )
}

function AutoLinkBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 text-xs text-blue-700">
      <Layers size={13} className="flex-shrink-0 mt-0.5 text-blue-400" />
      <span>{children}</span>
    </div>
  )
}

function TabBar({ active, onChange }: { active: 'existing' | 'wizard'; onChange: (t: 'existing' | 'wizard') => void }) {
  return (
    <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-5">
      {(['existing', 'wizard'] as const).map(t => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            active === t
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {t === 'existing' ? 'Bestaande telefoon' : 'Nieuwe telefoon'}
        </button>
      ))}
    </div>
  )
}

// ── Existing phone detail card ─────────────────────────────────────────────────

function PhoneDetailCard({ phone }: { phone: PhoneListItem }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-bold text-slate-900">
            {[phone.brand, phone.model].filter(Boolean).join(' ')}
          </p>
          {phone.serialNumber && (
            <p className="text-xs text-slate-500 mt-0.5">S/N: {phone.serialNumber}</p>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${PHONE_STATUS_TONE[phone.status] ?? 'bg-slate-100 text-slate-600'}`}>
          {PHONE_STATUS_LABEL[phone.status] ?? phone.status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-600">
        {phone.imeiNumber && (
          <p><span className="text-slate-400">IMEI:</span> {phone.imeiNumber}</p>
        )}
        {phone.simCardNumber && (
          <p><span className="text-slate-400">SIM:</span> {phone.simCardNumber}</p>
        )}
        {phone.simPhoneNumber && (
          <p><span className="text-slate-400">Nummer:</span> {phone.simPhoneNumber}</p>
        )}
        {phone.issuedAt && (
          <p><span className="text-slate-400">Uitgegeven:</span> {phone.issuedAt.substring(0, 10)}</p>
        )}
      </div>
      {phone.simCardId && (
        <p className="mt-2.5 text-xs text-blue-600 font-medium">
          ✓ Al voorzien van een simkaart
        </p>
      )}
    </div>
  )
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { label: 'Telefoon',   sub: null },
    { label: 'Abonnement', sub: 'optioneel' },
    { label: 'Simkaart',   sub: 'optioneel' },
  ]
  return (
    <div className="flex items-start gap-0 mb-6">
      {steps.map((s, i) => {
        const n        = i + 1
        const isDone   = step > n
        const isActive = step === n
        return (
          <Fragment key={n}>
            <div className="flex flex-col items-center gap-1.5" style={{ minWidth: 80 }}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200
                ${isDone   ? 'bg-blue-600 text-white' :
                  isActive ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                             'bg-slate-100 text-slate-400'}`}
              >
                {isDone ? <Check size={15} strokeWidth={2.5} /> : n}
              </div>
              <p className={`text-xs font-semibold text-center leading-tight transition-colors
                ${step >= n ? 'text-slate-800' : 'text-slate-400'}`}>{s.label}</p>
              {s.sub && (
                <p className="text-[10px] text-slate-400 -mt-1 text-center">{s.sub}</p>
              )}
            </div>
            {i < 2 && (
              <div className={`flex-1 h-px mt-[18px] transition-colors duration-300
                ${isDone ? 'bg-blue-400' : 'bg-slate-200'}`} />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}

// ── Step 1: Telefoon ──────────────────────────────────────────────────────────

function PhoneStep({
  form, teammates, lockedUser,
}: {
  form: ReturnType<typeof useForm<PhoneValues>>
  teammates: ClientUserListItem[]
  lockedUser?: { id: string; name: string }
}) {
  const { register, setValue, formState: { errors } } = form
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Merk *</label>
          <input {...register('brand')} className={f} placeholder="Apple" autoFocus />
          {errors.brand && <p className="mt-1 text-xs text-red-600">{errors.brand.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Model</label>
          <input {...register('model')} className={f} placeholder="iPhone 16 Pro" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Serienummer</label>
          <input {...register('serialNumber')} className={f} placeholder="C02XY…" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">IMEI-nummer</label>
          <input {...register('imeiNumber')} className={f} placeholder="35 123456…" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Leverancier</label>
        <input {...register('supplier')} className={f} placeholder="Belsimpel, MediaMarkt…" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Toegewezen aan</label>
          {lockedUser ? (
            <LockedField name={lockedUser.name} />
          ) : (
            <select
              {...register('assignedToUserId')}
              className={f}
              onChange={e => {
                setValue('assignedToUserId', e.target.value)
                setValue('status', e.target.value ? '1' : '0')
              }}
            >
              <option value="">— Niemand —</option>
              {teammates.map(u => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
          <select {...register('status')} className={f}>
            {PHONE_STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Uitgiftedatum</label>
          <input {...register('issuedAt')} type="date" className={f} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Inleverdatum</label>
          <input {...register('returnedAt')} type="date" className={f} />
        </div>
      </div>
    </div>
  )
}

// ── Step 2: Abonnement ────────────────────────────────────────────────────────

function SubStep({ form }: { form: ReturnType<typeof useForm<SubValues>> }) {
  const { register, formState: { errors } } = form
  return (
    <div className="space-y-4">
      <AutoLinkBanner>
        De simkaart die je in stap 3 aanmaakt, wordt automatisch aan dit abonnement gekoppeld.
      </AutoLinkBanner>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Naam *</label>
          <input {...register('name')} className={f} placeholder="KPN Unlimited" autoFocus />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Provider</label>
          <input {...register('provider')} className={f} placeholder="KPN, Vodafone…" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Leverancier</label>
        <input {...register('supplier')} className={f} placeholder="Belsimpel, Tele2…" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Bundel</label>
          <input {...register('bundle')} className={f} placeholder="Onbeperkt bellen + 20GB" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Maandelijkse kosten (€)</label>
          <input {...register('monthlyCost')} type="number" step="0.01" className={f} placeholder="25.00" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Startdatum</label>
          <input {...register('startsAt')} type="date" className={f} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Einddatum</label>
          <input {...register('expiresAt')} type="date" className={f} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
        <select {...register('status')} className={f}>
          {SUB_STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

// ── Step 3: Simkaart ──────────────────────────────────────────────────────────

function SimStep({
  form, phoneBrand, phoneModel, teammates, lockedUser,
}: {
  form: ReturnType<typeof useForm<SimValues>>
  phoneBrand: string
  phoneModel: string
  teammates: ClientUserListItem[]
  lockedUser?: { id: string; name: string }
}) {
  const { register, setValue, formState: { errors } } = form
  const phoneLabel = [phoneBrand, phoneModel].filter(Boolean).join(' ') || 'de telefoon uit stap 1'
  return (
    <div className="space-y-4">
      <AutoLinkBanner>
        Wordt automatisch gekoppeld aan <strong>{phoneLabel}</strong>.
      </AutoLinkBanner>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Kaartnummer *</label>
          <input {...register('kaartNummer')} className={f} placeholder="89NL…" autoFocus />
          {errors.kaartNummer && <p className="mt-1 text-xs text-red-600">{errors.kaartNummer.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
          <select {...register('type')} className={f}>
            {SIM_TYPE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Telefoonnummer</label>
          <input {...register('phoneNumber')} className={f} placeholder="+31 6 12345678" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Provider</label>
          <input {...register('provider')} className={f} placeholder="KPN, Vodafone…" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Toegewezen aan</label>
          {lockedUser ? (
            <LockedField name={lockedUser.name} />
          ) : (
            <select
              {...register('assignedToUserId')}
              className={f}
              onChange={e => {
                setValue('assignedToUserId', e.target.value)
                setValue('status', e.target.value ? '0' : '1')
              }}
            >
              <option value="">— Niemand —</option>
              {teammates.map(u => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
          <select {...register('status')} className={f}>
            {SIM_STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

// ── Main wizard ───────────────────────────────────────────────────────────────

export function PhoneSetupWizard({ open, onClose, onSuccess, teammates, lockedUser }: Props) {
  // Wizard state
  const [step, setStep]             = useState<1 | 2 | 3>(1)
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError]     = useState<string | null>(null)
  const pendingSub                  = useRef<SubValues | null>(null)

  // Outer tab state (only relevant when lockedUser is set)
  const [outerTab, setOuterTab]         = useState<'existing' | 'wizard'>('existing')
  const [phoneList, setPhoneList]       = useState<PhoneListItem[]>([])
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [phoneSearch, setPhoneSearch]   = useState('')
  const [selectedPhone, setSelectedPhone] = useState<PhoneListItem | null>(null)
  const [linking, setLinking]           = useState(false)
  const [linkError, setLinkError]       = useState<string | null>(null)

  const showTabs = !!lockedUser

  // All three forms always mounted (rules of hooks)
  const phoneForm = useForm<PhoneValues>({ resolver: zodResolver(phoneSchema) })
  const subForm   = useForm<SubValues>({ resolver: zodResolver(subSchema) })
  const simForm   = useForm<SimValues>({ resolver: zodResolver(simSchema) })

  const phoneBrand = phoneForm.watch('brand') ?? ''
  const phoneModel = phoneForm.watch('model') ?? ''

  // Reset everything on open
  useEffect(() => {
    if (open) {
      phoneForm.reset({ brand: '', model: '', serialNumber: '', imeiNumber: '', supplier: '', status: lockedUser ? '1' : '0', assignedToUserId: lockedUser?.id ?? '', issuedAt: '', returnedAt: '' })
      subForm.reset({ name: '', provider: '', supplier: '', bundle: '', monthlyCost: '', startsAt: '', expiresAt: '', status: '0' })
      simForm.reset({ kaartNummer: '', type: '0', phoneNumber: '', provider: '', status: '0', assignedToUserId: lockedUser?.id ?? '' })
      pendingSub.current = null
      setStep(1)
      setApiError(null)
      setOuterTab('existing')
      setSelectedPhone(null)
      setPhoneSearch('')
      setLinkError(null)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch available phones when tab is shown
  useEffect(() => {
    if (!open || !lockedUser) return
    setPhoneLoading(true)
    api.get<PhoneListItem[]>('/portal/phones')
      .then(r => setPhoneList(r.data.filter(p => !p.assignedToUserId && p.status !== 'Decommissioned')))
      .catch(() => setPhoneList([]))
      .finally(() => setPhoneLoading(false))
  }, [open, lockedUser])

  const handleClose = () => { if (!submitting && !linking) onClose() }

  // Link existing phone to user
  const handleLink = async () => {
    if (!selectedPhone || !lockedUser) return
    setLinking(true)
    setLinkError(null)
    try {
      await api.put(`/portal/phones/${selectedPhone.id}`, {
        brand:            selectedPhone.brand,
        model:            selectedPhone.model || '',
        serialNumber:     selectedPhone.serialNumber || '',
        imeiNumber:       selectedPhone.imeiNumber || '',
        status:           1, // InUse
        assignedToUserId: lockedUser.id,
        issuedAt:         selectedPhone.issuedAt ?? null,
        returnedAt:       null,
      })
      onSuccess()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setLinkError(msg ?? 'Koppelen mislukt.')
    } finally {
      setLinking(false)
    }
  }

  // Submit new phone (wizard flow)
  const submit = async (simValues: SimValues | null) => {
    setSubmitting(true)
    setApiError(null)
    try {
      const pv = phoneForm.getValues()
      const phoneRes = await api.post('/portal/phones', {
        brand:            pv.brand,
        model:            pv.model || '',
        serialNumber:     pv.serialNumber || '',
        imeiNumber:       pv.imeiNumber || '',
        supplier:         pv.supplier || null,
        status:           parseInt(pv.status, 10),
        assignedToUserId: pv.assignedToUserId || null,
        issuedAt:         pv.issuedAt ? new Date(pv.issuedAt).toISOString() : null,
        returnedAt:       pv.returnedAt ? new Date(pv.returnedAt).toISOString() : null,
      })
      const phoneId = phoneRes.data.id as string

      let simcardId: string | null = null
      if (simValues) {
        const simRes = await api.post('/portal/simcards', {
          kaartNummer:      simValues.kaartNummer,
          type:             parseInt(simValues.type, 10),
          phoneNumber:      simValues.phoneNumber || '',
          provider:         simValues.provider || '',
          status:           parseInt(simValues.status, 10),
          phoneId:          phoneId,
          assignedToUserId: simValues.assignedToUserId || null,
        })
        simcardId = simRes.data.id as string
      }

      const sv = pendingSub.current
      if (sv) {
        await api.post('/portal/subscriptions', {
          name:        sv.name,
          provider:    sv.provider || '',
          supplier:    sv.supplier || null,
          type:        0,
          bundle:      sv.bundle || '',
          monthlyCost: sv.monthlyCost ? parseFloat(sv.monthlyCost) : null,
          startsAt:    sv.startsAt ? new Date(sv.startsAt).toISOString() : null,
          expiresAt:   sv.expiresAt ? new Date(sv.expiresAt).toISOString() : null,
          status:      parseInt(sv.status, 10),
          location:    '',
          simCardId:   simcardId,
        })
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(msg ?? 'Er is iets misgegaan bij het opslaan.')
    } finally {
      setSubmitting(false)
    }
  }

  const prefillSimAssignee = () => {
    const assigned = lockedUser?.id ?? phoneForm.getValues('assignedToUserId')
    if (assigned) {
      simForm.setValue('assignedToUserId', assigned)
      simForm.setValue('status', '0')
    }
  }

  const handleNext = async () => {
    if (step === 1) {
      const ok = await phoneForm.trigger()
      if (!ok) return
      setStep(2)
    } else if (step === 2) {
      const ok = await subForm.trigger()
      if (!ok) return
      pendingSub.current = subForm.getValues()
      prefillSimAssignee()
      setStep(3)
    } else {
      const ok = await simForm.trigger()
      if (!ok) return
      await submit(simForm.getValues())
    }
  }

  const handleSkip = async () => {
    if (step === 2) {
      pendingSub.current = null
      prefillSimAssignee()
      setStep(3)
    } else {
      await submit(null)
    }
  }

  const handleBack = () => {
    if (step === 2) setStep(1)
    else if (step === 3) setStep(2)
  }

  if (!open) return null

  const stepLabels = ['Telefoon', 'Abonnement', 'Simkaart']
  const isLastStep = step === 3

  const filteredPhones = phoneList.filter(p =>
    `${p.brand} ${p.model} ${p.serialNumber} ${p.imeiNumber} ${p.simPhoneNumber}`
      .toLowerCase().includes(phoneSearch.toLowerCase())
  )

  const headerSubtitle = showTabs && outerTab === 'existing'
    ? 'Beschikbare telefoons'
    : `Stap ${step} van 3 — ${stepLabels[step - 1]}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl m-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Telefonie-setup</h2>
            <p className="text-xs text-slate-400 mt-0.5">{headerSubtitle}</p>
          </div>
          <button
            onClick={handleClose}
            disabled={submitting || linking}
            className="text-slate-400 hover:text-slate-600 transition-colors rounded-lg p-1 hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pt-5 pb-0">

          {/* Outer tabs (only with lockedUser) */}
          {showTabs && (
            <TabBar active={outerTab} onChange={t => { setOuterTab(t); setSelectedPhone(null); setLinkError(null) }} />
          )}

          {/* ── Existing phone tab ── */}
          {showTabs && outerTab === 'existing' && (
            <div className="space-y-4 pb-6">
              {phoneLoading ? (
                <div className="flex items-center justify-center py-10 gap-2 text-slate-400 text-sm">
                  <Loader2 size={16} className="animate-spin" /> Laden…
                </div>
              ) : phoneList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                  <Package size={32} className="text-slate-200" />
                  <p className="text-sm text-slate-400">Geen beschikbare telefoons gevonden.</p>
                  <button
                    type="button"
                    onClick={() => setOuterTab('wizard')}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Nieuwe telefoon aanmaken →
                  </button>
                </div>
              ) : (
                <>
                  {/* Search */}
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={phoneSearch}
                      onChange={e => { setPhoneSearch(e.target.value); setSelectedPhone(null) }}
                      placeholder="Zoek op merk, model, serienummer…"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-400 transition-colors"
                    />
                  </div>

                  {/* List */}
                  <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                    {filteredPhones.length === 0 ? (
                      <p className="p-4 text-center text-sm text-slate-400">Geen resultaten.</p>
                    ) : (
                      filteredPhones.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPhone(prev => prev?.id === p.id ? null : p)}
                          className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors
                            ${selectedPhone?.id === p.id
                              ? 'bg-blue-50 border-l-2 border-blue-500'
                              : 'hover:bg-slate-50'}`}
                        >
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold truncate ${selectedPhone?.id === p.id ? 'text-blue-800' : 'text-slate-800'}`}>
                              {[p.brand, p.model].filter(Boolean).join(' ')}
                            </p>
                            <p className="text-xs text-slate-400 truncate mt-0.5">
                              {[p.serialNumber ? `S/N: ${p.serialNumber}` : null, p.simPhoneNumber ?? null]
                                .filter(Boolean).join(' · ') || '—'}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${PHONE_STATUS_TONE[p.status] ?? 'bg-slate-100 text-slate-600'}`}>
                            {PHONE_STATUS_LABEL[p.status] ?? p.status}
                          </span>
                        </button>
                      ))
                    )}
                  </div>

                  {/* Detail card */}
                  {selectedPhone && <PhoneDetailCard phone={selectedPhone} />}

                  {linkError && (
                    <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{linkError}</p>
                  )}

                  {/* Footer */}
                  <div className="flex gap-3 pt-1">
                    <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>
                      Annuleren
                    </Button>
                    <Button
                      type="button"
                      className="flex-1"
                      disabled={!selectedPhone || linking}
                      onClick={handleLink}
                    >
                      {linking
                        ? <><Loader2 size={13} className="animate-spin" /> Koppelen…</>
                        : selectedPhone
                        ? `Koppelen aan ${lockedUser!.name.split(' ')[0]}`
                        : 'Selecteer een telefoon'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Wizard tab / standalone flow ── */}
          {(!showTabs || outerTab === 'wizard') && (
            <>
              {/* Step indicator */}
              <StepIndicator step={step} />

              {/* Divider */}
              <div className="h-px bg-slate-100 -mx-6" />

              {/* Form content */}
              <div className="py-5">
                <div style={{ display: step === 1 ? 'block' : 'none' }}>
                  <PhoneStep form={phoneForm} teammates={teammates} lockedUser={lockedUser} />
                </div>
                <div style={{ display: step === 2 ? 'block' : 'none' }}>
                  <SubStep form={subForm} />
                </div>
                <div style={{ display: step === 3 ? 'block' : 'none' }}>
                  <SimStep form={simForm} phoneBrand={phoneBrand} phoneModel={phoneModel} teammates={teammates} lockedUser={lockedUser} />
                </div>

                {apiError && (
                  <p className="mt-4 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {apiError}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 pb-6">
                <Button variant="secondary" size="sm" onClick={handleClose} disabled={submitting}>
                  Annuleren
                </Button>
                <div className="flex items-center gap-2">
                  {step > 1 && (
                    <Button variant="ghost" size="sm" onClick={handleBack} disabled={submitting}
                      className="text-slate-500 hover:text-slate-700 hover:bg-slate-100">
                      <ChevronLeft size={14} /> Terug
                    </Button>
                  )}
                  {step > 1 && (
                    <button
                      onClick={handleSkip}
                      disabled={submitting}
                      className="text-xs text-slate-400 hover:text-slate-600 transition-colors px-2 py-1 rounded hover:bg-slate-100 disabled:opacity-50"
                    >
                      {isLastStep ? 'Voltooien zonder simkaart' : 'Overslaan'}
                    </button>
                  )}
                  <Button size="sm" onClick={handleNext} disabled={submitting}>
                    {submitting ? (
                      <><Loader2 size={13} className="animate-spin" /> Opslaan…</>
                    ) : isLastStep ? (
                      <><Check size={13} /> Voltooien</>
                    ) : (
                      <>Volgende <span className="ml-0.5">→</span></>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
