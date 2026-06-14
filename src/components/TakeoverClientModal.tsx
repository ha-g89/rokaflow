import { useState } from 'react'
import { Search, Building2, Loader2, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import api from '@/lib/axios'
import type { TenantTransferPreviewDto } from '@/types/mspTransfer'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

type Step = 'search' | 'preview' | 'confirm' | 'done'

export function TakeoverClientModal({ open, onClose, onSuccess }: Props) {
  const [step,     setStep]     = useState<Step>('search')
  const [code,     setCode]     = useState('')
  const [notes,    setNotes]    = useState('')
  const [preview,  setPreview]  = useState<TenantTransferPreviewDto | null>(null)
  const [error,    setError]    = useState('')
  const [busy,     setBusy]     = useState(false)

  function reset() {
    setStep('search'); setCode(''); setNotes('')
    setPreview(null); setError('')
  }

  function handleClose() { reset(); onClose() }

  async function handleLookup() {
    if (!code.trim()) return
    setBusy(true); setError('')
    try {
      const { data } = await api.get<TenantTransferPreviewDto>(
        `/msp-transfers/lookup?code=${encodeURIComponent(code.trim().toUpperCase())}`)
      setPreview(data)
      setStep('preview')
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Code niet gevonden.')
    } finally { setBusy(false) }
  }

  async function handleSubmit() {
    setBusy(true); setError('')
    try {
      await api.post('/msp-transfers', { transferCode: code.trim().toUpperCase(), notes: notes || null })
      setStep('done')
      onSuccess()
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Er is een fout opgetreden.')
    } finally { setBusy(false) }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Bestaande client overnemen">
      {step === 'search' && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-500">
            Voer de transfer-code in die de klant u heeft doorgegeven. De code staat in het klantportaal onder <strong>Instellingen → MSP</strong>.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Transfer-code
            </label>
            <input
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleLookup()}
              placeholder="XXXX-XXXX"
              maxLength={9}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
            {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="secondary" className="flex-1" onClick={handleClose}>Annuleren</Button>
            <Button className="flex-1" onClick={handleLookup} disabled={busy || code.length < 4}>
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
              Opzoeken
            </Button>
          </div>
        </div>
      )}

      {step === 'preview' && preview && (
        <div className="flex flex-col gap-4">
          <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Building2 size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">{preview.tenantName}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Huidige MSP: <span className="font-medium">{preview.currentMspName ?? 'Geen'}</span>
              </p>
            </div>
          </div>

          {preview.hasPendingRequest && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700">Er is al een openstaand overdrachtverzoek voor deze klant.</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Toelichting <span className="normal-case font-normal">(optioneel)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Bijv. contract getekend op 01-06-2026"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
            />
          </div>

          <p className="text-xs text-slate-400">
            De klant ontvangt een e-mail met een goedkeuringslink. De overdracht wordt pas uitgevoerd na goedkeuring.
          </p>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setStep('search')}>Terug</Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={busy || preview.hasPendingRequest}
            >
              {busy ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
              Verzoek indienen
            </Button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 size={24} className="text-emerald-500" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">Verzoek ingediend</p>
            <p className="text-xs text-slate-500 mt-1">
              De klant ontvangt direct een e-mail met een goedkeuringslink. U ziet het verzoek terug in uw overzicht.
            </p>
          </div>
          <Button className="w-full" onClick={handleClose}>Sluiten</Button>
        </div>
      )}
    </Modal>
  )
}
