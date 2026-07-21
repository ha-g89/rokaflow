import { Fragment, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Send, Download, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, Settings, Play, Pencil,
} from 'lucide-react'
import api from '@/lib/axios'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useSort, SortHeader } from '@/components/ui/SortHeader'
import { FilterSelect } from '@/components/ui/FilterSelect'
import {
  InvoiceStatus, InvoiceKind, INVOICE_STATUS_LABEL,
  type InvoiceListItem, type InvoiceDetail, type BillingConfig,
} from '@/types/billing'

const currency = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' })

const DATE_FMT: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }

// Datum-only strings ("2026-07-01" of "...T00:00:00") component-gebaseerd parsen:
// `new Date('YYYY-MM-DD')` interpreteert als UTC-middernacht, waardoor de weergave
// op machines met negatieve UTC-offset een dag verschuift.
function parseDateOnly(iso: string) {
  const [y, m, d] = iso.split('T')[0].split('-').map(Number)
  return new Date(y, m - 1, d)
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return parseDateOnly(iso).toLocaleDateString('nl-NL', DATE_FMT)
}

// Voor echte timestamps (sentAt): wél via Date parsen zodat de tijdzone-offset
// van de timestamp zelf meetelt in de lokale datumweergave.
function fmtTimestampDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('nl-NL', DATE_FMT)
}

function fmtDateMinusOneDay(iso: string) {
  const d = parseDateOnly(iso)
  d.setDate(d.getDate() - 1)
  return d.toLocaleDateString('nl-NL', DATE_FMT)
}

const KIND_LABEL: Record<InvoiceKind, string> = {
  [InvoiceKind.Regular]: 'Regulier',
  [InvoiceKind.ProRataSettlement]: 'Verrekening',
}

const STATUS_BADGE: Record<InvoiceStatus, string> = {
  [InvoiceStatus.Sent]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  [InvoiceStatus.Reminded]: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  [InvoiceStatus.Overdue]: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  [InvoiceStatus.Paid]: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  [InvoiceStatus.Cancelled]: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
}

const inputField =
  'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25 transition-colors'

const sortAccessors = {
  invoiceNumber: (i: InvoiceListItem) => i.invoiceNumber,
  billedToName: (i: InvoiceListItem) => i.billedToName,
  periodStart: (i: InvoiceListItem) => i.periodStart,
  kind: (i: InvoiceListItem) => KIND_LABEL[i.kind],
  total: (i: InvoiceListItem) => i.total,
  status: (i: InvoiceListItem) => i.status,
  sentAt: (i: InvoiceListItem) => i.sentAt,
}

// ── Test-PDF modal (dev only) ───────────────────────────────────────────────

const testPdfSchema = z.object({
  email: z.string().email('Ongeldig e-mailadres'),
})
type TestPdfFormValues = z.infer<typeof testPdfSchema>

function TestPdfModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const {
    register, handleSubmit, reset, formState: { errors, isSubmitting },
  } = useForm<TestPdfFormValues>({ resolver: zodResolver(testPdfSchema) })

  const handleClose = () => {
    reset()
    setSentTo(null)
    setApiError(null)
    onClose()
  }

  const onSubmit = async (values: TestPdfFormValues) => {
    setApiError(null)
    try {
      await api.post('/billing/test-invoice', { email: values.email })
      setSentTo(values.email)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(msg ?? 'Versturen mislukt.')
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Test-PDF versturen">
      {sentTo ? (
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 size={24} className="text-emerald-500" />
          </div>
          <p className="text-sm text-slate-700">Test-PDF verstuurd naar {sentTo}.</p>
          <Button className="w-full" onClick={handleClose}>Sluiten</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Stuurt een voorbeeldfactuur (dummy data) naar het opgegeven e-mailadres, zodat de lay-out
            beoordeeld kan worden zonder een echte facturatierun.
          </p>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">E-mailadres *</label>
            <input {...register('email')} type="email" className={inputField} placeholder="naam@voorbeeld.nl" autoFocus />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>
          {apiError && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{apiError}</p>
          )}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>Annuleren</Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Versturen…' : 'Versturen'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}

// ── Facturatierun modal (dev only) ──────────────────────────────────────────

function RunBillingModal({
  open, onClose, onRun,
}: {
  open: boolean
  onClose: () => void
  onRun: () => void
}) {
  const [date, setDate] = useState('')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  const handleClose = () => {
    if (running) return
    setDate('')
    setResult(null)
    setApiError(null)
    onClose()
  }

  const handleRun = async () => {
    setRunning(true)
    setApiError(null)
    try {
      const { data } = await api.post('/billing/run', undefined, { params: date ? { today: date } : {} })
      setResult(data.message)
      onRun()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(msg ?? 'Facturatierun mislukt.')
    } finally { setRunning(false) }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Facturatierun uitvoeren">
      {result ? (
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 size={24} className="text-emerald-500" />
          </div>
          <p className="text-sm text-slate-700">{result}</p>
          <Button className="w-full" onClick={handleClose}>Sluiten</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Draait de volledige facturatieketen (metering, generatie, verzending, herinneringen) direct uit,
            zonder te wachten op de dagelijkse job.
          </p>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Gesimuleerde datum (optioneel)</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className={inputField}
            />
            <p className="mt-1 text-xs text-slate-400">
              Laat leeg voor vandaag. Kies de 1e van de volgende maand om een maandfactuur over de huidige maand te forceren.
            </p>
          </div>
          {apiError && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{apiError}</p>
          )}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={handleClose} disabled={running}>
              Annuleren
            </Button>
            <Button type="button" className="flex-1" onClick={handleRun} disabled={running}>
              {running ? 'Bezig…' : 'Uitvoeren'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ── Mark-paid confirm modal ─────────────────────────────────────────────────

function MarkPaidModal({
  invoice, onClose, onConfirmed,
}: {
  invoice: InvoiceListItem | null
  onClose: () => void
  onConfirmed: (id: string) => void
}) {
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const handleClose = () => {
    setApiError(null)
    onClose()
  }

  const handleConfirm = async () => {
    if (!invoice) return
    setSaving(true)
    setApiError(null)
    try {
      await api.put(`/billing/invoices/${invoice.id}/mark-paid`)
      onConfirmed(invoice.id)
      handleClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(msg ?? 'Markeren als betaald mislukt.')
    } finally { setSaving(false) }
  }

  return (
    <Modal open={!!invoice} onClose={() => !saving && handleClose()} title="Betaald markeren">
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 size={22} className="text-emerald-500" />
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          Weet je zeker dat factuur <span className="font-semibold">{invoice?.invoiceNumber}</span> betaald is?
          Eventueel geblokkeerde omgevingen worden weer geactiveerd.
        </p>
      </div>
      {apiError && (
        <p className="mt-4 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{apiError}</p>
      )}
      <div className="flex gap-2 mt-6">
        <Button variant="secondary" className="flex-1" onClick={handleClose} disabled={saving}>
          Annuleren
        </Button>
        <Button
          className="flex-1 !bg-emerald-600 hover:!bg-emerald-700"
          onClick={handleConfirm}
          disabled={saving}
        >
          <CheckCircle2 size={13} /> {saving ? 'Bezig…' : 'Ja, markeer als betaald'}
        </Button>
      </div>
    </Modal>
  )
}

// ── Invoice detail (expanded row) ───────────────────────────────────────────

function InvoiceDetailPanel({ detail, loading }: { detail: InvoiceDetail | null; loading: boolean }) {
  if (loading) {
    return <div className="py-4 text-center text-xs text-slate-400">Laden…</div>
  }
  if (!detail) {
    return <div className="py-4 text-center text-xs text-red-500">Details konden niet worden geladen.</div>
  }
  return (
    <div className="py-3">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-slate-400 dark:text-slate-500">
            <th className="text-left font-medium pb-1.5">Omschrijving</th>
            <th className="text-left font-medium pb-1.5">Plan</th>
            <th className="text-center font-medium pb-1.5">Dagen</th>
            <th className="text-right font-medium pb-1.5">Stukprijs</th>
            <th className="text-right font-medium pb-1.5">Bedrag</th>
          </tr>
        </thead>
        <tbody>
          {detail.lines.map((line, idx) => (
            <tr key={`${line.tenantId}-${idx}`} className="border-t border-slate-100 dark:border-slate-800">
              <td className="py-1.5 text-slate-700 dark:text-slate-300">{line.description}</td>
              <td className="py-1.5 text-slate-500 dark:text-slate-400">{line.planName}</td>
              <td className="py-1.5 text-center text-slate-500 dark:text-slate-400">{line.days}</td>
              <td className="py-1.5 text-right text-slate-500 dark:text-slate-400">{currency.format(line.unitPrice)}</td>
              <td className="py-1.5 text-right text-slate-700 dark:text-slate-300 font-medium">{currency.format(line.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 ml-auto w-56 space-y-1 text-xs">
        <div className="flex justify-between text-slate-500 dark:text-slate-400">
          <span>Subtotaal</span><span>{currency.format(detail.subTotal)}</span>
        </div>
        {detail.discountAmount > 0 && (
          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <span>Korting ({detail.discountPct}%)</span><span>-{currency.format(detail.discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-slate-500 dark:text-slate-400">
          <span>BTW ({detail.vatPct}%)</span><span>{currency.format(detail.vatAmount)}</span>
        </div>
        <div className="flex justify-between font-semibold text-slate-800 dark:text-slate-100 pt-1 border-t border-slate-200 dark:border-slate-700">
          <span>Totaal</span><span>{currency.format(detail.total)}</span>
        </div>
      </div>
    </div>
  )
}

// ── Instellingen (billing config) card ──────────────────────────────────────

const configSchema = z.object({
  vatPct: z.string().min(1, 'Verplicht'),
  yearlyDiscountPct: z.string().min(1, 'Verplicht'),
  dueDays: z.string().min(1, 'Verplicht'),
  reminderToGraceDays: z.string().min(1, 'Verplicht'),
  graceToBlockedDays: z.string().min(1, 'Verplicht'),
  onboardingExpiryDays: z.string().min(1, 'Verplicht'),
  mspBaseFee: z.string().min(1, 'Verplicht'),
  mspPerClientRate: z.string().min(1, 'Verplicht'),
})
type ConfigFormValues = z.infer<typeof configSchema>

// Alleen vatPct/mspBaseFee/mspPerClientRate zijn server-side decimalen; de overige velden zijn integers.
const CONFIG_FIELDS: { key: keyof ConfigFormValues; label: string; suffix: string; step: string }[] = [
  { key: 'vatPct', label: 'BTW-percentage', suffix: '%', step: '0.01' },
  { key: 'yearlyDiscountPct', label: 'Jaarkorting', suffix: '%', step: '1' },
  { key: 'dueDays', label: 'Betaaltermijn', suffix: 'dagen', step: '1' },
  { key: 'reminderToGraceDays', label: 'Herinnering → beperkt', suffix: 'dagen', step: '1' },
  { key: 'graceToBlockedDays', label: 'Beperkt → geblokkeerd', suffix: 'dagen', step: '1' },
  { key: 'onboardingExpiryDays', label: 'Uitnodiging verloopt na', suffix: 'dagen', step: '1' },
  { key: 'mspBaseFee', label: 'MSP-abonnement (basis)', suffix: '€/maand', step: '0.01' },
  { key: 'mspPerClientRate', label: 'MSP-tarief per klant', suffix: '€/klant', step: '0.01' },
]

function BillingConfigCard() {
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  // View/edit-toggle: na het laden start de kaart in view-mode (samenvatting);
  // "Wijzigen" schakelt om naar het bewerkbare formulier.
  const [isEditing, setIsEditing] = useState(false)
  const {
    register, handleSubmit, reset, watch, formState: { errors, isSubmitting },
  } = useForm<ConfigFormValues>({ resolver: zodResolver(configSchema) })

  useEffect(() => {
    api.get<BillingConfig>('/billing/config').then(({ data }) => {
      reset({
        vatPct: String(data.vatPct),
        yearlyDiscountPct: String(data.yearlyDiscountPct),
        dueDays: String(data.dueDays),
        reminderToGraceDays: String(data.reminderToGraceDays),
        graceToBlockedDays: String(data.graceToBlockedDays),
        onboardingExpiryDays: String(data.onboardingExpiryDays),
        mspBaseFee: String(data.mspBaseFee),
        mspPerClientRate: String(data.mspPerClientRate),
      })
    }).catch(() => {}).finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = async (values: ConfigFormValues) => {
    setApiError(null)
    setSaved(false)
    try {
      await api.put<BillingConfig>('/billing/config', {
        vatPct: Number(values.vatPct),
        yearlyDiscountPct: Math.round(Number(values.yearlyDiscountPct)),
        dueDays: Math.round(Number(values.dueDays)),
        reminderToGraceDays: Math.round(Number(values.reminderToGraceDays)),
        graceToBlockedDays: Math.round(Number(values.graceToBlockedDays)),
        onboardingExpiryDays: Math.round(Number(values.onboardingExpiryDays)),
        mspBaseFee: Number(values.mspBaseFee),
        mspPerClientRate: Number(values.mspPerClientRate),
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

  const watchedValues = watch()

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <Settings size={14} className="text-slate-400" />
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Facturatie-instellingen</h2>
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
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          {CONFIG_FIELDS.map(f => (
            <div key={f.key}>
              <div className="text-xs text-slate-500 dark:text-slate-400">{f.label}</div>
              <div className="text-sm text-slate-800 dark:text-slate-100">
                {watchedValues[f.key]
                  ? `${watchedValues[f.key]}${f.suffix === '%' ? '%' : ` ${f.suffix}`}`
                  : <span className="text-slate-400 dark:text-slate-500">—</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {CONFIG_FIELDS.map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{f.label}</label>
                <div className="relative">
                  <input
                    {...register(f.key)}
                    type="number"
                    step={f.step}
                    className={inputField}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">{f.suffix}</span>
                </div>
                {errors[f.key] && <p className="mt-1 text-xs text-red-600">{errors[f.key]?.message}</p>}
              </div>
            ))}
          </div>
          {apiError && (
            <p className="mt-4 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{apiError}</p>
          )}
          <div className="flex items-center gap-3 mt-5">
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

// ── Main view ────────────────────────────────────────────────────────────────

const currentYear = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
  .map(y => ({ value: String(y), label: String(y) }))
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(2000, i, 1).toLocaleDateString('nl-NL', { month: 'long' }).replace(/^./, c => c.toUpperCase()),
}))

export function InvoicesView() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('')

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailCache, setDetailCache] = useState<Record<string, InvoiceDetail>>({})
  const [detailLoading, setDetailLoading] = useState(false)

  const [confirmPayInvoice, setConfirmPayInvoice] = useState<InvoiceListItem | null>(null)
  const [showTestPdf, setShowTestPdf] = useState(false)
  const [showRunBilling, setShowRunBilling] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)

  const { sorted, sortKey, sortDir, toggleSort } = useSort(invoices, sortAccessors)

  const fetchInvoices = () => {
    setLoading(true)
    api.get<InvoiceListItem[]>('/billing/invoices', {
      params: { year: year || undefined, month: month || undefined },
    })
      .then(({ data }) => setInvoices(data))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false))
  }

  useEffect(fetchInvoices, [year, month])

  const toggleExpand = async (inv: InvoiceListItem) => {
    if (expandedId === inv.id) { setExpandedId(null); return }
    setExpandedId(inv.id)
    if (!detailCache[inv.id]) {
      setDetailLoading(true)
      try {
        const { data } = await api.get<InvoiceDetail>(`/billing/invoices/${inv.id}`)
        setDetailCache(prev => ({ ...prev, [inv.id]: data }))
      } catch { /* handled globally */ } finally { setDetailLoading(false) }
    }
  }

  const handleDownloadPdf = async (inv: InvoiceListItem) => {
    setPdfError(null)
    try {
      const res = await api.get(`/billing/invoices/${inv.id}/pdf`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `${inv.invoiceNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      setPdfError(`PDF van factuur ${inv.invoiceNumber} kon niet worden gedownload.`)
      setTimeout(() => setPdfError(null), 5000)
    }
  }

  const handleMarkedPaid = (id: string) => {
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: InvoiceStatus.Paid, paidAt: new Date().toISOString() } : i))
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <FilterSelect label="Jaar" value={year} options={YEAR_OPTIONS} onChange={setYear} />
          <FilterSelect label="Maand" value={month} options={MONTH_OPTIONS} onChange={setMonth} />
          {import.meta.env.DEV && (
            <>
              <button
                onClick={() => setShowRunBilling(true)}
                className="ml-auto flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 hover:border-blue-300 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                title="Alleen zichtbaar in development"
              >
                <Play size={12} /> Facturatierun uitvoeren
              </button>
              <button
                onClick={() => setShowTestPdf(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 hover:border-blue-300 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                title="Alleen zichtbaar in development"
              >
                <Send size={12} /> Verstuur test-PDF
              </button>
            </>
          )}
        </div>

        {pdfError && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/40">
            {pdfError}
          </p>
        )}

        {/* Invoice table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-4 py-2"><SortHeader label="Factuurnr" sortKey="invoiceNumber" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} /></th>
                <th className="px-4 py-2"><SortHeader label="Partij" sortKey="billedToName" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} /></th>
                <th className="px-4 py-2"><SortHeader label="Periode" sortKey="periodStart" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} /></th>
                <th className="px-4 py-2"><SortHeader label="Soort" sortKey="kind" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} /></th>
                <th className="px-4 py-2 text-right"><SortHeader label="Totaal" sortKey="total" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} className="justify-end" /></th>
                <th className="px-4 py-2"><SortHeader label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} /></th>
                <th className="px-4 py-2"><SortHeader label="Verzonden" sortKey="sentAt" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} /></th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-400">Laden…</td></tr>
              ) : sorted.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-400">Nog geen facturen.</td></tr>
              ) : (
                sorted.map(inv => {
                  const notSent = inv.sentAt === null && inv.status === InvoiceStatus.Sent
                  const canMarkPaid = inv.status !== InvoiceStatus.Paid && inv.status !== InvoiceStatus.Cancelled
                  const expanded = expandedId === inv.id
                  return (
                    <Fragment key={inv.id}>
                      <tr className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{inv.billedToName}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {fmtDate(inv.periodStart)} t/m {fmtDateMinusOneDay(inv.periodEnd)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{KIND_LABEL[inv.kind]}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-slate-900 dark:text-slate-100">{currency.format(inv.total)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-start gap-1">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[inv.status]}`}>
                              {INVOICE_STATUS_LABEL[inv.status]}
                            </span>
                            {notSent && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                                <AlertTriangle size={10} /> Niet verzonden — profiel onvolledig
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{fmtTimestampDate(inv.sentAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {inv.sentAt !== null && (
                              <button
                                onClick={() => handleDownloadPdf(inv)}
                                title="PDF downloaden"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              >
                                <Download size={13} />
                              </button>
                            )}
                            <button
                              onClick={() => toggleExpand(inv)}
                              title="Details"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>
                            {canMarkPaid && (
                              <button
                                onClick={() => setConfirmPayInvoice(inv)}
                                title="Markeer als betaald"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                              >
                                <CheckCircle2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="bg-slate-50/60 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                          <td colSpan={8} className="px-6">
                            <InvoiceDetailPanel detail={detailCache[inv.id] ?? null} loading={detailLoading && !detailCache[inv.id]} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Settings */}
        <BillingConfigCard />
      </div>

      <TestPdfModal open={showTestPdf} onClose={() => setShowTestPdf(false)} />
      <RunBillingModal open={showRunBilling} onClose={() => setShowRunBilling(false)} onRun={fetchInvoices} />
      <MarkPaidModal
        invoice={confirmPayInvoice}
        onClose={() => setConfirmPayInvoice(null)}
        onConfirmed={handleMarkedPaid}
      />
    </div>
  )
}
