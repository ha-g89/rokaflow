import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import api from '@/lib/axios'
import type { SimCardListItem } from '@/types/simcard'
import type { SubscriptionListItem } from '@/types/subscription'
import { SUB_TYPE_OPTIONS, SUB_STATUS_OPTIONS } from '@/types/subscription'

const schema = z.object({
  name: z.string().min(1, 'Naam is verplicht').max(256),
  provider: z.string().max(200),
  supplier: z.string().max(200),
  type: z.string(),
  bundle: z.string().max(200),
  monthlyCost: z.string(),
  startsAt: z.string(),
  expiresAt: z.string(),
  status: z.string(),
  location: z.string().max(300),
  simCardId: z.string(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  simCards: SimCardListItem[]
  subscription?: SubscriptionListItem | null
}

const field =
  'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors'

export function SubscriptionModal({ open, onClose, onSuccess, simCards, subscription }: Props) {
  const [apiError, setApiError] = useState<string | null>(null)
  const isEdit = !!subscription

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const selectedType = watch('type')

  useEffect(() => {
    if (open) {
      reset(subscription ? {
        name: subscription.name,
        provider: subscription.provider,
        supplier: subscription.supplier ?? '',
        type: subscription.type === 'Mobile' ? '0' : '1',
        bundle: subscription.bundle,
        monthlyCost: subscription.monthlyCost != null ? String(subscription.monthlyCost) : '',
        startsAt: subscription.startsAt ? subscription.startsAt.substring(0, 10) : '',
        expiresAt: subscription.expiresAt ? subscription.expiresAt.substring(0, 10) : '',
        status: subscription.status === 'Active' ? '0' : subscription.status === 'Cancelled' ? '1' : subscription.status === 'Inactive' ? '2' : '0',
        location: subscription.location,
        simCardId: subscription.simCardId ?? '',
      } : {
        name: '', provider: '', supplier: '', type: '0', bundle: '', monthlyCost: '',
        startsAt: '', expiresAt: '', status: '0', location: '', simCardId: '',
      })
      setApiError(null)
    }
  }, [open, subscription, reset])

  const handleClose = () => { reset(); setApiError(null); onClose() }

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      const payload = {
        name: values.name,
        provider: values.provider || '',
        supplier: values.supplier || null,
        type: parseInt(values.type, 10),
        bundle: values.bundle || '',
        monthlyCost: values.monthlyCost ? parseFloat(values.monthlyCost) : null,
        startsAt: values.startsAt ? new Date(values.startsAt).toISOString() : null,
        expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : null,
        status: parseInt(values.status, 10),
        location: values.location || '',
        simCardId: values.simCardId || null,
      }

      if (isEdit) {
        await api.put(`/portal/subscriptions/${subscription!.id}`, payload)
      } else {
        await api.post('/portal/subscriptions', payload)
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
      title={isEdit ? 'Abonnement wijzigen' : 'Abonnement toevoegen'}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Naam *</label>
            <input {...register('name')} className={field} placeholder="KPN Unlimited" autoFocus />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Provider</label>
            <input {...register('provider')} className={field} placeholder="KPN, Ziggo…" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Leverancier</label>
          <input {...register('supplier')} className={field} placeholder="Belsimpel, Tele2…" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
            <select {...register('type')} className={field}>
              {SUB_TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Bundel</label>
            <input {...register('bundle')} className={field} placeholder="Onbeperkt bellen + 20GB" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Maandelijkse kosten (€)</label>
            <input {...register('monthlyCost')} type="number" step="0.01" className={field} placeholder="25.00" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
            <select {...register('status')} className={field}>
              {SUB_STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Startdatum</label>
            <input {...register('startsAt')} type="date" className={field} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Einddatum</label>
            <input {...register('expiresAt')} type="date" className={field} />
          </div>
        </div>

        {/* Simkaart only relevant for Mobile */}
        {selectedType === '0' && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Gekoppeld aan simkaart</label>
            <select {...register('simCardId')} className={field}>
              <option value="">— Geen —</option>
              {simCards.map(s => (
                <option key={s.id} value={s.id}>
                  {s.kaartNummer}{s.phoneNumber ? ` · ${s.phoneNumber}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Location only relevant for Internet */}
        {selectedType === '1' && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Locatie</label>
            <input {...register('location')} className={field} placeholder="Kantoor Amsterdam" />
          </div>
        )}

        {apiError && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{apiError}</p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>
            Annuleren
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? 'Opslaan…' : isEdit ? 'Wijzigingen opslaan' : 'Abonnement toevoegen'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
