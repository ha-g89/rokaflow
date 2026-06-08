import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import api from '@/lib/axios'
import type { LocationListItem } from '@/types/location'

const schema = z.object({
  name:       z.string().min(1, 'Naam is verplicht').max(200),
  address:    z.string().max(300),
  city:       z.string().max(100),
  country:    z.string().max(100),
  province:   z.string().max(100),
  postalCode: z.string().max(20),
  phone:      z.string().max(50),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  location?: LocationListItem | null
}

const field =
  'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-colors'

export function LocationModal({ open, onClose, onSuccess, location }: Props) {
  const [apiError, setApiError] = useState<string | null>(null)
  const isEdit = !!location

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (open) {
      if (location) {
        reset({
          name:       location.name,
          address:    location.address,
          city:       location.city,
          country:    location.country,
          province:   location.province,
          postalCode: location.postalCode,
          phone:      location.phone,
        })
      } else {
        reset({ name: '', address: '', city: '', country: 'Nederland', province: '', postalCode: '', phone: '' })
      }
      setApiError(null)
    }
  }, [open, location, reset])

  const handleClose = () => { reset(); setApiError(null); onClose() }

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      const payload = {
        name:       values.name,
        address:    values.address || '',
        city:       values.city || '',
        country:    values.country || '',
        province:   values.province || '',
        postalCode: values.postalCode || '',
        phone:      values.phone || '',
      }
      if (isEdit) {
        await api.put(`/portal/locations/${location!.id}`, payload)
      } else {
        await api.post('/portal/locations', payload)
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
      title={isEdit ? 'Locatie wijzigen' : 'Locatie toevoegen'}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Naam *</label>
          <input {...register('name')} className={field} placeholder="Hoofdkantoor Amsterdam" autoFocus />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Adres</label>
          <input {...register('address')} className={field} placeholder="Keizersgracht 123" />
        </div>

        {/* City + PostalCode */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Stad</label>
            <input {...register('city')} className={field} placeholder="Amsterdam" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Postcode</label>
            <input {...register('postalCode')} className={field} placeholder="1234 AB" />
          </div>
        </div>

        {/* Province + Country */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Provincie</label>
            <input {...register('province')} className={field} placeholder="Noord-Holland" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Land</label>
            <input {...register('country')} className={field} placeholder="Nederland" />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Telefoonnummer</label>
          <input {...register('phone')} className={field} placeholder="+31 20 123 4567" />
        </div>

        {apiError && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{apiError}</p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>
            Annuleren
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? 'Opslaan…' : isEdit ? 'Wijzigingen opslaan' : 'Locatie toevoegen'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
