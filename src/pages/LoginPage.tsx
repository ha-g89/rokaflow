import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/axios'
import type { LoginResponse, UserRole } from '@/types/auth'
import { MfaChallenge } from '@/components/auth/MfaChallenge'
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
  employee:     '/mijn-omgeving',
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #ffffff;
    --bg-alt:    #f8fafc;
    --bg-panel:  #f0f4ff;
    --text:      #0f172a;
    --text-2:    #334155;
    --muted:     #64748b;
    --accent:    #2563eb;
    --accent-dk: #1d4ed8;
    --line:      rgba(15,23,42,0.08);
    --line-md:   rgba(15,23,42,0.12);
    --field-bg:  #f8fafc;
    --field-bd:  rgba(15,23,42,0.10);
  }

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
    border-right: 1px solid var(--line);
    background: var(--bg-alt);
  }

  .rfl-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px 48px;
    flex-shrink: 0;
    animation: rflFadeIn 0.4s ease both;
  }

  .rfl-logo-sm {
    height: 52px;
    object-fit: contain;
    filter: brightness(0) opacity(0.82);
    display: block;
  }

  .rfl-back {
    font-size: 13px;
    font-weight: 500;
    color: var(--muted);
    background: none;
    border: none;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: color 0.16s;
    padding: 0;
  }
  .rfl-back:hover { color: var(--text); }
  .rfl-back .rfl-arr { font-style: normal; transition: transform 0.16s; }
  .rfl-back:hover .rfl-arr { transform: translateX(-3px); }

  .rfl-form-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 48px 48px;
  }

  .rfl-card {
    width: 100%;
    max-width: 380px;
    background: #ffffff;
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 36px 40px;
    box-shadow: 0 1px 3px rgba(15,23,42,0.05), 0 8px 24px rgba(15,23,42,0.06);
    animation: rflSlideUp 0.45s cubic-bezier(0.16,1,0.3,1) 0.05s both;
  }

  .rfl-heading {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 30px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--text);
    margin-bottom: 6px;
  }

  .rfl-sub {
    font-size: 14px;
    color: var(--muted);
    margin-bottom: 28px;
    line-height: 1.55;
  }

  /* ── Fields ── */
  .rfl-field { margin-bottom: 18px; }

  .rfl-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-2);
    margin-bottom: 7px;
  }

  .rfl-input-wrap { position: relative; }

  .rfl-input {
    width: 100%;
    padding: 11px 14px;
    background: var(--field-bg);
    border: 1.5px solid var(--field-bd);
    border-radius: 9px;
    color: var(--text);
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
    -webkit-appearance: none;
  }
  .rfl-input::placeholder { color: rgba(15,23,42,0.28); }
  .rfl-input:focus {
    border-color: var(--accent);
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
  }
  .rfl-input.rfl-err {
    border-color: #ef4444;
    background: #fff5f5;
  }
  .rfl-input.rfl-err:focus {
    border-color: #ef4444;
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
    color: var(--muted);
    display: flex;
    align-items: center;
    padding: 4px;
    transition: color 0.16s;
  }
  .rfl-eye:hover { color: var(--text); }

  .rfl-err-msg {
    margin-top: 5px;
    font-size: 12px;
    color: #ef4444;
    font-weight: 500;
  }

  .rfl-api-err {
    padding: 10px 13px;
    border-radius: 9px;
    border: 1.5px solid #fecaca;
    background: #fef2f2;
    font-size: 13px;
    color: #dc2626;
    margin-bottom: 18px;
  }

  /* ── Submit ── */
  .rfl-submit {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 24px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: #ffffff;
    background: var(--accent);
    border: none;
    border-radius: 9px;
    cursor: pointer;
    transition: background 0.18s, box-shadow 0.18s, transform 0.12s, opacity 0.2s;
    margin-top: 6px;
    box-shadow: 0 1px 2px rgba(37,99,235,0.20);
  }
  .rfl-submit:hover:not(:disabled) {
    background: var(--accent-dk);
    box-shadow: 0 6px 20px rgba(37,99,235,0.35);
    transform: translateY(-1px);
  }
  .rfl-submit:disabled { opacity: 0.5; cursor: not-allowed; }

  .rfl-submit-inner {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .rfl-submit .rfl-btn-arr {
    font-style: normal;
    transition: transform 0.16s;
  }
  .rfl-submit:hover:not(:disabled) .rfl-btn-arr { transform: translateX(3px); }

  @keyframes rflSpin { to { transform: rotate(360deg); } }
  .rfl-spin {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.35);
    border-top-color: white;
    border-radius: 50%;
    animation: rflSpin 0.7s linear infinite;
    flex-shrink: 0;
  }

  .rfl-remember {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--muted);
    margin-bottom: 18px;
    cursor: pointer;
  }

  .rfl-footer {
    margin-top: 20px;
    text-align: center;
    font-size: 13px;
    color: var(--muted);
  }
  .rfl-footer a {
    color: var(--accent);
    text-decoration: none;
    font-weight: 600;
    transition: color 0.16s;
  }
  .rfl-footer a:hover { color: var(--accent-dk); }

  /* ── Right panel ── */
  .rfl-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--bg-panel);
    position: relative;
  }

  .rfl-emblem {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    animation: rflFadeIn 0.8s ease 0.2s both;
  }

  /* ── Logo mask animation ── */
  .rfl-logo-wrap {
    width: 160px;
    height: 160px;
    position: relative;
    flex-shrink: 0;
    animation: rflFloat 8s ease-in-out 1s infinite;
  }
  .rfl-logo-base {
    position: absolute;
    inset: 0;
    background: rgba(15,23,42,0.18);
  }
  .rfl-logo-sweep {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      105deg,
      transparent 15%,
      rgba(37,99,235,0.55) 38%,
      rgba(96,165,250,0.95) 50%,
      rgba(37,99,235,0.55) 62%,
      transparent 85%
    );
    transform: translateX(-200%);
    animation: rflLogoSweep 4s cubic-bezier(0.4,0,0.2,1) 1.8s infinite;
  }
  @keyframes rflLogoSweep {
    0%   { transform: translateX(-200%); }
    100% { transform: translateX(300%); }
  }

  .rfl-brand {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(15,23,42,0.28);
  }

  .rfl-tagline {
    font-size: 14px;
    color: rgba(15,23,42,0.45);
    text-align: center;
    max-width: 220px;
    line-height: 1.65;
  }

  /* ── Post-login loading screen (stays dark) ── */
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
    display: inline-flex; align-items: center; gap: 7px;
    padding: 5px 13px; border-radius: 20px;
    border: 1px solid rgba(238,240,246,0.08);
    background: rgba(238,240,246,0.04);
    font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--load-accent, #7c3aed);
    animation: rflFadeIn 0.5s ease 0.15s both;
  }
  .rfl-loading-ring {
    width: 36px; height: 36px; border-radius: 50%;
    border: 2px solid rgba(238,240,246,0.07);
    border-top-color: var(--load-accent, #7c3aed);
    animation: rflSpin 0.75s linear infinite;
  }
  .rfl-loading-label {
    font-size: 12px; font-weight: 500;
    color: rgba(238,240,246,0.30);
    letter-spacing: 0.04em; margin-top: -4px;
  }
  @keyframes rflLoadPulse {
    0%, 100% { opacity: 0.7;  transform: scale(1);    }
    50%       { opacity: 0.9;  transform: scale(1.04); }
  }

  /* ── Animations ── */
  @keyframes rflSlideUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes rflFadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes rflFloat {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-12px); }
  }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .rfl-right    { display: none; }
    .rfl-left     { width: 100%; border-right: none; }
    .rfl-topbar   { padding: 20px 24px; }
    .rfl-form-wrap { padding: 0 24px 40px; }
  }

  /* ── Dark mode ── */
  html.dark .rfl-wrap {
    --bg: #030812; --bg-alt: #0d1117; --bg-panel: #0a0f1e;
    --text: #eef0f6; --text-2: rgba(238,240,246,0.72); --muted: rgba(238,240,246,0.42);
    --accent-dk: #3b82f6; --line: rgba(238,240,246,0.07); --line-md: rgba(238,240,246,0.11);
    --field-bg: rgba(238,240,246,0.05); --field-bd: rgba(238,240,246,0.10);
  }
  html.dark .rfl-card {
    background: rgba(8,12,28,0.95);
    border-color: rgba(238,240,246,0.07);
    box-shadow: 0 24px 56px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04);
  }
  html.dark .rfl-logo-sm { filter: brightness(0) invert(1) opacity(0.72); }
  html.dark .rfl-right {
    background: #0a0f1e;
  }
  html.dark .rfl-logo-base { background: rgba(238,240,246,0.25); }
  html.dark .rfl-wrap .rfl-input { background: var(--field-bg); border-color: var(--field-bd); color: var(--text); }
  html.dark .rfl-wrap .rfl-input::placeholder { color: rgba(238,240,246,0.22); }
  html.dark .rfl-wrap .rfl-input:focus { border-color: rgba(37,99,235,0.7); background: rgba(37,99,235,0.08); box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }
  html.dark .rfl-wrap .rfl-input.rfl-err { border-color: rgba(239,68,68,0.45); background: rgba(239,68,68,0.05); }
  html.dark .rfl-api-err { background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.2); color: #fca5a5; }
  html.dark .rfl-brand { color: rgba(238,240,246,0.28); }
  html.dark .rfl-tagline { color: rgba(238,240,246,0.45); }
