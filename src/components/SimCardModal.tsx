import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import api from '@/lib/axios'
import type { ClientUserListItem } from '@/types/clientUser'
import type { PhoneListItem } from '@/types/phone'
import type { SimCardListItem } from '@/types/simcard'
import { SIM_TYPE_OPTIONS, SIM_STATUS_OPTIONS } from '@/types/simcard'

const schema = z.object({
  kaartNummer: z.string().min(1, 'Kaartnummer is verplicht').max(100),
  type: z.string(),
  phoneNumber: z.string().max(50),
  provider: z.string().max(200),
  status: z.string(),
  phoneId: z.string(),
  assignedToUserId: z.string(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  teammates: ClientUserListItem[]
  phones: PhoneListItem[]
  simCard?: SimCardListItem | null
}

const field =
  'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-colors'

export function SimCardModal({ open, onClose, onSuccess, teammates, phones, simCard }: Props) {
  const [apiError, setApiError] = useState<string | null>(null)
  const isEdit = !!simCard

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (open) {
      reset(simCard ? {
        kaartNummer: simCard.kaartNummer,
        type: simCard.type === 'Physical' ? '0' : '1',
        phoneNumber: simCard.phoneNumber,
        provider: simCard.provider,
        status: simCard.status === 'InUse' ? '0' : simCard.status === 'InStock' ? '1' : '2',
        phoneId: simCard.phoneId ?? '',
        assignedToUserId: simCard.assignedToUserId ?? '',
      } : {
        kaartNummer: '', type: '0', phoneNumber: '',
        provider: '', status: '1', phoneId: '', assignedToUserId: '',
      })
      setApiError(null)
    }
  }, [open, simCard, reset])

  const handleClose = () => { reset(); setApiError(null); onClose() }

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      const payload = {
        kaartNummer: values.kaartNummer,
        type: parseInt(values.type, 10),
        phoneNumber: values.phoneNumber || '',
        provider: values.provider || '',
        status: parseInt(values.status, 10),
        phoneId: values.phoneId || null,
        assignedToUserId: values.assignedToUserId || null,
      }

      if (isEdit) {
        await api.put(`/portal/simcards/${simCard!.id}`, payload)
      } else {
        await api.post('/portal/simcards', payload)
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
      title={isEdit ? 'Simkaart wijzigen' : 'Simkaart toevoegen'}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Kaartnummer *</label>
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Telefoonnummer</label>
            <input {...register('phoneNumber')} className={field} placeholder="+31 6 12345678" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Provider</label>
            <input {...register('provider')} className={field} placeholder="KPN, Vodafone…" />
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Gekoppeld aan telefoon</label>
            <select {...register('phoneId')} className={field}>
              <option value="">— Geen —</option>
              {phones.map(p => (
                <option key={p.id} value={p.id}>{p.brand} {p.model}</option>
              ))}
            </select>
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
        </div>

        {apiError && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{apiError}</p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>
            Annuleren
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? 'Opslaan…' : isEdit ? 'Wijzigingen opslaan' : 'Simkaart toevoegen'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
