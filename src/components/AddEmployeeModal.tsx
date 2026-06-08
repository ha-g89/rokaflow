import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import api from '@/lib/axios'

const schema = z.object({
  firstName: z.string().min(1, 'Voornaam is verplicht').max(100),
  lastName: z.string().min(1, 'Achternaam is verplicht').max(100),
  email: z.string().max(256).refine(
    v => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    'Ongeldig e-mailadres'
  ),
  departmentId: z.string().min(1, 'Afdeling is verplicht'),
  managerId: z.string(),
  jobTitle: z.string().min(1, 'Functie is verplicht').max(200),
  phone: z.string().max(100),
  status: z.string(),
  contractType: z.string().min(1, 'Contracttype is verplicht'),
  startDate: z.string().min(1, 'Startdatum is verplicht'),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  departments?: { id: string; name: string; managerId: string | null }[]
  managers?: { id: string; fullName: string }[]
}

const field =
  'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-colors'

const STATUS_OPTIONS = [
  { value: '0', label: 'In dienst' },
  { value: '3', label: 'In dienst gepland' },
  { value: '1', label: 'Uit dienst gepland' },
  { value: '2', label: 'Uit dienst' },
]

const CONTRACT_OPTIONS = [
  { value: '', label: '— Kies contracttype —' },
  { value: '0', label: 'Vast' },
  { value: '1', label: 'Tijdelijk' },
  { value: '2', label: 'Stagiair' },
  { value: '3', label: 'Inhuur' },
]

export function AddEmployeeModal({ open, onClose, onSuccess, departments = [], managers = [] }: Props) {
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '', lastName: '', email: '', departmentId: '', managerId: '',
      jobTitle: '', phone: '', status: '0', contractType: '', startDate: '',
    },
  })

  const selectedDeptId = watch('departmentId')
  const selectedStartDate = watch('startDate')
  const startIsPlanned = selectedStartDate ? new Date(selectedStartDate) > new Date() : false

  // auto-fill manager when department changes
  useEffect(() => {
    if (selectedDeptId) {
      const dept = departments.find(d => d.id === selectedDeptId)
      if (dept?.managerId) setValue('managerId', dept.managerId)
    }
  }, [selectedDeptId, departments, setValue])

  const handleClose = () => { reset(); setApiError(null); onClose() }

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      await api.post('/portal/employees', {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email || null,
        departmentId: values.departmentId || null,
        managerId: values.managerId || null,
        jobTitle: values.jobTitle || null,
        phone: values.phone || null,
        status: parseInt(values.status, 10),
        contractType: values.contractType !== '' ? parseInt(values.contractType, 10) : null,
        startDate: values.startDate ? new Date(values.startDate).toISOString() : null,
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
    <Modal open={open} onClose={handleClose} title="Medewerker toevoegen" className="max-w-lg">
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
          <label className="block text-xs font-medium text-slate-600 mb-1">E-mailadres</label>
          <input {...register('email')} type="email" className={field} placeholder="jan@bedrijf.nl (optioneel)" />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          <p className="mt-1 text-xs text-slate-400">Niet vereist — deze medewerker heeft geen inlogaccount.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Afdeling *</label>
            <select {...register('departmentId')} className={field}>
              <option value="">— Kies afdeling —</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            {errors.departmentId && <p className="mt-1 text-xs text-red-600">{errors.departmentId.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Manager</label>
            <select {...register('managerId')} className={field}>
              <option value="">— Geen manager —</option>
              {managers.map(m => (
                <option key={m.id} value={m.id}>{m.fullName}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Functie *</label>
          <input {...register('jobTitle')} className={field} placeholder="Medewerker" />
          {errors.jobTitle && <p className="mt-1 text-xs text-red-600">{errors.jobTitle.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Telefoon</label>
            <input {...register('phone')} className={field} placeholder="+31 6 12345678 (optioneel)" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Startdatum *</label>
            <input {...register('startDate')} type="date" className={field} />
            {errors.startDate && <p className="mt-1 text-xs text-red-600">{errors.startDate.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
            {startIsPlanned ? (
              <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-700">
                Automatisch <strong>In dienst gepland</strong>
              </div>
            ) : (
              <select {...register('status')} className={field}>
                {STATUS_OPTIONS.filter(o => o.value !== '3').map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Contracttype *</label>
            <select {...register('contractType')} className={field}>
              {CONTRACT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {errors.contractType && <p className="mt-1 text-xs text-red-600">{errors.contractType.message}</p>}
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
            {isSubmitting ? 'Aanmaken…' : 'Medewerker toevoegen'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
