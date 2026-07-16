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
  firstName:       z.string().min(1, 'Voornaam is verplicht').max(100),
  tussenvoegsel:   z.string().max(50).optional(),
  lastName:        z.string().min(1, 'Achternaam is verplicht').max(100),
  email:           z.string().email('Voer een geldig e-mailadres in'),
  password:        z.string().min(8, 'Minimaal 8 tekens'),
  confirmPassword: z.string().min(1, 'Bevestig uw wachtwoord'),
  companyName:     z.string().min(1, 'Bedrijfsnaam is verplicht').max(200),
  kvkNumber:       z.string().max(50).optional(),
  vatNumber:       z.string().max(50).optional(),
  invoiceEmail:    z.string().optional(),
  addressLine:     z.string().max(200).optional(),
  postalCode:      z.string().max(20).optional(),
  city:            z.string().max(100).optional(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Wachtwoorden komen niet overeen',
  path: ['confirmPassword'],
})

type FormValues = z.infer<typeof schema>

const STEP1_FIELDS = ['firstName', 'tussenvoegsel', 'lastName', 'email', 'password', 'confirmPassword'] as const

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
    border-right: 1px solid var(--line);
    overflow-y: auto;
    background: var(--bg-alt);
  }

  .rfr-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px 48px;
    flex-shrink: 0;
    animation: rfrFadeIn 0.4s ease both;
  }

  .rfr-logo-sm {
    height: 52px;
    object-fit: contain;
    filter: brightness(0) opacity(0.82);
    display: block;
  }

  .rfr-back {
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
  .rfr-back:hover { color: var(--text); }
  .rfr-back .rfr-arr { font-style: normal; transition: transform 0.16s; }
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
    max-width: 480px;
    background: #ffffff;
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 36px 40px;
    box-shadow: 0 1px 3px rgba(15,23,42,0.05), 0 8px 24px rgba(15,23,42,0.06);
    animation: rfrSlideUp 0.45s cubic-bezier(0.16,1,0.3,1) 0.05s both;
  }

  .rfr-heading {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 30px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--text);
    margin-bottom: 6px;
  }

  .rfr-sub {
    font-size: 14px;
    color: var(--muted);
    margin-bottom: 24px;
    line-height: 1.55;
  }

  .rfr-section-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 12px;
    margin-top: 4px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--line);
  }

  .rfr-row-3 {
    display: grid;
    grid-template-columns: 2fr 1fr 2fr;
    gap: 12px;
    margin-bottom: 18px;
  }

  .rfr-row-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 18px;
  }

  .rfr-field { margin-bottom: 18px; }
  .rfr-field-inline { margin-bottom: 0; }
  .rfr-field-hint {
    margin-top: 5px;
    font-size: 11px;
    color: var(--muted);
  }

  /* ── Step indicator ── */
  .rfr-step-indicator {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }
  .rfr-step-dots { display: flex; gap: 5px; }
  .rfr-step-dot {
    width: 22px;
    height: 4px;
    border-radius: 2px;
    background: var(--line-md);
    transition: background 0.2s;
  }
  .rfr-step-dot.rfr-step-dot-active { background: var(--accent); }
  .rfr-step-text {
    font-size: 12px;
    font-weight: 600;
    color: var(--muted);
  }

  .rfr-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-2);
    margin-bottom: 7px;
  }

  .rfr-input-wrap { position: relative; }

  .rfr-input {
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
  .rfr-input::placeholder { color: rgba(15,23,42,0.28); }
  .rfr-input:focus {
    border-color: var(--accent);
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
  }
  .rfr-input.rfr-err {
    border-color: #ef4444;
    background: #fff5f5;
  }
  .rfr-input.rfr-err:focus {
    border-color: #ef4444;
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
    color: var(--muted);
    display: flex;
    align-items: center;
    padding: 4px;
    transition: color 0.16s;
  }
  .rfr-eye:hover { color: var(--text); }

  .rfr-err-msg {
    margin-top: 5px;
    font-size: 12px;
    color: #ef4444;
    font-weight: 500;
  }

  .rfr-api-err {
    padding: 10px 13px;
    border-radius: 9px;
    border: 1.5px solid #fecaca;
    background: #fef2f2;
    font-size: 13px;
    color: #dc2626;
    margin-bottom: 18px;
  }

  /* ── Logo upload ── */
  .rfr-logo-upload {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background: var(--field-bg);
    border: 1.5px dashed var(--field-bd);
    border-radius: 9px;
    cursor: pointer;
    transition: border-color 0.18s, background 0.18s;
  }
  .rfr-logo-upload:hover {
    border-color: var(--accent);
    background: #eff6ff;
  }
  .rfr-logo-preview {
    width: 36px; height: 36px;
    border-radius: 6px;
    object-fit: contain;
    background: var(--line);
    flex-shrink: 0;
  }
  .rfr-logo-placeholder {
    width: 36px; height: 36px;
    border-radius: 6px;
    background: var(--line);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    color: var(--muted);
  }
  .rfr-logo-text { flex: 1; min-width: 0; }
  .rfr-logo-text-main {
    font-size: 13px; font-weight: 500;
    color: var(--text-2);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .rfr-logo-text-sub { font-size: 11px; color: var(--muted); margin-top: 1px; }

  /* ── Submit ── */
  .rfr-submit {
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
  .rfr-submit:hover:not(:disabled) {
    background: var(--accent-dk);
    box-shadow: 0 6px 20px rgba(37,99,235,0.35);
    transform: translateY(-1px);
  }
  .rfr-submit:disabled { opacity: 0.5; cursor: not-allowed; }

  .rfr-submit-inner {
    display: flex; align-items: center; gap: 8px;
  }

  .rfr-submit .rfr-btn-arr {
    font-style: normal;
    transition: transform 0.16s;
  }
  .rfr-submit:hover:not(:disabled) .rfr-btn-arr { transform: translateX(3px); }

  .rfr-btn-row {
    display: flex;
    gap: 10px;
    margin-top: 6px;
  }
  .rfr-submit-flex { margin-top: 0; flex: 1; }

  .rfr-btn-secondary {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 20px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-2);
    background: var(--field-bg);
    border: 1.5px solid var(--field-bd);
    border-radius: 9px;
    cursor: pointer;
    transition: background 0.18s, border-color 0.18s;
  }
  .rfr-btn-secondary:hover { background: var(--line); }

  @keyframes rfrSpin { to { transform: rotate(360deg); } }
  .rfr-spin {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.35);
    border-top-color: white;
    border-radius: 50%;
    animation: rfrSpin 0.7s linear infinite;
    flex-shrink: 0;
  }

  .rfr-footer {
    margin-top: 20px;
    text-align: center;
    font-size: 13px;
    color: var(--muted);
  }
  .rfr-footer a {
    color: var(--accent);
    text-decoration: none;
    font-weight: 600;
    transition: color 0.16s;
  }
  .rfr-footer a:hover { color: var(--accent-dk); }

  /* ── Right panel ── */
  .rfr-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--bg-panel);
    position: relative;
  }

  .rfr-emblem {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    animation: rfrFadeIn 0.8s ease 0.2s both;
  }

  /* ── Logo mask animation ── */
  .rfr-logo-wrap {
    width: 160px;
    height: 160px;
    position: relative;
    flex-shrink: 0;
    animation: rfrFloat 8s ease-in-out 1s infinite;
  }
  .rfr-logo-base {
    position: absolute;
    inset: 0;
    background: rgba(15,23,42,0.18);
  }
  .rfr-logo-sweep {
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
    animation: rfrLogoSweep 4s cubic-bezier(0.4,0,0.2,1) 1.8s infinite;
  }
  @keyframes rfrLogoSweep {
    0%   { transform: translateX(-200%); }
    100% { transform: translateX(300%); }
  }

  .rfr-brand {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(15,23,42,0.28);
  }

  .rfr-tagline {
    font-size: 14px;
    color: rgba(15,23,42,0.45);
    text-align: center;
    max-width: 220px;
    line-height: 1.65;
  }

  .rfr-trust {
    margin-top: 28px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
  }
  .rfr-trust-item {
    font-size: 12px;
    color: rgba(15,23,42,0.38);
    font-weight: 500;
  }

  /* ── Animations ── */
  @keyframes rfrSlideUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes rfrFadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes rfrFloat {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-12px); }
  }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .rfr-right    { display: none; }
    .rfr-left     { width: 100%; border-right: none; }
    .rfr-topbar   { padding: 20px 24px; }
    .rfr-form-wrap { padding: 0 24px 40px; }
  }

  /* ── Dark mode ── */
  html.dark .rfr-wrap {
    --bg: #030812; --bg-alt: #0d1117; --bg-panel: #0a0f1e;
    --text: #eef0f6; --text-2: rgba(238,240,246,0.72); --muted: rgba(238,240,246,0.42);
    --accent-dk: #3b82f6; --line: rgba(238,240,246,0.07); --line-md: rgba(238,240,246,0.11);
    --field-bg: rgba(238,240,246,0.05); --field-bd: rgba(238,240,246,0.10);
  }
  html.dark .rfr-card {
    background: rgba(8,12,28,0.95);
    border-color: rgba(238,240,246,0.07);
    box-shadow: 0 24px 56px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04);
  }
  html.dark .rfr-logo-sm { filter: brightness(0) invert(1) opacity(0.72); }
  html.dark .rfr-right {
    background: #0a0f1e;
  }
  html.dark .rfr-logo-base { background: rgba(238,240,246,0.25); }
  html.dark .rfr-wrap .rfr-input { background: var(--field-bg); border-color: var(--field-bd); color: var(--text); }
  html.dark .rfr-wrap .rfr-input::placeholder { color: rgba(238,240,246,0.22); }
  html.dark .rfr-wrap .rfr-input:focus { border-color: rgba(37,99,235,0.7); background: rgba(37,99,235,0.08); box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }
  html.dark .rfr-wrap .rfr-input.rfr-err { border-color: rgba(239,68,68,0.45); background: rgba(239,68,68,0.05); }
  html.dark .rfr-api-err { background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.2); color: #fca5a5; }
  html.dark .rfr-logo-upload { background: rgba(238,240,246,0.04); border-color: rgba(238,240,246,0.12); }
  html.dark .rfr-logo-upload:hover { background: rgba(37,99,235,0.1); border-color: rgba(37,99,235,0.35); }
  html.dark .rfr-section-label { border-bottom-color: rgba(238,240,246,0.08); }
  html.dark .rfr-btn-secondary { background: rgba(238,240,246,0.04); border-color: rgba(238,240,246,0.12); color: var(--text-2); }
  html.dark .rfr-btn-secondary:hover { background: rgba(238,240,246,0.08); }
  html.dark .rfr-brand { color: rgba(238,240,246,0.28); }
  html.dark .rfr-tagline { color: rgba(238,240,246,0.45); }
