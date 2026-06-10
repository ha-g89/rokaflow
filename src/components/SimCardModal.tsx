import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertTriangle, ChevronDown, Check } from 'lucide-react'
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
  'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-colors'

// ── Custom phone dropdown ─────────────────────────────────────────────────────

function PhoneDropdown({ phones, value, simCardId, onChange }: {
  phones: PhoneListItem[]
  value: string
  simCardId: string | undefined
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = phones.find(p => p.id === value) ?? null

  const select = (id: string) => { onChange(id); setOpen(false) }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm transition-colors text-left
          ${open ? 'border-violet-500 ring-2 ring-violet-100' : 'border-slate-300 hover:border-slate-400'}
          bg-white`}
      >
        {selected ? (
          <div className="min-w-0">
            <p className="text-slate-900 font-medium truncate">{selected.brand} {selected.model}</p>
            <p className="text-xs text-slate-400 truncate">S/N: {selected.serialNumber || '—'}</p>
          </div>
        ) : (
          <span className="text-slate-400">— Geen —</span>
        )}
        <ChevronDown size={14} className={`text-slate-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <div className="max-h-52 overflow-y-auto">
            {/* None option */}
            <button
              type="button"
              onClick={() => select('')}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm transition-colors text-left
                ${!value ? 'bg-violet-50 text-violet-700' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <span>— Geen —</span>
              {!value && <Check size={13} className="text-violet-500 flex-shrink-0" />}
            </button>

            {phones.map(p => {
              const isSelected  = value === p.id
              const hasOtherSim = !!p.simCardId && p.simCardId !== (simCardId ?? null)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => select(p.id)}
                  className={`w-full flex items-start justify-between gap-2 px-3 py-2.5 border-t border-slate-100 text-sm transition-colors text-left
                    ${isSelected ? 'bg-violet-50' : 'hover:bg-slate-50'}`}
                >
                  <div className="min-w-0">
                    <p className={`font-medium leading-tight truncate ${isSelected ? 'text-violet-700' : 'text-slate-800'}`}>
                      {p.brand} {p.model}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">S/N: {p.serialNumber || '—'}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                    {hasOtherSim && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                        SIM gekoppeld
                      </span>
                    )}
                    {isSelected && <Check size={13} className="text-violet-500" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export function SimCardModal({ open, onClose, onSuccess, teammates, phones, simCard }: Props) {
  const isEdit = !!simCard

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
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
    }
  }, [open, simCard, reset])

  const handleClose = () => { reset(); onClose() }

  const selectedPhoneId = watch('phoneId')
  const selectedPhone   = phones.find(p => p.id === selectedPhoneId) ?? null
  const phoneHasOtherSim =
    !!selectedPhone?.simCardId &&
    selectedPhone.simCardId !== (simCard?.id ?? null)

  const onSubmit = async (values: FormValues) => {
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
      console.error(err)
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

        {/* Phone picker */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Gekoppeld aan telefoon</label>
          <input type="hidden" {...register('phoneId')} />
          <PhoneDropdown
            phones={phones}
            value={selectedPhoneId}
            simCardId={simCard?.id}
            onChange={id => setValue('phoneId', id)}
          />

          {phoneHasOtherSim && (
            <div className="mt-2 flex gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
              <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                <span className="font-semibold">Let op:</span> Deze telefoon is al gekoppeld aan simkaart{' '}
                <span className="font-medium">{selectedPhone!.simCardNumber ?? '(onbekend)'}</span>.
                Door op te slaan wordt die koppeling verbroken en deze simkaart eraan gekoppeld.
              </p>
            </div>
          )}
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
