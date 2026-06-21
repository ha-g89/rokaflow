import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/axios'
import logo from '@/assets/RokaFlow_icon_dark_transparent.png'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --rfp-bg: #030812; --rfp-text: #eef0f6;
    --rfp-muted: rgba(238,240,246,0.38); --rfp-accent: #2563eb;
    --rfp-accent-lt: #60a5fa; --rfp-line: rgba(238,240,246,0.11);
    --rfp-field-bg: rgba(238,240,246,0.05); --rfp-field-bd: rgba(238,240,246,0.10);
  }
  .rfp-wrap {
    min-height: 100vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    background: var(--rfp-bg); font-family: 'DM Sans', system-ui, sans-serif;
    color: var(--rfp-text); padding: 40px 20px; position: relative; overflow: hidden;
  }
  .rfp-logo { height: 56px; object-fit: contain; opacity: 0.75; margin-bottom: 32px; animation: rfpFade 0.5s ease both; }
  .rfp-card {
    width: 100%; max-width: 400px;
    background: rgba(8,12,28,0.85); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px; padding: 36px 32px; backdrop-filter: blur(20px);
    box-shadow: 0 24px 56px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05);
    animation: rfpSlide 0.5s cubic-bezier(0.16,1,0.3,1) 0.05s both; position: relative; z-index: 1;
  }
  .rfp-heading { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 700; letter-spacing: -0.015em; color: var(--rfp-text); margin-bottom: 6px; }
  .rfp-sub { font-size: 13px; color: var(--rfp-muted); margin-bottom: 28px; line-height: 1.55; }
  .rfp-field { margin-bottom: 16px; }
  .rfp-label { display: block; font-size: 11px; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: var(--rfp-muted); margin-bottom: 7px; }
  .rfp-input {
    width: 100%; padding: 11px 14px; background: var(--rfp-field-bg); border: 1px solid var(--rfp-field-bd);
    border-radius: 8px; color: var(--rfp-text); font-size: 14px; font-family: 'DM Sans', sans-serif;
    outline: none; transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  }
  .rfp-input::placeholder { color: rgba(238,240,246,0.20); }
  .rfp-input:focus { border-color: rgba(37,99,235,0.6); background: rgba(37,99,235,0.05); box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
  .rfp-input.rfp-err { border-color: rgba(239,68,68,0.45); background: rgba(239,68,68,0.04); }
  .rfp-err-msg { margin-top: 5px; font-size: 12px; color: #f87171; font-weight: 500; }
  .rfp-api-err { padding: 10px 13px; border-radius: 8px; border: 1px solid rgba(239,68,68,0.18); background: rgba(239,68,68,0.07); font-size: 13px; color: #fca5a5; margin-bottom: 18px; }
  .rfp-submit {
    width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 12px 24px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600;
    color: var(--rfp-text); background: transparent; border: 1px solid rgba(37,99,235,0.45);
    border-radius: 8px; cursor: pointer; position: relative; overflow: hidden;
    transition: border-color 0.35s, box-shadow 0.35s, opacity 0.2s; margin-top: 8px;
  }
  .rfp-submit::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(37,99,235,0.28) 0%, rgba(37,99,235,0.12) 100%); opacity: 0; transition: opacity 0.35s; }
  .rfp-submit:hover:not(:disabled)::before { opacity: 1; }
  .rfp-submit:hover:not(:disabled) { border-color: rgba(37,99,235,0.75); box-shadow: 0 0 0 3px rgba(37,99,235,0.12), 0 8px 24px rgba(37,99,235,0.2); }
  .rfp-submit:disabled { opacity: 0.5; cursor: not-allowed; }
  .rfp-submit span { position: relative; z-index: 1; }
  .rfp-spin { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.2); border-top-color: white; border-radius: 50%; animation: rfpSpin 0.7s linear infinite; position: relative; z-index: 1; }
  .rfp-back-link { margin-top: 20px; text-align: center; font-size: 12px; }
  .rfp-back-link a { color: var(--rfp-accent-lt); text-decoration: none; font-weight: 600; transition: color 0.2s; }
  .rfp-back-link a:hover { color: white; }
  .rfp-sent { text-align: center; padding: 8px 0; }
  .rfp-sent-icon { width: 52px; height: 52px; background: rgba(37,99,235,0.12); border: 1px solid rgba(37,99,235,0.25); border-radius: 14px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px; }
  .rfp-sent h3 { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: var(--rfp-text); margin-bottom: 10px; }
  .rfp-sent p { font-size: 13px; color: var(--rfp-muted); line-height: 1.6; }
  .rfp-footer { margin-top: 24px; font-size: 12px; color: rgba(238,240,246,0.2); text-align: center; z-index: 1; position: relative; }
  @keyframes rfpFade  { from { opacity: 0 } to { opacity: 0.75 } }
  @keyframes rfpSlide { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes rfpSpin  { to { transform: rotate(360deg) } }
`

const schema = z.object({
  email: z.string().email('Voer een geldig e-mailadres in'),
})
type FormValues = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [sent, setSent]         = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = CSS
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      await api.post('/auth/forgot-password', { email: values.email })
      setSent(true)
    } catch {
      // Still show sent state — don't reveal if email exists
      setSent(true)
    }
  }

  return (
    <div className="rfp-wrap">
      <img src={logo} alt="RokaFlow" className="rfp-logo" />

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
              {apiError && <div className="rfp-api-err">{apiError}</div>}

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
  )
}
