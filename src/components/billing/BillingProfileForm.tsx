import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react'
import api from '@/lib/axios'
import { Button } from '@/components/ui/Button'
import { BillingInterval, type BillingProfile } from '@/types/billing'

// Datum-only strings ("2026-07-01" of "...T00:00:00") component-gebaseerd parsen:
// `new Date('YYYY-MM-DD')` interpreteert als UTC-middernacht, waardoor de weergave
// op machines met negatieve UTC-offset een dag verschuift.
function parseDateOnly(iso: string) {
  const [y, m, d] = iso.split('T')[0].split('-').map(Number)
  return new Date(y, m - 1, d)
}

function fmtDate(iso: string) {
  return parseDateOnly(iso).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const inputField =
  'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25 transition-colors'

const profileSchema = z.object({
  interval: z.string(),
  invoiceEmail: z.string().email('Ongeldig e-mailadres').or(z.literal('')),
  companyName: z.string(),
  addressLine: z.string(),
  postalCode: z.string(),
  city: z.string(),
  country: z.string(),
  vatNumber: z.string(),
  kvkNumber: z.string(),
  iban: z.string().max(34, 'Maximaal 34 tekens').optional().or(z.literal('')),
})
type ProfileFormValues = z.infer<typeof profileSchema>

const TEXT_FIELDS: { key: keyof Omit<ProfileFormValues, 'interval'>; label: string; type?: string; placeholder?: string }[] = [
  { key: 'invoiceEmail', label: 'Factuur-e-mailadres', type: 'email' },
  { key: 'companyName',  label: 'Bedrijfsnaam' },
  { key: 'addressLine',  label: 'Adres' },
  { key: 'postalCode',   label: 'Postcode' },
  { key: 'city',         label: 'Plaats' },
  { key: 'country',      label: 'Land' },
  { key: 'vatNumber',    label: 'BTW-nummer' },
  { key: 'kvkNumber',    label: 'KvK-nummer' },
  { key: 'iban',         label: 'IBAN', placeholder: 'NL00 BANK 0123 4567 89' },
]

const emptyValues: ProfileFormValues = {
  interval: String(BillingInterval.Monthly),
  invoiceEmail: '', companyName: '', addressLine: '', postalCode: '',
  city: '', country: '', vatNumber: '', kvkNumber: '', iban: '',
}

export function BillingProfileForm({ baseUrl, mode = 'full' }: { baseUrl: string; mode?: 'full' | 'company' }) {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [saved, setSaved] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [savedInterval, setSavedInterval] = useState<number>(BillingInterval.Monthly)
  const [savedYearAnchorDate, setSavedYearAnchorDate] = useState<string | null>(null)

  const {
    register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({ resolver: zodResolver(profileSchema), defaultValues: emptyValues })

  // Haalt het profiel op en zet zowel de form-waarden als de saved-state.
  // Ook na PUT gebruikt: de server antwoordt 204 NoContent (geen body), dus de
  // actuele waarden — o.a. de server-berekende yearAnchorDate bij een switch
  // naar Jaarlijks — moeten opnieuw opgehaald worden.
  const fetchProfile = useCallback(async () => {
    const { data } = await api.get<BillingProfile>(`${baseUrl}/profile`)
    reset({
      interval: String(data.interval),
      invoiceEmail: data.invoiceEmail ?? '',
      companyName: data.companyName ?? '',
      addressLine: data.addressLine ?? '',
      postalCode: data.postalCode ?? '',
      city: data.city ?? '',
      country: data.country ?? '',
      vatNumber: data.vatNumber ?? '',
      kvkNumber: data.kvkNumber ?? '',
      iban: data.iban ?? '',
    })
    setSavedInterval(data.interval)
    setSavedYearAnchorDate(data.yearAnchorDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl])

  const loadProfile = useCallback(() => {
    setLoading(true)
    setLoadError(false)
    fetchProfile()
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }, [fetchProfile])

  useEffect(() => { loadProfile() }, [loadProfile])

  const watchedInterval = Number(watch('interval'))
  const watchedEmail = watch('invoiceEmail')

  const onSubmit = async (values: ProfileFormValues) => {
    setApiError(null)
    setSaved(false)
    try {
      await api.put(`${baseUrl}/profile`, {
        interval: Number(values.interval),
        invoiceEmail: values.invoiceEmail || null,
        companyName: values.companyName || null,
        addressLine: values.addressLine || null,
        postalCode: values.postalCode || null,
        city: values.city || null,
        country: values.country || null,
        vatNumber: values.vatNumber || null,
        kvkNumber: values.kvkNumber || null,
        iban: values.iban || null,
      })
      // PUT geeft 204 NoContent terug: profiel opnieuw ophalen voor de
      // actuele saved-state (interval + yearAnchorDate).
      try {
        await fetchProfile()
      } catch {
        // Opslaan zelf is gelukt; alleen het verversen faalde.
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(msg ?? 'Opslaan mislukt.')
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 text-center text-xs text-slate-400">
        Laden…
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center gap-3 text-center">
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/40 flex items-center gap-1.5">
          <AlertTriangle size={12} className="flex-shrink-0" /> Factuurgegevens konden niet worden geladen.
        </p>
        <Button size="sm" variant="secondary" onClick={loadProfile}>
          <RefreshCw size={13} /> Opnieuw proberen
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {mode === 'full' && !watchedEmail && (
        <div className="px-5 py-3 border-b border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/20 flex items-center gap-2">
          <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-800 dark:text-amber-300">
            Zonder factuur-e-mailadres kunnen facturen niet verzonden worden.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
        {/* Frequentie — bij MSP-beheerde tenants forceert de backend altijd
            Maandelijks; de selector wordt dan niet getoond, maar het
            geladen interval blijft ongewijzigd meegestuurd via de hidden input. */}
        {mode === 'full' ? (
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Frequentie</label>
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              {[
                { value: BillingInterval.Monthly, label: 'Maandelijks' },
                { value: BillingInterval.Yearly, label: 'Jaarlijks (met korting)' },
              ].map((opt, idx) => {
                const active = watchedInterval === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setValue('interval', String(opt.value), { shouldDirty: true })}
                    className={`px-3.5 py-2 text-xs font-semibold transition-colors ${idx > 0 ? 'border-l border-slate-200 dark:border-slate-700' : ''} ${
                      active
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
            <input type="hidden" {...register('interval')} />

            {watchedInterval === BillingInterval.Yearly && savedInterval !== BillingInterval.Yearly && (
              <p className="mt-2 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-lg px-3 py-2">
                De eerste jaarfactuur wordt vooruit aangemaakt vanaf vandaag.
              </p>
            )}
            {watchedInterval === BillingInterval.Yearly && savedInterval === BillingInterval.Yearly && savedYearAnchorDate && (
              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                Jaarperiode loopt vanaf {fmtDate(savedYearAnchorDate)}
              </p>
            )}
          </div>
        ) : (
          <input type="hidden" {...register('interval')} />
        )}

        {/* Overige velden — in 'company'-modus blijft het factuur-e-mailadres
            geregistreerd (verzonden zoals geladen) maar wordt het niet getoond,
            omdat facturatie via de MSP verloopt. */}
        <div className="grid grid-cols-2 gap-4">
          {TEXT_FIELDS.filter(f => mode === 'full' || f.key !== 'invoiceEmail').map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{f.label}</label>
              <input {...register(f.key)} type={f.type ?? 'text'} placeholder={f.placeholder} className={inputField} />
              {errors[f.key] && <p className="mt-1 text-xs text-red-600">{errors[f.key]?.message}</p>}
            </div>
          ))}
          {mode === 'company' && <input type="hidden" {...register('invoiceEmail')} />}
        </div>

        {apiError && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/40">
            {apiError}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Opslaan…' : 'Opslaan'}
          </Button>
          {saved && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={13} /> Opgeslagen
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
