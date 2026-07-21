import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import logo from '@/assets/RokaFlow_icon_dark_transparent.png'

const ROLE_HOME: Record<string, string> = {
  superuser: '/superuser', msp_admin: '/org', msp_member: '/org',
  portal_admin: '/client', employee: '/mijn-omgeving',
}

// ── 3D Tilt Card ──────────────────────────────────────────────────────────────

function TiltCard({ children, featured = false, delay = '0s' }: {
  children: React.ReactNode
  featured?: boolean
  delay?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current; if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left - r.width  / 2) / (r.width  / 2)
    const y = (e.clientY - r.top  - r.height / 2) / (r.height / 2)
    el.style.transition = 'box-shadow 0.15s ease'
    el.style.transform  = `perspective(1000px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateZ(${featured ? 28 : 14}px)`
  }, [featured])

  const onLeave = useCallback(() => {
    const el = ref.current; if (!el) return
    el.style.transition = 'transform 0.7s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease'
    el.style.transform  = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(${featured ? 16 : 0}px)`
  }, [featured])

  return (
    <div
      ref={ref}
      className={`pr-card${featured ? ' pr-card-feat' : ''}`}
      style={{ animationDelay: delay }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  )
}

// ── Animated counter ──────────────────────────────────────────────────────────

function AnimPrice({ value }: { value: number }) {
  const [shown, setShown] = useState(0)
  const prev = useRef(value)

  useEffect(() => {
    const from = prev.current
    prev.current = value
    const diff = value - from
    if (diff === 0) return
    const dur = 550
    const fps = 60
    const steps = (dur / 1000) * fps
    let frame = 0
    const timer = setInterval(() => {
      frame++
      const t = Math.min(frame / steps, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setShown(Math.round(from + diff * ease))
      if (t >= 1) clearInterval(timer)
    }, 1000 / fps)
    return () => clearInterval(timer)
  }, [value])

  // Initial count-up on mount
  useEffect(() => {
    const dur = 800
    const fps = 60
    const steps = (dur / 1000) * fps
    let frame = 0
    const timer = setInterval(() => {
      frame++
      const t = Math.min(frame / steps, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setShown(Math.round(value * ease))
      if (t >= 1) clearInterval(timer)
    }, 1000 / fps)
    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{shown}</>
}

// ── Check icon ────────────────────────────────────────────────────────────────

function Check({ featured }: { featured?: boolean }) {
  return (
    <span className={`pr-check${featured ? ' pr-check-feat' : ''}`}>
      <svg viewBox="0 0 10 8" fill="none">
        <path d="M1 4l2.5 2.5L9 1" stroke={featured ? '#93c5fd' : '#60a5fa'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

// ── Feature lists ─────────────────────────────────────────────────────────────

const STARTER = [
  'Tot 100 geregistreerde assets',
  'Volledig medewerkerbeheer',
  'Hardware & apparatuur tracking',
  'Licenties & software beheer',
  'Telefonie & simkaarten',
  '1 portaalbeheerder',
  'E-mail ondersteuning',
]

const PRO = [
  '100 tot 500 geregistreerde assets',
  'Alles uit Portaal Starter',
  'Meerdere portaalbeheerders',
  'Rapportages & grafieken',
  'Excel & CSV export',
  'MSP-koppeling mogelijk',
  'Prioriteit ondersteuning',
]

const MSP = [
  'Onbeperkt clients beheren',
  'Alle portaalfuncties per client',
  'Multi-tenant MSP dashboard',
  'Client overdracht via transfer-code',
  'Volledige audit logs per client',
  'Geavanceerde rapportages',
  'API-toegang (binnenkort)',
  'Dedicated ondersteuning',
]

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  @property --pr-angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }


  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .pr-page {
    min-height: 100vh;
    background: #050d1a;
    color: #e8f1ff;
    font-family: 'DM Sans', system-ui, sans-serif;
    overflow-x: hidden;
    position: relative;
  }


  /* ── Dot grid ── */
  .pr-page::after {
    content: '';
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image: radial-gradient(rgba(99,150,255,0.055) 1px, transparent 1px);
    background-size: 28px 28px;
  }

  /* ── Nav ── */
  .pr-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 56px; height: 62px;
    background: rgba(5,13,26,0.88);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255,255,255,0.055);
  }
  .pr-nav-logo { height: 44px; object-fit: contain; filter: brightness(0) invert(1) opacity(0.7); }
  .pr-nav-actions { display: flex; align-items: center; gap: 20px; }
  .pr-nav-link {
    font-size: 13.5px; font-weight: 500; color: rgba(232,241,255,0.45);
    background: none; border: none; cursor: pointer;
    transition: color 0.15s; display: flex; align-items: center; gap: 5px;
  }
  .pr-nav-link:hover { color: #e8f1ff; }
  .pr-nav-link em { font-style: normal; transition: transform 0.15s; }
  .pr-nav-link:hover em { transform: translateX(3px); }
  .pr-nav-cta {
    font-size: 13.5px; font-weight: 600; color: #fff;
    background: #2563eb; border: none; cursor: pointer;
    padding: 8px 18px; border-radius: 8px;
    transition: background 0.18s, box-shadow 0.18s;
  }
  .pr-nav-cta:hover { background: #1d4ed8; box-shadow: 0 4px 16px rgba(37,99,235,0.4); }

  /* ── Hero ── */
  .pr-hero {
    position: relative; z-index: 1;
    padding: 138px 40px 52px;
    text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 18px;
  }
  .pr-hero-tag {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 10.5px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
    color: #60a5fa;
    background: rgba(37,99,235,0.12); border: 1px solid rgba(37,99,235,0.28);
    padding: 5px 14px; border-radius: 99px;
    animation: prFadeIn 0.5s ease both;
  }
  .pr-tag-dot {
    width: 5px; height: 5px; border-radius: 50%; background: #60a5fa;
    animation: prTagPulse 2.2s ease-in-out infinite;
  }
  @keyframes prTagPulse { 0%,100%{opacity:.55;transform:scale(1)} 50%{opacity:1;transform:scale(1.5)} }
  @keyframes prFadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes prSlideUp  { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }

  .pr-hero-h {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: clamp(38px, 4.6vw, 68px);
    font-weight: 800; line-height: 1.06; letter-spacing: -0.02em;
    color: #f0f7ff;
    animation: prSlideUp 0.65s cubic-bezier(0.16,1,0.3,1) 0.08s both;
  }
  .pr-hero-h em {
    font-style: normal;
    background: linear-gradient(128deg, #60a5fa 0%, #93c5fd 40%, #7dd3fc 80%, #38bdf8 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .pr-hero-sub {
    font-size: 16.5px; color: rgba(232,241,255,0.48); max-width: 440px; line-height: 1.68;
    animation: prSlideUp 0.65s cubic-bezier(0.16,1,0.3,1) 0.18s both;
  }

  /* ── Toggle ── */
  .pr-toggle-row {
    position: relative; z-index: 1;
    display: flex; align-items: center; gap: 14px; justify-content: center;
    padding-bottom: 12px;
    animation: prSlideUp 0.65s cubic-bezier(0.16,1,0.3,1) 0.26s both;
  }
  .pr-toggle-label { font-size: 13px; font-weight: 500; color: rgba(232,241,255,0.38); transition: color 0.2s; }
  .pr-toggle-label.pr-tl-on { color: #e8f1ff; }
  .pr-toggle {
    width: 50px; height: 27px; border-radius: 99px; cursor: pointer;
    background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.11);
    position: relative; transition: background 0.22s, border-color 0.22s;
  }
  .pr-toggle.pr-tog-on { background: rgba(37,99,235,0.35); border-color: rgba(37,99,235,0.55); }
  .pr-toggle-knob {
    position: absolute; top: 3px; left: 3px;
    width: 19px; height: 19px; border-radius: 50%;
    background: rgba(232,241,255,0.65);
    transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1), background 0.2s;
  }
  .pr-toggle.pr-tog-on .pr-toggle-knob { transform: translateX(23px); background: #60a5fa; }
  .pr-save-pill {
    font-size: 10px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase;
    color: #4ade80; background: rgba(74,222,128,0.12); border: 1px solid rgba(74,222,128,0.28);
    padding: 3px 8px; border-radius: 6px;
    opacity: 0; transform: translateX(-4px);
    transition: opacity 0.2s ease, transform 0.2s ease;
  }
  .pr-save-pill.pr-pill-on { opacity: 1; transform: translateX(0); }

  /* ── Cards grid ── */
  .pr-cards {
    position: relative; z-index: 1;
    display: grid; grid-template-columns: repeat(3,1fr); gap: 18px;
    max-width: 1060px; margin: 0 auto;
    padding: 0 28px 88px;
    align-items: center;
  }

  .pr-card {
    background: rgba(255,255,255,0.032);
    border: 1px solid rgba(255,255,255,0.075);
    border-radius: 22px; padding: 30px 26px;
    position: relative; overflow: hidden;
    will-change: transform;
    transform: perspective(1000px) rotateX(0) rotateY(0) translateZ(0);
    transition: transform 0.7s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease;
    animation: prCardIn 0.8s cubic-bezier(0.16,1,0.3,1) both;
  }

  .pr-card-feat {
    background: rgba(37,99,235,0.075);
    border-color: rgba(37,99,235,0.32);
    box-shadow:
      inset 0 0 0 1px rgba(37,99,235,0.14),
      0 20px 60px rgba(37,99,235,0.16),
      0 0 90px rgba(37,99,235,0.08);
    transform: perspective(1000px) rotateX(0) rotateY(0) translateZ(16px);
  }
  .pr-card-feat:hover {
    box-shadow:
      inset 0 0 0 1px rgba(37,99,235,0.22),
      0 28px 80px rgba(37,99,235,0.26),
      0 0 130px rgba(37,99,235,0.12);
  }

  @keyframes prCardIn {
    from { opacity: 0; transform: perspective(1000px) translateY(44px) rotateX(6deg); }
    to   { opacity: 1; transform: perspective(1000px) translateY(0)    rotateX(0deg); }
  }

  /* ── Rotating border wrapper ── */
  .pr-feat-wrap {
    position: relative;
    z-index: 1;
    border-radius: 22px;
    align-self: center;
  }

  /* Rotating gradient — extends 5px outside the card */
  .pr-feat-wrap::before {
    content: '';
    position: absolute;
    inset: -5px;
    border-radius: 27px;
    background: conic-gradient(
      from var(--pr-angle),
      #1e3a8a 0%,
      #2563eb 18%,
      #60a5fa 35%,
      #bae6fd 50%,
      #60a5fa 65%,
      #2563eb 82%,
      #1e3a8a 100%
    );
    opacity: 0;
    transition: opacity 0.45s ease;
    z-index: 0;
  }

  /* Interior mask — hides gradient from card face */
  .pr-feat-wrap::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 22px;
    background: #050d1a;
    z-index: 1;
  }

  @keyframes prBorderSpin {
    to { --pr-angle: 360deg; }
  }

  .pr-feat-wrap:hover::before {
    opacity: 1;
    animation: prBorderSpin 3.5s linear infinite;
  }

  /* Card sits above the mask, hides its own border on hover */
  .pr-feat-wrap .pr-card-feat {
    position: relative;
    z-index: 2;
  }
  .pr-feat-wrap:hover .pr-card-feat {
    border-color: transparent;
  }


  /* Featured badge */
  .pr-feat-badge {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.10em; text-transform: uppercase;
    color: #93c5fd; background: rgba(37,99,235,0.2); border: 1px solid rgba(37,99,235,0.4);
    padding: 4px 11px; border-radius: 99px;
    margin-bottom: 20px;
  }
  .pr-feat-dot { width: 4px; height: 4px; border-radius: 50%; background: #93c5fd; animation: prTagPulse 2s ease-in-out infinite; }

  /* Card body */
  .pr-card-tag {
    font-size: 11px; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase;
    color: rgba(232,241,255,0.35); margin-bottom: 14px;
    position: relative; z-index: 2;
  }
  .pr-price-row {
    display: flex; align-items: baseline; gap: 3px;
    margin-bottom: 5px; position: relative; z-index: 2;
  }
  .pr-currency {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 20px; font-weight: 700;
    color: rgba(240,247,255,0.6); margin-bottom: 6px;
  }
  .pr-price-num {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 56px; font-weight: 800; letter-spacing: -0.03em;
    color: #f0f7ff; line-height: 1;
  }
  .pr-price-period {
    font-size: 12px; color: rgba(232,241,255,0.3);
    margin-bottom: 5px; position: relative; z-index: 2;
  }
  .pr-price-extra {
    font-size: 12px; color: rgba(232,241,255,0.35);
    margin-bottom: 26px; min-height: 17px;
    position: relative; z-index: 2;
  }
  .pr-price-extra strong { color: rgba(232,241,255,0.6); }
  .pr-old-price {
    font-size: 11px; color: rgba(232,241,255,0.22);
    text-decoration: line-through; margin-left: 6px;
  }
  .pr-divider {
    height: 1px; background: rgba(255,255,255,0.065);
    margin-bottom: 22px; position: relative; z-index: 2;
  }

  .pr-feat-list {
    list-style: none; display: flex; flex-direction: column; gap: 10px;
    margin-bottom: 28px; position: relative; z-index: 2;
  }
  .pr-feat-item {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: 13px; color: rgba(232,241,255,0.58); line-height: 1.45;
  }
  .pr-check {
    flex-shrink: 0; width: 17px; height: 17px; border-radius: 5px; margin-top: 1px;
    background: rgba(37,99,235,0.12); border: 1px solid rgba(37,99,235,0.28);
    display: flex; align-items: center; justify-content: center;
  }
  .pr-check-feat {
    background: rgba(37,99,235,0.22); border-color: rgba(37,99,235,0.5);
  }
  .pr-check svg { width: 10px; height: 8px; }

  /* Buttons */
  .pr-btn {
    width: 100%; padding: 13px 18px; border-radius: 12px;
    font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600;
    cursor: pointer; border: none;
    transition: all 0.2s ease;
    position: relative; z-index: 2;
    display: flex; align-items: center; justify-content: center; gap: 7px;
  }
  .pr-btn em { font-style: normal; transition: transform 0.16s; }
  .pr-btn:hover em { transform: translateX(3px); }
  .pr-btn-ghost {
    background: rgba(255,255,255,0.055);
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(232,241,255,0.65);
  }
  .pr-btn-ghost:hover { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.18); color: #e8f1ff; }
  .pr-btn-primary {
    background: #2563eb; color: #fff;
    box-shadow: 0 4px 22px rgba(37,99,235,0.38);
  }
  .pr-btn-primary:hover {
    background: #1d4ed8;
    box-shadow: 0 6px 30px rgba(37,99,235,0.54);
    transform: translateY(-1px);
  }

  /* ── MSP note ── */
  .pr-msp-note {
    grid-column: 2; text-align: center;
    font-size: 11.5px; color: rgba(232,241,255,0.28);
    margin-top: -56px; padding: 0 16px 16px;
    position: relative; z-index: 1;
  }

  /* ── Transfer callout ── */
  .pr-transfer-band {
    position: relative; z-index: 1;
    max-width: 720px; margin: 0 auto 64px;
    padding: 0 28px;
  }
  .pr-transfer-inner {
    background: rgba(37,99,235,0.06);
    border: 1px solid rgba(37,99,235,0.18);
    border-radius: 18px; padding: 28px 32px;
    display: flex; align-items: flex-start; gap: 20px;
  }
  .pr-transfer-icon {
    width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
    background: rgba(37,99,235,0.15); border: 1px solid rgba(37,99,235,0.3);
    display: flex; align-items: center; justify-content: center; font-size: 20px;
  }
  .pr-transfer-text h4 {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 16px; font-weight: 700; color: #e8f1ff; margin-bottom: 6px;
  }
  .pr-transfer-text p { font-size: 13px; color: rgba(232,241,255,0.45); line-height: 1.6; }

  /* ── CTA footer ── */
  .pr-cta {
    position: relative; z-index: 1;
    display: flex; flex-direction: column; align-items: center; gap: 14px;
    text-align: center;
    padding: 52px 40px 56px;
    border-top: 1px solid rgba(255,255,255,0.045);
  }
  .pr-cta h3 {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 30px; font-weight: 700; color: #f0f7ff; letter-spacing: -0.01em;
  }
  .pr-cta p { font-size: 14px; color: rgba(232,241,255,0.38); max-width: 360px; line-height: 1.65; }
  .pr-cta-btns { display: flex; gap: 12px; margin-top: 6px; }
  .pr-cta-primary {
    padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 600;
    background: #2563eb; color: #fff; border: none; cursor: pointer;
    transition: background 0.18s, box-shadow 0.18s;
    display: flex; align-items: center; gap: 6px;
  }
  .pr-cta-primary em { font-style: normal; transition: transform 0.16s; }
  .pr-cta-primary:hover { background: #1d4ed8; box-shadow: 0 4px 18px rgba(37,99,235,0.42); }
  .pr-cta-primary:hover em { transform: translateX(3px); }
  .pr-cta-ghost {
    padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 600;
    background: transparent; color: rgba(232,241,255,0.5);
    border: 1px solid rgba(255,255,255,0.1); cursor: pointer;
    transition: all 0.18s;
  }
  .pr-cta-ghost:hover { background: rgba(255,255,255,0.055); color: #e8f1ff; border-color: rgba(255,255,255,0.2); }

  /* ── Footer ── */
  .pr-footer {
    position: relative; z-index: 1;
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 56px;
    border-top: 1px solid rgba(255,255,255,0.04);
  }
  .pr-footer-logo { height: 34px; filter: brightness(0) invert(1) opacity(0.28); }
  .pr-footer-copy { font-size: 12px; color: rgba(232,241,255,0.22); }
  .pr-footer-back {
    font-size: 13px; color: rgba(232,241,255,0.3); background: none; border: none; cursor: pointer;
    transition: color 0.15s; display: flex; align-items: center; gap: 5px;
  }
  .pr-footer-back:hover { color: rgba(232,241,255,0.7); }
`

// ── Component ──────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const navigate   = useNavigate()
  const { _hasHydrated, accessToken, user } = useAuthStore()
  const isLoggedIn = _hasHydrated && !!accessToken && !!user
  const [annual, setAnnual] = useState(false)

  const handleLogin    = () => navigate(isLoggedIn && user ? (ROLE_HOME[user.role] ?? '/login') : '/login')
  const handleRegister = (type?: 'client' | 'msp') => navigate(type ? `/register?type=${type}` : '/register')

  // Prices
  const p1 = annual ? 10  : 12
  const p2 = annual ? 25  : 29
  const p3 = annual ? 54  : 60
  const pu = annual ? 8   : 9

  return (
    <>
      <style>{CSS}</style>
      <div className="pr-page">

        {/* ── Nav ── */}
        <nav className="pr-nav">
          <img src={logo} alt="RokaFlow" className="pr-nav-logo" />
          <div className="pr-nav-actions">
            <button className="pr-nav-link" onClick={() => navigate('/')}>
              ← Terug naar home
            </button>
            <button className="pr-nav-link" onClick={handleLogin}>
              {isLoggedIn ? 'Naar portaal' : 'Inloggen'} <em>→</em>
            </button>
            {!isLoggedIn && (
              <button className="pr-nav-cta" onClick={() => handleRegister()}>
                Gratis starten
              </button>
            )}
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="pr-hero">
          <h1 className="pr-hero-h">
            Betaal alleen voor<br /><em>wat u gebruikt.</em>
          </h1>
          <p className="pr-hero-sub">
            Eenvoudige abonnementen zonder verborgen kosten.
            Schaal mee met uw organisatie — of uw klantenbestand.
          </p>
        </section>

        {/* ── Annual toggle ── */}
        <div className="pr-toggle-row">
          <span className={`pr-toggle-label${!annual ? ' pr-tl-on' : ''}`}>Maandelijks</span>
          <button
            className={`pr-toggle${annual ? ' pr-tog-on' : ''}`}
            onClick={() => setAnnual(v => !v)}
            aria-label="Jaarcontract/Maandelijks"
          >
            <span className="pr-toggle-knob" />
          </button>
          <span className={`pr-toggle-label${annual ? ' pr-tl-on' : ''}`}>Jaarcontract</span>
          <span className={`pr-save-pill${annual ? ' pr-pill-on' : ''}`}>10% korting</span>
        </div>

        {/* ── Cards ── */}
        <div className="pr-cards">

          {/* Portal Starter */}
          <TiltCard delay="0.05s">
            <div className="pr-card-tag">Portaal Starter</div>
            <div className="pr-price-row">
              <span className="pr-currency">€</span>
              <span className="pr-price-num"><AnimPrice value={p1} /></span>
            </div>
            <p className="pr-price-period">per maand{annual ? ' — bij een jaarcontract' : ''}</p>
            <p className="pr-price-extra">
              {annual && <span className="pr-old-price">€12/mnd</span>}
              Tot 100 geregistreerde assets
            </p>
            <div className="pr-divider" />
            <ul className="pr-feat-list">
              {STARTER.map(f => (
                <li key={f} className="pr-feat-item">
                  <Check />
                  {f}
                </li>
              ))}
            </ul>
            <button className="pr-btn pr-btn-ghost" onClick={() => handleRegister('client')}>
              Gratis proberen <em>→</em>
            </button>
          </TiltCard>

          {/* MSP Platform — featured center */}
          <div className="pr-feat-wrap">
          <TiltCard featured delay="0.12s">
            <div className="pr-card-tag">MSP Platform</div>
            <div className="pr-price-row">
              <span className="pr-currency">€</span>
              <span className="pr-price-num"><AnimPrice value={p3} /></span>
            </div>
            <p className="pr-price-period">per maand{annual ? ' — bij een jaarcontract' : ''}</p>
            <p className="pr-price-extra">
              {annual && <span className="pr-old-price">€60/mnd</span>}
              + <strong>€<AnimPrice value={pu} /></strong>/gebruiker/mnd
            </p>
            <div className="pr-divider" />
            <ul className="pr-feat-list">
              {MSP.map(f => (
                <li key={f} className="pr-feat-item">
                  <Check featured />
                  {f}
                </li>
              ))}
            </ul>
            <button className="pr-btn pr-btn-primary" onClick={() => handleRegister('msp')}>
              Gratis starten <em>→</em>
            </button>
            <p style={{ fontSize: '11.5px', color: 'rgba(232,241,255,0.28)', marginTop: '14px', lineHeight: '1.55', position: 'relative', zIndex: 2 }}>
              Gebruikersprijs geldt per actieve client-gebruiker.<br />MSP-beheerders worden apart gefactureerd.
            </p>
          </TiltCard>
          </div>

          {/* Portal Pro */}
          <TiltCard delay="0.19s">
            <div className="pr-card-tag">Portaal Pro</div>
            <div className="pr-price-row">
              <span className="pr-currency">€</span>
              <span className="pr-price-num"><AnimPrice value={p2} /></span>
            </div>
            <p className="pr-price-period">per maand{annual ? ' — bij een jaarcontract' : ''}</p>
            <p className="pr-price-extra">
              {annual && <span className="pr-old-price">€29/mnd</span>}
              100 tot 500 geregistreerde assets
            </p>
            <div className="pr-divider" />
            <ul className="pr-feat-list">
              {PRO.map(f => (
                <li key={f} className="pr-feat-item">
                  <Check />
                  {f}
                </li>
              ))}
            </ul>
            <button className="pr-btn pr-btn-ghost" onClick={() => handleRegister('client')}>
              Gratis proberen <em>→</em>
            </button>
          </TiltCard>

        </div>

        {/* ── Transfer callout ── */}
        <div className="pr-transfer-band">
          <div className="pr-transfer-inner">
            <div className="pr-transfer-icon">🔄</div>
            <div className="pr-transfer-text">
              <h4>Clients overdragen</h4>
              <p>Vanuit het MSP-dashboard kunt u bestaande klanten overnemen en overdragen.</p>
            </div>
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="pr-cta">
          <h3>Klaar om te beginnen?</h3>
          <p>Start uw gratis proefperiode. Geen creditcard vereist, geen verplichtingen.</p>
          <div className="pr-cta-btns">
            <button className="pr-cta-primary" onClick={() => handleRegister()}>
              Gratis starten <em>→</em>
            </button>
            <button className="pr-cta-ghost" onClick={handleLogin}>
              Inloggen
            </button>
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="pr-footer">
          <img src={logo} alt="RokaFlow" className="pr-footer-logo" />
          <p className="pr-footer-copy">© {new Date().getFullYear()} RokaFlow · Alle rechten voorbehouden</p>
          <button className="pr-footer-back" onClick={() => navigate('/')}>
            ← Terug naar home
          </button>
        </footer>

      </div>
    </>
  )
}
