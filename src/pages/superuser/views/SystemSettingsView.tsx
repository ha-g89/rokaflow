import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, AlertTriangle, CheckCircle2, Pencil } from 'lucide-react'
import api from '@/lib/axios'
import { Button } from '@/components/ui/Button'

interface SystemSettings {
  mailingEnabled: boolean
  mailRedirectAddress: string | null
}

const inputField =
  'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25 transition-colors'

const settingsSchema = z.object({
  mailingEnabled: z.boolean(),
  mailRedirectAddress: z.string().max(256).email('Ongeldig e-mailadres').optional().or(z.literal('')),
})
type SettingsFormValues = z.infer<typeof settingsSchema>

function MailCard() {
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  // View/edit-toggle: na het laden start de kaart in view-mode (samenvatting);
  // "Wijzigen" schakelt om naar het bewerkbare formulier.
  const [isEditing, setIsEditing] = useState(false)
  const {
    register, handleSubmit, reset, watch, control, formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { mailingEnabled: true, mailRedirectAddress: '' },
  })

  useEffect(() => {
    api.get<SystemSettings>('/system-settings').then(({ data }) => {
      reset({
        mailingEnabled: data.mailingEnabled,
        mailRedirectAddress: data.mailRedirectAddress ?? '',
      })
    }).catch(() => {}).finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = async (values: SettingsFormValues) => {
    setApiError(null)
    setSaved(false)
    try {
      await api.put('/system-settings', {
        mailingEnabled: values.mailingEnabled,
        mailRedirectAddress: values.mailRedirectAddress || null,
      })
      // defaultValues bijwerken naar de zojuist opgeslagen waarden, zodat een
      // latere Annuleren (reset zonder argumenten) hierop terugvalt.
      reset(values)
      setIsEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(msg ?? 'Opslaan mislukt.')
    }
  }

  const handleCancel = () => {
    // Terug naar de laatst geladen/opgeslagen waarden zonder API-call.
    reset()
    setApiError(null)
    setIsEditing(false)
  }

  const watched = watch()

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <Mail size={14} className="text-slate-400" />
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">E-mail</h2>
        {!loading && !isEditing && (
          <div className="ml-auto flex items-center gap-3">
            {saved && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={13} /> Opgeslagen
              </span>
            )}
            <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
              <Pencil size={14} /> Wijzigen
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-6 text-center text-xs text-slate-400">Laden…</div>
      ) : !isEditing ? (
        <div className="p-5 space-y-4">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">E-mail versturen</div>
            {watched.mailingEnabled ? (
              <div className="text-sm text-slate-800 dark:text-slate-100">Aan</div>
            ) : (
              <div className="flex items-center gap-1.5 text-sm font-medium text-red-600 dark:text-red-400">
                <AlertTriangle size={13} /> Uit <span className="text-xs font-normal text-red-500 dark:text-red-400">(alle mail wordt overgeslagen!)</span>
              </div>
            )}
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Alle mail omleiden naar</div>
            <div className="text-sm text-slate-800 dark:text-slate-100">
              {watched.mailRedirectAddress || <span className="text-slate-400 dark:text-slate-500">—</span>}
            </div>
            {watched.mailRedirectAddress && (
              <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-lg px-3 py-2 inline-block">
                Testmodus: alle mail gaat naar dit adres.
              </p>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <Controller
              name="mailingEnabled"
              control={control}
              render={({ field }) => (
                <button
                  type="button"
                  role="switch"
                  aria-checked={field.value}
                  onClick={() => field.onChange(!field.value)}
                  className="flex items-center gap-2"
                >
                  <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                    field.value ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                  }`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      field.value ? 'translate-x-4' : 'translate-x-0.5'
                    }`} />
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">E-mail versturen</span>
                </button>
              )}
            />
            {!watch('mailingEnabled') && (
              <p className="mt-2 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg px-3 py-2 flex items-start gap-1.5">
                <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                Let op: ook uitnodigingen, wachtwoord-resets en facturen worden dan niet verstuurd.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Alle mail omleiden naar (leeg = normale verzending)
            </label>
            <input
              {...register('mailRedirectAddress')}
              type="text"
              placeholder="test@voorbeeld.nl"
              className={inputField}
            />
            {errors.mailRedirectAddress && (
              <p className="mt-1 text-xs text-red-600">{errors.mailRedirectAddress.message}</p>
            )}
          </div>

          {apiError && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{apiError}</p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Opslaan…' : 'Opslaan'}
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={handleCancel} disabled={isSubmitting}>
              Annuleren
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

export function SystemSettingsView() {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <MailCard />
      </div>
    </div>
  )
}
