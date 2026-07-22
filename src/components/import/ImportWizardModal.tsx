import { useRef, useState } from 'react'
import { Upload, Download, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import api from '@/lib/axios'
import type { ImportResult, ImportColumnsResult } from '@/types/import'

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
  columnsUrl: string
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

const STEP_LABELS = ['Type & upload', 'Kolommen koppelen', 'Preview', 'Klaar']

function StepIndicator({ step }: { step: 1 | 2 | 3 | 4 }) {
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
  open, title, templateUrl, templateFileName, columnsUrl, validateUrl, confirmUrl, columns, onClose, onDone,
}: ImportWizardModalProps<TRow, TPreview>) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [file, setFile] = useState<File | null>(null)
  const [columnsResult, setColumnsResult] = useState<ImportColumnsResult | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<TPreview | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setStep(1); setFile(null); setColumnsResult(null); setMapping({})
    setPreview(null); setResult(null); setError(null)
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

  const handleUploadNext = async () => {
    if (!file) return
    setLoading(true); setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post<ImportColumnsResult>(columnsUrl, form, {
        headers: { 'Content-Type': undefined },
      })
      setColumnsResult(data)
      const initialMapping: Record<string, string> = {}
      for (const [fieldKey, column] of Object.entries(data.suggestedMapping)) {
        if (column) initialMapping[fieldKey] = column
      }
      setMapping(initialMapping)
      setStep(2)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg ?? 'Inlezen van de kolommen is mislukt.')
    } finally {
      setLoading(false)
    }
  }

  const handleMappingNext = async () => {
    if (!file) return
    setLoading(true); setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('columnMapping', JSON.stringify(mapping))
      const { data } = await api.post<TPreview>(validateUrl, form, {
        headers: { 'Content-Type': undefined },
      })
      setPreview(data)
      setStep(3)
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
      setStep(4)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg ?? 'Bevestigen van de import is mislukt.')
    } finally {
      setLoading(false)
    }
  }

  const validCount = preview?.rows.filter(r => r.isValid).length ?? 0
  const invalidCount = (preview?.rows.length ?? 0) - validCount

  const missingRequiredFields = columnsResult?.fields.filter(f => f.required && !mapping[f.key]) ?? []
  const usedColumns = new Set(Object.values(mapping).filter(Boolean))

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

          <Button onClick={handleUploadNext} disabled={!file || loading} className="self-end">
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            Volgende: kolommen koppelen →
          </Button>
        </div>
      )}

      {step === 2 && columnsResult && (
        <div className="flex flex-col gap-4">
          {columnsResult.fileErrors.length > 0 ? (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-lg px-4 py-3">
              {columnsResult.fileErrors.map(e => <p key={e}>{e}</p>)}
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Koppel de kolommen uit uw bestand aan de bijbehorende velden. Velden met een <span className="text-red-500 font-medium">*</span> zijn verplicht.
              </p>
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 max-h-96 overflow-y-auto">
                {columnsResult.fields.map(fieldDef => (
                  <div key={fieldDef.key} className="flex items-center justify-between gap-4 px-4 py-2.5">
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {fieldDef.label}{fieldDef.required && <span className="text-red-500 font-medium"> *</span>}
                    </span>
                    <select
                      value={mapping[fieldDef.key] ?? ''}
                      onChange={e => setMapping(prev => {
                        const next = { ...prev }
                        if (e.target.value) next[fieldDef.key] = e.target.value
                        else delete next[fieldDef.key]
                        return next
                      })}
                      className="text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 px-2 py-1.5 min-w-[180px] focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25"
                    >
                      <option value="">— Niet koppelen —</option>
                      {columnsResult.fileColumns.map(col => (
                        <option
                          key={col}
                          value={col}
                          disabled={usedColumns.has(col) && mapping[fieldDef.key] !== col}
                        >
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex justify-between items-center">
            <Button variant="secondary" onClick={() => setStep(1)}>← Terug</Button>
            <Button
              onClick={handleMappingNext}
              disabled={loading || columnsResult.fileErrors.length > 0 || missingRequiredFields.length > 0}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              Volgende: valideren →
            </Button>
          </div>
        </div>
      )}

      {step === 3 && preview && (
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
            <Button variant="secondary" onClick={() => setStep(2)}>← Terug</Button>
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

      {step === 4 && result && (
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
