import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/axios'
import type { LoginResponse } from '@/types/auth'
import logo from '@/assets/RokaFlow_icon_dark_transparent.png'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --rpr-bg:        #ffffff;
    --rpr-text:      #0f172a;
    --rpr-text-2:    #334155;
    --rpr-muted:     #64748b;
    --rpr-accent:    #2563eb;
    --rpr-accent-dk: #1d4ed8;
    --rpr-line:      rgba(15,23,42,0.08);
    --rpr-field-bg:  #f8fafc;
    --rpr-field-bd:  rgba(15,23,42,0.10);
  }
  .rpr-wrap {
    min-height: 100vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    background: var(--rpr-bg);
    font-family: 'DM Sans', system-ui, sans-serif;
    color: var(--rpr-text); padding: 40px 20px;
  }
  .rpr-logo-wrap {
    width: 52px; height: 52px; position: relative;
    flex-shrink: 0; margin-bottom: 24px;
    animation: rprFloat 8s ease-in-out 1s infinite;
  }
  .rpr-logo-base { position: absolute; inset: 0; background: rgba(15,23,42,0.18); }
  .rpr-logo-sweep {
    position: absolute; inset: 0;
    background: linear-gradient(105deg, transparent 15%, rgba(37,99,235,0.55) 38%, rgba(96,165,250,0.95) 50%, rgba(37,99,235,0.55) 62%, transparent 85%);
    transform: translateX(-200%);
    animation: rprLogoSweep 4s cubic-bezier(0.4,0,0.2,1) 1.8s infinite;
  }
  @keyframes rprLogoSweep { 0% { transform: translateX(-200%); } 100% { transform: translateX(300%); } }
  @keyframes rprFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  .rpr-card {
    width: 100%; max-width: 400px;
    background: #ffffff; border: none;
    border-radius: 16px; padding: 36px 40px;
    box-shadow: 0 1px 3px rgba(15,23,42,0.05), 0 8px 24px rgba(15,23,42,0.08);
    animation: rprSlide 0.45s cubic-bezier(0.16,1,0.3,1) 0.05s both;
  }
  .rpr-badge {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--rpr-accent); background: #eff6ff;
    border: 1px solid #bfdbfe; border-radius: 6px; padding: 5px 10px; margin-bottom: 18px;
  }
  .rpr-heading {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 26px; font-weight: 800; letter-spacing: -0.02em;
    color: var(--rpr-text); margin-bottom: 6px;
  }
  .rpr-sub { font-size: 14px; color: var(--rpr-muted); margin-bottom: 24px; line-height: 1.55; }
  .rpr-email-hint { font-weight: 600; color: var(--rpr-text-2); }
  .rpr-field { margin-bottom: 18px; }
  .rpr-label { display: block; font-size: 12px; font-weight: 600; color: var(--rpr-text-2); margin-bottom: 7px; }
  .rpr-input-wrap { position: relative; }
  .rpr-input {
    width: 100%; padding: 11px 40px 11px 14px;
    background: var(--rpr-field-bg); border: 1.5px solid var(--rpr-field-bd);
    border-radius: 9px; color: var(--rpr-text); font-size: 14px;
    font-family: 'DM Sans', sans-serif; outline: none;
    transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
    -webkit-appearance: none;
  }
  .rpr-input::placeholder { color: rgba(15,23,42,0.28); }
  .rpr-input:focus { border-color: var(--rpr-accent); background: #ffffff; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
  .rpr-input.rpr-err { border-color: #ef4444; background: #fff5f5; }
  .rpr-eye {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: var(--rpr-muted);
    display: flex; align-items: center; padding: 4px; transition: color 0.16s;
  }
  .rpr-eye:hover { color: var(--rpr-text); }
  .rpr-err-msg { margin-top: 5px; font-size: 12px; color: #ef4444; font-weight: 500; }
  .rpr-api-err {
    padding: 10px 13px; border-radius: 9px;
    border: 1.5px solid #fecaca; background: #fef2f2;
    font-size: 13px; color: #dc2626; margin-bottom: 18px;
  }
  .rpr-submit {
    width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 12px 24px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600;
    color: #ffffff; background: var(--rpr-accent); border: none;
    border-radius: 9px; cursor: pointer;
    transition: background 0.18s, box-shadow 0.18s, transform 0.12s, opacity 0.2s;
    margin-top: 6px; box-shadow: 0 1px 2px rgba(37,99,235,0.20);
  }
  .rpr-submit:hover:not(:disabled) {
    background: var(--rpr-accent-dk);
    box-shadow: 0 6px 20px rgba(37,99,235,0.35);
    transform: translateY(-1px);
  }
  .rpr-submit:disabled { opacity: 0.5; cursor: not-allowed; }
  .rpr-spin {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.35); border-top-color: white;
    border-radius: 50%; animation: rprSpin 0.7s linear infinite;
  }
  .rpr-spin-blue {
    width: 20px; height: 20px;
    border: 2px solid rgba(37,99,235,0.15); border-top-color: var(--rpr-accent);
    border-radius: 50%; animation: rprSpin 0.7s linear infinite;
    margin: 0 auto;
  }
  .rpr-back-link { margin-top: 20px; text-align: center; font-size: 13px; color: var(--rpr-muted); }
  .rpr-back-link a { color: var(--rpr-accent); text-decoration: none; font-weight: 600; transition: color 0.16s; cursor: pointer; }
  .rpr-back-link a:hover { color: var(--rpr-accent-dk); }
  .rpr-invalid { text-align: center; padding: 8px 0; }
  .rpr-invalid-icon {
    width: 52px; height: 52px; background: #fef2f2; border: 1px solid #fecaca;
    border-radius: 14px; display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px; font-size: 24px;
  }
  .rpr-invalid h3 { font-family: 'Bricolage Grotesque', sans-serif; font-size: 20px; font-weight: 800; color: var(--rpr-text); margin-bottom: 8px; }
  .rpr-invalid p { font-size: 13px; color: var(--rpr-muted); margin-bottom: 20px; }
  .rpr-login-link { font-size: 13px; color: var(--rpr-accent); text-decoration: none; font-weight: 600; transition: color 0.16s; }
  .rpr-login-link:hover { color: var(--rpr-accent-dk); }
  .rpr-success { text-align: center; padding: 8px 0; }
  .rpr-success-icon {
    width: 52px; height: 52px; background: #f0fdf4; border: 1px solid #bbf7d0;
    border-radius: 14px; display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px; font-size: 24px;
  }
  .rpr-success h3 { font-family: 'Bricolage Grotesque', sans-serif; font-size: 20px; font-weight: 800; color: var(--rpr-text); margin-bottom: 8px; }
  .rpr-success p { font-size: 13px; color: var(--rpr-muted); }
  .rpr-footer { margin-top: 24px; font-size: 12px; color: rgba(15,23,42,0.25); text-align: center; }
  .rpr-checking { text-align: center; padding: 24px 0; }
  .rpr-checking p { font-size: 13px; color: var(--rpr-muted); margin-top: 14px; }
  @keyframes rprSlide { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes rprSpin  { to { transform: rotate(360deg); } }

  /* ── Dark mode ── */
  html.dark .rpr-wrap {
    --rpr-bg: #030812; --rpr-text: #eef0f6; --rpr-text-2: rgba(238,240,246,0.72);
    --rpr-muted: rgba(238,240,246,0.42); --rpr-accent-dk: #3b82f6;
    --rpr-line: rgba(238,240,246,0.07); --rpr-field-bg: rgba(238,240,246,0.05); --rpr-field-bd: rgba(238,240,246,0.10);
    background-color: #030812;
  }
  html.dark .rpr-card { background: rgba(8,12,28,0.95); border-color: rgba(238,240,246,0.07); box-shadow: 0 24px 56px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04); }
  html.dark .rpr-logo-base { background: rgba(238,240,246,0.25); }
  html.dark .rpr-badge { color: #60a5fa; background: rgba(37,99,235,0.12); border-color: rgba(37,99,235,0.25); }
  html.dark .rpr-wrap .rpr-input { background: var(--rpr-field-bg); border-color: var(--rpr-field-bd); color: var(--rpr-text); }
  html.dark .rpr-wrap .rpr-input::placeholder { color: rgba(238,240,246,0.22); }
  html.dark .rpr-wrap .rpr-input:focus { border-color: rgba(37,99,235,0.7); background: rgba(37,99,235,0.08); box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }
  html.dark .rpr-wrap .rpr-input.rpr-err { border-color: rgba(239,68,68,0.45); background: rgba(239,68,68,0.05); }
  html.dark .rpr-api-err { background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.2); color: #fca5a5; }
  html.dark .rpr-invalid-icon { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.22); }
  html.dark .rpr-success-icon { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.22); }
  html.dark .rpr-footer { color: rgba(238,240,246,0.18); }
`

const schema = z.object({
  password: z.string().min(8, 'Minimaal 8 tekens'),
  confirmPassword: z.string().min(1, 'Bevestig je wachtwoord'),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Wachtwoorden komen niet overeen',
  path: ['confirmPassword'],
})
type FormValues = z.infer<typeof schema>

interface ResetInfo { email: string }

export default function ResetPasswordPage() {
  const [searchParams]          = useSearchParams()
  const token                   = searchParams.get('token') ?? ''
  const navigate                = useNavigate()
  const login                   = useAuthStore(s => s.login)

  const [info, setInfo]         = useState<ResetInfo | null>(null)
  const [checking, setChecking] = useState(true)
  const [invalid, setInvalid]   = useState(false)
  const [showPw, setShowPw]     = useState(false)
  const [showCpw, setShowCpw]   = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [done, setDone]         = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!token) { setInvalid(true); setChecking(false); return }
    api.get<ResetInfo>(`/auth/reset-password/${token}`)
      .then(r => setInfo(r.data))
      .catch(() => setInvalid(true))
      .finally(() => setChecking(false))
  }, [token])

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      const { data } = await api.post<LoginResponse>('/auth/reset-password', {
        token,
        password: values.password,
        confirmPassword: values.confirmPassword,
      })
      login(data.accessToken, data.refreshToken ?? '', data.user)
      setDone(true)
      setTimeout(() => navigate('/client', { replace: true }), 1800)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(msg ?? 'Er is iets misgegaan. Probeer het opnieuw.')
    }
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="rpr-wrap">

        <div
          className="rpr-logo-wrap"
          style={{
            WebkitMaskImage: `url(${logo})`,
            maskImage: `url(${logo})`,
            WebkitMaskSize: 'contain', maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center', maskPosition: 'center',
          }}
        >
          <div className="rpr-logo-base" />
          <div className="rpr-logo-sweep" />
        </div>

        <div className="rpr-card">
          {checking ? (
            <div className="rpr-checking">
              <div className="rpr-spin-blue" />
              <p>Link controleren…</p>
            </div>
          ) : invalid ? (
            <div className="rpr-invalid">
              <div className="rpr-invalid-icon">⚠️</div>
              <h3>Link ongeldig of verlopen</h3>
              <p>Deze reset-link is niet meer geldig.<br />Vraag een nieuwe aan via de inlogpagina.</p>
              <a href="/forgot-password" className="rpr-login-link">Nieuw verzoek indienen →</a>
            </div>
          ) : done ? (
            <div className="rpr-success">
              <div className="rpr-success-icon">✓</div>
              <h3>Wachtwoord gewijzigd!</h3>
              <p>Je wordt doorgestuurd naar je portaal…</p>
            </div>
          ) : (
            <>
              <div className="rpr-badge">🔒 Wachtwoord instellen</div>
              <h1 className="rpr-heading">Nieuw wachtwoord</h1>
              <p className="rpr-sub">
                Kies een nieuw wachtwoord voor{' '}
                <span className="rpr-email-hint">{info?.email}</span>
              </p>

              <form onSubmit={handleSubmit(onSubmit)}>
                {apiError && <div className="rpr-api-err">{apiError}</div>}

                <div className="rpr-field">
                  <label className="rpr-label">Nieuw wachtwoord</label>
                  <div className="rpr-input-wrap">
                    <input
                      {...register('password')}
                      type={showPw ? 'text' : 'password'}
                      className={`rpr-input${errors.password ? ' rpr-err' : ''}`}
                      placeholder="Minimaal 8 tekens"
                      autoFocus
                    />
                    <button type="button" className="rpr-eye" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.password && <p className="rpr-err-msg">{errors.password.message}</p>}
                </div>

                <div className="rpr-field">
                  <label className="rpr-label">Wachtwoord bevestigen</label>
                  <div className="rpr-input-wrap">
                    <input
                      {...register('confirmPassword')}
                      type={showCpw ? 'text' : 'password'}
                      className={`rpr-input${errors.confirmPassword ? ' rpr-err' : ''}`}
                      placeholder="Herhaal wachtwoord"
                    />
                    <button type="button" className="rpr-eye" onClick={() => setShowCpw(v => !v)} tabIndex={-1}>
                      {showCpw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="rpr-err-msg">{errors.confirmPassword.message}</p>}
                </div>

                <button type="submit" className="rpr-submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? <><div className="rpr-spin" /><span>Opslaan…</span></>
                    : <span>Wachtwoord opslaan en inloggen →</span>
                  }
                </button>
              </form>
            </>
          )}
        </div>

        <div className="rpr-back-link">
          <a onClick={() => navigate('/login')}>← Terug naar inloggen</a>
        </div>

        <p className="rpr-footer">© {new Date().getFullYear()} RokaFlow</p>
      </div>
    </>
  )
}
