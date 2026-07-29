import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import api from '@/lib/axios'
import type { PhoneSystemListItem } from '@/types/phoneSystem'
import {
  PHONE_SYSTEM_TYPE_OPTIONS, PHONE_SYSTEM_STATUS_OPTIONS,
  PHONE_SYSTEM_TYPE_VALUE, PHONE_SYSTEM_STATUS_VALUE,
} from '@/types/phoneSystem'

const schema = z.object({
  product: z.string().min(1, 'Product is verplicht').max(200),
  label: z.string().max(150),
  provider: z.string().max(200),
  supplier: z.string().max(200),
  type: z.string(),
  status: z.string(),
  seatCount: z.string(),
  channelCount: z.string(),
  mainNumber: z.string().max(30),
  numberRange: z.string().max(100),
  requestedAt: z.string(),
  activatedAt: z.string(),
  termMonths: z.string(),
  monthlyCost: z.string(),
  city: z.string().max(100),
  notes: z.string(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  system?: PhoneSystemListItem | null
}

const field =
  'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25 transition-colors'

export function PhoneSystemModal({ open, onClose, onSuccess, system }: Props) {
  const [apiError, setApiError] = useState<string | null>(null)
  const isEdit = !!system

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (open) {
      if (system) {
        reset({
          product: system.product,
          label: system.label ?? '',
          provider: system.provider ?? '',
          supplier: system.supplier ?? '',
          type: String(PHONE_SYSTEM_TYPE_VALUE[system.type] ?? 0),
          status: String(PHONE_SYSTEM_STATUS_VALUE[system.status] ?? 0),
          seatCount: system.seatCount?.toString() ?? '',
          channelCount: system.channelCount?.toString() ?? '',
          mainNumber: system.mainNumber ?? '',
          numberRange: system.numberRange ?? '',
          requestedAt: system.requestedAt.slice(0, 10),
          activatedAt: system.activatedAt ? system.activatedAt.slice(0, 10) : '',
          termMonths: system.termMonths?.toString() ?? '',
          monthlyCost: system.monthlyCost?.toString() ?? '',
          city: system.city,
          notes: system.notes ?? '',
        })
      } else {
        reset({
          product: '', label: '', provider: '', supplier: '', type: '0', status: '0',
          seatCount: '', channelCount: '', mainNumber: '', numberRange: '',
          requestedAt: new Date().toISOString().slice(0, 10),
          activatedAt: '', termMonths: '', monthlyCost: '', city: '', notes: '',
        })
      }
      setApiError(null)
    }
  }, [open, system, reset])

  const handleClose = () => { reset(); setApiError(null); onClose() }

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      const payload = {
        product: values.product,
        label: values.label || null,
        provider: values.provider || null,
        supplier: values.supplier || null,
        type: Number(values.type),
        status: Number(values.status),
        seatCount: values.seatCount ? Number(values.seatCount) : null,
        channelCount: values.channelCount ? Number(values.channelCount) : null,
        mainNumber: values.mainNumber || null,
        numberRange: values.numberRange || null,
        requestedAt: values.requestedAt || null,
        activatedAt: values.activatedAt || null,
        termMonths: values.termMonths ? Number(values.termMonths) : null,
        monthlyCost: values.monthlyCost ? Number(values.monthlyCost) : null,
        city: values.city || '',
        notes: values.notes || null,
      }
      if (isEdit) {
        await api.put(`/portal/phone-systems/${system!.id}`, payload)
      } else {
        await api.post('/portal/phone-systems', payload)
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
      title={isEdit ? 'Vaste telefonie wijzigen' : 'Vaste telefonie toevoegen'}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Product *</label>
          <input {...register('product')} className={field} placeholder="KPN EEN MKB" autoFocus />
          {errors.product && <p className="mt-1 text-xs text-red-600">{errors.product.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Label</label>
          <input {...register('label')} className={field} placeholder="Centrale hoofdkantoor" />
          {errors.label && <p className="mt-1 text-xs text-red-600">{errors.label.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Provider</label>
            <input {...register('provider')} className={field} placeholder="KPN" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Leverancier</label>
            <input {...register('supplier')} className={field} placeholder="Reseller B.V." />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Type centrale</label>
            <select {...register('type')} className={field}>
              {PHONE_SYSTEM_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
            <select {...register('status')} className={field}>
              {PHONE_SYSTEM_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Aantal seats</label>
            <input {...register('seatCount')} className={field} placeholder="25" inputMode="numeric" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Aantal kanalen</label>
            <input {...register('channelCount')} className={field} placeholder="8" inputMode="numeric" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Hoofdnummer</label>
            <input {...register('mainNumber')} className={field} placeholder="088-1234500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nummerblok</label>
            <input {...register('numberRange')} className={field} placeholder="088-1234500 t/m ...599" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Aanvraagdatum</label>
            <input type="date" {...register('requestedAt')} className={field} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Activatiedatum</label>
            <input type="date" {...register('activatedAt')} className={field} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Looptijd (maanden)</label>
            <input {...register('termMonths')} className={field} placeholder="36" inputMode="numeric" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Maandelijkse kosten</label>
            <input {...register('monthlyCost')} className={field} placeholder="129.00" inputMode="decimal" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Plaats</label>
            <input {...register('city')} className={field} placeholder="Amsterdam" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Opmerkingen</label>
          <textarea {...register('notes')} className={field} rows={3} placeholder="Extra notities…" />
        </div>

        {apiError && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{apiError}</p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>
            Annuleren
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? 'Opslaan…' : isEdit ? 'Wijzigingen opslaan' : 'Centrale toevoegen'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
