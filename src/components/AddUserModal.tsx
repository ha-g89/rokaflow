import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import api from '@/lib/axios'

const schema = z.object({
  firstName:    z.string().min(1, 'Voornaam is verplicht').max(100),
  tussenvoegsel: z.string().max(50).optional().default(''),
  lastName:     z.string().min(1, 'Achternaam is verplicht').max(100),
  email:        z.string().email('Geldig e-mailadres vereist'),
  departmentId: z.string().optional().default(''),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  clientId?: string
  clientName: string
  apiEndpoint?: string
  departments?: { id: string; name: string }[]
}

const field =
  'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25 transition-colors'

export function AddUserModal({ open, onClose, onSuccess, clientId, clientName, apiEndpoint, departments = [] }: Props) {
  const [apiError, setApiError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const handleClose = () => { reset(); setApiError(null); onClose() }

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      const endpoint = apiEndpoint ?? `/clients/${clientId}/users`
      await api.post(endpoint, {
        firstName:     values.firstName,
        tussenvoegsel: values.tussenvoegsel || '',
        lastName:      values.lastName,
        email:         values.email,
        departmentId:  values.departmentId || null,
      })
      reset()
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(msg ?? 'Aanmaken mislukt.')
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={`Gebruiker toevoegen aan ${clientName}`} className="max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Voornaam *</label>
            <input {...register('firstName')} className={field} placeholder="Jan" autoFocus />
            {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tussenvoegsel</label>
            <input {...register('tussenvoegsel')} className={field} placeholder="van der" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Achternaam *</label>
          <input {...register('lastName')} className={field} placeholder="Berg" />
          {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">E-mailadres *</label>
          <input {...register('email')} type="email" className={field} placeholder="jan@bedrijf.nl" />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>

        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/40">
          <Mail size={13} className="text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700 dark:text-blue-300 leading-snug">
            De gebruiker ontvangt een uitnodigingsmail om zelf een wachtwoord in te stellen.
          </p>
        </div>

        {departments.length > 0 && (
          <>
            <hr className="border-slate-100" />
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Afdeling</label>
              <select {...register('departmentId')} className={field}>
                <option value="">— Geen afdeling —</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {apiError && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{apiError}</p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>
            Annuleren
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? 'Toevoegen…' : 'Toevoegen & uitnodiging sturen'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