`

function LoadingScreen({ role }: { role: UserRole }) {
  const isMsp  = role === 'msp_admin' || role === 'msp_member'
  const accent = isMsp ? '#1d4ed8' : '#2563eb'
  const badge  = isMsp ? 'MSP Portaal' : 'Portaal'
  const label  = isMsp ? 'MSP-omgeving laden…' : 'Portaal laden…'

  return (
    <div className="rfl-loading-wrap" style={{ '--load-accent': accent } as React.CSSProperties}>
      <img src={logo} alt="" className="rfl-loading-logo" />
      <div className="rfl-loading-badge">{badge}</div>
      <div className="rfl-loading-ring" />
      <p className="rfl-loading-label">{label}</p>
    </div>
  )
}

export default function LoginPage() {
  const [apiError,     setApiError]     = useState<string | null>(null)
  const [showPass,     setShowPass]     = useState(false)
  const [loadingRole,  setLoadingRole]  = useState<UserRole | null>(null)
  const [keepSignedIn, setKeepSignedIn] = useState(true)
  const [mfaChallenge, setMfaChallenge] = useState<{ token: string; setupRequired: boolean } | null>(null)
  const { login }  = useAuthStore()
  const navigate   = useNavigate()
  const location   = useLocation()

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) })

  const proceedWithSession = (data: LoginResponse) => {
    login(data.accessToken!, data.refreshToken!, data.user!, keepSignedIn)
    const home = ROLE_HOME[data.user!.role]
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname
    const dest = from?.startsWith(home) ? from : home
    setLoadingRole(data.user!.role)
    setTimeout(() => navigate(dest, { replace: true }), 1400)
  }

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      const { data } = await api.post<LoginResponse>('/auth/login', values)
      if (data.mfaRequired && data.mfaChallengeToken) {
        setMfaChallenge({ token: data.mfaChallengeToken, setupRequired: !!data.mfaSetupRequired })
        return
      }
      proceedWithSession(data)
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

              {mfaChallenge ? (
                <MfaChallenge
                  challengeToken={mfaChallenge.token}
                  setupRequired={mfaChallenge.setupRequired}
                  onDone={proceedWithSession}
                  renderSubmit={({ onClick, disabled, loading }) => (
                    <button type="button" onClick={onClick} disabled={disabled} className="rfl-submit">
                      <span className="rfl-submit-inner">
                        {loading
                          ? <><div className="rfl-spin" /> Bezig…</>
                          : <>Bevestigen <i className="rfl-btn-arr">→</i></>
                        }
                      </span>
                    </button>
                  )}
                />
              ) : (
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
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && <p className="rfl-err-msg">{errors.password.message}</p>}
                </div>

                <label className="rfl-remember">
                  <input
                    type="checkbox"
                    checked={keepSignedIn}
                    onChange={e => setKeepSignedIn(e.target.checked)}
                  />
                  Blijf ingelogd op dit apparaat
                </label>

                <button type="submit" disabled={isSubmitting} className="rfl-submit">
                  <span className="rfl-submit-inner">
                    {isSubmitting
                      ? <><div className="rfl-spin" /> Bezig…</>
                      : <>Inloggen <i className="rfl-btn-arr">→</i></>
                    }
                  </span>
                </button>

                <p className="rfl-footer">
                  <a href="/forgot-password">Wachtwoord vergeten?</a>
                </p>
              </form>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: panel ── */}
        <div className="rfl-right">
          <div className="rfl-emblem">
            <div
              className="rfl-logo-wrap"
              style={{
                WebkitMaskImage: `url(${logo})`,
                maskImage: `url(${logo})`,
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
              }}
            >
              <div className="rfl-logo-base" />
              <div className="rfl-logo-sweep" />
            </div>
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
