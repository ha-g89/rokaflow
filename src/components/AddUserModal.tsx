import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import api from '@/lib/axios'

const schema = z.object({
  firstName: z.string().min(1, 'Voornaam is verplicht').max(100),
  lastName: z.string().min(1, 'Achternaam is verplicht').max(100),
  email: z.string().email('Geldig e-mailadres vereist'),
  password: z.string().min(8, 'Minimaal 8 tekens'),
  departmentId: z.string().optional().default(''),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  clientId?: string
  clientName: string
  /** Override the POST endpoint (e.g. '/portal/users' for the client portal) */
  apiEndpoint?: string
  /** If provided, shows a department dropdown instead of a free-text field */
  departments?: { id: string; name: string }[]
}

const field =
  'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-colors'

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
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        departmentId: values.departmentId || null,
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
            <label className="block text-xs font-medium text-slate-600 mb-1">Achternaam *</label>
            <input {...register('lastName')} className={field} placeholder="de Vries" />
            {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">E-mailadres *</label>
          <input {...register('email')} type="email" className={field} placeholder="jan@bedrijf.nl" />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Wachtwoord *</label>
          <input {...register('password')} type="password" className={field} placeholder="••••••••" />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          <p className="mt-1 text-xs text-slate-400">Gebruiker logt in met deze gegevens.</p>
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
            {isSubmitting ? 'Aanmaken…' : 'Gebruiker toevoegen'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
