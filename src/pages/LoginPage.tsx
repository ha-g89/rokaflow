import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/axios'
import type { LoginResponse, UserRole } from '@/types/auth'
import logo from '@/assets/RokaFlow_icon_dark_transparent.png'

const schema = z.object({
  email:    z.string().email('Voer een geldig e-mailadres in'),
  password: z.string().min(1, 'Wachtwoord is verplicht'),
})
type FormValues = z.infer<typeof schema>

const ROLE_HOME: Record<UserRole, string> = {
  superuser:    '/superuser',
  msp_admin:    '/org',
  msp_member:   '/org',
  portal_admin: '/client',
  employee:     '/client',
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #030812;
    --bg-r:      #050c1a;
    --text:      #eef0f6;
    --muted:     rgba(238,240,246,0.38);
    --accent:    #2563eb;
    --accent-lt: #60a5fa;
    --line-md:   rgba(238,240,246,0.11);
    --field-bg:  rgba(238,240,246,0.05);
    --field-bd:  rgba(238,240,246,0.10);
  }

  /* ── Layout ── */
  .rfl-wrap {
    display: flex;
    height: 100vh;
    overflow: hidden;
    background: var(--bg);
    font-family: 'DM Sans', system-ui, sans-serif;
    color: var(--text);
  }

  /* ── Left panel ── */
  .rfl-left {
    width: 50%;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--line-md);
    position: relative;
  }

  .rfl-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 28px 48px;
    flex-shrink: 0;
    animation: rflFadeIn 0.5s ease both;
  }

  .rfl-logo-sm {
    height: 68px;
    object-fit: contain;
    opacity: 0.8;
    display: block;
  }

  .rfl-back {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.025em;
    color: var(--muted);
    background: none;
    border: none;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: color 0.2s;
    padding: 0;
  }
  .rfl-back:hover { color: var(--text); }
  .rfl-back .rfl-arr {
    display: inline-block;
    font-style: normal;
    transition: transform 0.2s;
  }
  .rfl-back:hover .rfl-arr { transform: translateX(-3px); }

  /* Centered card area */
  .rfl-form-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 48px 48px;
  }

  /* Card */
  .rfl-card {
    width: 100%;
    max-width: 360px;
    background: rgba(8,12,28,0.85);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    padding: 36px 32px;
    backdrop-filter: blur(20px);
    box-shadow: 0 24px 56px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05);
    animation: rflSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.05s both;
  }

  .rfl-heading {
    font-family: 'Syne', sans-serif;
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -0.015em;
    color: var(--text);
    margin-bottom: 4px;
  }

  .rfl-sub {
    font-size: 13px;
    color: var(--muted);
    margin-bottom: 28px;
  }

  /* Fields */
  .rfl-field { margin-bottom: 18px; }

  .rfl-label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 7px;
  }

  .rfl-input-wrap { position: relative; }

  .rfl-input {
    width: 100%;
    padding: 11px 14px;
    background: var(--field-bg);
    border: 1px solid var(--field-bd);
    border-radius: 8px;
    color: var(--text);
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
    -webkit-appearance: none;
  }
  .rfl-input::placeholder { color: rgba(238,240,246,0.20); }
  .rfl-input:focus {
    border-color: rgba(37,99,235,0.6);
    background: rgba(37,99,235,0.05);
    box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
  }
  .rfl-input.rfl-err {
    border-color: rgba(239,68,68,0.45);
    background: rgba(239,68,68,0.04);
  }
  .rfl-input.rfl-err:focus {
    border-color: rgba(239,68,68,0.65);
    box-shadow: 0 0 0 3px rgba(239,68,68,0.10);
  }

  .rfl-eye {
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
  .rfl-eye:hover { color: rgba(238,240,246,0.65); }

  .rfl-err-msg {
    margin-top: 5px;
    font-size: 12px;
    color: #f87171;
    font-weight: 500;
  }

  /* API error */
  .rfl-api-err {
    padding: 10px 13px;
    border-radius: 8px;
    border: 1px solid rgba(239,68,68,0.18);
    background: rgba(239,68,68,0.07);
    font-size: 13px;
    color: #fca5a5;
    margin-bottom: 18px;
  }

  /* Submit button */
  .rfl-submit {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 24px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--text);
    background: transparent;
    border: 1px solid rgba(37,99,235,0.45);
    border-radius: 8px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: border-color 0.35s, box-shadow 0.35s, opacity 0.2s;
    margin-top: 6px;
  }

  /* Sweep fill */
  .rfl-submit::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--accent);
    border-radius: 8px;
    transform: translateX(-105%);
    transition: transform 0.42s cubic-bezier(0.16,1,0.3,1);
    z-index: 0;
  }
  .rfl-submit:hover:not(:disabled)::before { transform: translateX(0); }

  /* Shimmer pass */
  .rfl-submit::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.13) 50%, transparent 70%);
    transform: translateX(-120%);
    z-index: 1;
  }
  .rfl-submit:hover:not(:disabled)::after {
    transform: translateX(120%);
    transition: transform 0.55s cubic-bezier(0.4,0,0.2,1) 0.34s;
  }

  .rfl-submit:hover:not(:disabled) {
    border-color: var(--accent);
    box-shadow: 0 0 20px rgba(37,99,235,0.38), 0 0 48px rgba(37,99,235,0.13);
  }
  .rfl-submit:disabled { opacity: 0.45; cursor: not-allowed; }

  .rfl-submit-inner {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .rfl-submit .rfl-btn-arr {
    font-style: normal;
    display: inline-block;
    opacity: 0;
    transform: translateX(-6px);
    transition: opacity 0.22s 0.12s, transform 0.3s cubic-bezier(0.16,1,0.3,1) 0.12s;
  }
  .rfl-submit:hover:not(:disabled) .rfl-btn-arr {
    opacity: 1;
    transform: translateX(0);
  }

  /* Spinner */
  @keyframes rflSpin { to { transform: rotate(360deg); } }
  .rfl-spin {
    width: 13px; height: 13px;
    border: 2px solid rgba(238,240,246,0.25);
    border-top-color: var(--text);
    border-radius: 50%;
    animation: rflSpin 0.7s linear infinite;
    flex-shrink: 0;
  }

  .rfl-footer {
    margin-top: 20px;
    text-align: center;
    font-size: 12px;
    color: var(--muted);
    opacity: 0.7;
  }
  .rfl-footer a {
    color: var(--accent-lt);
    text-decoration: none;
    font-weight: 600;
    transition: color 0.2s;
  }
  .rfl-footer a:hover { color: #c4b5fd; }

  /* ── Right panel ── */
  .rfl-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--bg-r);
    position: relative;
  }

  .rfl-emblem {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    animation: rflFadeIn 1.2s ease 0.2s both;
  }

  .rfl-emblem img {
    width: 280px;
    opacity: 0.20;
    filter: drop-shadow(0 0 48px rgba(139,92,246,0.30));
    animation: rflFloat 8s ease-in-out 1.4s infinite;
    display: block;
  }

  .rfl-brand {
    font-family: 'Syne', sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(238,240,246,0.20);
  }

  .rfl-tagline {
    font-size: 13px;
    color: rgba(238,240,246,0.22);
    letter-spacing: 0.01em;
    text-align: center;
    max-width: 240px;
    line-height: 1.65;
  }

  /* ── Post-login loading screen ── */
  .rfl-loading-wrap {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 24px;
    background: #030812;
    animation: rflFadeIn 0.25s ease both;
    font-family: 'DM Sans', system-ui, sans-serif;
  }

  .rfl-loading-logo {
    width: 80px;
    opacity: 0.7;
    animation: rflLoadPulse 1.8s ease-in-out infinite;
    display: block;
  }

  .rfl-loading-badge {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 5px 13px;
    border-radius: 20px;
    border: 1px solid rgba(238,240,246,0.08);
    background: rgba(238,240,246,0.04);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--load-accent, #7c3aed);
    animation: rflFadeIn 0.5s ease 0.15s both;
  }

  .rfl-loading-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--load-accent, #7c3aed);
    animation: rflDotPulse 1.4s ease-in-out infinite;
    flex-shrink: 0;
  }

  .rfl-loading-ring {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 2px solid rgba(238,240,246,0.07);
    border-top-color: var(--load-accent, #7c3aed);
    animation: rflSpin 0.75s linear infinite;
  }

  .rfl-loading-label {
    font-size: 12px;
    font-weight: 500;
    color: rgba(238,240,246,0.30);
    letter-spacing: 0.04em;
    margin-top: -4px;
  }

  @keyframes rflLoadPulse {
    0%, 100% { opacity: 0.7;  transform: scale(1);    }
    50%       { opacity: 0.9;  transform: scale(1.04); }
  }

  @keyframes rflDotPulse {
    0%, 100% { opacity: 0.35; }
    50%       { opacity: 1;   }
  }

  /* ── Keyframes ── */
  @keyframes rflSlideUp {
    from { opacity: 0; transform: translateY(16px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }
  @keyframes rflFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes rflFloat {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-14px); }
  }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .rfl-right  { display: none; }
    .rfl-left   { width: 100%; border-right: none; }
    .rfl-topbar { padding: 24px 24px; }
    .rfl-form-wrap { padding: 0 24px 40px; }
  }
