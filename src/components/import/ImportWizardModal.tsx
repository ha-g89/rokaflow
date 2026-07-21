import { useRef, useState } from 'react'
import { Upload, Download, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import api from '@/lib/axios'
import type { ImportResult } from '@/types/import'

interface ImportRowBase {
  rowNumber: number
  isValid: boolean
  errors: string[]
}

interface ImportPreviewBase<TRow> {
  fileErrors: string[]
  totalRows: number
  validRowCount: number
  planLimitExceeded: boolean
  planLimitMessage: string | null
  rows: TRow[]
}

interface ImportColumn<TRow> {
  key: keyof TRow
  label: string
}

interface ImportWizardModalProps<TRow extends ImportRowBase, TPreview extends ImportPreviewBase<TRow>> {
  open: boolean
  title: string
  templateUrl: string
  templateFileName: string
  validateUrl: string
  confirmUrl: string
  columns: ImportColumn<TRow>[]
  onClose: () => void
  onDone: () => void
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Ja' : 'Nee'
  return String(value)
}

const STEP_LABELS = ['Type & upload', 'Preview', 'Klaar']

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex gap-1.5 mb-4">
      {STEP_LABELS.map((label, i) => (
        <div
          key={label}
          className={`flex-1 text-center text-[11px] font-medium py-1.5 rounded-lg ${
            step === i + 1
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
          }`}
        >
          {i + 1}. {label}
        </div>
      ))}
    </div>
  )
}

export function ImportWizardModal<TRow extends ImportRowBase, TPreview extends ImportPreviewBase<TRow>>({
  open, title, templateUrl, templateFileName, validateUrl, confirmUrl, columns, onClose, onDone,
}: ImportWizardModalProps<TRow, TPreview>) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<TPreview | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setStep(1); setFile(null); setPreview(null); setResult(null); setError(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleDownloadTemplate = async () => {
    const res = await api.get(templateUrl, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = templateFileName
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleValidate = async () => {
    if (!file) return
    setLoading(true); setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post<TPreview>(validateUrl, form, {
        headers: { 'Content-Type': undefined },
      })
      setPreview(data)
      setStep(2)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg ?? 'Valideren van het bestand is mislukt.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!preview) return
    setLoading(true); setError(null)
    try {
      const validRows = preview.rows.filter(r => r.isValid)
      const { data } = await api.post<ImportResult>(confirmUrl, validRows)
      setResult(data)
      setStep(3)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg ?? 'Bevestigen van de import is mislukt.')
    } finally {
      setLoading(false)
    }
  }

  const validCount = preview?.rows.filter(r => r.isValid).length ?? 0
  const invalidCount = (preview?.rows.length ?? 0) - validCount

  return (
    <Modal open={open} onClose={handleClose} title={title} className="max-w-3xl">
      <StepIndicator step={step} />

      {error && (
        <div className="mb-4 text-xs text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 self-start"
          >
            <Download size={13} /> Download template
          </button>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 p-8 flex flex-col items-center gap-2 cursor-pointer hover:border-blue-400 transition-colors"
          >
            <Upload size={22} className="text-slate-400" />
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {file ? file.name : 'Klik om een CSV- of Excel-bestand te uploaden'}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <Button onClick={handleValidate} disabled={!file || loading} className="self-end">
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            Volgende: valideren →
          </Button>
        </div>
      )}

      {step === 2 && preview && (
        <div className="flex flex-col gap-4">
          {preview.fileErrors.length > 0 ? (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-lg px-4 py-3">
              {preview.fileErrors.map(e => <p key={e}>{e}</p>)}
            </div>
          ) : (
            <>
              {preview.planLimitExceeded && (
                <div className="text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 rounded-lg px-3 py-2">
                  {preview.planLimitMessage}
                </div>
              )}
              <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-500">#</th>
                      {columns.map(col => (
                        <th key={String(col.key)} className="px-3 py-2 text-left font-semibold text-slate-500">{col.label}</th>
                      ))}
                      <th className="px-3 py-2 text-left font-semibold text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {preview.rows.map(row => (
                      <tr key={row.rowNumber} className={row.isValid ? '' : 'bg-red-50/60 dark:bg-red-950/20'}>
                        <td className="px-3 py-2 text-slate-400">{row.rowNumber}</td>
                        {columns.map(col => (
                          <td key={String(col.key)} className="px-3 py-2 text-slate-700 dark:text-slate-300">
                            {formatCell(row[col.key])}
                          </td>
                        ))}
                        <td className="px-3 py-2">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 size={13} /> OK</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-600" title={row.errors.join(' ')}>
                              <XCircle size={13} /> {row.errors[0]}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="flex justify-between items-center">
            <Button variant="secondary" onClick={() => setStep(1)}>← Terug</Button>
            <Button
              onClick={handleConfirm}
              disabled={loading || preview.fileErrors.length > 0 || preview.planLimitExceeded || validCount === 0}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              Bevestig import ({validCount} geldig{invalidCount > 0 ? `, ${invalidCount} overgeslagen` : ''})
            </Button>
          </div>
        </div>
      )}

      {step === 3 && result && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle2 size={20} className="text-emerald-500" />
            <span>
              <strong>{result.createdCount}</strong> aangemaakt
              {result.skippedCount > 0 && <>, <strong>{result.skippedCount}</strong> overgeslagen</>}
            </span>
          </div>
          {result.errors.length > 0 && (
            <div className="text-xs text-slate-500 dark:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
              {result.errors.map(e => (
                <p key={e.rowNumber} className="px-3 py-2">Rij {e.rowNumber}: {e.message}</p>
              ))}
            </div>
          )}
          <Button onClick={() => { reset(); onDone() }} className="self-end">Sluiten</Button>
        </div>
      )}
    </Modal>
  )
}
