import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import api from '@/lib/axios'
import type { PhoneNumberListItem } from '@/types/phoneNumber'
import { PHONE_NUMBER_TYPE_OPTIONS, PHONE_NUMBER_TYPE_VALUE } from '@/types/phoneNumber'

const schema = z.object({
  type: z.string(),
  startNumber: z.string().min(1, 'Beginnummer is verplicht').max(30),
  endNumber: z.string().max(30),
  notes: z.string(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  number?: PhoneNumberListItem | null
}

const field =
  'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25 transition-colors'

export function PhoneNumberModal({ open, onClose, onSuccess, number }: Props) {
  const [apiError, setApiError] = useState<string | null>(null)
  const isEdit = !!number

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (open) {
      if (number) {
        reset({
          type: String(PHONE_NUMBER_TYPE_VALUE[number.type] ?? 0),
          startNumber: number.startNumber,
          endNumber: number.endNumber ?? '',
          notes: number.notes ?? '',
        })
      } else {
        reset({ type: '0', startNumber: '', endNumber: '', notes: '' })
      }
      setApiError(null)
    }
  }, [open, number, reset])

  const handleClose = () => { reset(); setApiError(null); onClose() }

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      const payload = {
        type: Number(values.type),
        startNumber: values.startNumber,
        endNumber: values.endNumber || null,
        notes: values.notes || null,
      }
      if (isEdit) {
        await api.put(`/portal/phone-numbers/${number!.id}`, payload)
      } else {
        await api.post('/portal/phone-numbers', payload)
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
      title={isEdit ? 'Telefoonnummer wijzigen' : 'Telefoonnummer toevoegen'}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Soort</label>
          <select {...register('type')} className={field} autoFocus>
            {PHONE_NUMBER_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Beginnummer *</label>
            <input {...register('startNumber')} className={field} placeholder="088-1234500" />
            {errors.startNumber && <p className="mt-1 text-xs text-red-600">{errors.startNumber.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Eindnummer</label>
            <input {...register('endNumber')} className={field} placeholder="088-1234599" />
            {errors.endNumber && <p className="mt-1 text-xs text-red-600">{errors.endNumber.message}</p>}
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
            {isSubmitting ? 'Opslaan…' : isEdit ? 'Wijzigingen opslaan' : 'Nummer toevoegen'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
