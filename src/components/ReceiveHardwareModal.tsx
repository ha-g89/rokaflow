import { useState } from 'react'
import { PackageCheck } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import api from '@/lib/axios'
import type { HardwareAssetListItem } from '@/types/hardware'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  asset: HardwareAssetListItem
}

export function ReceiveHardwareModal({ open, onClose, onSuccess, asset }: Props) {
  const [serialNumber, setSerialNumber] = useState('')
  const [saving, setSaving]             = useState(false)
  const [apiError, setApiError]         = useState<string | null>(null)

  const handleClose = () => { setSerialNumber(''); setApiError(null); onClose() }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setApiError(null)
    try {
      await api.put(`/portal/hardware/${asset.id}/receive`, { serialNumber })
      setSerialNumber('')
      onSuccess()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(msg ?? 'Ontvangst registreren mislukt.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Hardware ontvangen" className="max-w-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col items-center text-center gap-3 py-1">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
            <PackageCheck size={22} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{asset.brand} {asset.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">Vul het serienummer in om de ontvangst te bevestigen.</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Serienummer *</label>
          <input
            value={serialNumber}
            onChange={e => setSerialNumber(e.target.value)}
            required
            autoFocus
            placeholder="SN1234567"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25 transition-colors"
          />
        </div>

        {apiError && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{apiError}</p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>
            Annuleren
          </Button>
          <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={!serialNumber.trim() || saving}>
            {saving ? 'Bezig…' : 'Ontvangst bevestigen'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
