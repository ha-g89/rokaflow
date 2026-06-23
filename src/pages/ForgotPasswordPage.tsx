import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/axios'
import logo from '@/assets/RokaFlow_icon_dark_transparent.png'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --rfp-bg:        #f0f4ff;
    --rfp-text:      #0f172a;
    --rfp-text-2:    #334155;
    --rfp-muted:     #64748b;
    --rfp-accent:    #2563eb;
    --rfp-accent-dk: #1d4ed8;
    --rfp-line:      rgba(15,23,42,0.08);
    --rfp-field-bg:  #f8fafc;
    --rfp-field-bd:  rgba(15,23,42,0.10);
  }
  .rfp-wrap {
    min-height: 100vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    background: var(--rfp-bg);
    font-family: 'DM Sans', system-ui, sans-serif;
    color: var(--rfp-text); padding: 40px 20px;
  }
  .rfp-logo-wrap {
    width: 52px; height: 52px; position: relative;
    flex-shrink: 0; margin-bottom: 24px;
    animation: rfpFloat 8s ease-in-out 1s infinite;
  }
  .rfp-logo-base { position: absolute; inset: 0; background: rgba(15,23,42,0.18); }
  .rfp-logo-sweep {
    position: absolute; inset: 0;
    background: linear-gradient(105deg, transparent 15%, rgba(37,99,235,0.55) 38%, rgba(96,165,250,0.95) 50%, rgba(37,99,235,0.55) 62%, transparent 85%);
    transform: translateX(-200%);
    animation: rfpLogoSweep 4s cubic-bezier(0.4,0,0.2,1) 1.8s infinite;
  }
  @keyframes rfpLogoSweep { 0% { transform: translateX(-200%); } 100% { transform: translateX(300%); } }
  @keyframes rfpFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  .rfp-card {
    width: 100%; max-width: 400px;
    background: #ffffff; border: 1px solid var(--rfp-line);
    border-radius: 16px; padding: 36px 40px;
    box-shadow: 0 1px 3px rgba(15,23,42,0.05), 0 8px 24px rgba(15,23,42,0.08);
    animation: rfpSlide 0.45s cubic-bezier(0.16,1,0.3,1) 0.05s both;
  }
  .rfp-heading {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 26px; font-weight: 800; letter-spacing: -0.02em;
    color: var(--rfp-text); margin-bottom: 6px;
  }
  .rfp-sub { font-size: 14px; color: var(--rfp-muted); margin-bottom: 24px; line-height: 1.55; }
  .rfp-field { margin-bottom: 18px; }
  .rfp-label { display: block; font-size: 12px; font-weight: 600; color: var(--rfp-text-2); margin-bottom: 7px; }
  .rfp-input {
    width: 100%; padding: 11px 14px;
    background: var(--rfp-field-bg); border: 1.5px solid var(--rfp-field-bd);
    border-radius: 9px; color: var(--rfp-text); font-size: 14px;
    font-family: 'DM Sans', sans-serif; outline: none;
    transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
    -webkit-appearance: none;
  }
  .rfp-input::placeholder { color: rgba(15,23,42,0.28); }
  .rfp-input:focus { border-color: var(--rfp-accent); background: #ffffff; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
  .rfp-input.rfp-err { border-color: #ef4444; background: #fff5f5; }
  .rfp-err-msg { margin-top: 5px; font-size: 12px; color: #ef4444; font-weight: 500; }
  .rfp-api-err {
    padding: 10px 13px; border-radius: 9px;
    border: 1.5px solid #fecaca; background: #fef2f2;
    font-size: 13px; color: #dc2626; margin-bottom: 18px;
  }
  .rfp-submit {
    width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 12px 24px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600;
    color: #ffffff; background: var(--rfp-accent); border: none;
    border-radius: 9px; cursor: pointer;
    transition: background 0.18s, box-shadow 0.18s, transform 0.12s, opacity 0.2s;
    margin-top: 6px; box-shadow: 0 1px 2px rgba(37,99,235,0.20);
  }
  .rfp-submit:hover:not(:disabled) {
    background: var(--rfp-accent-dk);
    box-shadow: 0 6px 20px rgba(37,99,235,0.35);
    transform: translateY(-1px);
  }
  .rfp-submit:disabled { opacity: 0.5; cursor: not-allowed; }
  .rfp-spin {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.35); border-top-color: white;
    border-radius: 50%; animation: rfpSpin 0.7s linear infinite;
  }
  .rfp-back-link { margin-top: 20px; text-align: center; font-size: 13px; color: var(--rfp-muted); }
  .rfp-back-link a { color: var(--rfp-accent); text-decoration: none; font-weight: 600; transition: color 0.16s; }
  .rfp-back-link a:hover { color: var(--rfp-accent-dk); }
  .rfp-sent { text-align: center; padding: 8px 0; }
  .rfp-sent-icon {
    width: 52px; height: 52px; background: #eff6ff; border: 1px solid #bfdbfe;
    border-radius: 14px; display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px; font-size: 24px;
  }
  .rfp-sent h3 { font-family: 'Bricolage Grotesque', sans-serif; font-size: 20px; font-weight: 800; color: var(--rfp-text); margin-bottom: 10px; }
  .rfp-sent p { font-size: 13px; color: var(--rfp-muted); line-height: 1.6; }
  .rfp-footer { margin-top: 24px; font-size: 12px; color: rgba(15,23,42,0.25); text-align: center; }
  @keyframes rfpSlide { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes rfpSpin  { to { transform: rotate(360deg); } }

  /* ── Dark mode ── */
  html.dark .rfp-wrap {
    --rfp-bg: #030812; --rfp-text: #eef0f6; --rfp-text-2: rgba(238,240,246,0.72);
    --rfp-muted: rgba(238,240,246,0.42); --rfp-accent-dk: #3b82f6;
    --rfp-line: rgba(238,240,246,0.07); --rfp-field-bg: rgba(238,240,246,0.05); --rfp-field-bd: rgba(238,240,246,0.10);
    background-color: #030812;
  }
  html.dark .rfp-card { background: rgba(8,12,28,0.95); border-color: rgba(238,240,246,0.07); box-shadow: 0 24px 56px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04); }
  html.dark .rfp-logo-base { background: rgba(238,240,246,0.25); }
  html.dark .rfp-wrap .rfp-input { background: var(--rfp-field-bg); border-color: var(--rfp-field-bd); color: var(--rfp-text); }
  html.dark .rfp-wrap .rfp-input::placeholder { color: rgba(238,240,246,0.22); }
  html.dark .rfp-wrap .rfp-input:focus { border-color: rgba(37,99,235,0.7); background: rgba(37,99,235,0.08); box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }
  html.dark .rfp-wrap .rfp-input.rfp-err { border-color: rgba(239,68,68,0.45); background: rgba(239,68,68,0.05); }
  html.dark .rfp-sent-icon { background: rgba(37,99,235,0.12); border-color: rgba(37,99,235,0.25); }
  html.dark .rfp-footer { color: rgba(238,240,246,0.18); }
`

const schema = z.object({
  email: z.string().email('Voer een geldig e-mailadres in'),
})
type FormValues = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    try {
      await api.post('/auth/forgot-password', { email: values.email })
    } catch {
      // intentionally ignored — anti-enumeration
    }
    setSent(true)
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="rfp-wrap">

        <div
          className="rfp-logo-wrap"
          style={{
            WebkitMaskImage: `url(${logo})`,
            maskImage: `url(${logo})`,
            WebkitMaskSize: 'contain', maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center', maskPosition: 'center',
          }}
        >
          <div className="rfp-logo-base" />
          <div className="rfp-logo-sweep" />
        </div>

        <div className="rfp-card">
          {sent ? (
            <div className="rfp-sent">
              <div className="rfp-sent-icon">✉</div>
              <h3>E-mail verstuurd</h3>
              <p>
                Als er een account bestaat voor dit e-mailadres, ontvang je binnen enkele minuten een e-mail
                met een link om je wachtwoord opnieuw in te stellen. Check ook je spam-map.
              </p>
            </div>
          ) : (
            <>
              <h1 className="rfp-heading">Wachtwoord vergeten?</h1>
              <p className="rfp-sub">
                Vul je e-mailadres in. Als er een account bestaat, sturen we je een link om een nieuw wachtwoord in te stellen.
              </p>

              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="rfp-field">
                  <label className="rfp-label">E-mailadres</label>
                  <input
                    {...register('email')}
                    type="email"
                    className={`rfp-input${errors.email ? ' rfp-err' : ''}`}
                    placeholder="u@organisatie.nl"
                    autoFocus
                  />
                  {errors.email && <p className="rfp-err-msg">{errors.email.message}</p>}
                </div>

                <button type="submit" className="rfp-submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? <><div className="rfp-spin" /><span>Versturen…</span></>
                    : <span>Reset-link versturen →</span>
                  }
                </button>
              </form>
            </>
          )}
        </div>

        <div className="rfp-back-link">
          <a onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>← Terug naar inloggen</a>
        </div>

        <p className="rfp-footer">© {new Date().getFullYear()} RokaFlow</p>
      </div>
    </>
  )
}
