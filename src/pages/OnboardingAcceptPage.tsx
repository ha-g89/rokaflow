import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import api from '@/lib/axios'
import logo from '@/assets/RokaFlow_icon_dark_transparent.png'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --onb-bg:        #ffffff;
    --onb-text:      #0f172a;
    --onb-text-2:    #334155;
    --onb-muted:     #64748b;
    --onb-accent:    #2563eb;
    --onb-accent-dk: #1d4ed8;
    --onb-line:      rgba(15,23,42,0.08);
    --onb-field-bg:  #f8fafc;
    --onb-field-bd:  rgba(15,23,42,0.10);
  }
  .onb-wrap {
    min-height: 100vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    background: var(--onb-bg);
    font-family: 'DM Sans', system-ui, sans-serif;
    color: var(--onb-text); padding: 40px 20px;
  }
  .onb-logo-wrap {
    width: 52px; height: 52px; position: relative;
    flex-shrink: 0; margin-bottom: 24px;
    animation: onbFloat 8s ease-in-out 1s infinite;
  }
  .onb-logo-base { position: absolute; inset: 0; background: rgba(15,23,42,0.18); }
  .onb-logo-sweep {
    position: absolute; inset: 0;
    background: linear-gradient(105deg, transparent 15%, rgba(37,99,235,0.55) 38%, rgba(96,165,250,0.95) 50%, rgba(37,99,235,0.55) 62%, transparent 85%);
    transform: translateX(-200%);
    animation: onbLogoSweep 4s cubic-bezier(0.4,0,0.2,1) 1.8s infinite;
  }
  @keyframes onbLogoSweep { 0% { transform: translateX(-200%); } 100% { transform: translateX(300%); } }
  @keyframes onbFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  .onb-card {
    width: 100%; max-width: 440px;
    background: #ffffff; border: none;
    border-radius: 16px; padding: 36px 40px;
    box-shadow: 0 1px 3px rgba(15,23,42,0.05), 0 8px 24px rgba(15,23,42,0.08);
    animation: onbSlide 0.45s cubic-bezier(0.16,1,0.3,1) 0.05s both;
  }
  .onb-heading {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 26px; font-weight: 800; letter-spacing: -0.02em;
    color: var(--onb-text); margin-bottom: 6px;
  }
  .onb-sub { font-size: 14px; color: var(--onb-muted); margin-bottom: 24px; line-height: 1.6; }
  .onb-strong { font-weight: 600; color: var(--onb-text-2); }
  .onb-field { margin-bottom: 18px; }
  .onb-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .onb-label { display: block; font-size: 12px; font-weight: 600; color: var(--onb-text-2); margin-bottom: 7px; }
  .onb-input-wrap { position: relative; }
  .onb-input {
    width: 100%; padding: 11px 14px;
    background: var(--onb-field-bg); border: 1.5px solid var(--onb-field-bd);
    border-radius: 9px; color: var(--onb-text); font-size: 14px;
    font-family: 'DM Sans', sans-serif; outline: none;
    transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
    -webkit-appearance: none;
  }
  .onb-input.has-eye { padding-right: 40px; }
  .onb-input::placeholder { color: rgba(15,23,42,0.28); }
  .onb-input:focus { border-color: var(--onb-accent); background: #ffffff; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
  .onb-input.onb-err { border-color: #ef4444; background: #fff5f5; }
  .onb-eye {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: var(--onb-muted);
    display: flex; align-items: center; padding: 4px; transition: color 0.16s;
  }
  .onb-eye:hover { color: var(--onb-text); }
  .onb-err-msg { margin-top: 5px; font-size: 12px; color: #ef4444; font-weight: 500; }
  .onb-api-err {
    padding: 10px 13px; border-radius: 9px;
    border: 1.5px solid #fecaca; background: #fef2f2;
    font-size: 13px; color: #dc2626; margin-bottom: 18px;
  }
  .onb-consent-row {
    display: flex; align-items: flex-start; gap: 10px;
    margin-bottom: 22px; margin-top: 4px;
  }
  .onb-consent-checkbox {
    width: 16px; height: 16px; margin-top: 2px; flex-shrink: 0;
    accent-color: var(--onb-accent); cursor: pointer;
  }
  .onb-consent-label { font-size: 13px; color: var(--onb-muted); line-height: 1.5; cursor: pointer; }
  .onb-submit {
    width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 12px 24px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600;
    color: #ffffff; background: var(--onb-accent); border: none;
    border-radius: 9px; cursor: pointer;
    transition: background 0.18s, box-shadow 0.18s, transform 0.12s, opacity 0.2s;
    margin-top: 6px; box-shadow: 0 1px 2px rgba(37,99,235,0.20);
  }
  .onb-submit:hover:not(:disabled) {
    background: var(--onb-accent-dk);
    box-shadow: 0 6px 20px rgba(37,99,235,0.35);
    transform: translateY(-1px);
  }
  .onb-submit:disabled { opacity: 0.5; cursor: not-allowed; }
  .onb-spin {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.35); border-top-color: white;
    border-radius: 50%; animation: onbSpin 0.7s linear infinite;
  }
  .onb-spin-blue {
    width: 20px; height: 20px;
    border: 2px solid rgba(37,99,235,0.15); border-top-color: var(--onb-accent);
    border-radius: 50%; animation: onbSpin 0.7s linear infinite;
    margin: 0 auto;
  }
  .onb-back-link { margin-top: 20px; text-align: center; font-size: 13px; color: var(--onb-muted); }
  .onb-back-link a { color: var(--onb-accent); text-decoration: none; font-weight: 600; transition: color 0.16s; cursor: pointer; }
  .onb-back-link a:hover { color: var(--onb-accent-dk); }
  .onb-status { text-align: center; padding: 8px 0; }
  .onb-status-icon {
    width: 52px; height: 52px; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px; font-size: 24px;
  }
  .onb-status-icon.invalid  { background: #fef2f2; border: 1px solid #fecaca; }
  .onb-status-icon.expired  { background: #fff7ed; border: 1px solid #fed7aa; }
  .onb-status-icon.cancelled { background: #f8fafc; border: 1px solid var(--onb-field-bd); }
  .onb-status-icon.accepted { background: #eff6ff; border: 1px solid #bfdbfe; }
  .onb-status-icon.success  { background: #f0fdf4; border: 1px solid #bbf7d0; }
  .onb-status h3 { font-family: 'Bricolage Grotesque', sans-serif; font-size: 20px; font-weight: 800; color: var(--onb-text); margin-bottom: 8px; }
  .onb-status p { font-size: 13px; color: var(--onb-muted); margin-bottom: 20px; line-height: 1.55; }
  .onb-status-link { font-size: 13px; color: var(--onb-accent); text-decoration: none; font-weight: 600; transition: color 0.16s; }
  .onb-status-link:hover { color: var(--onb-accent-dk); }
  .onb-status-btn {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 11px 22px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
    color: #ffffff; background: var(--onb-accent); border: none; border-radius: 9px; cursor: pointer;
    transition: background 0.18s, box-shadow 0.18s, transform 0.12s;
  }
  .onb-status-btn:hover { background: var(--onb-accent-dk); box-shadow: 0 6px 20px rgba(37,99,235,0.30); transform: translateY(-1px); }
  .onb-footer { margin-top: 24px; font-size: 12px; color: rgba(15,23,42,0.25); text-align: center; }
  .onb-checking { text-align: center; padding: 24px 0; }
  .onb-checking p { font-size: 13px; color: var(--onb-muted); margin-top: 14px; }
  @keyframes onbSlide { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes onbSpin  { to { transform: rotate(360deg); } }

  /* ── Dark mode: volgt de OS/browser-voorkeur (prefers-color-scheme), er is hier
     geen handmatige schakelaar zoals in de ingelogde app ── */
  @media (prefers-color-scheme: dark) {
    .onb-wrap {
      --onb-bg: #030812; --onb-text: #eef0f6; --onb-text-2: rgba(238,240,246,0.72);
      --onb-muted: rgba(238,240,246,0.42); --onb-accent-dk: #3b82f6;
      --onb-line: rgba(238,240,246,0.07); --onb-field-bg: rgba(238,240,246,0.05); --onb-field-bd: rgba(238,240,246,0.10);
      background-color: #030812;
    }
    .onb-card { background: rgba(8,12,28,0.95); border-color: rgba(238,240,246,0.07); box-shadow: 0 24px 56px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04); }
    .onb-logo-base { background: rgba(238,240,246,0.25); }
    .onb-wrap .onb-input { background: rgba(238,240,246,0.05); border-color: rgba(238,240,246,0.10); color: var(--onb-text); box-shadow: inset 0 1px 3px 0 rgba(0,0,0,0.4); }
    .onb-wrap .onb-input::placeholder { color: rgba(238,240,246,0.22); }
    .onb-wrap .onb-input:focus { border-color: rgba(37,99,235,0.7); background: rgba(37,99,235,0.08); box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }
    .onb-wrap .onb-input.onb-err { border-color: rgba(239,68,68,0.45); background: rgba(239,68,68,0.05); }
    .onb-api-err { background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.2); color: #fca5a5; }
    .onb-status-icon.invalid { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.22); }
    .onb-status-icon.expired { background: rgba(249,115,22,0.1); border-color: rgba(249,115,22,0.25); }
    .onb-status-icon.cancelled { background: rgba(238,240,246,0.05); border-color: rgba(238,240,246,0.10); }
    .onb-status-icon.accepted { background: rgba(37,99,235,0.12); border-color: rgba(37,99,235,0.25); }
    .onb-status-icon.success { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.22); }
    .onb-footer { color: rgba(238,240,246,0.18); }
  }
`

const schema = z.object({
  firstName: z.string().min(1, 'Voornaam is verplicht').max(100),
  tussenvoegsel: z.string().max(50).optional(),
  lastName: z.string().min(1, 'Achternaam is verplicht').max(100),
  password: z.string().min(8, 'Minimaal 8 tekens'),
  confirmPassword: z.string().min(1, 'Bevestig je wachtwoord'),
  consent: z.literal(true, { error: 'U moet akkoord gaan om door te gaan' }),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Wachtwoorden komen niet overeen',
  path: ['confirmPassword'],
})
type FormValues = z.infer<typeof schema>

type OnboardingStatus = 0 | 1 | 2 | 3

interface OnboardingInfo {
  tenantName: string
  mspName: string
  ownerName: string
  ownerEmail: string
  status: OnboardingStatus
  expiresAt: string
}

type Stage = 'checking' | 'invalid' | 'pending' | 'accepted' | 'expired' | 'cancelled' | 'success'

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: '', lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

export default function OnboardingAcceptPage() {
  const [searchParams] = useSearchParams()
  const token          = searchParams.get('token') ?? ''
  const navigate        = useNavigate()

  const [info, setInfo]         = useState<OnboardingInfo | null>(null)
  const [stage, setStage]       = useState<Stage>('checking')
  const [showPw, setShowPw]     = useState(false)
  const [showCpw, setShowCpw]   = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!token) { setStage('invalid'); return }
    api.get<OnboardingInfo>(`/onboarding/${token}`)
      .then(r => {
        setInfo(r.data)
        if (r.data.status === 0) {
          const { firstName, lastName } = splitName(r.data.ownerName)
          reset({ firstName, tussenvoegsel: '', lastName, password: '', confirmPassword: '' })
          setStage('pending')
        } else if (r.data.status === 1) {
          setStage('accepted')
        } else if (r.data.status === 2) {
          setStage('expired')
        } else {
          setStage('cancelled')
        }
      })
      .catch(() => setStage('invalid'))
  }, [token, reset])

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      await api.post('/onboarding/accept', {
        token,
        firstName: values.firstName,
        tussenvoegsel: values.tussenvoegsel || '',
        lastName: values.lastName,
        password: values.password,
        confirmPassword: values.confirmPassword,
        consentGiven: true,
      })
      setStage('success')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(msg ?? 'Er is iets misgegaan. Probeer het opnieuw.')
    }
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="onb-wrap">

        <div
          className="onb-logo-wrap"
          style={{
            WebkitMaskImage: `url(${logo})`,
            maskImage: `url(${logo})`,
            WebkitMaskSize: 'contain', maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center', maskPosition: 'center',
          }}
        >
          <div className="onb-logo-base" />
          <div className="onb-logo-sweep" />
        </div>

        <div className="onb-card">
          {stage === 'checking' && (
            <div className="onb-checking">
              <div className="onb-spin-blue" />
              <p>Link controleren…</p>
            </div>
          )}

          {stage === 'invalid' && (
            <div className="onb-status">
              <div className="onb-status-icon invalid">⚠️</div>
              <h3>Link ongeldig</h3>
              <p>Deze link is ongeldig of niet meer beschikbaar.</p>
              <a href="/" className="onb-status-link">Naar homepagina →</a>
            </div>
          )}

          {stage === 'expired' && (
            <div className="onb-status">
              <div className="onb-status-icon expired">⏳</div>
              <h3>Uitnodiging verlopen</h3>
              <p>Deze uitnodiging is verlopen. Vraag de MSP om een nieuwe uitnodiging.</p>
              <a href="/" className="onb-status-link">Naar homepagina →</a>
            </div>
          )}

          {stage === 'cancelled' && (
            <div className="onb-status">
              <div className="onb-status-icon cancelled">🚫</div>
              <h3>Aanvraag geannuleerd</h3>
              <p>Deze aanvraag is geannuleerd.</p>
              <a href="/" className="onb-status-link">Naar homepagina →</a>
            </div>
          )}

          {stage === 'accepted' && (
            <div className="onb-status">
              <div className="onb-status-icon accepted">✅</div>
              <h3>Al goedgekeurd</h3>
              <p>Deze uitnodiging is al geaccepteerd. U kunt inloggen met uw account.</p>
              <button type="button" className="onb-status-btn" onClick={() => navigate('/login')}>Naar inloggen</button>
            </div>
          )}

          {stage === 'success' && (
            <div className="onb-status">
              <div className="onb-status-icon success">✓</div>
              <h3>Omgeving geactiveerd</h3>
              <p>Omgeving geactiveerd. U kunt nu inloggen met uw e-mailadres.</p>
              <button type="button" className="onb-status-btn" onClick={() => navigate('/login')}>Naar inloggen</button>
            </div>
          )}

          {stage === 'pending' && info && (
            <>
              <h1 className="onb-heading">Goedkeuring beheer</h1>
              <p className="onb-sub">
                <span className="onb-strong">{info.mspName}</span> wil de omgeving{' '}
                <span className="onb-strong">{info.tenantName}</span> in RokaFlow beheren. Door te
                accepteren maakt u een beheerdersaccount aan voor{' '}
                <span className="onb-strong">{info.ownerEmail}</span> en geeft u {info.mspName} toegang
                tot deze omgeving.
              </p>

              <form onSubmit={handleSubmit(onSubmit)}>
                {apiError && <div className="onb-api-err">{apiError}</div>}

                <div className="onb-row onb-field">
                  <div>
                    <label className="onb-label">Voornaam</label>
                    <input
                      {...register('firstName')}
                      className={`onb-input${errors.firstName ? ' onb-err' : ''}`}
                      placeholder="Jan"
                      autoFocus
                    />
                    {errors.firstName && <p className="onb-err-msg">{errors.firstName.message}</p>}
                  </div>
                  <div>
                    <label className="onb-label">Tussenvoegsel</label>
                    <input
                      {...register('tussenvoegsel')}
                      className="onb-input"
                      placeholder="van der"
                    />
                  </div>
                </div>

                <div className="onb-field">
                  <label className="onb-label">Achternaam</label>
                  <input
                    {...register('lastName')}
                    className={`onb-input${errors.lastName ? ' onb-err' : ''}`}
                    placeholder="Berg"
                  />
                  {errors.lastName && <p className="onb-err-msg">{errors.lastName.message}</p>}
                </div>

                <div className="onb-field">
                  <label className="onb-label">Wachtwoord</label>
                  <div className="onb-input-wrap">
                    <input
                      {...register('password')}
                      type={showPw ? 'text' : 'password'}
                      className={`onb-input has-eye${errors.password ? ' onb-err' : ''}`}
                      placeholder="Minimaal 8 tekens"
                    />
                    <button type="button" className="onb-eye" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.password && <p className="onb-err-msg">{errors.password.message}</p>}
                </div>

                <div className="onb-field">
                  <label className="onb-label">Wachtwoord bevestigen</label>
                  <div className="onb-input-wrap">
                    <input
                      {...register('confirmPassword')}
                      type={showCpw ? 'text' : 'password'}
                      className={`onb-input has-eye${errors.confirmPassword ? ' onb-err' : ''}`}
                      placeholder="Herhaal wachtwoord"
                    />
                    <button type="button" className="onb-eye" onClick={() => setShowCpw(v => !v)} tabIndex={-1}>
                      {showCpw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="onb-err-msg">{errors.confirmPassword.message}</p>}
                </div>

                <div className="onb-consent-row">
                  <input
                    {...register('consent')}
                    type="checkbox"
                    id="onb-consent"
                    className="onb-consent-checkbox"
                  />
                  <label htmlFor="onb-consent" className="onb-consent-label">
                    Ik ga akkoord dat {info.mspName} deze omgeving beheert
                  </label>
                </div>
                {errors.consent && <p className="onb-err-msg" style={{ marginTop: -14, marginBottom: 14 }}>{errors.consent.message}</p>}

                <button type="submit" className="onb-submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? <><div className="onb-spin" /><span>Bezig…</span></>
                    : <span>Accepteren en account aanmaken →</span>
                  }
                </button>
              </form>
            </>
          )}
        </div>

        <div className="onb-back-link">
          <a onClick={() => navigate('/login')}>← Terug naar inloggen</a>
        </div>

        <p className="onb-footer">© {new Date().getFullYear()} RokaFlow</p>
      </div>
    </>
  )
}
