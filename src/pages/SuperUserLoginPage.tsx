import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/axios'
import type { LoginResponse } from '@/types/auth'
import { MfaChallenge } from '@/components/auth/MfaChallenge'
import logo from '@/assets/RokaFlow_icon_dark_transparent.png'

const schema = z.object({
  email:    z.string().email('Voer een geldig e-mailadres in'),
  password: z.string().min(1, 'Wachtwoord is verplicht'),
})
type FormValues = z.infer<typeof schema>

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #030812;
    --bg-r:      #08060a;
    --text:      #eef0f6;
    --muted:     rgba(238,240,246,0.38);
    --accent:    #d97706;
    --accent-lt: #fbbf24;
    --line-md:   rgba(238,240,246,0.11);
    --field-bg:  rgba(238,240,246,0.05);
    --field-bd:  rgba(238,240,246,0.10);
  }

  /* ── Layout ── */
  .rfa-wrap {
    display: flex;
    height: 100vh;
    overflow: hidden;
    background: var(--bg);
    font-family: 'DM Sans', system-ui, sans-serif;
    color: var(--text);
  }

  /* ── Left panel ── */
  .rfa-left {
    width: 50%;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--line-md);
    position: relative;
  }

  .rfa-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 28px 48px;
    flex-shrink: 0;
    animation: rfaFadeIn 0.5s ease both;
  }

  .rfa-logo-sm {
    height: 68px;
    object-fit: contain;
    opacity: 0.8;
    display: block;
  }

  .rfa-badge {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent);
    border: 1px solid rgba(217,119,6,0.30);
    padding: 3px 9px;
    border-radius: 4px;
    background: rgba(217,119,6,0.07);
  }

  .rfa-back {
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
    text-decoration: none;
  }
  .rfa-back:hover { color: var(--text); }
  .rfa-back .rfa-arr {
    display: inline-block;
    font-style: normal;
    transition: transform 0.2s;
  }
  .rfa-back:hover .rfa-arr { transform: translateX(-3px); }

  /* Centered card area */
  .rfa-form-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 48px 48px;
  }

  /* Card */
  .rfa-card {
    width: 100%;
    max-width: 360px;
    background: rgba(12,8,18,0.85);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    padding: 36px 32px;
    backdrop-filter: blur(20px);
    box-shadow: 0 24px 56px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05);
    animation: rfaSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.05s both;
  }

  .rfa-heading {
    font-family: 'Syne', sans-serif;
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -0.015em;
    color: var(--text);
    margin-bottom: 4px;
  }

  .rfa-sub {
    font-size: 13px;
    color: var(--muted);
    margin-bottom: 28px;
  }

  /* Fields */
  .rfa-field { margin-bottom: 18px; }

  .rfa-label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 7px;
  }

  .rfa-input-wrap { position: relative; }

  .rfa-input {
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
  .rfa-input::placeholder { color: rgba(238,240,246,0.20); }
  .rfa-input:focus {
    border-color: rgba(217,119,6,0.55);
    background: rgba(217,119,6,0.04);
    box-shadow: 0 0 0 3px rgba(217,119,6,0.10);
  }
  .rfa-input.rfa-err {
    border-color: rgba(239,68,68,0.45);
    background: rgba(239,68,68,0.04);
  }
  .rfa-input.rfa-err:focus {
    border-color: rgba(239,68,68,0.65);
    box-shadow: 0 0 0 3px rgba(239,68,68,0.10);
  }

  .rfa-eye {
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
  .rfa-eye:hover { color: rgba(238,240,246,0.65); }

  .rfa-err-msg {
    margin-top: 5px;
    font-size: 12px;
    color: #f87171;
    font-weight: 500;
  }

  /* API error */
  .rfa-api-err {
    padding: 10px 13px;
    border-radius: 8px;
    border: 1px solid rgba(239,68,68,0.18);
    background: rgba(239,68,68,0.07);
    font-size: 13px;
    color: #fca5a5;
    margin-bottom: 18px;
  }

  /* Submit button */
  .rfa-submit {
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
    border: 1px solid rgba(217,119,6,0.45);
    border-radius: 8px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: border-color 0.35s, box-shadow 0.35s, opacity 0.2s;
    margin-top: 6px;
  }

  /* Sweep fill */
  .rfa-submit::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--accent);
    border-radius: 8px;
    transform: translateX(-105%);
    transition: transform 0.42s cubic-bezier(0.16,1,0.3,1);
    z-index: 0;
  }
  .rfa-submit:hover:not(:disabled)::before { transform: translateX(0); }

  /* Shimmer pass */
  .rfa-submit::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.13) 50%, transparent 70%);
    transform: translateX(-120%);
    z-index: 1;
  }
  .rfa-submit:hover:not(:disabled)::after {
    transform: translateX(120%);
    transition: transform 0.55s cubic-bezier(0.4,0,0.2,1) 0.34s;
  }

  .rfa-submit:hover:not(:disabled) {
    border-color: var(--accent);
    box-shadow: 0 0 20px rgba(217,119,6,0.38), 0 0 48px rgba(217,119,6,0.13);
  }
  .rfa-submit:disabled { opacity: 0.45; cursor: not-allowed; }

  .rfa-submit-inner {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .rfa-submit .rfa-btn-arr {
    font-style: normal;
    display: inline-block;
    opacity: 0;
    transform: translateX(-6px);
    transition: opacity 0.22s 0.12s, transform 0.3s cubic-bezier(0.16,1,0.3,1) 0.12s;
  }
  .rfa-submit:hover:not(:disabled) .rfa-btn-arr {
    opacity: 1;
    transform: translateX(0);
  }

  /* Spinner */
  @keyframes rfaSpin { to { transform: rotate(360deg); } }
  .rfa-spin {
    width: 13px; height: 13px;
    border: 2px solid rgba(238,240,246,0.25);
    border-top-color: var(--text);
    border-radius: 50%;
    animation: rfaSpin 0.7s linear infinite;
    flex-shrink: 0;
  }

  .rfa-footer {
    margin-top: 20px;
    text-align: center;
    font-size: 12px;
    color: var(--muted);
    opacity: 0.7;
  }
  .rfa-footer a {
    color: var(--accent-lt);
    text-decoration: none;
    font-weight: 600;
    transition: color 0.2s;
  }
  .rfa-footer a:hover { color: #fde68a; }

  /* ── Right panel ── */
  .rfa-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--bg-r);
    position: relative;
  }

  .rfa-emblem {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    animation: rfaFadeIn 1.2s ease 0.2s both;
  }

  .rfa-emblem img {
    width: 280px;
    opacity: 0.18;
    filter: drop-shadow(0 0 48px rgba(217,119,6,0.30));
    animation: rfaFloat 8s ease-in-out 1.4s infinite;
    display: block;
  }

  .rfa-brand {
    font-family: 'Syne', sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(238,240,246,0.20);
  }

  .rfa-admin-tag {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(217,119,6,0.45);
    border: 1px solid rgba(217,119,6,0.18);
    padding: 4px 12px;
    border-radius: 4px;
  }

  .rfa-tagline {
    font-size: 13px;
    color: rgba(238,240,246,0.22);
    letter-spacing: 0.01em;
    text-align: center;
    max-width: 240px;
    line-height: 1.65;
  }

  /* ── Keyframes ── */
  @keyframes rfaSlideUp {
    from { opacity: 0; transform: translateY(16px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }
  @keyframes rfaFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes rfaFloat {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-14px); }
  }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .rfa-right  { display: none; }
    .rfa-left   { width: 100%; border-right: none; }
    .rfa-topbar { padding: 24px 24px; }
    .rfa-form-wrap { padding: 0 24px 40px; }
  }
