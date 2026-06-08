import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import api from '@/lib/axios'
import type { ClientUserListItem } from '@/types/clientUser'
import type { HardwareAssetListItem } from '@/types/hardware'
import { HARDWARE_TYPE_OPTIONS, HARDWARE_STATUS_OPTIONS } from '@/types/hardware'

const schema = z.object({
  name: z.string().min(1, 'Naam is verplicht').max(256),
  brand: z.string().max(200),
  type: z.string(),
  assetNumber: z.string().max(100),
  serialNumber: z.string().max(100),
  status: z.string(),
  location: z.string().max(200),
  purchaseValue: z.string(),
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
  asset?: HardwareAssetListItem | null
}

const field =
  'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-colors'

function toDateInput(v: string | null | undefined) {
  if (!v) return ''
  return v.substring(0, 10)
}

function typeNameToValue(typeName: string): number {
  const map: Record<string, number> = {
    Laptop: 0, Desktop: 1, Phone: 2, Tablet: 3, Monitor: 4, Other: 5,
  }
  return map[typeName] ?? 0
}

function statusNameToValue(statusName: string): number {
  const map: Record<string, number> = {
    InStock: 0, InUse: 1, Decommissioned: 2,
  }
  return map[statusName] ?? 0
}

export function HardwareModal({ open, onClose, onSuccess, teammates, asset }: Props) {
  const [apiError, setApiError] = useState<string | null>(null)
  const isEdit = !!asset

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (open) {
      if (asset) {
        reset({
          name: asset.name,
          brand: asset.brand,
          type: String(typeNameToValue(asset.type)),
          assetNumber: asset.assetNumber,
          serialNumber: asset.serialNumber,
          status: String(statusNameToValue(asset.status)),
          location: asset.location,
          purchaseValue: asset.purchaseValue != null ? String(asset.purchaseValue) : '',
          assignedToUserId: asset.assignedToUserId ?? '',
          issuedAt: toDateInput(asset.issuedAt),
          returnedAt: toDateInput(asset.returnedAt),
        })
      } else {
        reset({
          name: '', brand: '', type: '0', assetNumber: '', serialNumber: '',
          status: '0', location: '', purchaseValue: '',
          assignedToUserId: '', issuedAt: '', returnedAt: '',
        })
      }
      setApiError(null)
    }
  }, [open, asset, reset])

  const handleClose = () => { reset(); setApiError(null); onClose() }

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      const payload = {
        name: values.name,
        brand: values.brand || '',
        type: parseInt(values.type, 10),
        assetNumber: values.assetNumber || '',
        serialNumber: values.serialNumber || '',
        status: parseInt(values.status, 10),
        location: values.location || '',
        purchaseValue: values.purchaseValue !== '' ? parseFloat(values.purchaseValue) : null,
        assignedToUserId: values.assignedToUserId || null,
        issuedAt: values.issuedAt ? new Date(values.issuedAt).toISOString() : null,
        returnedAt: values.returnedAt ? new Date(values.returnedAt).toISOString() : null,
      }

      if (isEdit) {
        await api.put(`/portal/hardware/${asset!.id}`, payload)
      } else {
        await api.post('/portal/hardware', payload)
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
      title={isEdit ? 'Hardware wijzigen' : 'Hardware toevoegen'}
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Naam *</label>
          <input {...register('name')} className={field} placeholder="Dell Latitude 5520" autoFocus />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>

        {/* Brand + Type */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Merk / model</label>
            <input {...register('brand')} className={field} placeholder="Dell" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Type *</label>
            <select {...register('type')} className={field}>
              {HARDWARE_TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* AssetNumber + SerialNumber */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Assetnummer</label>
            <input {...register('assetNumber')} className={field} placeholder="ASS-001" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Serienummer</label>
            <input {...register('serialNumber')} className={field} placeholder="SN1234567" />
          </div>
        </div>

        {/* Status + Location */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Status *</label>
            <select {...register('status')} className={field}>
              {HARDWARE_STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Locatie</label>
            <input {...register('location')} className={field} placeholder="Kantoor Amsterdam" />
          </div>
        </div>

        {/* PurchaseValue + AssignedTo */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Aanschafwaarde (€)</label>
            <input
              {...register('purchaseValue')}
              type="number"
              step="0.01"
              min="0"
              className={field}
              placeholder="0.00"
            />
            {errors.purchaseValue && (
              <p className="mt-1 text-xs text-red-600">{errors.purchaseValue.message}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Toegewezen aan</label>
            <select {...register('assignedToUserId')} className={field}>
              <option value="">— Niemand —</option>
              {teammates.map(u => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* IssuedAt + ReturnedAt */}
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
            {isSubmitting ? 'Opslaan…' : isEdit ? 'Wijzigingen opslaan' : 'Hardware toevoegen'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
