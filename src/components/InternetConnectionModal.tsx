import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import api from '@/lib/axios'
import type { InternetConnectionListItem } from '@/types/internetConnection'
import { CONNECTION_TYPE_OPTIONS, INTERNET_CONNECTION_STATUS_OPTIONS } from '@/types/internetConnection'

const schema = z.object({
  product: z.string().min(1, 'Product is verplicht').max(200),
  provider: z.string().max(200),
  supplier: z.string().max(200),
  type: z.string(),
  status: z.string(),
  activatedAt: z.string(),
  termMonths: z.string(),
  postalCode: z.string().max(10),
  houseNumber: z.string().max(20),
  ipAddress: z.string().max(45),
  hostCount: z.string(),
  notes: z.string(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  connection?: InternetConnectionListItem | null
}

const field =
  'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25 transition-colors'

export function InternetConnectionModal({ open, onClose, onSuccess, connection }: Props) {
  const [apiError, setApiError] = useState<string | null>(null)
  const isEdit = !!connection

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (open) {
      if (connection) {
        reset({
          product: connection.product,
          provider: connection.provider ?? '',
          supplier: connection.supplier ?? '',
          type: String(CONNECTION_TYPE_OPTIONS.find(o => o.label === connection.type)?.value ?? 0),
          status: String(INTERNET_CONNECTION_STATUS_OPTIONS.find(o => o.label === connection.status)?.value ?? 0),
          activatedAt: connection.activatedAt ? connection.activatedAt.slice(0, 10) : '',
          termMonths: connection.termMonths?.toString() ?? '',
          postalCode: connection.postalCode,
          houseNumber: connection.houseNumber,
          ipAddress: connection.ipAddress ?? '',
          hostCount: connection.hostCount?.toString() ?? '',
          notes: connection.notes ?? '',
        })
      } else {
        reset({
          product: '', provider: '', supplier: '', type: '0', status: '0',
          activatedAt: '', termMonths: '', postalCode: '', houseNumber: '',
          ipAddress: '', hostCount: '', notes: '',
        })
      }
      setApiError(null)
    }
  }, [open, connection, reset])

  const handleClose = () => { reset(); setApiError(null); onClose() }

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      const payload = {
        product: values.product,
        provider: values.provider || null,
        supplier: values.supplier || null,
        type: Number(values.type),
        status: Number(values.status),
        activatedAt: values.activatedAt || null,
        termMonths: values.termMonths ? Number(values.termMonths) : null,
        postalCode: values.postalCode || '',
        houseNumber: values.houseNumber || '',
        ipAddress: values.ipAddress || null,
        hostCount: values.hostCount ? Number(values.hostCount) : null,
        notes: values.notes || null,
      }
      if (isEdit) {
        await api.put(`/portal/internet-connections/${connection!.id}`, payload)
      } else {
        await api.post('/portal/internet-connections', payload)
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
      title={isEdit ? 'Vaste internetverbinding wijzigen' : 'Vaste internetverbinding toevoegen'}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Product *</label>
          <input {...register('product')} className={field} placeholder="KPN Zakelijk Glasvezel 500/500" autoFocus />
          {errors.product && <p className="mt-1 text-xs text-red-600">{errors.product.message}</p>}
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
            <label className="block text-xs font-medium text-slate-600 mb-1">Type verbinding</label>
            <select {...register('type')} className={field}>
              {CONNECTION_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
            <select {...register('status')} className={field}>
              {INTERNET_CONNECTION_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Activatiedatum</label>
            <input type="date" {...register('activatedAt')} className={field} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Looptijd (maanden)</label>
            <input {...register('termMonths')} className={field} placeholder="24" inputMode="numeric" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Postcode</label>
            <input {...register('postalCode')} className={field} placeholder="1234 AB" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Huisnummer</label>
            <input {...register('houseNumber')} className={field} placeholder="12A" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">IP-adres</label>
            <input {...register('ipAddress')} className={field} placeholder="192.168.1.1" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Aantal hosts</label>
            <input {...register('hostCount')} className={field} placeholder="30" inputMode="numeric" />
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
            {isSubmitting ? 'Opslaan…' : isEdit ? 'Wijzigingen opslaan' : 'Verbinding toevoegen'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
