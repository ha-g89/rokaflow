import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import api from '@/lib/axios'
import type { ClientUserListItem } from '@/types/clientUser'
import type { PhoneListItem } from '@/types/phone'
import { PHONE_STATUS_OPTIONS } from '@/types/phone'

const schema = z.object({
  brand: z.string().min(1, 'Merk is verplicht').max(200),
  model: z.string().max(200),
  serialNumber: z.string().max(100),
  imeiNumber: z.string().max(20),
  supplier: z.string().max(200),
  status: z.string(),
  assignedToUserId: z.string(),
  issuedAt: z.string(),
  returnedAt: z.string(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  teammates: ClientUserListItem[]
  phone?: PhoneListItem | null
}

const field =
  'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-colors'

export function PhoneModal({ open, onClose, onSuccess, teammates, phone }: Props) {
  const [apiError, setApiError] = useState<string | null>(null)
  const isEdit = !!phone

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (open) {
      reset(phone ? {
        brand: phone.brand,
        model: phone.model,
        serialNumber: phone.serialNumber,
        imeiNumber: phone.imeiNumber,
        supplier: phone.supplier ?? '',
        status: phone.status === 'InStock' ? '0' : phone.status === 'InUse' ? '1' : '2',
        assignedToUserId: phone.assignedToUserId ?? '',
        issuedAt: phone.issuedAt ? phone.issuedAt.substring(0, 10) : '',
        returnedAt: phone.returnedAt ? phone.returnedAt.substring(0, 10) : '',
      } : {
        brand: '', model: '', serialNumber: '', imeiNumber: '',
        supplier: '', status: '0', assignedToUserId: '', issuedAt: '', returnedAt: '',
      })
      setApiError(null)
    }
  }, [open, phone, reset])

  const handleClose = () => { reset(); setApiError(null); onClose() }

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      const payload = {
        brand: values.brand,
        model: values.model || '',
        serialNumber: values.serialNumber || '',
        imeiNumber: values.imeiNumber || '',
        supplier: values.supplier || null,
        status: parseInt(values.status, 10),
        assignedToUserId: values.assignedToUserId || null,
        issuedAt: values.issuedAt ? new Date(values.issuedAt).toISOString() : null,
        returnedAt: values.returnedAt ? new Date(values.returnedAt).toISOString() : null,
      }

      if (isEdit) {
        await api.put(`/portal/phones/${phone!.id}`, payload)
      } else {
        await api.post('/portal/phones', payload)
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
      title={isEdit ? 'Telefoon wijzigen' : 'Telefoon toevoegen'}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Merk *</label>
            <input {...register('brand')} className={field} placeholder="Apple" autoFocus />
            {errors.brand && <p className="mt-1 text-xs text-red-600">{errors.brand.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Model</label>
            <input {...register('model')} className={field} placeholder="iPhone 15 Pro" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Serienummer</label>
            <input {...register('serialNumber')} className={field} placeholder="C02XY…" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">IMEI-nummer</label>
            <input {...register('imeiNumber')} className={field} placeholder="35 123456…" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Leverancier</label>
          <input {...register('supplier')} className={field} placeholder="Belsimpel, MediaMarkt…" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
            <select {...register('status')} className={field}>
              {PHONE_STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Toegewezen aan</label>
            <select
              {...register('assignedToUserId')}
              className={field}
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
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Uitgiftedatum</label>
            <input {...register('issuedAt')} type="date" className={field} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Inleverdatum</label>
            <input {...register('returnedAt')} type="date" className={field} />
          </div>
        </div>

        {apiError && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{apiError}</p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>
            Annuleren
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? 'Opslaan…' : isEdit ? 'Wijzigingen opslaan' : 'Telefoon toevoegen'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
