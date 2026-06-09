import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/axios'
import type { LoginResponse } from '@/types/auth'
import logo from '@/assets/RokaFlow_icon_dark_transparent.png'

const schema = z.object({
  companyName:     z.string().min(1, 'Bedrijfsnaam is verplicht').max(200),
  firstName:       z.string().min(1, 'Voornaam is verplicht').max(100),
  lastName:        z.string().min(1, 'Achternaam is verplicht').max(100),
  email:           z.string().email('Voer een geldig e-mailadres in'),
  password:        z.string().min(8, 'Minimaal 8 tekens'),
  confirmPassword: z.string().min(1, 'Bevestig uw wachtwoord'),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Wachtwoorden komen niet overeen',
  path: ['confirmPassword'],
})

type FormValues = z.infer<typeof schema>

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #030812;
    --bg-r:      #050c1a;
    --text:      #eef0f6;
    --muted:     rgba(238,240,246,0.38);
    --accent:    #7c3aed;
    --accent-lt: #a78bfa;
    --line-md:   rgba(238,240,246,0.11);
    --field-bg:  rgba(238,240,246,0.05);
    --field-bd:  rgba(238,240,246,0.10);
  }

  .rfr-wrap {
    display: flex;
    height: 100vh;
    overflow: hidden;
    background: var(--bg);
    font-family: 'DM Sans', system-ui, sans-serif;
    color: var(--text);
  }

  .rfr-left {
    width: 50%;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--line-md);
    overflow-y: auto;
  }

  .rfr-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 28px 48px;
    flex-shrink: 0;
    animation: rfrFadeIn 0.5s ease both;
  }

  .rfr-logo-sm {
    height: 68px;
    object-fit: contain;
    opacity: 0.8;
    display: block;
  }

  .rfr-back {
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
  .rfr-back:hover { color: var(--text); }
  .rfr-back .rfr-arr {
    display: inline-block;
    font-style: normal;
    transition: transform 0.2s;
  }
  .rfr-back:hover .rfr-arr { transform: translateX(-3px); }

  .rfr-form-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 48px 48px;
  }

  .rfr-card {
    width: 100%;
    max-width: 400px;
    background: rgba(8,12,28,0.85);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    padding: 36px 32px;
    backdrop-filter: blur(20px);
    box-shadow: 0 24px 56px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05);
    animation: rfrSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.05s both;
  }

  .rfr-heading {
    font-family: 'Syne', sans-serif;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.015em;
    color: var(--text);
    margin-bottom: 4px;
  }

  .rfr-sub {
    font-size: 13px;
    color: var(--muted);
    margin-bottom: 24px;
  }

  .rfr-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 18px;
  }

  .rfr-field { margin-bottom: 18px; }
  .rfr-field-inline { margin-bottom: 0; }

  .rfr-label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 7px;
  }

  .rfr-input-wrap { position: relative; }

  .rfr-input {
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
  .rfr-input::placeholder { color: rgba(238,240,246,0.20); }
  .rfr-input:focus {
    border-color: rgba(139,92,246,0.6);
    background: rgba(139,92,246,0.05);
    box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
  }
  .rfr-input.rfr-err {
    border-color: rgba(239,68,68,0.45);
    background: rgba(239,68,68,0.04);
  }
  .rfr-input.rfr-err:focus {
    border-color: rgba(239,68,68,0.65);
    box-shadow: 0 0 0 3px rgba(239,68,68,0.10);
  }

  .rfr-eye {
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
  .rfr-eye:hover { color: rgba(238,240,246,0.65); }

  .rfr-err-msg {
    margin-top: 5px;
    font-size: 12px;
    color: #f87171;
    font-weight: 500;
  }

  .rfr-api-err {
    padding: 10px 13px;
    border-radius: 8px;
    border: 1px solid rgba(239,68,68,0.18);
    background: rgba(239,68,68,0.07);
    font-size: 13px;
    color: #fca5a5;
    margin-bottom: 18px;
  }

  .rfr-submit {
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
    border: 1px solid rgba(139,92,246,0.45);
    border-radius: 8px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: border-color 0.35s, box-shadow 0.35s, opacity 0.2s;
    margin-top: 6px;
  }
  .rfr-submit::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--accent);
    border-radius: 8px;
    transform: translateX(-105%);
    transition: transform 0.42s cubic-bezier(0.16,1,0.3,1);
    z-index: 0;
  }
  .rfr-submit:hover:not(:disabled)::before { transform: translateX(0); }
  .rfr-submit::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.13) 50%, transparent 70%);
    transform: translateX(-120%);
    z-index: 1;
  }
  .rfr-submit:hover:not(:disabled)::after {
    transform: translateX(120%);
    transition: transform 0.55s cubic-bezier(0.4,0,0.2,1) 0.34s;
  }
  .rfr-submit:hover:not(:disabled) {
    border-color: var(--accent);
    box-shadow: 0 0 20px rgba(124,58,237,0.38), 0 0 48px rgba(124,58,237,0.13);
  }
  .rfr-submit:disabled { opacity: 0.45; cursor: not-allowed; }

  .rfr-submit-inner {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .rfr-submit .rfr-btn-arr {
    font-style: normal;
    display: inline-block;
    opacity: 0;
    transform: translateX(-6px);
    transition: opacity 0.22s 0.12s, transform 0.3s cubic-bezier(0.16,1,0.3,1) 0.12s;
  }
  .rfr-submit:hover:not(:disabled) .rfr-btn-arr {
    opacity: 1;
    transform: translateX(0);
  }

  @keyframes rfrSpin { to { transform: rotate(360deg); } }
  .rfr-spin {
    width: 13px; height: 13px;
    border: 2px solid rgba(238,240,246,0.25);
    border-top-color: var(--text);
    border-radius: 50%;
    animation: rfrSpin 0.7s linear infinite;
    flex-shrink: 0;
  }

  .rfr-footer {
    margin-top: 20px;
    text-align: center;
    font-size: 12px;
    color: var(--muted);
    opacity: 0.7;
  }
  .rfr-footer a {
    color: var(--accent-lt);
    text-decoration: none;
    font-weight: 600;
    transition: color 0.2s;
  }
  .rfr-footer a:hover { color: #c4b5fd; }

  /* ── Logo upload ── */
  .rfr-logo-upload {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background: var(--field-bg);
    border: 1px dashed var(--field-bd);
    border-radius: 8px;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
  }
  .rfr-logo-upload:hover {
    border-color: rgba(139,92,246,0.4);
    background: rgba(139,92,246,0.04);
  }
  .rfr-logo-preview {
    width: 36px;
    height: 36px;
    border-radius: 6px;
    object-fit: contain;
    background: rgba(255,255,255,0.07);
    flex-shrink: 0;
  }
  .rfr-logo-placeholder {
    width: 36px;
    height: 36px;
    border-radius: 6px;
    background: rgba(255,255,255,0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: rgba(238,240,246,0.25);
  }
  .rfr-logo-text { flex: 1; min-width: 0; }
  .rfr-logo-text-main {
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .rfr-logo-text-sub {
    font-size: 11px;
    color: var(--muted);
    margin-top: 1px;
  }

  /* ── Right panel ── */
  .rfr-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--bg-r);
    position: relative;
  }

  .rfr-emblem {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    animation: rfrFadeIn 1.2s ease 0.2s both;
  }

  .rfr-emblem img {
    width: 280px;
    opacity: 0.20;
    filter: drop-shadow(0 0 48px rgba(139,92,246,0.30));
    animation: rfrFloat 8s ease-in-out 1.4s infinite;
    display: block;
  }

  .rfr-brand {
    font-family: 'Syne', sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(238,240,246,0.20);
  }

  .rfr-tagline {
    font-size: 13px;
    color: rgba(238,240,246,0.22);
    letter-spacing: 0.01em;
    text-align: center;
    max-width: 240px;
    line-height: 1.65;
  }

  @keyframes rfrSlideUp {
    from { opacity: 0; transform: translateY(16px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0)    scale(1); }
  }
  @keyframes rfrFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes rfrFloat {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-14px); }
  }

  @media (max-width: 768px) {
    .rfr-right    { display: none; }
    .rfr-left     { width: 100%; border-right: none; }
    .rfr-topbar   { padding: 24px; }
    .rfr-form-wrap { padding: 0 24px 40px; }
  }