`

function LoadingScreen({ role }: { role: UserRole }) {
  const isMsp   = role === 'msp_admin' || role === 'msp_member'
  const accent  = isMsp ? '#1d4ed8' : '#2563eb'
  const badge   = isMsp ? 'MSP Portaal' : 'Portaal'
  const label   = isMsp ? 'MSP-omgeving laden…' : 'Portaal laden…'

  return (
    <div
      className="rfl-loading-wrap"
      style={{ '--load-accent': accent } as React.CSSProperties}
    >
      <img src={logo} alt="" className="rfl-loading-logo" />
      <div className="rfl-loading-badge">
        {badge}
      </div>
      <div className="rfl-loading-ring" />
      <p className="rfl-loading-label">{label}</p>
    </div>
  )
}

export default function LoginPage() {
  const [apiError, setApiError]       = useState<string | null>(null)
  const [showPass, setShowPass]       = useState(false)
  const [loadingRole, setLoadingRole] = useState<UserRole | null>(null)
  const { login }  = useAuthStore()
  const navigate   = useNavigate()
  const location   = useLocation()

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      const { data } = await api.post<LoginResponse>('/auth/login', values)

      login(data.accessToken, data.refreshToken, data.user)

      const home = ROLE_HOME[data.user.role]
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname
      const dest = from?.startsWith(home) ? from : home

      setLoadingRole(data.user.role)
      setTimeout(() => navigate(dest, { replace: true }), 1400)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(msg ?? 'Ongeldig e-mailadres of wachtwoord.')
    }
  }

  if (loadingRole) {
    return (
      <>
        <style>{CSS}</style>
        <LoadingScreen role={loadingRole} />
      </>
    )
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="rfl-wrap">

        {/* ── Left: form ── */}
        <div className="rfl-left">
          <div className="rfl-topbar">
            <img src={logo} alt="RokaFlow" className="rfl-logo-sm" />
            <button className="rfl-back" onClick={() => navigate('/')}>
              <i className="rfl-arr">←</i> Terug
            </button>
          </div>

          <div className="rfl-form-wrap">
            <div className="rfl-card">
              <h1 className="rfl-heading">Inloggen</h1>
              <p className="rfl-sub">Log in op uw RokaFlow-account.</p>

              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                {apiError && <div className="rfl-api-err">{apiError}</div>}

                <div className="rfl-field">
                  <label className="rfl-label">E-mailadres</label>
                  <input
                    type="email"
                    autoComplete="email"
                    autoFocus
                    placeholder="u@organisatie.nl"
                    {...register('email')}
                    className={`rfl-input${errors.email ? ' rfl-err' : ''}`}
                  />
                  {errors.email && <p className="rfl-err-msg">{errors.email.message}</p>}
                </div>

                <div className="rfl-field">
                  <label className="rfl-label">Wachtwoord</label>
                  <div className="rfl-input-wrap">
                    <input
                      type={showPass ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      {...register('password')}
                      className={`rfl-input${errors.password ? ' rfl-err' : ''}`}
                      style={{ paddingRight: '42px' }}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="rfl-eye"
                      onClick={() => setShowPass(p => !p)}
                    >
                      {showPass ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && <p className="rfl-err-msg">{errors.password.message}</p>}
                </div>

                <button type="submit" disabled={isSubmitting} className="rfl-submit">
                  <span className="rfl-submit-inner">
                    {isSubmitting ? (
                      <><div className="rfl-spin" /> Bezig…</>
                    ) : (
                      <>Inloggen <i className="rfl-btn-arr">→</i></>
                    )}
                  </span>
                </button>

                <p className="rfl-footer">
                  Platform beheerder?{' '}
                  <a href="/superuser/login">Admin login →</a>
                </p>
              </form>
            </div>
          </div>
        </div>

        {/* ── Right: logo ── */}
        <div className="rfl-right">
          <div className="rfl-emblem">
            <img src={logo} alt="" aria-hidden="true" />
            <span className="rfl-brand">RokaFlow</span>
            <p className="rfl-tagline">
              IT-beheer van onboarding<br />tot offboarding.
            </p>
          </div>
        </div>

      </div>
    </>
  )
}
