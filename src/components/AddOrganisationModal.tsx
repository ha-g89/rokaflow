import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import api from '@/lib/axios'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(256),
  slug: z
    .string()
    .regex(/^[a-z0-9-]*$/, 'Only lowercase letters, numbers and hyphens')
    .optional()
    .or(z.literal('')),
  adminEmail: z.string().email('Valid email required'),
  adminPassword: z.string().min(8, 'Minimum 8 characters'),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const field =
  'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors'

export function AddOrganisationModal({ open, onClose, onSuccess }: Props) {
  const [apiError, setApiError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      await api.post('/organisations', {
        name: values.name,
        slug: values.slug || undefined,
        adminEmail: values.adminEmail,
        adminPassword: values.adminPassword,
      })
      reset()
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(msg ?? 'Failed to create organisation.')
    }
  }

  return (
    <Modal open={open} onClose={() => { reset(); setApiError(null); onClose() }} title="New Organisation">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Organisation Name</label>
          <input {...register('name')} className={field} placeholder="Acme Corp" />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Slug <span className="text-slate-400 font-normal">(optional — auto-generated)</span>
          </label>
          <input {...register('slug')} className={field} placeholder="acme-corp" />
          {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
        </div>

        <hr className="border-slate-100" />

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Admin Email</label>
          <input {...register('adminEmail')} type="email" className={field} placeholder="admin@acme.com" />
          {errors.adminEmail && <p className="mt-1 text-xs text-red-600">{errors.adminEmail.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Admin Password</label>
          <input {...register('adminPassword')} type="password" className={field} placeholder="••••••••" />
          {errors.adminPassword && <p className="mt-1 text-xs text-red-600">{errors.adminPassword.message}</p>}
        </div>

        {apiError && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{apiError}</p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={() => { reset(); setApiError(null); onClose() }}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create Organisation'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