`

const EyeIcon = ({ open }: { open: boolean }) => open ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

export default function RegisterPage() {
  const [apiError,    setApiError]    = useState<string | null>(null)
  const [showPass,    setShowPass]    = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [logoFile,    setLogoFile]    = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [step,        setStep]        = useState<1 | 2>(1)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { login }  = useAuthStore()
  const navigate   = useNavigate()

  const { register, handleSubmit, trigger, watch, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) })

  const handleNext = async () => {
    const valid = await trigger(STEP1_FIELDS as unknown as Array<keyof FormValues>)
    if (valid) setStep(2)
  }

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
        companyName:   values.companyName,
        firstName:     values.firstName,
        tussenvoegsel: values.tussenvoegsel ?? '',
        lastName:      values.lastName,
        email:         values.email,
        password:      values.password,
        kvkNumber:     values.kvkNumber || undefined,
        vatNumber:     values.vatNumber || undefined,
        invoiceEmail:  values.invoiceEmail || undefined,
        addressLine:   values.addressLine || undefined,
        postalCode:    values.postalCode || undefined,
        city:          values.city || undefined,
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
              <h1 className="rfr-heading">{step === 1 ? 'Account aanmaken' : 'Bedrijfsgegevens'}</h1>
              <p className="rfr-sub">
                {step === 1
                  ? 'Start gratis met RokaFlow voor uw organisatie.'
                  : 'Vertel ons iets over uw organisatie voor facturatie en branding.'}
              </p>

              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                {apiError && <div className="rfr-api-err">{apiError}</div>}

                <div className="rfr-step-indicator">
                  <div className="rfr-step-dots">
                    <span className={`rfr-step-dot${step >= 1 ? ' rfr-step-dot-active' : ''}`} />
                    <span className={`rfr-step-dot${step >= 2 ? ' rfr-step-dot-active' : ''}`} />
                  </div>
                  <span className="rfr-step-text">Stap {step} van 2</span>
                </div>

                {step === 1 && (
                  <>
                    {/* Persoon */}
                    <p className="rfr-section-label">Uw gegevens</p>

                    {/* Voornaam + Tussenvoegsel + Achternaam */}
                    <div className="rfr-row-3">
                      <div className="rfr-field-inline">
                        <label className="rfr-label">Voornaam</label>
                        <input
                          autoFocus
                          placeholder="Jan"
                          {...register('firstName')}
                          className={`rfr-input${errors.firstName ? ' rfr-err' : ''}`}
                        />
                        {errors.firstName && <p className="rfr-err-msg">{errors.firstName.message}</p>}
                      </div>
                      <div className="rfr-field-inline">
                        <label className="rfr-label">Tussen</label>
                        <input
                          placeholder="de"
                          {...register('tussenvoegsel')}
                          className="rfr-input"
                        />
                      </div>
                      <div className="rfr-field-inline">
                        <label className="rfr-label">Achternaam</label>
                        <input
                          placeholder="Vries"
                          {...register('lastName')}
                          className={`rfr-input${errors.lastName ? ' rfr-err' : ''}`}
                        />
                        {errors.lastName && <p className="rfr-err-msg">{errors.lastName.message}</p>}
                      </div>
                    </div>

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

                    <button type="button" className="rfr-submit" onClick={handleNext}>
                      <span className="rfr-submit-inner">
                        Bedrijfsgegevens toevoegen <i className="rfr-btn-arr">→</i>
                      </span>
                    </button>
                  </>
                )}

                {step === 2 && (
                  <>
                    {/* Bedrijf */}
                    <p className="rfr-section-label">Organisatie</p>

                    <div className="rfr-field">
                      <label className="rfr-label">
                        Bedrijfslogo{' '}
                        <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--muted)', fontSize: 11 }}>(optioneel)</span>
                      </label>
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

                    <div className="rfr-row-2">
                      <div className="rfr-field-inline">
                        <label className="rfr-label">
                          KvK-nummer{' '}
                          <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--muted)', fontSize: 11 }}>(optioneel)</span>
                        </label>
                        <input
                          placeholder="12345678"
                          {...register('kvkNumber')}
                          className="rfr-input"
                        />
                      </div>
                      <div className="rfr-field-inline">
                        <label className="rfr-label">
                          BTW-nummer{' '}
                          <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--muted)', fontSize: 11 }}>(optioneel)</span>
                        </label>
                        <input
                          placeholder="NL123456789B01"
                          {...register('vatNumber')}
                          className="rfr-input"
                        />
                      </div>
                    </div>

                    <div className="rfr-field">
                      <label className="rfr-label">
                        Factuur-e-mailadres{' '}
                        <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--muted)', fontSize: 11 }}>(optioneel)</span>
                      </label>
                      <input
                        type="email"
                        placeholder={watch('email') || 'facturatie@mijnbedrijf.nl'}
                        {...register('invoiceEmail')}
                        className="rfr-input"
                      />
                      <p className="rfr-field-hint">Leeg laten = accountadres</p>
                    </div>

                    <div className="rfr-field">
                      <label className="rfr-label">
                        Adres{' '}
                        <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--muted)', fontSize: 11 }}>(optioneel)</span>
                      </label>
                      <input
                        placeholder="Hoofdstraat 1"
                        {...register('addressLine')}
                        className="rfr-input"
                      />
                    </div>

                    <div className="rfr-row-2">
                      <div className="rfr-field-inline">
                        <label className="rfr-label">
                          Postcode{' '}
                          <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--muted)', fontSize: 11 }}>(optioneel)</span>
                        </label>
                        <input
                          placeholder="1234 AB"
                          {...register('postalCode')}
                          className="rfr-input"
                        />
                      </div>
                      <div className="rfr-field-inline">
                        <label className="rfr-label">
                          Plaats{' '}
                          <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--muted)', fontSize: 11 }}>(optioneel)</span>
                        </label>
                        <input
                          placeholder="Amsterdam"
                          {...register('city')}
                          className="rfr-input"
                        />
                      </div>
                    </div>

                    <div className="rfr-btn-row">
                      <button type="button" className="rfr-btn-secondary" onClick={() => setStep(1)}>
                        ← Terug
                      </button>
                      <button type="submit" disabled={isSubmitting} className="rfr-submit rfr-submit-flex">
                        <span className="rfr-submit-inner">
                          {isSubmitting
                            ? <><div className="rfr-spin" /> Bezig…</>
                            : <>Account aanmaken <i className="rfr-btn-arr">→</i></>
                          }
                        </span>
                      </button>
                    </div>
                  </>
                )}

                <p className="rfr-footer">
                  Al een account?{' '}
                  <a href="/login">Inloggen →</a>
                </p>
              </form>
            </div>
          </div>
        </div>

        {/* ── Right: panel ── */}
        <div className="rfr-right">
          <div className="rfr-emblem">
            <div
              className="rfr-logo-wrap"
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
              <div className="rfr-logo-base" />
              <div className="rfr-logo-sweep" />
            </div>
            <span className="rfr-brand">RokaFlow</span>
            <p className="rfr-tagline">
              Start in minuten met uw organisatie.
            </p>
            <div className="rfr-trust">
              <div className="rfr-trust-item">Veilig &amp; versleuteld</div>
              <div className="rfr-trust-item">Direct operationeel</div>
              <div className="rfr-trust-item">30 dagen gratis</div>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
