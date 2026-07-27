import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import api from '@/lib/axios'
import { Button } from '@/components/ui/Button'
import type { MspUserListItem } from '@/types/mspUser'

const schema = z.object({
  firstName: z.string().min(1, 'Voornaam is verplicht').max(100),
  lastName:  z.string().min(1, 'Achternaam is verplicht').max(100),
  email:     z.string().min(1, 'E-mailadres is verplicht').email('Ongeldig e-mailadres').max(256),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: (user: MspUserListItem) => void
}

export function InviteMspUserModal({ open, onClose, onSuccess }: Props) {
  const [mounted, setMounted]   = useState(false)
  const [visible, setVisible]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (open) {
      setMounted(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    } else {
      setVisible(false)
      const t = setTimeout(() => setMounted(false), 220)
      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      reset({ firstName: '', lastName: '', email: '' })
      setApiError(null)
    }
  }, [open, reset])

  const onSubmit = async (values: FormValues) => {
    setSaving(true)
    setApiError(null)
    try {
      const { data } = await api.post<MspUserListItem>('/msp/users', {
        firstName: values.firstName.trim(),
        lastName:  values.lastName.trim(),
        email:     values.email.trim(),
      })
      onSuccess(data)
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(msg ?? 'Er is iets misgegaan.')
    } finally {
      setSaving(false)
    }
  }

  if (!mounted) return null

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md transition-all duration-200 ease-out ${visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Teamlid toevoegen</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Voornaam <span className="text-red-500">*</span>
              </label>
              <input
                {...register('firstName')}
                autoFocus
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-400 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25"
              />
              {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Achternaam <span className="text-red-500">*</span>
              </label>
              <input
                {...register('lastName')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-400 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25"
              />
              {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              E-mailadres <span className="text-red-500">*</span>
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="naam@bedrijf.nl"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-400 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25"
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <p className="text-xs text-slate-400">
            Dit teamlid ontvangt een e-mail met een link om zelf een wachtwoord in te stellen.
          </p>

          {apiError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-4 py-3">
              <p className="text-sm text-red-700 dark:text-red-400">{apiError}</p>
            </div>
          )}
        </form>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Annuleren</Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={saving}>
            {saving ? 'Versturen…' : 'Uitnodigen'}
          </Button>
        </div>
      </div>
    </div>
  )
}
