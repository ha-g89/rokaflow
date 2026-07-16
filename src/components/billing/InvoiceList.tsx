import { useEffect, useState } from 'react'
import { Download, AlertTriangle } from 'lucide-react'
import api from '@/lib/axios'
import { useSort, SortHeader } from '@/components/ui/SortHeader'
import {
  InvoiceKind, INVOICE_STATUS_LABEL, type InvoiceListItem, type InvoiceStatus,
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

function fmtDate(iso: string) {
  return parseDateOnly(iso).toLocaleDateString('nl-NL', DATE_FMT)
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
  0: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  1: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  2: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  3: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  4: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
}

const sortAccessors = {
  invoiceNumber: (i: InvoiceListItem) => i.invoiceNumber,
  periodStart: (i: InvoiceListItem) => i.periodStart,
  kind: (i: InvoiceListItem) => KIND_LABEL[i.kind],
  total: (i: InvoiceListItem) => i.total,
  status: (i: InvoiceListItem) => i.status,
}

export function InvoiceList({ baseUrl }: { baseUrl: string }) {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pdfError, setPdfError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    api.get<InvoiceListItem[]>(`${baseUrl}/invoices`)
      .then(({ data }) => setInvoices(data))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false))
  }, [baseUrl])

  const { sorted, sortKey, sortDir, toggleSort } = useSort(invoices, sortAccessors)

  const handleDownloadPdf = async (inv: InvoiceListItem) => {
    setPdfError(null)
    try {
      const res = await api.get(`${baseUrl}/invoices/${inv.id}/pdf`, { responseType: 'blob' })
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

  return (
    <div className="space-y-3">
      {pdfError && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/40 flex items-center gap-1.5">
          <AlertTriangle size={12} className="flex-shrink-0" /> {pdfError}
        </p>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              <th className="px-4 py-2"><SortHeader label="Factuurnr" sortKey="invoiceNumber" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} /></th>
              <th className="px-4 py-2"><SortHeader label="Periode" sortKey="periodStart" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} /></th>
              <th className="px-4 py-2"><SortHeader label="Soort" sortKey="kind" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} /></th>
              <th className="px-4 py-2 text-right"><SortHeader label="Totaal" sortKey="total" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} className="justify-end" /></th>
              <th className="px-4 py-2"><SortHeader label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} /></th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">Laden…</td></tr>
            ) : sorted.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">Nog geen facturen.</td></tr>
            ) : (
              sorted.map(inv => (
                <tr key={inv.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {fmtDate(inv.periodStart)} t/m {fmtDateMinusOneDay(inv.periodEnd)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{KIND_LABEL[inv.kind]}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-slate-900 dark:text-slate-100">{currency.format(inv.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[inv.status]}`}>
                      {INVOICE_STATUS_LABEL[inv.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      {inv.sentAt !== null && (
                        <button
                          onClick={() => handleDownloadPdf(inv)}
                          title="PDF downloaden"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          <Download size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