`

export default function SuperUserLoginPage() {
  const [apiError, setApiError] = useState<string | null>(null)
  const [showPass, setShowPass]  = useState(false)
  const [mfaChallenge, setMfaChallenge] = useState<{ token: string; setupRequired: boolean } | null>(null)
  const { login }  = useAuthStore()
  const navigate   = useNavigate()

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) })

  const proceedWithSession = (data: LoginResponse) => {
    login(data.accessToken!, data.refreshToken!, data.user!)
    navigate('/superuser', { replace: true })
  }

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      const { data } = await api.post<LoginResponse>('/auth/superuser/login', values)

      if (data.mfaRequired && data.mfaChallengeToken) {
        setMfaChallenge({ token: data.mfaChallengeToken, setupRequired: !!data.mfaSetupRequired })
        return
      }

      proceedWithSession(data)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(detail ?? 'Inloggen mislukt.')
    }
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="rfa-wrap">

        {/* ── Left: form ── */}
        <div className="rfa-left">
          <div className="rfa-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src={logo} alt="RokaFlow" className="rfa-logo-sm" />
              <span className="rfa-badge">Platformbeheer</span>
            </div>
            <a href="/login" className="rfa-back">
              <i className="rfa-arr">←</i> Terug
            </a>
          </div>

          <div className="rfa-form-wrap">
            <div className="rfa-card">
              <h1 className="rfa-heading">Admin login</h1>
              <p className="rfa-sub">Toegang tot het platformbeheer.</p>

              {mfaChallenge ? (
                <MfaChallenge
                  challengeToken={mfaChallenge.token}
                  setupRequired={mfaChallenge.setupRequired}
                  onDone={proceedWithSession}
                />
              ) : (
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                {apiError && <div className="rfa-api-err">{apiError}</div>}

                <div className="rfa-field">
                  <label className="rfa-label">E-mailadres</label>
                  <input
                    type="email"
                    autoComplete="email"
                    autoFocus
                    placeholder="admin@platform.nl"
                    {...register('email')}
                    className={`rfa-input${errors.email ? ' rfa-err' : ''}`}
                  />
                  {errors.email && <p className="rfa-err-msg">{errors.email.message}</p>}
                </div>

                <div className="rfa-field">
                  <label className="rfa-label">Wachtwoord</label>
                  <div className="rfa-input-wrap">
                    <input
                      type={showPass ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      {...register('password')}
                      className={`rfa-input${errors.password ? ' rfa-err' : ''}`}
                      style={{ paddingRight: '42px' }}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="rfa-eye"
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
                  {errors.password && <p className="rfa-err-msg">{errors.password.message}</p>}
                </div>

                <button type="submit" disabled={isSubmitting} className="rfa-submit">
                  <span className="rfa-submit-inner">
                    {isSubmitting ? (
                      <><div className="rfa-spin" /> Bezig…</>
                    ) : (
                      <>Inloggen als Admin <i className="rfa-btn-arr">→</i></>
                    )}
                  </span>
                </button>

                <p className="rfa-footer">
                  Reguliere gebruiker?{' '}
                  <a href="/login">Portaal login →</a>
                </p>
              </form>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: logo ── */}
        <div className="rfa-right">
          <div className="rfa-emblem">
            <img src={logo} alt="" aria-hidden="true" />
            <span className="rfa-brand">RokaFlow</span>
            <span className="rfa-admin-tag">Platform Admin</span>
            <p className="rfa-tagline">
              Volledig beheer van<br />organisaties en gebruikers.
            </p>
          </div>
        </div>

      </div>
    </>
  )
}