`

const EyeIcon = ({ open }: { open: boolean }) => open ? (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
) : (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

export default function RegisterPage() {
  const [apiError,     setApiError]     = useState<string | null>(null)
  const [showPass,     setShowPass]     = useState(false)
  const [showConfirm,  setShowConfirm]  = useState(false)
  const [logoFile,     setLogoFile]     = useState<File | null>(null)
  const [logoPreview,  setLogoPreview]  = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { login }  = useAuthStore()
  const navigate   = useNavigate()

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) })

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setLogoFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onload = ev => setLogoPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setLogoPreview(null)
    }
  }

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      const { data } = await api.post<LoginResponse>('/auth/register', {
        companyName: values.companyName,
        firstName:   values.firstName,
        lastName:    values.lastName,
        email:       values.email,
        password:    values.password,
      }, {
        headers: { Authorization: undefined },
      })
      login(data.accessToken, data.refreshToken, data.user)

      if (logoFile) {
        const form = new FormData()
        form.append('file', logoFile)
        await api.post('/portal/logo', form, {
          headers: {
            Authorization: `Bearer ${data.accessToken}`,
            'Content-Type': undefined,
          },
        })
      }

      navigate('/client', { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(msg ?? 'Registratie mislukt. Probeer het opnieuw.')
    }
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="rfr-wrap">

        {/* ── Left: form ── */}
        <div className="rfr-left">
          <div className="rfr-topbar">
            <img src={logo} alt="RokaFlow" className="rfr-logo-sm" />
            <button className="rfr-back" onClick={() => navigate('/')}>
              <i className="rfr-arr">←</i> Terug
            </button>
          </div>

          <div className="rfr-form-wrap">
            <div className="rfr-card">
              <h1 className="rfr-heading">Account aanmaken</h1>
              <p className="rfr-sub">Start gratis met RokaFlow voor uw organisatie.</p>

              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                {apiError && <div className="rfr-api-err">{apiError}</div>}

                {/* Bedrijfsnaam */}
                <div className="rfr-field">
                  <label className="rfr-label">Bedrijfsnaam</label>
                  <input
                    autoFocus
                    placeholder="Mijn Bedrijf B.V."
                    {...register('companyName')}
                    className={`rfr-input${errors.companyName ? ' rfr-err' : ''}`}
                  />
                  {errors.companyName && <p className="rfr-err-msg">{errors.companyName.message}</p>}
                </div>

                {/* Logo upload */}
                <div className="rfr-field">
                  <label className="rfr-label">Bedrijfslogo <span style={{ opacity: 0.5, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optioneel)</span></label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleLogoChange}
                  />
                  <div className="rfr-logo-upload" onClick={() => fileInputRef.current?.click()}>
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="rfr-logo-preview" />
                    ) : (
                      <div className="rfr-logo-placeholder">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                    )}
                    <div className="rfr-logo-text">
                      <p className="rfr-logo-text-main">{logoFile ? logoFile.name : 'Klik om een logo te uploaden'}</p>
                      <p className="rfr-logo-text-sub">PNG, JPEG, SVG of WebP · max 2 MB</p>
                    </div>
                  </div>
                </div>

                {/* Voornaam + Achternaam */}
                <div className="rfr-row">
                  <div className="rfr-field-inline">
                    <label className="rfr-label">Voornaam</label>
                    <input
                      placeholder="Jan"
                      {...register('firstName')}
                      className={`rfr-input${errors.firstName ? ' rfr-err' : ''}`}
                    />
                    {errors.firstName && <p className="rfr-err-msg">{errors.firstName.message}</p>}
                  </div>
                  <div className="rfr-field-inline">
                    <label className="rfr-label">Achternaam</label>
                    <input
                      placeholder="de Vries"
                      {...register('lastName')}
                      className={`rfr-input${errors.lastName ? ' rfr-err' : ''}`}
                    />
                    {errors.lastName && <p className="rfr-err-msg">{errors.lastName.message}</p>}
                  </div>
                </div>

                {/* E-mail */}
                <div className="rfr-field">
                  <label className="rfr-label">E-mailadres</label>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="jan@mijnbedrijf.nl"
                    {...register('email')}
                    className={`rfr-input${errors.email ? ' rfr-err' : ''}`}
                  />
                  {errors.email && <p className="rfr-err-msg">{errors.email.message}</p>}
                </div>

                {/* Wachtwoord */}
                <div className="rfr-field">
                  <label className="rfr-label">Wachtwoord</label>
                  <div className="rfr-input-wrap">
                    <input
                      type={showPass ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Minimaal 8 tekens"
                      {...register('password')}
                      className={`rfr-input${errors.password ? ' rfr-err' : ''}`}
                      style={{ paddingRight: '42px' }}
                    />
                    <button type="button" tabIndex={-1} className="rfr-eye" onClick={() => setShowPass(p => !p)}>
                      <EyeIcon open={showPass} />
                    </button>
                  </div>
                  {errors.password && <p className="rfr-err-msg">{errors.password.message}</p>}
                </div>

                {/* Wachtwoord bevestigen */}
                <div className="rfr-field">
                  <label className="rfr-label">Wachtwoord bevestigen</label>
                  <div className="rfr-input-wrap">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      {...register('confirmPassword')}
                      className={`rfr-input${errors.confirmPassword ? ' rfr-err' : ''}`}
                      style={{ paddingRight: '42px' }}
                    />
                    <button type="button" tabIndex={-1} className="rfr-eye" onClick={() => setShowConfirm(p => !p)}>
                      <EyeIcon open={showConfirm} />
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="rfr-err-msg">{errors.confirmPassword.message}</p>}
                </div>

                <button type="submit" disabled={isSubmitting} className="rfr-submit">
                  <span className="rfr-submit-inner">
                    {isSubmitting ? (
                      <><div className="rfr-spin" /> Bezig…</>
                    ) : (
                      <>Account aanmaken <i className="rfr-btn-arr">→</i></>
                    )}
                  </span>
                </button>

                <p className="rfr-footer">
                  Al een account?{' '}
                  <a href="/login">Inloggen →</a>
                </p>
              </form>
            </div>
          </div>
        </div>

        {/* ── Right: logo ── */}
        <div className="rfr-right">
          <div className="rfr-emblem">
            <img src={logo} alt="" aria-hidden="true" />
            <span className="rfr-brand">RokaFlow</span>
            <p className="rfr-tagline">
              Start in minuten.<br />Geen MSP vereist.
            </p>
          </div>
        </div>

      </div>
    </>
  )
}
