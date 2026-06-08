import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import logo from '@/assets/RokaFlow_icon_dark_transparent.png'

const ROLE_HOME: Record<string, string> = {
  superuser:   '/superuser',
  org_admin:   '/org',
  org_member:  '/org',
  client_user: '/client',
}

const FEATURES = [
  {
    n: '01',
    name: 'Medewerkerbeheer',
    desc: 'Van aantreden tot vertrek. Volg de volledige lifecycle van elke medewerker — afdeling, manager, contract en dienstverband in één overzicht.',
  },
  {
    n: '02',
    name: 'Hardware & Assets',
    desc: 'Laptops, werkstations en apparatuur bijhouden per medewerker. Uitgifte- en inleverhistorie altijd beschikbaar.',
  },
  {
    n: '03',
    name: 'Licenties & Software',
    desc: 'Overzicht van alle software-toewijzingen en licentiekosten. Altijd inzicht in beschikbaarheid per medewerker.',
  },
  {
    n: '04',
    name: 'Telefonie',
    desc: 'Telefoons, simkaarten en abonnementen gecombineerd in één overzicht — inclusief koppelingen en contracten.',
  },
  {
    n: '05',
    name: 'Onboarding & Offboarding',
    desc: 'Gestructureerde checklists zodat niets wordt vergeten bij in- of uitdienst. Reproduceerbaar en traceerbaar.',
  },
  {
    n: '06',
    name: 'MSP-platform',
    desc: 'Beheer meerdere organisaties vanuit één dashboard. Volledig multi-tenant met rolgebaseerde toegangscontrole.',
  },
]

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #030812;
    --text:      #eef0f6;
    --muted:     rgba(238,240,246,0.38);
    --accent:    #7c3aed;
    --accent-lt: #a78bfa;
    --line:      rgba(238,240,246,0.07);
    --line-md:   rgba(238,240,246,0.11);
  }

  /* ── Base ───────────────────────────────────────────────────── */
  .rf-land {
    min-height: 100vh;
    background-color: var(--bg);
    color: var(--text);
    font-family: 'DM Sans', system-ui, sans-serif;
    position: relative;
    overflow-x: hidden;
  }

  .rf-land::after { display: none; }

  /* ── Nav ────────────────────────────────────────────────────── */
  .rf-nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 64px;
    height: 62px;
    background: rgba(3,8,18,0.75);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border-bottom: 1px solid var(--line);
    animation: rfFadeIn 0.5s ease 0.05s both;
  }

  .rf-nav-logo {
    height: 60px;
    object-fit: contain;
    opacity: 0.88;
    display: block;
  }

  .rf-nav-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    letter-spacing: 0.025em;
    color: rgba(238,240,246,0.65);
    background: none;
    border: none;
    cursor: pointer;
    transition: color 0.2s;
    padding: 0;
  }
  .rf-nav-btn:hover { color: var(--text); }
  .rf-nav-btn .rf-arr {
    display: inline-block;
    transition: transform 0.2s;
    font-style: normal;
  }
  .rf-nav-btn:hover .rf-arr { transform: translateX(3px); }

  /* ── Hero ───────────────────────────────────────────────────── */
  .rf-hero {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 62px 64px 0;
  }

  .rf-hero-body {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 60px;
    align-items: center;
    padding-top: 56px;
    padding-bottom: 56px;
  }

  /* Headline */
  .rf-headline {
    font-family: 'Syne', sans-serif;
    font-size: clamp(52px, 6vw, 92px);
    font-weight: 700;
    line-height: 1.06;
    letter-spacing: -0.01em;
    margin-bottom: 30px;
  }

  .rf-lw {
    overflow: hidden;
    line-height: 1.08;
  }
  .rf-lw + .rf-lw { margin-top: 0.04em; }

  .rf-l1 {
    display: block;
    color: var(--text);
    animation: rfRevealUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both;
  }
  .rf-l2 {
    display: block;
    color: var(--text);
    animation: rfRevealUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.28s both;
  }
  .rf-l3 {
    display: block;
    color: var(--accent-lt);
    animation: rfRevealUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.41s both;
  }

  /* Drawing underline on "medewerkers," */
  .rf-underline {
    display: inline;
    background-image: linear-gradient(var(--accent), var(--accent));
    background-size: 0% 2px;
    background-position: 0 100%;
    background-repeat: no-repeat;
    padding-bottom: 3px;
    animation: rfUnderline 0.75s cubic-bezier(0.16, 1, 0.3, 1) 0.88s forwards;
  }

  @keyframes rfUnderline {
    from { background-size: 0% 2px; }
    to   { background-size: 100% 2px; }
  }

  .rf-sub {
    font-size: 16px;
    line-height: 1.7;
    color: var(--muted);
    max-width: 480px;
    margin-bottom: 44px;
    animation: rfRevealUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.58s both;
  }

  /* CTA: sweep-fill on hover */
  .rf-cta {
    display: inline-flex;
    align-items: center;
    gap: 0;
    padding: 0;
    background: transparent;
    border: 1px solid rgba(139,92,246,0.45);
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: border-color 0.3s;
    animation: rfRevealUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.72s both;
  }
  .rf-cta::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--accent);
    transform: translateX(-105%);
    transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .rf-cta:hover { border-color: var(--accent); }
  .rf-cta:hover::before { transform: translateX(0); }

  .rf-cta-inner {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 13px 28px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--text);
  }
  .rf-cta .rf-arr {
    font-style: normal;
    display: inline-block;
    transition: transform 0.25s;
  }
  .rf-cta:hover .rf-arr { transform: translateX(5px); }

  .rf-no-reg {
    margin-top: 16px;
    font-size: 12px;
    color: var(--muted);
    opacity: 0.55;
    animation: rfRevealUp 0.6s ease 0.88s both;
    max-width: 400px;
    line-height: 1.6;
  }

  /* Hero logo right */
  .rf-hero-emblem {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .rf-hero-emblem::before { display: none; }

  .rf-hero-emblem img {
    width: 220px;
    opacity: 0.20;
    filter: none;
    animation: rfFadeIn 1.4s ease 0.3s both, rfFloat 8s ease-in-out 1.7s infinite;
    display: block;
    position: relative;
  }

  @keyframes rfFloat {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-16px); }
  }

  /* Feature strip */
  .rf-strip {
    display: flex;
    border-top: 1px solid var(--line-md);
    animation: rfFadeIn 0.8s ease 1.15s both;
    margin-top: auto;
  }

  .rf-strip-item {
    flex: 1;
    padding: 17px 20px;
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--muted);
    border-right: 1px solid var(--line);
    transition: color 0.2s, background 0.2s;
    white-space: nowrap;
    cursor: default;
  }
  .rf-strip-item:last-child { border-right: none; }
  .rf-strip-item:hover {
    color: var(--accent-lt);
    background: rgba(139,92,246,0.04);
  }

  /* ── Features ───────────────────────────────────────────────── */
  .rf-features {
    padding: 96px 64px 80px;
  }

  .rf-feat-head {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 52px;
  }

  .rf-feat-tag {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent-lt);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .rf-feat-rule {
    flex: 1;
    height: 1px;
    background: var(--line-md);
    transform-origin: left;
    transform: scaleX(0);
    transition: transform 1s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .rf-feat-rule.rf-visible { transform: scaleX(1); }

  .rf-feat-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    border-top: 1px solid var(--line);
    border-left: 1px solid var(--line);
  }

  .rf-feat-item {
    padding: 36px 32px;
    border-right: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
    transition: background 0.25s, opacity 0.55s ease, transform 0.55s ease;
    opacity: 0;
    transform: translateY(18px);
  }
  .rf-feat-item.rf-visible {
    opacity: 1;
    transform: translateY(0);
  }
  .rf-feat-item:hover { background: rgba(139,92,246,0.04); }

  .rf-feat-n {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    color: var(--muted);
    margin-bottom: 18px;
    opacity: 0.7;
  }

  .rf-feat-name {
    font-family: 'Syne', sans-serif;
    font-size: 17px;
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.01em;
    margin-bottom: 11px;
  }

  .rf-feat-desc {
    font-size: 13px;
    line-height: 1.75;
    color: var(--muted);
  }

  /* ── Footer ─────────────────────────────────────────────────── */
  .rf-footer {
    padding: 28px 64px;
    border-top: 1px solid var(--line);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  .rf-footer-logo {
    height: 22px;
    opacity: 0.28;
    object-fit: contain;
    display: block;
  }

  .rf-footer-copy {
    font-size: 12px;
    color: var(--muted);
    opacity: 0.55;
  }

  .rf-footer-btn {
    font-size: 13px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    letter-spacing: 0.025em;
    color: var(--muted);
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: color 0.2s;
    padding: 0;
  }
  .rf-footer-btn:hover { color: var(--accent-lt); }
  .rf-footer-btn .rf-arr {
    font-style: normal;
    display: inline-block;
    transition: transform 0.2s;
  }
  .rf-footer-btn:hover .rf-arr { transform: translateX(3px); }

  /* ── Shared animations ──────────────────────────────────────── */
  @keyframes rfRevealUp {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes rfFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  /* ── Responsive ─────────────────────────────────────────────── */
  @media (max-width: 960px) {
    .rf-nav    { padding: 0 28px; }
    .rf-hero   { padding: 62px 28px 0; }
    .rf-hero-body { grid-template-columns: 1fr; gap: 0; }
    .rf-hero-emblem { display: none; }
    .rf-features { padding: 64px 28px; }
    .rf-feat-grid { grid-template-columns: repeat(2, 1fr); }
    .rf-footer { padding: 24px 28px; }
    .rf-strip  { display: none; }
  }

  @media (max-width: 560px) {
    .rf-feat-grid { grid-template-columns: 1fr; }
    .rf-headline  { font-size: 46px; }
    .rf-footer    { flex-direction: column; gap: 10px; text-align: center; }
  }
`

export default function LandingPage() {
  const navigate = useNavigate()
  const { _hasHydrated, accessToken, user } = useAuthStore()

  const isLoggedIn = _hasHydrated && !!accessToken && !!user
  const ctaLabel   = isLoggedIn ? 'Naar portaal' : 'Inloggen'

  const handleLogin = () => {
    if (isLoggedIn && user) {
      navigate(ROLE_HOME[user.role] ?? '/login')
    } else {
      navigate('/login')
    }
  }

  // Intersection observer for feature items + rule line
  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>('.rf-feat-item')
    const rule  = document.querySelector<HTMLElement>('.rf-feat-rule')

    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('rf-visible')
      }),
      { threshold: 0.12 }
    )

    items.forEach((el, i) => {
      el.style.transitionDelay = `${i * 0.07}s`
      observer.observe(el)
    })
    if (rule) observer.observe(rule)

    return () => observer.disconnect()
  }, [])

  return (
    <>
      <style>{CSS}</style>
      <div className="rf-land">

        {/* ── Nav ── */}
        <nav className="rf-nav">
          <img src={logo} alt="RokaFlow" className="rf-nav-logo" />
          <button className="rf-nav-btn" onClick={handleLogin}>
            {ctaLabel} <i className="rf-arr">→</i>
          </button>
        </nav>

        {/* ── Hero ── */}
        <section className="rf-hero">
          <div className="rf-hero-body">
            <div>
              <h1 className="rf-headline">
                <div className="rf-lw"><span className="rf-l1">Alles over uw</span></div>
                <div className="rf-lw">
                  <span className="rf-l2">
                    <span className="rf-underline">medewerkers,</span>
                  </span>
                </div>
                <div className="rf-lw"><span className="rf-l3">op één plek.</span></div>
              </h1>

              <p className="rf-sub">
                IT-beheer van onboarding tot offboarding — hardware, licenties
                en telefonie voor elke medewerker in uw organisatie.
              </p>

              <button className="rf-cta" onClick={handleLogin}>
                <span className="rf-cta-inner">
                  {ctaLabel}
                  <i className="rf-arr">→</i>
                </span>
              </button>

              <p className="rf-no-reg">
                Registreren is niet mogelijk — neem contact op met uw beheerder voor toegang.
              </p>
            </div>

            <div className="rf-hero-emblem" aria-hidden="true">
              <img src={logo} alt="" />
            </div>
          </div>

          <div className="rf-strip">
            {['Medewerkerbeheer', 'Hardware & Assets', 'Licenties', 'Telefonie', 'Onboarding', 'MSP-platform'].map(s => (
              <div key={s} className="rf-strip-item">{s}</div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section className="rf-features">
          <div className="rf-feat-head">
            <span className="rf-feat-tag">Wat doet RokaFlow?</span>
            <div className="rf-feat-rule" />
          </div>

          <div className="rf-feat-grid">
            {FEATURES.map(f => (
              <div key={f.n} className="rf-feat-item">
                <div className="rf-feat-n">{f.n}</div>
                <div className="rf-feat-name">{f.name}</div>
                <div className="rf-feat-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="rf-footer">
          <img src={logo} alt="RokaFlow" className="rf-footer-logo" />
          <p className="rf-footer-copy">
            © {new Date().getFullYear()} RokaFlow · Alle rechten voorbehouden
          </p>
          <button className="rf-footer-btn" onClick={handleLogin}>
            {ctaLabel} <i className="rf-arr">→</i>
          </button>
        </footer>

      </div>
    </>
  )
}
