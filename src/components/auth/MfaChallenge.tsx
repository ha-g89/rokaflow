import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import api from '@/lib/axios'
import type { LoginResponse, MfaConfirmResponse, MfaSetupResponse } from '@/types/auth'

interface Props {
  challengeToken: string
  setupRequired: boolean
  onDone: (session: LoginResponse) => void
}

export function MfaChallenge({ challengeToken, setupRequired, onDone }: Props) {
  const [otpAuthUri, setOtpAuthUri] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null)
  const [pendingSession, setPendingSession] = useState<LoginResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const setupCalled = useRef(false)

  useEffect(() => {
    if (!setupRequired || setupCalled.current) return
    setupCalled.current = true
    api.post<MfaSetupResponse>('/auth/mfa/setup', { challengeToken })
      .then(async res => {
        setOtpAuthUri(res.data.otpAuthUri)
        setQrDataUrl(await QRCode.toDataURL(res.data.otpAuthUri))
      })
      .catch(() => setError('Kon de MFA-instelling niet starten.'))
  }, [setupRequired, challengeToken])

  const submitCode = async () => {
    setLoading(true); setError(null)
    try {
      if (setupRequired) {
        const { data } = await api.post<MfaConfirmResponse>('/auth/mfa/confirm', { challengeToken, code })
        setBackupCodes(data.backupCodes)
        setPendingSession(data.session)
      } else {
        const { data } = await api.post<LoginResponse>('/auth/mfa/verify', { challengeToken, code })
        onDone(data)
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg ?? 'Ongeldige code.')
    } finally {
      setLoading(false)
    }
  }

  if (backupCodes && pendingSession) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm font-semibold text-slate-800">Bewaar deze backup-codes</p>
        <p className="text-xs text-slate-500">
          Elke code is eenmalig bruikbaar als u geen toegang heeft tot uw authenticator-app.
          Dit is de enige keer dat ze worden getoond.
        </p>
        <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-slate-50 rounded-lg p-3">
          {backupCodes.map(c => <span key={c}>{c}</span>)}
        </div>
        <button
          className="mt-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          onClick={() => onDone(pendingSession)}
        >
          Ik heb ze bewaard, doorgaan →
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {setupRequired && (
        <>
          <p className="text-sm font-semibold text-slate-800">Scan deze QR-code met uw authenticator-app</p>
          {qrDataUrl && <img src={qrDataUrl} alt="MFA QR-code" className="w-40 h-40 self-center" />}
          {otpAuthUri && (
            <p className="text-[11px] text-slate-400 break-all">Handmatig geheim: {otpAuthUri.match(/secret=([^&]+)/)?.[1]}</p>
          )}
        </>
      )}
      <label className="text-sm text-slate-700">
        {setupRequired ? 'Voer de eerste code in ter bevestiging' : 'Voer uw 6-cijferige code in (of een backup-code)'}
      </label>
      <input
        value={code}
        onChange={e => setCode(e.target.value)}
        placeholder="123456"
        className="px-3 py-2 rounded-lg border border-slate-300 text-center tracking-widest text-lg"
        maxLength={setupRequired ? 6 : 12}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        disabled={loading || !code}
        onClick={submitCode}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        Bevestigen
      </button>
    </div>
  )
}
