import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/axios'
import type { LoginResponse } from '@/types/auth'
import { MfaChallenge } from '@/components/auth/MfaChallenge'
import logo from '@/assets/RokaFlow_icon_dark_transparent.png'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --rfi-bg:        #0f172a;
    --rfi-text:      #eef0f6;
    --rfi-muted:     rgba(238,240,246,0.38);
    --rfi-accent:    #2563eb;
    --rfi-accent-lt: #60a5fa;
    --rfi-line:      rgba(238,240,246,0.11);
    --rfi-field-bg:  rgba(238,240,246,0.05);
    --rfi-field-bd:  rgba(238,240,246,0.10);
  }

  .rfi-wrap {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--rfi-bg);
    font-family: 'DM Sans', system-ui, sans-serif;
    color: var(--rfi-text);
    padding: 40px 20px;
    position: relative;
    overflow: hidden;
  }

  /* Subtle glow behind card */
  .rfi-wrap::before {
    content: '';
    position: fixed;
    top: 35%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 520px;
    height: 420px;
    background: radial-gradient(ellipse at center, rgba(37,99,235,0.13) 0%, transparent 70%);
    pointer-events: none;
  }

  .rfi-logo {
    height: 56px;
    object-fit: contain;
    opacity: 0.75;
    margin-bottom: 32px;
    animation: rfiFade 0.5s ease both;
  }

  .rfi-card {
    width: 100%;
    max-width: 400px;
    background: rgba(30,41,59,0.85);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    padding: 36px 32px;
    backdrop-filter: blur(20px);
    box-shadow: 0 24px 56px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05);
    animation: rfiSlide 0.5s cubic-bezier(0.16,1,0.3,1) 0.05s both;
    position: relative;
    z-index: 1;
  }

  .rfi-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--rfi-accent-lt);
    background: rgba(37,99,235,0.12);
    border: 1px solid rgba(37,99,235,0.22);
    border-radius: 6px;
    padding: 5px 10px;
    margin-bottom: 18px;
  }

  .rfi-heading {
    font-family: 'Syne', sans-serif;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.015em;
    color: var(--rfi-text);
    margin-bottom: 6px;
  }

  .rfi-sub {
    font-size: 13px;
    color: var(--rfi-muted);
    margin-bottom: 28px;
    line-height: 1.55;
  }

  .rfi-divider {
    height: 1px;
    background: var(--rfi-line);
    margin: 20px 0;
  }

  .rfi-field { margin-bottom: 16px; }

  .rfi-label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--rfi-muted);
    margin-bottom: 7px;
  }

  .rfi-input-wrap { position: relative; }

  .rfi-input {
    width: 100%;
    padding: 11px 14px;
    background: var(--rfi-field-bg);
    border: 1px solid var(--rfi-field-bd);
    border-radius: 8px;
    color: var(--rfi-text);
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  }
  .rfi-input.has-eye { padding-right: 40px; }
  .rfi-input::placeholder { color: rgba(238,240,246,0.20); }
  .rfi-input:focus {
    border-color: rgba(37,99,235,0.6);
    background: rgba(37,99,235,0.05);
    box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
  }
  .rfi-input.rfi-err {
    border-color: rgba(239,68,68,0.45);
    background: rgba(239,68,68,0.04);
  }

  .rfi-eye {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: rgba(238,240,246,0.3);
    display: flex;
    align-items: center;
    padding: 4px;
    transition: color 0.2s;
  }
  .rfi-eye:hover { color: rgba(238,240,246,0.65); }

  .rfi-err-msg {
    margin-top: 5px;
    font-size: 12px;
    color: #f87171;
    font-weight: 500;
  }

  .rfi-api-err {
    padding: 10px 13px;
    border-radius: 8px;
    border: 1px solid rgba(239,68,68,0.18);
    background: rgba(239,68,68,0.07);
    font-size: 13px;
    color: #fca5a5;
    margin-bottom: 18px;
  }

  .rfi-submit {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 24px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: var(--rfi-text);
    background: transparent;
    border: 1px solid rgba(37,99,235,0.45);
    border-radius: 8px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: border-color 0.35s, box-shadow 0.35s, opacity 0.2s;
    margin-top: 8px;
  }
  .rfi-submit::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(37,99,235,0.28) 0%, rgba(37,99,235,0.12) 100%);
    opacity: 0;
    transition: opacity 0.35s;
  }
  .rfi-submit:hover:not(:disabled)::before { opacity: 1; }
  .rfi-submit:hover:not(:disabled) {
    border-color: rgba(37,99,235,0.75);
    box-shadow: 0 0 0 3px rgba(37,99,235,0.12), 0 8px 24px rgba(37,99,235,0.2);
  }
  .rfi-submit:disabled { opacity: 0.5; cursor: not-allowed; }
  .rfi-submit span { position: relative; z-index: 1; }

  .rfi-spin {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.2);
    border-top-color: white;
    border-radius: 50%;
    animation: rfiSpin 0.7s linear infinite;
    position: relative; z-index: 1;
  }

  .rfi-success {
    text-align: center;
    padding: 8px 0;
  }
  .rfi-success-icon {
    width: 52px; height: 52px;
    background: rgba(16,185,129,0.12);
    border: 1px solid rgba(16,185,129,0.25);
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px;
    font-size: 24px;
  }
  .rfi-success h3 {
    font-family: 'Syne', sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: var(--rfi-text);
    margin-bottom: 8px;
  }
  .rfi-success p {
    font-size: 13px;
    color: var(--rfi-muted);
  }

  .rfi-invalid {
    text-align: center;
    padding: 8px 0;
  }
  .rfi-invalid-icon {
    width: 52px; height: 52px;
    background: rgba(239,68,68,0.10);
    border: 1px solid rgba(239,68,68,0.22);
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px;
    font-size: 24px;
  }
  .rfi-invalid h3 {
    font-family: 'Syne', sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: var(--rfi-text);
    margin-bottom: 8px;
  }
  .rfi-invalid p {
    font-size: 13px;
    color: var(--rfi-muted);
    margin-bottom: 20px;
  }
  .rfi-login-link {
    font-size: 13px;
    color: var(--rfi-accent-lt);
    text-decoration: none;
    font-weight: 600;
    transition: color 0.2s;
  }
  .rfi-login-link:hover { color: white; }

  .rfi-hint {
    font-size: 11px;
    color: var(--rfi-muted);
    margin-top: 5px;
  }

  .rfi-footer {
    margin-top: 24px;
    font-size: 12px;
    color: rgba(238,240,246,0.2);
    text-align: center;
    z-index: 1;
    position: relative;
  }

  @keyframes rfiFade  { from { opacity: 0 } to { opacity: 0.75 } }
  @keyframes rfiSlide { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes rfiSpin  { to { transform: rotate(360deg) } }
`

const schema = z.object({
  password: z.string().min(8, 'Minimaal 8 tekens'),
  confirmPassword: z.string().min(1, 'Bevestig je wachtwoord'),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Wachtwoorden komen niet overeen',
  path: ['confirmPassword'],
})
type FormValues = z.infer<typeof schema>

interface InviteInfo {
  firstName: string
  lastName: string
  email: string
}

export default function InvitePage() {
  const [searchParams]          = useSearchParams()
  const token                   = searchParams.get('token') ?? ''
  const navigate                = useNavigate()
  const login                   = useAuthStore(s => s.login)

  const [info, setInfo]         = useState<InviteInfo | null>(null)
  const [checking, setChecking] = useState(true)
  const [invalid, setInvalid]   = useState(false)
  const [showPw, setShowPw]     = useState(false)
  const [showCpw, setShowCpw]   = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [done, setDone]         = useState(false)
  const [mfaChallenge, setMfaChallenge] = useState<{ token: string; setupRequired: boolean } | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = CSS
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  useEffect(() => {
    if (!token) { setInvalid(true); setChecking(false); return }
    api.get<InviteInfo>(`/auth/invite/${token}`)
      .then(r => setInfo(r.data))
      .catch(() => setInvalid(true))
      .finally(() => setChecking(false))
  }, [token])

  const finishInvite = (session: LoginResponse) => {
    login(session.accessToken!, session.refreshToken ?? '', session.user!, true)
    setDone(true)
    setTimeout(() => navigate('/client', { replace: true }), 1800)
  }

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      const { data } = await api.post<LoginResponse>('/auth/accept-invite', {
        token,
        password: values.password,
        confirmPassword: values.confirmPassword,
      })

      if (data.mfaRequired && data.mfaChallengeToken) {
        setMfaChallenge({ token: data.mfaChallengeToken, setupRequired: !!data.mfaSetupRequired })
        return
      }

      finishInvite(data)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(msg ?? 'Er is iets misgegaan. Probeer het opnieuw.')
    }
  }

  return (
    <div className="rfi-wrap">
      <img src={logo} alt="RokaFlow" className="rfi-logo" />

      <div className="rfi-card">
        {checking ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div className="rfi-spin" style={{ margin: '0 auto 14px' }} />
            <p style={{ fontSize: 13, color: 'rgba(238,240,246,0.4)' }}>Uitnodiging controleren…</p>
          </div>
        ) : invalid ? (
          <div className="rfi-invalid">
            <div className="rfi-invalid-icon">⚠️</div>
            <h3>Link ongeldig of verlopen</h3>
            <p>Deze uitnodigingslink is niet meer geldig.<br />Vraag een beheerder om een nieuwe uitnodiging te sturen.</p>
            <a href="/login" className="rfi-login-link">Terug naar inloggen →</a>
          </div>
        ) : done ? (
          <div className="rfi-success">
            <div className="rfi-success-icon">✓</div>
            <h3>Wachtwoord ingesteld!</h3>
            <p>Je wordt doorgestuurd naar je portaal…</p>
          </div>
        ) : mfaChallenge ? (
          <>
            <div className="rfi-badge">✉ Uitnodiging</div>
            <h1 className="rfi-heading">Beveilig je account</h1>
            <p className="rfi-sub">Stel tweestapsverificatie in om verder te gaan.</p>
            <MfaChallenge
              challengeToken={mfaChallenge.token}
              setupRequired={mfaChallenge.setupRequired}
              onDone={finishInvite}
            />
          </>
        ) : (
          <>
            <div className="rfi-badge">✉ Uitnodiging</div>
            <h1 className="rfi-heading">Welkom, {info?.firstName}!</h1>
            <p className="rfi-sub">
              Stel een wachtwoord in voor <strong style={{ color: 'rgba(238,240,246,0.7)' }}>{info?.email}</strong> om toegang te krijgen tot je portaal.
            </p>

            <form onSubmit={handleSubmit(onSubmit)}>
              {apiError && <div className="rfi-api-err">{apiError}</div>}

              <div className="rfi-field">
                <label className="rfi-label">Wachtwoord</label>
                <div className="rfi-input-wrap">
                  <input
                    {...register('password')}
                    type={showPw ? 'text' : 'password'}
                    className={`rfi-input has-eye${errors.password ? ' rfi-err' : ''}`}
                    placeholder="Minimaal 8 tekens"
                    autoFocus
                  />
                  <button type="button" className="rfi-eye" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && <p className="rfi-err-msg">{errors.password.message}</p>}
              </div>

              <div className="rfi-field">
                <label className="rfi-label">Wachtwoord bevestigen</label>
                <div className="rfi-input-wrap">
                  <input
                    {...register('confirmPassword')}
                    type={showCpw ? 'text' : 'password'}
                    className={`rfi-input has-eye${errors.confirmPassword ? ' rfi-err' : ''}`}
                    placeholder="Herhaal wachtwoord"
                  />
                  <button type="button" className="rfi-eye" onClick={() => setShowCpw(v => !v)} tabIndex={-1}>
                    {showCpw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="rfi-err-msg">{errors.confirmPassword.message}</p>}
              </div>

              <button type="submit" className="rfi-submit" disabled={isSubmitting}>
                {isSubmitting
                  ? <><div className="rfi-spin" /><span>Opslaan…</span></>
                  : <span>Wachtwoord instellen en inloggen →</span>
                }
              </button>
            </form>
          </>
        )}
      </div>

      <p className="rfi-footer">© {new Date().getFullYear()} RokaFlow</p>
    </div>
  )
}
