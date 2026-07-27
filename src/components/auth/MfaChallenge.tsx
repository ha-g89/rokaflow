import { useEffect, useRef, useState, type ReactNode } from 'react'
import QRCode from 'qrcode'
import api from '@/lib/axios'
import type { LoginResponse, MfaSetupResponse } from '@/types/auth'

interface Props {
  challengeToken: string
  setupRequired: boolean
  onDone: (session: LoginResponse) => void
  renderSubmit?: (state: { onClick: () => void; disabled: boolean; loading: boolean }) => ReactNode
}

export function MfaChallenge({ challengeToken, setupRequired, onDone, renderSubmit }: Props) {
  const [otpAuthUri, setOtpAuthUri] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [code, setCode] = useState('')
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
      const endpoint = setupRequired ? '/auth/mfa/confirm' : '/auth/mfa/verify'
      const { data } = await api.post<LoginResponse>(endpoint, { challengeToken, code })
      onDone(data)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg ?? 'Ongeldige code.')
    } finally {
      setLoading(false)
    }
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
        {setupRequired ? 'Voer de eerste code in ter bevestiging' : 'Voer uw 6-cijferige code in'}
      </label>
      <input
        value={code}
        onChange={e => setCode(e.target.value)}
        placeholder="123456"
        className="px-3 py-2 rounded-lg border border-slate-300 text-center tracking-widest text-lg"
        maxLength={6}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {renderSubmit
        ? renderSubmit({ onClick: submitCode, disabled: loading || !code, loading })
        : (
          <button
            disabled={loading || !code}
            onClick={submitCode}
            className="w-full px-4 py-3.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Bevestigen
          </button>
        )}
    </div>
  )
}
