import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Search, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import api from '@/lib/axios'
import type { ClientUserListItem } from '@/types/clientUser'
import type { LicenseListItem } from '@/types/license'
import { LICENSE_TYPE_OPTIONS, LICENSE_TARGET_OPTIONS } from '@/types/license'

const schema = z.object({
  name: z.string().min(1, 'Naam is verplicht').max(256),
  vendor: z.string().max(200),
  type: z.string(),
  target: z.string(),
  maxUsers: z.string().min(1),
  startsAt: z.string().min(1, 'Startdatum is verplicht'),
  expiresAt: z.string(),
  isActive: z.boolean(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  teammates: ClientUserListItem[]
  license?: LicenseListItem | null
}

const field =
  'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-colors'

function toDateInput(v: string | null | undefined) {
  if (!v) return ''
  return v.substring(0, 10)
}

function typeNameToValue(name: string): number {
  const map: Record<string, number> = { Basic: 0, Pro: 1, Enterprise: 2 }
  return map[name] ?? 0
}

export function LicenseModal({ open, onClose, onSuccess, teammates, license }: Props) {
  const [apiError, setApiError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [userSearch, setUserSearch] = useState('')
  const isEdit = !!license

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (open) {
      if (license) {
        reset({
          name: license.name,
          vendor: license.vendor,
          type: String(typeNameToValue(license.type)),
          target: license.target === 'Device' ? '1' : '0',
          maxUsers: String(license.maxUsers),
          startsAt: toDateInput(license.startsAt),
          expiresAt: toDateInput(license.expiresAt),
          isActive: license.isActive,
        })
      } else {
        reset({
          name: '', vendor: '', type: '0', target: '0', maxUsers: '1',
          startsAt: '', expiresAt: '', isActive: true,
        })
      }
      setSelectedIds([])
      setUserSearch('')
      setApiError(null)
    }
  }, [open, license, reset])

  const handleClose = () => { reset(); setApiError(null); onClose() }

  const toggleUser = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const filteredTeammates = teammates.filter(t =>
    `${t.firstName} ${t.lastName} ${t.email}`.toLowerCase().includes(userSearch.toLowerCase())
  )

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      const payload = {
        name: values.name,
        vendor: values.vendor || '',
        type: parseInt(values.type, 10),
        target: parseInt(values.target, 10),
        maxUsers: parseInt(values.maxUsers, 10),
        startsAt: new Date(values.startsAt).toISOString(),
        expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : null,
        isActive: values.isActive,
      }

      if (isEdit) {
        await api.put(`/portal/licenses/${license!.id}`, payload)
      } else {
        const { data } = await api.post<LicenseListItem>('/portal/licenses', payload)
        // assign selected users sequentially after creation
        for (const userId of selectedIds) {
          await api.post(`/portal/licenses/${data.id}/assign`, { userId })
        }
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
      title={isEdit ? 'Licentie wijzigen' : 'Licentie toevoegen'}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Naam *</label>
          <input {...register('name')} className={field} placeholder="Microsoft 365 Business Premium" autoFocus />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>

        {/* Vendor */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Leverancier</label>
          <input {...register('vendor')} className={field} placeholder="Microsoft" />
        </div>

        {/* Type + Target */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tier</label>
            <select {...register('type')} className={field}>
              {LICENSE_TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Toewijzen aan</label>
            <select {...register('target')} className={field}>
              {LICENSE_TARGET_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* MaxUsers */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Max. gebruikers *</label>
          <input {...register('maxUsers')} type="number" min="1" className={field} placeholder="25" />
          {errors.maxUsers && <p className="mt-1 text-xs text-red-600">{errors.maxUsers.message}</p>}
        </div>

        {/* StartsAt + ExpiresAt */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Startdatum *</label>
            <input {...register('startsAt')} type="date" className={field} />
            {errors.startsAt && <p className="mt-1 text-xs text-red-600">{errors.startsAt.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Vervaldatum</label>
            <input {...register('expiresAt')} type="date" className={field} />
          </div>
        </div>

        {/* IsActive */}
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input {...register('isActive')} type="checkbox" className="w-4 h-4 accent-indigo-600" />
          <span className="text-sm text-slate-700">Actief</span>
        </label>

        {/* User assignment — only on create */}
        {!isEdit && teammates.length > 0 && (
          <div>
            <hr className="border-slate-100" />
            <div className="pt-1">
              <label className="block text-xs font-medium text-slate-600 mb-2">
                Gebruikers toewijzen
                {selectedIds.length > 0 && (
                  <span className="ml-1.5 text-indigo-600">({selectedIds.length} geselecteerd)</span>
                )}
              </label>

              {/* Selected tags */}
              {selectedIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedIds.map(id => {
                    const u = teammates.find(t => t.id === id)
                    if (!u) return null
                    return (
                      <span key={id} className="inline-flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                        {u.firstName} {u.lastName}
                        <button type="button" onClick={() => toggleUser(id)} className="hover:text-indigo-900">
                          <X size={11} />
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}

              {/* Search */}
              <div className="relative mb-1.5">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Zoek medewerker…"
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-indigo-400"
                />
              </div>

              {/* User list */}
              <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                {filteredTeammates.length === 0 ? (
                  <p className="p-3 text-xs text-slate-400 text-center">Geen medewerkers gevonden.</p>
                ) : (
                  filteredTeammates.map(u => (
                    <label key={u.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(u.id)}
                        onChange={() => toggleUser(u.id)}
                        className="w-3.5 h-3.5 accent-indigo-600 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-800 truncate">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{u.department || u.email}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {apiError && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{apiError}</p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>
            Annuleren
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? 'Opslaan…' : isEdit ? 'Wijzigingen opslaan' : 'Licentie toevoegen'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
