import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertTriangle, ChevronDown, Check, Plus, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import api from '@/lib/axios'
import type { ClientUserListItem } from '@/types/clientUser'
import type { PhoneListItem } from '@/types/phone'
import type { SimCardListItem } from '@/types/simcard'
import { SIM_TYPE_OPTIONS, SIM_STATUS_OPTIONS } from '@/types/simcard'
import type { SubscriptionListItem } from '@/types/subscription'
import { SUB_TYPE_OPTIONS, SUB_STATUS_OPTIONS } from '@/types/subscription'

const schema = z.object({
  kaartNummer: z.string().min(1, 'SIM nummer is verplicht').max(100),
  type: z.string(),
  phoneNumber: z.string().max(50),
  status: z.string(),
  phoneId: z.string(),
  assignedToUserId: z.string(),
  // Abonnement (alleen gevalideerd/verstuurd als het blok is uitgeklapt)
  subName: z.string().max(256),
  subProvider: z.string().max(200),
  subSupplier: z.string().max(200),
  subType: z.string(),
  subBundle: z.string().max(200),
  subMonthlyCost: z.string(),
  subStartsAt: z.string(),
  subExpiresAt: z.string(),
  subStatus: z.string(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  teammates: ClientUserListItem[]
  phones: PhoneListItem[]
  simCard?: SimCardListItem | null
  subscription?: SubscriptionListItem | null
}

const field =
  'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25 transition-colors'

// ── Custom phone dropdown ─────────────────────────────────────────────────────

function PhoneDropdown({ phones, value, simCardId, onChange }: {
  phones: PhoneListItem[]
  value: string
  simCardId: string | undefined
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = phones.find(p => p.id === value) ?? null

  const select = (id: string) => { onChange(id); setOpen(false) }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm transition-colors text-left
          ${open ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-300 hover:border-slate-400'}
          bg-white`}
      >
        {selected ? (
          <div className="min-w-0">
            <p className="text-slate-900 font-medium truncate">{selected.brand} {selected.model}</p>
            <p className="text-xs text-slate-400 truncate">S/N: {selected.serialNumber || '—'}</p>
          </div>
        ) : (
          <span className="text-slate-400">— Geen —</span>
        )}
        <ChevronDown size={14} className={`text-slate-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <div className="max-h-52 overflow-y-auto">
            {/* None option */}
            <button
              type="button"
              onClick={() => select('')}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm transition-colors text-left
                ${!value ? 'bg-blue-50 text-blue-700' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <span>— Geen —</span>
              {!value && <Check size={13} className="text-blue-500 flex-shrink-0" />}
            </button>

            {phones.map(p => {
              const isSelected  = value === p.id
              const hasOtherSim = !!p.simCardId && p.simCardId !== (simCardId ?? null)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => select(p.id)}
                  className={`w-full flex items-start justify-between gap-2 px-3 py-2.5 border-t border-slate-100 text-sm transition-colors text-left
                    ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                >
                  <div className="min-w-0">
                    <p className={`font-medium leading-tight truncate ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                      {p.brand} {p.model}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">S/N: {p.serialNumber || '—'}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                    {hasOtherSim && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                        SIM gekoppeld
                      </span>
                    )}
                    {isSelected && <Check size={13} className="text-blue-500" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export function SimCardModal({ open, onClose, onSuccess, teammates, phones, simCard, subscription }: Props) {
  const isEdit = !!simCard
  const [apiError, setApiError] = useState<string | null>(null)
  const [showSubscription, setShowSubscription] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (open) {
      reset(simCard ? {
        kaartNummer: simCard.kaartNummer,
        type: simCard.type === 'Physical' ? '0' : '1',
        phoneNumber: simCard.phoneNumber,
        status: simCard.status === 'InUse' ? '0' : simCard.status === 'InStock' ? '1' : '2',
        phoneId: simCard.phoneId ?? '',
        assignedToUserId: simCard.assignedToUserId ?? '',
        subName: subscription?.name ?? '',
        subProvider: subscription?.provider ?? '',
        subSupplier: subscription?.supplier ?? '',
        subType: subscription ? (subscription.type === 'Mobile' ? '0' : '1') : '0',
        subBundle: subscription?.bundle ?? '',
        subMonthlyCost: subscription?.monthlyCost != null ? String(subscription.monthlyCost) : '',
        subStartsAt: subscription?.startsAt ? subscription.startsAt.substring(0, 10) : '',
        subExpiresAt: subscription?.expiresAt ? subscription.expiresAt.substring(0, 10) : '',
        // 'Incomplete' (bulk-import) is niet los kiesbaar — bij het aanvullen van zo'n
        // abonnement is Actief de zinvolle default, niet de Inactief-fallback.
        subStatus: subscription
          ? (subscription.status === 'Cancelled' ? '1' : subscription.status === 'Inactive' ? '2' : '0')
          : '0',
      } : {
        kaartNummer: '', type: '0', phoneNumber: '', status: '1', phoneId: '', assignedToUserId: '',
        subName: '', subProvider: '', subSupplier: '', subType: '0', subBundle: '',
        subMonthlyCost: '', subStartsAt: '', subExpiresAt: '', subStatus: '0',
      })
      setShowSubscription(!!subscription)
      setApiError(null)
    }
  }, [open, simCard, subscription, reset])

  const handleClose = () => { reset(); setApiError(null); onClose() }

  const selectedPhoneId = watch('phoneId')
  const selectedPhone   = phones.find(p => p.id === selectedPhoneId) ?? null
  const phoneHasOtherSim =
    !!selectedPhone?.simCardId &&
    selectedPhone.simCardId !== (simCard?.id ?? null)

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      const simPayload = {
        kaartNummer: values.kaartNummer,
        type: parseInt(values.type, 10),
        provider: '',
        status: parseInt(values.status, 10),
        phoneId: values.phoneId || null,
      }

      let simCardId: string
      if (isEdit) {
        await api.put(`/portal/simcards/${simCard!.id}`, simPayload)
        simCardId = simCard!.id
      } else {
        const { data } = await api.post<SimCardListItem>('/portal/simcards', simPayload)
        simCardId = data.id
      }

      if (showSubscription && values.subName.trim()) {
        const subPayload = {
          name: values.subName,
          provider: values.subProvider || '',
          supplier: values.subSupplier || null,
          type: parseInt(values.subType, 10),
          bundle: values.subBundle || '',
          phoneNumber: values.phoneNumber || '',
          assignedToUserId: values.assignedToUserId || null,
          monthlyCost: values.subMonthlyCost ? parseFloat(values.subMonthlyCost) : null,
          startsAt: values.subStartsAt ? new Date(values.subStartsAt).toISOString() : null,
          expiresAt: values.subExpiresAt ? new Date(values.subExpiresAt).toISOString() : null,
          status: parseInt(values.subStatus, 10),
          location: '',
          simCardId,
        }
        if (subscription) {
          await api.put(`/portal/subscriptions/${subscription.id}`, subPayload)
        } else {
          await api.post('/portal/subscriptions', subPayload)
        }
      } else if (subscription && !showSubscription) {
        await api.delete(`/portal/subscriptions/${subscription.id}`)
      }

      reset()
      onSuccess()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(msg ?? 'Opslaan mislukt.')
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Simkaart & abonnement wijzigen' : 'Simkaart & abonnement toevoegen'}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Simkaart</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">SIM nummer *</label>
            <input {...register('kaartNummer')} className={field} placeholder="89NL…" autoFocus />
            {errors.kaartNummer && <p className="mt-1 text-xs text-red-600">{errors.kaartNummer.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
            <select {...register('type')} className={field}>
              {SIM_TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
          <select {...register('status')} className={field}>
            {SIM_STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Phone picker */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Gekoppeld aan telefoon</label>
          <input type="hidden" {...register('phoneId')} />
          <PhoneDropdown
            phones={phones}
            value={selectedPhoneId}
            simCardId={simCard?.id}
            onChange={id => setValue('phoneId', id)}
          />

          {phoneHasOtherSim && (
            <div className="mt-2 flex gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
              <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                <span className="font-semibold">Let op:</span> Deze telefoon is al gekoppeld aan simkaart{' '}
                <span className="font-medium">{selectedPhone!.simCardNumber ?? '(onbekend)'}</span>.
                Door op te slaan wordt die koppeling verbroken en deze simkaart eraan gekoppeld.
              </p>
            </div>
          )}
        </div>

        <div className="pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between mt-3 mb-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Abonnement</p>
            {showSubscription && (
              <button
                type="button"
                onClick={() => setShowSubscription(false)}
                className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600"
              >
                <X size={12} /> {subscription ? 'Abonnement verwijderen' : 'Annuleren'}
              </button>
            )}
          </div>

          {!showSubscription ? (
            <button
              type="button"
              onClick={() => setShowSubscription(true)}
              className="w-full flex items-center justify-between gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2.5 text-left hover:border-blue-400 hover:bg-blue-50/40 transition-colors"
            >
              <span className="text-xs text-slate-500">Nog geen abonnement — simkaart in voorraad</span>
              <span className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                <Plus size={13} /> Toevoegen
              </span>
            </button>
          ) : (
            <div className="space-y-3">
              {subscription?.status === 'Incomplete' && (
                <div className="flex gap-2 rounded-lg bg-violet-50 border border-violet-200 px-3 py-2.5">
                  <AlertTriangle size={15} className="text-violet-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-violet-800">
                    Aangemaakt via import — prijs en bundel zijn nog niet bekend. Vul aan en kies de juiste status.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Naam *</label>
                  <input {...register('subName')} className={field} placeholder="KPN Unlimited" />
                  {errors.subName && <p className="mt-1 text-xs text-red-600">{errors.subName.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Provider</label>
                  <input {...register('subProvider')} className={field} placeholder="KPN, Vodafone…" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Telefoonnummer</label>
                  <input {...register('phoneNumber')} className={field} placeholder="+31 6 12345678" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Leverancier</label>
                  <input {...register('subSupplier')} className={field} placeholder="Belsimpel, Tele2…" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Toegewezen aan</label>
                <select {...register('assignedToUserId')} className={field}>
                  <option value="">— Niemand —</option>
                  {teammates.map(u => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                  <select {...register('subType')} className={field}>
                    {SUB_TYPE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Bundel</label>
                  <input {...register('subBundle')} className={field} placeholder="Onbeperkt bellen + 20GB" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Maandelijkse kosten (€)</label>
                  <input {...register('subMonthlyCost')} type="number" step="0.01" className={field} placeholder="25.00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                  <select {...register('subStatus')} className={field}>
                    {SUB_STATUS_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Startdatum</label>
                  <input {...register('subStartsAt')} type="date" className={field} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Einddatum</label>
                  <input {...register('subExpiresAt')} type="date" className={field} />
                </div>
              </div>
            </div>
          )}
        </div>

        {apiError && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{apiError}</p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>
            Annuleren
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? 'Opslaan…' : isEdit ? 'Wijzigingen opslaan' : 'Toevoegen'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
