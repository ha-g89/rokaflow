import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react'
import api from '@/lib/axios'
import logo from '@/assets/RokaFlow_icon_dark_transparent.png'

type State = 'loading' | 'confirm-approve' | 'confirm-reject' | 'success-approve' | 'success-reject' | 'error'

export default function TransferApprovePage() {
  const [params]   = useSearchParams()
  const navigate   = useNavigate()
  const token      = params.get('token') ?? ''
  const action     = params.get('action') as 'approve' | 'reject' | null

  const [state,   setState]   = useState<State>('loading')
  const [message, setMessage] = useState('')
  const [busy,    setBusy]    = useState(false)

  useEffect(() => {
    if (!token) { setState('error'); setMessage('Ongeldige link.'); return }
    setState(action === 'reject' ? 'confirm-reject' : 'confirm-approve')
  }, [token, action])

  async function handleApprove() {
    setBusy(true)
    try {
      await api.post(`/msp-transfers/approve?token=${token}`)
      setState('success-approve')
    } catch (e: any) {
      setState('error')
      setMessage(e?.response?.data?.detail ?? 'Er is een fout opgetreden.')
    } finally { setBusy(false) }
  }

  async function handleReject() {
    setBusy(true)
    try {
      await api.post(`/msp-transfers/reject?token=${token}`)
      setState('success-reject')
    } catch (e: any) {
      setState('error')
      setMessage(e?.response?.data?.detail ?? 'Er is een fout opgetreden.')
    } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 flex flex-col items-center text-center gap-6">
        <img src={logo} alt="RokaFlow" className="h-10 opacity-80" />

        {state === 'loading' && (
          <Loader2 size={36} className="animate-spin text-blue-500" />
        )}

        {(state === 'confirm-approve' || state === 'confirm-reject') && (
          <>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
              state === 'confirm-approve' ? 'bg-blue-50' : 'bg-red-50'
            }`}>
              {state === 'confirm-approve'
                ? <CheckCircle2 size={28} className="text-blue-500" />
                : <XCircle size={28} className="text-red-500" />
              }
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 mb-1">
                {state === 'confirm-approve' ? 'Overdracht goedkeuren' : 'Overdracht afwijzen'}
              </h1>
              <p className="text-sm text-slate-500">
                {state === 'confirm-approve'
                  ? 'Door te bevestigen geeft u toestemming voor de MSP-overdracht. De nieuwe MSP krijgt direct toegang tot uw omgeving.'
                  : 'Het overdrachtverzoek wordt afgewezen. Uw huidige MSP-koppeling blijft ongewijzigd.'
                }
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => navigate('/')}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={state === 'confirm-approve' ? handleApprove : handleReject}
                disabled={busy}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2 ${
                  state === 'confirm-approve'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-red-500 hover:bg-red-600'
                } disabled:opacity-50`}
              >
                {busy && <Loader2 size={14} className="animate-spin" />}
                {state === 'confirm-approve' ? 'Ja, goedkeuren' : 'Ja, afwijzen'}
              </button>
            </div>
          </>
        )}

        {state === 'success-approve' && (
          <>
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-emerald-500" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 mb-1">Overdracht goedgekeurd</h1>
              <p className="text-sm text-slate-500">De nieuwe MSP heeft nu toegang tot uw omgeving. Beide partijen ontvangen een bevestiging per e-mail.</p>
            </div>
          </>
        )}

        {state === 'success-reject' && (
          <>
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
              <XCircle size={28} className="text-slate-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 mb-1">Verzoek afgewezen</h1>
              <p className="text-sm text-slate-500">Het overdrachtverzoek is afgewezen. Uw MSP-koppeling blijft ongewijzigd.</p>
            </div>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle size={28} className="text-red-500" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 mb-1">Fout</h1>
              <p className="text-sm text-slate-500">{message || 'Deze link is ongeldig of verlopen.'}</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 rounded-lg bg-slate-100 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Naar homepagina
            </button>
          </>
        )}
      </div>
    </div>
  )
}
