import { useEffect, useRef, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, ImagePlus, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import api from '@/lib/axios'
import type { PlatformPlanDto } from '@/types/platformPlan'

const schemaWithOwnerInvite = z.object({
  name: z.string().min(1, 'Naam is verplicht').max(256),
  planId: z.string().min(1, 'Kies een abonnement'),
  ownerName: z.string().min(1, 'Naam van de eigenaar is verplicht'),
  ownerEmail: z.string().email('Ongeldig e-mailadres'),
})

const schemaSimple = z.object({
  name: z.string().min(1, 'Naam is verplicht').max(256),
})

interface FormValues {
  name: string
  planId: string
  ownerName: string
  ownerEmail: string
}

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  endpoint: string
  /**
   * When true (default), this modal creates a client via the MSP-facing
   * `/clients` endpoint, which requires an owner name/e-mail so the owner
   * can receive a consent invite. Set to false for endpoints (e.g.
   * `/organisations/{id}/clients`, used by the superuser dashboard) that
   * only accept `{ name }` and create the client directly.
   */
  requireOwnerInvite?: boolean
}

const field =
  'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25 transition-colors'

export function AddClientModal({ open, onClose, onSuccess, endpoint, requireOwnerInvite = true }: Props) {
  const [apiError, setApiError] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [plans, setPlans] = useState<PlatformPlanDto[]>([])
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(requireOwnerInvite ? schemaWithOwnerInvite : schemaSimple) as Resolver<FormValues>,
  })

  useEffect(() => {
    if (!open || !requireOwnerInvite) return
    api.get<PlatformPlanDto[]>('/msp/subscriptions/plans')
      .then(r => setPlans(r.data))
      .catch(() => {})
  }, [open, requireOwnerInvite])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const clearLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClose = () => {
    reset()
    setApiError(null)
    clearLogo()
    setInvitedEmail(null)
    onClose()
  }

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      const body = requireOwnerInvite
        ? { name: values.name, planId: values.planId, ownerName: values.ownerName, ownerEmail: values.ownerEmail }
        : { name: values.name }
      const { data } = await api.post<{ id: string }>(endpoint, body)

      if (logoFile && data.id) {
        const form = new FormData()
        form.append('file', logoFile)
        await api.post(`/clients/${data.id}/logo`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      if (requireOwnerInvite) {
        // Show an inline confirmation instead of closing immediately — the
        // client isn't active yet, so surface that the owner still needs
        // to accept the invite before the row appears as a "real" client.
        clearLogo()
        setInvitedEmail(values.ownerEmail)
        onSuccess()
      } else {
        handleClose()
        onSuccess()
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(msg ?? 'Aanmaken mislukt.')
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Nieuwe client">
      {invitedEmail ? (
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 size={24} className="text-emerald-500" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">Uitnodiging verstuurd</p>
            <p className="text-xs text-slate-500 mt-1">
              Uitnodiging verstuurd naar {invitedEmail}. De omgeving wordt actief zodra de eigenaar heeft goedgekeurd.
            </p>
          </div>
          <Button className="w-full" onClick={handleClose}>Sluiten</Button>
        </div>
      ) : (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Logo upload */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-2">Logo (optioneel)</label>
          <div className="flex items-center gap-3">
            {logoPreview ? (
              <div className="relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex-shrink-0">
                <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-1" />
                <button
                  type="button"
                  onClick={clearLogo}
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-slate-700/80 text-white flex items-center justify-center hover:bg-slate-900"
                >
                  <X size={9} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-blue-500 transition-colors flex-shrink-0"
              >
                <ImagePlus size={18} />
                <span className="text-[10px] leading-none">Upload</span>
              </button>
            )}
            <div className="text-xs text-slate-500 leading-relaxed">
              PNG, JPG of WebP<br />Maximaal 512×512px
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Naam *</label>
          <input {...register('name')} className={field} placeholder="Bedrijfsnaam" autoFocus />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>

        {requireOwnerInvite && (
          <>
            {/* Plan */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Abonnement *</label>
              <select {...register('planId')} className={field} defaultValue="">
                <option value="" disabled>Kies een abonnement…</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.directRate != null ? ` — €${p.directRate.toFixed(2)}/mnd` : ''}
                  </option>
                ))}
              </select>
              {errors.planId && <p className="mt-1 text-xs text-red-600">{errors.planId.message}</p>}
            </div>

            <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              De eigenaar of beheerder van dit bedrijf ontvangt een e-mail en moet het beheer goedkeuren
              voordat de omgeving actief wordt.
            </p>

            {/* Owner name */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Naam eigenaar/beheerder *</label>
              <input {...register('ownerName')} className={field} placeholder="Voor- en achternaam" />
              {errors.ownerName && <p className="mt-1 text-xs text-red-600">{errors.ownerName.message}</p>}
            </div>

            {/* Owner email */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">E-mail eigenaar/beheerder *</label>
              <input {...register('ownerEmail')} type="email" className={field} placeholder="naam@bedrijf.nl" />
              {errors.ownerEmail && <p className="mt-1 text-xs text-red-600">{errors.ownerEmail.message}</p>}
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
            {isSubmitting ? 'Aanmaken…' : 'Client aanmaken'}
          </Button>
        </div>
      </form>
      )}
    </Modal>
  )
}
