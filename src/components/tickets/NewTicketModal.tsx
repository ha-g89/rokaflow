import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import api from '@/lib/axios'
import { TICKET_CATEGORY_OPTIONS, notifyTicketsChanged } from '@/types/ticket'

const schema = z.object({
  category: z.string(),
  entityId: z.string(),
  description: z.string().min(1, 'Omschrijving is verplicht').max(4000),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  hardware: { id: string; label: string }[]
  presetEntityId?: string
}

const field =
  'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25 transition-colors'

export function NewTicketModal({ open, onClose, onSuccess, hardware, presetEntityId }: Props) {
  const [apiError, setApiError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (open) {
      reset({ category: '0', entityId: presetEntityId ?? '', description: '' })
      setApiError(null)
    }
  }, [open, presetEntityId, reset])

  const handleClose = () => { reset(); setApiError(null); onClose() }

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      await api.post('/portal/tickets', {
        category: Number(values.category),
        description: values.description,
        entityType: values.entityId ? 0 : null,
        entityId: values.entityId || null,
      })
      notifyTicketsChanged()
      onSuccess()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(msg ?? 'Aanmaken mislukt.')
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Nieuw ticket" className="max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Categorie</label>
          <select {...register('category')} className={field} autoFocus>
            {TICKET_CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Hardware (optioneel)</label>
          <select {...register('entityId')} className={field}>
            <option value="">Geen koppeling</option>
            {hardware.map(h => <option key={h.id} value={h.id}>{h.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Omschrijving *</label>
          <textarea
            {...register('description')}
            className={field}
            rows={5}
            placeholder="Beschrijf het probleem of de aanvraag zo duidelijk mogelijk…"
          />
          {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
        </div>

        {apiError && (
          <p className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">{apiError}</p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>
            Annuleren
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? 'Aanmaken…' : 'Ticket aanmaken'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
