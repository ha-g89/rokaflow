import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/axios'
import type { LoginResponse } from '@/types/auth'

const schema = z.object({
  email: z.string().email('Voer een geldig e-mailadres in'),
  password: z.string().min(1, 'Wachtwoord is verplicht'),
})
type FormValues = z.infer<typeof schema>

const CSS = `
  @keyframes rfAdminSlideUp {
    from { opacity: 0; transform: translateY(20px) scale(0.975); }
    to   { opacity: 1; transform: translateY(0)    scale(1);     }
  }
  @keyframes rfAdminSpin {
    to { transform: rotate(360deg); }
  }

  .rf-admin-card {
    animation: rfAdminSlideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .rf-admin-input {
    width: 100%;
    padding: 11px 14px;
    background: rgba(255,255,255,0.04) !important;
    border: 1px solid rgba(255,255,255,0.08) !important;
    border-radius: 10px;
    color: #f1f5f9 !important;
    font-size: 14px;
    font-family: 'DM Sans', system-ui, sans-serif;
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
    box-sizing: border-box;
  }
  .rf-admin-input::placeholder { color: rgba(148,163,184,0.35); }
  .rf-admin-input:focus {
    border-color: rgba(245,158,11,0.6) !important;
    background: rgba(245,158,11,0.05) !important;
    box-shadow: 0 0 0 3px rgba(245,158,11,0.10);
  }
  .rf-admin-input.rf-err {
    border-color: rgba(239,68,68,0.45) !important;
    background: rgba(239,68,68,0.05) !important;
  }
  .rf-admin-input.rf-err:focus {
    border-color: rgba(239,68,68,0.65) !important;
    box-shadow: 0 0 0 3px rgba(239,68,68,0.10);
  }

  .rf-admin-btn {
    width: 100%;
    padding: 12px 20px;
    border: none;
    cursor: pointer;
    background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
    color: #1c1009;
    font-size: 14px;
    font-weight: 700;
    font-family: 'DM Sans', system-ui, sans-serif;
    border-radius: 10px;
    letter-spacing: 0.01em;
    box-shadow: 0 4px 16px rgba(217,119,6,0.30);
    transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .rf-admin-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 22px rgba(217,119,6,0.42);
  }
  .rf-admin-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .rf-admin-label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: rgba(148,163,184,0.65);
    letter-spacing: 0.07em;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .rf-admin-link { color: rgba(148,163,184,0.5); text-decoration: none; transition: color 0.15s; }
  .rf-admin-link:hover { color: rgba(148,163,184,0.85); }

  .rf-admin-spin { animation: rfAdminSpin 0.75s linear infinite; }
`

export default function SuperUserLoginPage() {
  const [apiError, setApiError] = useState<string | null>(null)
  const [showPass, setShowPass] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      const { data } = await api.post<LoginResponse>('/auth/superuser/login', values)
      login(data.accessToken, data.refreshToken, data.user)
      navigate('/superuser', { replace: true })
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(detail ?? 'Inloggen mislukt.')
    }
  }

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        background: '#070810',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Dot grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(rgba(148,163,184,0.035) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        <div className="rf-admin-card" style={{ width: '100%', maxWidth: '380px', position: 'relative', zIndex: 1 }}>

          {/* Brand */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h1 style={{ margin: 0, fontSize: '21px', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              Admin Panel
            </h1>
            <p style={{ margin: '5px 0 0', fontSize: '13px', color: 'rgba(148,163,184,0.6)' }}>
              Platformbeheer
            </p>
          </div>

          {/* Card */}
          <div style={{
            background: 'rgba(8,12,24,0.85)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '20px',
            padding: '30px',
            backdropFilter: 'blur(24px)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 28px 60px rgba(0,0,0,0.6)',
          }}>
            <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

              {/* Email */}
              <div>
                <label className="rf-admin-label">E-mailadres</label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="admin@platform.nl"
                  {...register('email')}
                  className={`rf-admin-input${errors.email ? ' rf-err' : ''}`}
                />
                {errors.email && (
                  <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#f87171', fontWeight: 500 }}>
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="rf-admin-label">Wachtwoord</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...register('password')}
                    className={`rf-admin-input${errors.password ? ' rf-err' : ''}`}
                    style={{ paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPass(p => !p)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                      color: 'rgba(148,163,184,0.4)', display: 'flex', alignItems: 'center',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(148,163,184,0.75)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(148,163,184,0.4)')}
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
                {errors.password && (
                  <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#f87171', fontWeight: 500 }}>
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* API error */}
              {apiError && (
                <div style={{
                  padding: '10px 14px', borderRadius: '9px',
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.16)',
                  fontSize: '13px', color: '#fca5a5',
                }}>
                  {apiError}
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={isSubmitting} className="rf-admin-btn" style={{ marginTop: '4px' }}>
                {isSubmitting ? (
                  <>
                    <svg className="rf-admin-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Bezig…
                  </>
                ) : 'Inloggen als Admin'}
              </button>
            </form>
          </div>

          {/* Footer link */}
          <p style={{ margin: '18px 0 0', textAlign: 'center', fontSize: '12px' }}>
            <a href="/login" className="rf-admin-link">← Terug naar reguliere login</a>
          </p>
        </div>
      </div>
    </>
  )
}
