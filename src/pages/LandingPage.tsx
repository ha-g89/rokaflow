import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import logo from '@/assets/RokaFlow_icon_dark_transparent.png'

const ROLE_HOME: Record<string, string> = {
  superuser:    '/superuser',
  msp_admin:    '/org',
  msp_member:   '/org',
  portal_admin: '/client',
  employee:     '/client',
}

const FEATURES = [
  { n: '01', icon: '👥', name: 'Medewerkerbeheer',      desc: 'Van aantreden tot vertrek. Lifecycle, afdeling, manager en contract in één overzicht.' },
  { n: '02', icon: '💻', name: 'Hardware & Assets',      desc: 'Laptops en apparatuur per medewerker. Uitgifte- en inleverhistorie altijd beschikbaar.' },
  { n: '03', icon: '🔑', name: 'Licenties & Software',   desc: 'Inzicht in software-toewijzingen, licentiekosten en bezettingsgraad per seat.' },
  { n: '04', icon: '📱', name: 'Telefonie',              desc: 'Telefoons, simkaarten en abonnementen gecombineerd — inclusief koppelingen en contracten.' },
  { n: '05', icon: '✅', name: 'Onboarding & Offboarding', desc: 'Gestructureerde checklists zodat niets wordt vergeten bij in- of uitdienst.' },
  { n: '06', icon: '🏢', name: 'MSP-platform',           desc: 'Beheer meerdere organisaties vanuit één dashboard. Volledig multi-tenant.' },
]

// ── Mock screen sub-components ────────────────────────────────────────────────

const EmpRow = ({ color, w1 = '62%', w2 = '42%', badge, bCls }: {
  color: string; w1?: string; w2?: string; badge: string; bCls: string
}) => (
  <div className="rf-sc-row">
    <div className="rf-sc-av" style={{ background: color }} />
    <div className="rf-sc-lines">
      <div className="rf-sc-line" style={{ width: w1 }} />
      <div className="rf-sc-line rf-sc-line-s" style={{ width: w2 }} />
    </div>
    <span className={`rf-sc-badge ${bCls}`}>{badge}</span>
  </div>
)

const HwRow = ({ icon, w1 = '55%', w2 = '38%', pct, barClr, badge, bCls }: {
  icon: string; w1?: string; w2?: string; pct: number; barClr: string; badge: string; bCls: string
}) => (
  <div className="rf-sc-row">
    <div className="rf-sc-icon">{icon}</div>
    <div className="rf-sc-lines">
      <div className="rf-sc-line" style={{ width: w1 }} />
      <div className="rf-sc-line rf-sc-line-s" style={{ width: w2 }} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
      <span className={`rf-sc-badge ${bCls}`}>{badge}</span>
      <div className="rf-sc-bar-mini-track">
        <div className="rf-sc-bar-mini-fill" style={{ width: `${pct}%`, background: barClr }} />
      </div>
    </div>
  </div>
)

const LicCard = ({ name, vendor, used, max, pct, barClr, delay }: {
  name: string; vendor: string; used: number; max: number; pct: number; barClr: string; delay: string
}) => (
  <div className="rf-sc-lic">
    <div className="rf-sc-lic-head">
      <span className="rf-sc-lic-name">{name}</span>
      <span className="rf-sc-badge rf-badge-b">{used}/{max}</span>
    </div>
    <div className="rf-sc-lic-vendor">{vendor}</div>
    <div className="rf-sc-bar-track">
      <div className="rf-sc-bar-fill" style={{ width: `${pct}%`, background: barClr, animationDelay: delay } as React.CSSProperties} />
    </div>
  </div>
)

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #ffffff;
    --bg-alt:    #f8fafc;
    --bg-deep:   #f1f5f9;
    --bg-panel:  #f0f4ff;
    --text:      #0f172a;
    --text-2:    #334155;
    --muted:     #64748b;
    --accent:    #2563eb;
    --accent-lt: #3b82f6;
    --accent-dim:#eff6ff;
    --line:      rgba(15,23,42,0.08);
    --line-md:   rgba(15,23,42,0.12);
    --green:     #059669;
    --amber:     #d97706;
    /* screens keep their own dark palette */
    --sc-bg:     #071628;
    --sc-top:    #0d2244;
  }

  /* ── Base ───────────────────────────────────────────────────── */
  .rf-land {
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: 'DM Sans', system-ui, sans-serif;
    overflow-x: hidden;
  }

  /* ── Nav ────────────────────────────────────────────────────── */
  .rf-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 56px; height: 62px;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border-bottom: 1px solid var(--line);
    animation: rfFade 0.4s ease both;
  }
  .rf-nav-logo {
    height: 48px; object-fit: contain;
    filter: brightness(0) opacity(0.82);
  }
  .rf-nav-actions { display: flex; align-items: center; gap: 16px; }

  .rf-nav-link {
    font-size: 13.5px; font-weight: 500;
    color: var(--muted); background: none; border: none; cursor: pointer;
    transition: color 0.16s; display: flex; align-items: center; gap: 5px; padding: 0;
  }
  .rf-nav-link:hover { color: var(--text); }
  .rf-nav-link em { font-style: normal; transition: transform 0.16s; }
  .rf-nav-link:hover em { transform: translateX(3px); }

  .rf-nav-cta {
    font-size: 13.5px; font-weight: 600;
    color: #fff; background: var(--accent);
    border: none; cursor: pointer;
    padding: 8px 18px; border-radius: 8px;
    transition: background 0.18s, box-shadow 0.18s;
    display: flex; align-items: center; gap: 6px;
  }
  .rf-nav-cta:hover { background: #1d4ed8; box-shadow: 0 4px 14px rgba(37,99,235,0.35); }
  .rf-nav-cta em { font-style: normal; transition: transform 0.16s; }
  .rf-nav-cta:hover em { transform: translateX(3px); }

  /* ── Hero ───────────────────────────────────────────────────── */
  .rf-hero {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1fr 1.12fr;
    padding-top: 62px;
    position: relative;
  }

  /* right panel bg */
  .rf-hero::after {
    content: '';
    position: absolute;
    right: 0; top: 0; bottom: 0;
    width: 53%;
    background: var(--bg-panel);
    z-index: 0;
    /* subtle dot grid */
    background-image:
      radial-gradient(rgba(37,99,235,0.12) 1px, transparent 1px),
      linear-gradient(var(--bg-panel), var(--bg-panel));
    background-size: 24px 24px, auto;
  }

  /* ── Hero left (text) ───────────────────────────────────────── */
  .rf-hero-left {
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    text-align: center;
    padding: 72px 56px 72px 56px;
    position: relative; z-index: 1;
  }

  .rf-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--accent);
    margin-bottom: 28px;
    animation: rfReveal 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both;
  }
  .rf-eyebrow-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--accent); opacity: 0.7;
    animation: rfDotPulse 2s ease-in-out 0.8s infinite;
  }
  @keyframes rfDotPulse {
    0%,100% { opacity: 0.7; transform: scale(1); }
    50%      { opacity: 1;   transform: scale(1.3); }
  }

  .rf-headline {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: clamp(42px, 4.4vw, 76px);
    font-weight: 800; line-height: 1.08;
    letter-spacing: -0.01em; color: var(--text);
    margin-bottom: 22px;
  }
  .rf-lw { overflow: hidden; line-height: 1.1; }
  .rf-lw + .rf-lw { margin-top: 0.04em; }
  .rf-l1 { display: block; animation: rfReveal 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s both; }
  .rf-l2 { display: block; animation: rfReveal 0.8s cubic-bezier(0.16,1,0.3,1) 0.32s both; }
  .rf-l3 {
    display: block; color: var(--accent);
    animation: rfReveal 0.8s cubic-bezier(0.16,1,0.3,1) 0.44s both;
  }

  .rf-sub {
    font-size: 16px; line-height: 1.72;
    color: var(--muted); max-width: 420px;
    margin-bottom: 36px;
    animation: rfReveal 0.7s cubic-bezier(0.16,1,0.3,1) 0.58s both;
  }

  .rf-ctas {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    animation: rfReveal 0.7s cubic-bezier(0.16,1,0.3,1) 0.72s both;
  }

  .rf-btn-primary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 24px; font-size: 14px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    color: #fff; background: var(--accent);
    border: none; border-radius: 9px; cursor: pointer;
    transition: background 0.18s, box-shadow 0.18s, transform 0.12s;
    box-shadow: 0 1px 2px rgba(37,99,235,0.25);
  }
  .rf-btn-primary:hover {
    background: #1d4ed8;
    box-shadow: 0 6px 20px rgba(37,99,235,0.38);
    transform: translateY(-1px);
  }
  .rf-btn-primary em { font-style: normal; transition: transform 0.16s; }
  .rf-btn-primary:hover em { transform: translateX(4px); }

  .rf-btn-ghost {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 22px; font-size: 14px; font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    color: var(--text-2);
    background: var(--bg); border: 1.5px solid var(--line-md);
    border-radius: 9px; cursor: pointer;
    transition: border-color 0.18s, color 0.18s, background 0.18s;
  }
  .rf-btn-ghost:hover {
    border-color: var(--accent-lt);
    color: var(--accent);
    background: var(--accent-dim);
  }
  .rf-btn-ghost em { font-style: normal; transition: transform 0.16s; }
  .rf-btn-ghost:hover em { transform: translateX(3px); }

  .rf-notice {
    margin-top: 14px; font-size: 12px; color: var(--muted);
    opacity: 0.7; line-height: 1.6;
    animation: rfReveal 0.6s ease 0.9s both;
  }

  /* Trust badges */
  .rf-trust {
    display: flex; align-items: center; gap: 20px;
    margin-top: 44px; padding-top: 28px;
    border-top: 1px solid var(--line);
    animation: rfReveal 0.6s ease 1.05s both;
  }
  .rf-trust-item {
    font-size: 12px; font-weight: 500;
    color: var(--muted); display: flex; align-items: center; gap: 6px;
  }
  .rf-trust-icon {
    width: 18px; height: 18px; border-radius: 50%;
    background: var(--bg-deep); display: flex; align-items: center; justify-content: center;
    font-size: 10px;
  }

  /* ── Hero right (screens) ───────────────────────────────────── */
  .rf-hero-right {
    position: relative; z-index: 1;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 48px 28px 40px;
  }

  /* App icon badge */
  .rf-app-badge {
    display: flex; align-items: center; gap: 10px;
    background: var(--sc-bg);
    border: 1px solid rgba(56,189,248,0.2);
    border-radius: 12px; padding: 8px 14px 8px 10px;
    margin-bottom: 28px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.18);
    animation: rfReveal 0.8s cubic-bezier(0.16,1,0.3,1) 0.35s both;
  }
  .rf-app-badge-logo {
    width: 28px; height: 28px; object-fit: contain;
  }
  .rf-app-badge-label {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 13px; font-weight: 700;
    color: rgba(238,242,255,0.85); letter-spacing: 0.01em;
  }
  .rf-app-badge-pill {
    margin-left: 4px; font-size: 9px; font-weight: 700;
    padding: 2px 7px; border-radius: 20px;
    background: rgba(37,99,235,0.3); color: #93c5fd;
    letter-spacing: 0.06em; text-transform: uppercase;
  }

  /* ── 3D Screens ──────────────────────────────────────────────── */
  .rf-screens-wrap {
    perspective: 1100px;
    perspective-origin: 50% -15%;
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    justify-content: center;
    gap: 14px;
    flex-shrink: 0;
    padding-bottom: 80px;
  }

  .rf-so {
    position: relative;
    transform: rotateX(10deg);
    transition: transform 0.5s cubic-bezier(0.16,1,0.3,1);
    will-change: transform;
  }
  .rf-so:hover {
    transform: rotateX(2deg) translateY(-28px);
  }

  .rf-so-caption {
    position: absolute;
    bottom: -58px;
    left: 50%;
    transform: translateX(-50%) translateY(8px);
    width: max-content;
    max-width: 215px;
    text-align: center;
    font-size: 11px;
    line-height: 1.65;
    color: rgba(238,242,255,0.82);
    background: rgba(4,9,20,0.82);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 8px;
    padding: 7px 12px;
    opacity: 0;
    transition: opacity 0.32s ease 0.18s,
                transform 0.42s cubic-bezier(0.16,1,0.3,1) 0.18s;
    pointer-events: none;
  }
  .rf-so:hover .rf-so-caption {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }

  .rf-so-c {
    animation: rfSoFade 0.9s cubic-bezier(0.16,1,0.3,1) 0.45s both;
  }
  .rf-so-l {
    opacity: 0.9;
    animation: rfSoFade 0.9s cubic-bezier(0.16,1,0.3,1) 0.65s both;
  }
  .rf-so-r {
    opacity: 0.9;
    animation: rfSoFade 0.9s cubic-bezier(0.16,1,0.3,1) 0.57s both;
  }

  @keyframes rfSoFade {
    from { opacity: 0; }
  }

  /* ── Screen shell ────────────────────────────────────────────── */
  .rf-screen {
    border-radius: 10px; overflow: hidden;
    background: var(--sc-bg);
    border: 1px solid rgba(255,255,255,0.06);
    box-shadow:
      0 0 0 1px rgba(0,0,0,0.3),
      0 24px 56px rgba(0,0,0,0.35),
      0 8px 16px rgba(0,0,0,0.2);
    position: relative;
  }
  .rf-screen::after {
    content: '';
    position: absolute; inset: 0;
    background: repeating-linear-gradient(
      0deg, transparent, transparent 3px,
      rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px
    );
    pointer-events: none; z-index: 20;
  }
  .rf-screen-c  { width: 310px; }
  .rf-screen-ls { width: 208px; }

  .rf-sc-chrome {
    height: 27px; background: var(--sc-top);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    display: flex; align-items: center; gap: 5px; padding: 0 10px;
  }
  .rf-sc-dot { width: 7px; height: 7px; border-radius: 50%; }
  .rf-sc-dot-r { background: #ff5f57; }
  .rf-sc-dot-y { background: #febc2e; }
  .rf-sc-dot-g { background: #28c840; }
  .rf-sc-title {
    font-family: 'DM Sans', sans-serif;
    font-size: 10px; font-weight: 600;
    color: rgba(238,242,255,0.4); margin-left: 7px; letter-spacing: 0.04em;
  }
  .rf-sc-body { padding: 9px 10px 10px; }

  .rf-sc-stats { display: flex; gap: 5px; margin-bottom: 8px; }
  .rf-sc-stat {
    flex: 1; background: rgba(37,99,235,0.1);
    border: 1px solid rgba(37,99,235,0.18);
    border-radius: 5px; padding: 5px 6px;
  }
  .rf-sc-stat-n {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 13px; font-weight: 700; color: #60a5fa; line-height: 1;
  }
  .rf-sc-stat-l { font-size: 7.5px; color: rgba(238,242,255,0.28); margin-top: 2px; }

  .rf-sc-bar-main-track {
    background: rgba(238,242,255,0.06); height: 5px;
    border-radius: 3px; overflow: hidden; margin-bottom: 8px;
  }
  .rf-sc-bar-main-fill {
    height: 100%; border-radius: 3px;
    transform-origin: left center; transform: scaleX(0);
    animation: rfBarReveal 1s cubic-bezier(0.16,1,0.3,1) 1.2s both;
  }

  .rf-sc-row {
    display: flex; align-items: center; gap: 7px;
    padding: 4px 0; border-bottom: 1px solid rgba(238,242,255,0.04);
  }
  .rf-sc-row:last-child { border-bottom: none; }
  .rf-sc-av { width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; }
  .rf-sc-icon { font-size: 11px; line-height: 1; flex-shrink: 0; width: 20px; text-align: center; }
  .rf-sc-lines { flex: 1; }
  .rf-sc-line { height: 5px; border-radius: 2px; background: rgba(238,242,255,0.1); margin-bottom: 3px; }
  .rf-sc-line-s { background: rgba(238,242,255,0.06); margin-bottom: 0; }

  .rf-sc-badge {
    font-size: 7px; font-weight: 700;
    padding: 2px 5px; border-radius: 3px;
    white-space: nowrap; flex-shrink: 0;
  }
  .rf-badge-g { background: rgba(16,185,129,0.18); color: #34d399; }
  .rf-badge-a { background: rgba(245,158,11,0.18); color: #fbbf24; }
  .rf-badge-b { background: rgba(37,99,235,0.22); color: #93c5fd; }

  .rf-sc-bar-mini-track { width: 38px; height: 3px; border-radius: 2px; background: rgba(238,242,255,0.08); overflow: hidden; }
  .rf-sc-bar-mini-fill  { height: 100%; border-radius: 2px; }

  .rf-sc-lic { background: rgba(37,99,235,0.07); border: 1px solid rgba(37,99,235,0.14); border-radius: 5px; padding: 7px 8px; margin-bottom: 5px; }
  .rf-sc-lic:last-child { margin-bottom: 0; }
  .rf-sc-lic-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1px; }
  .rf-sc-lic-name { font-size: 9px; font-weight: 700; color: rgba(238,242,255,0.8); }
  .rf-sc-lic-vendor { font-size: 7.5px; color: rgba(238,242,255,0.28); margin-bottom: 5px; }
  .rf-sc-bar-track { background: rgba(238,242,255,0.07); height: 4px; border-radius: 2px; overflow: hidden; }
  .rf-sc-bar-fill {
    height: 100%; border-radius: 2px;
    transform-origin: left center; transform: scaleX(0);
    animation: rfBarReveal 0.9s cubic-bezier(0.16,1,0.3,1) both;
  }

  .rf-sc-tabs { display: flex; border-bottom: 1px solid rgba(238,242,255,0.07); margin-bottom: 7px; }
  .rf-sc-tab { font-size: 8px; font-weight: 600; padding: 4px 7px; color: rgba(238,242,255,0.28); letter-spacing: 0.03em; }
  .rf-sc-tab.active { color: #38bdf8; border-bottom: 1px solid #38bdf8; margin-bottom: -1px; }

  @keyframes rfBarReveal { to { transform: scaleX(1); } }

  /* ── Feature strip ───────────────────────────────────────────── */
  .rf-strip {
    display: flex; border-top: 1px solid var(--line);
    position: relative; z-index: 1;
    background: var(--bg);
    animation: rfFade 0.8s ease 1.1s both;
  }
  .rf-strip-item {
    flex: 1; padding: 14px 18px;
    font-size: 10.5px; font-weight: 600; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--muted);
    border-right: 1px solid var(--line);
    transition: color 0.18s, background 0.18s; cursor: default; white-space: nowrap;
  }
  .rf-strip-item:last-child { border-right: none; }
  .rf-strip-item:hover { color: var(--accent); background: var(--accent-dim); }

  /* ── Features ───────────────────────────────────────────────── */
  .rf-features {
    background: #060d1a;
    padding: 88px 56px 88px;
  }

  .rf-feat-head {
    text-align: center; margin-bottom: 56px;
    max-width: 1160px; margin-left: auto; margin-right: auto;
  }
  .rf-feat-tag {
    display: inline-block;
    font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: #60a5fa;
    background: rgba(37,99,235,0.15); padding: 5px 12px;
    border-radius: 20px; margin-bottom: 14px;
  }
  .rf-feat-title {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: clamp(28px, 3vw, 42px); font-weight: 800;
    color: #eef2ff; letter-spacing: -0.02em; line-height: 1.12;
  }
  .rf-feat-sub {
    font-size: 15px; color: rgba(238,242,255,0.52);
    margin-top: 10px; max-width: 500px; margin-left: auto; margin-right: auto;
    line-height: 1.65;
  }

  .rf-feat-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    max-width: 1160px; margin: 0 auto;
  }

  .rf-feat-item {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px; padding: 28px 24px;
    transition: box-shadow 0.22s, border-color 0.22s, transform 0.2s,
                opacity 0.5s ease, translateY 0.5s ease;
    opacity: 0; transform: translateY(16px);
    cursor: default; position: relative; overflow: hidden;
  }
  .rf-feat-item.rf-visible { opacity: 1; transform: translateY(0); }
  .rf-feat-item:hover {
    box-shadow: 0 8px 32px rgba(37,99,235,0.18);
    border-color: rgba(37,99,235,0.3);
    transform: translateY(-3px);
  }
  .rf-feat-item::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, #2563eb, #38bdf8);
    opacity: 0; transition: opacity 0.22s;
    border-radius: 14px 14px 0 0;
  }
  .rf-feat-item:hover::before { opacity: 1; }

  .rf-feat-icon-wrap {
    width: 40px; height: 40px; border-radius: 10px;
    background: rgba(37,99,235,0.15); display: flex; align-items: center;
    justify-content: center; font-size: 18px; margin-bottom: 16px;
  }
  .rf-feat-n {
    font-size: 9.5px; font-weight: 700; letter-spacing: 0.14em;
    color: #60a5fa; opacity: 0.7; margin-bottom: 6px;
  }
  .rf-feat-name {
    font-family: 'Bricolage Grotesque', sans-serif; font-size: 15.5px; font-weight: 700;
    color: #eef2ff; letter-spacing: -0.01em; margin-bottom: 8px;
  }
  .rf-feat-desc { font-size: 13px; line-height: 1.7; color: rgba(238,242,255,0.48); }

  /* ── MSP Transfer ────────────────────────────────────────────── */
  .rf-msp-xfer {
    background: #060d1a;
    padding: 80px 56px 88px;
    border-top: 1px solid rgba(255,255,255,0.05);
  }
  .rf-msp-xfer-inner {
    max-width: 1160px; margin: 0 auto;
    display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center;
  }
  .rf-msp-xfer-tag {
    display: inline-flex; align-items: center; gap: 7px;
    font-size: 10.5px; font-weight: 700; letter-spacing: 0.11em; text-transform: uppercase;
    color: #60a5fa;
    background: rgba(37,99,235,0.12); border: 1px solid rgba(37,99,235,0.25);
    padding: 4px 12px; border-radius: 99px; margin-bottom: 20px;
  }
  .rf-msp-xfer-dot { width: 4px; height: 4px; border-radius: 50%; background: #60a5fa; animation: rfDotPulse 2s ease-in-out infinite; }
  .rf-msp-xfer-h {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: clamp(26px, 2.8vw, 40px); font-weight: 800;
    color: #eef2ff; letter-spacing: -0.02em; line-height: 1.1; margin-bottom: 18px;
  }
  .rf-msp-xfer-h em { font-style: normal; color: #60a5fa; }
  .rf-msp-xfer-p {
    font-size: 15px; color: rgba(238,242,255,0.5); line-height: 1.72; margin-bottom: 32px;
  }
  .rf-msp-xfer-link {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 14px; font-weight: 600; color: #60a5fa;
    background: rgba(37,99,235,0.12); border: 1px solid rgba(37,99,235,0.28);
    padding: 10px 22px; border-radius: 10px; cursor: pointer;
    border-width: 0; transition: background 0.18s, border-color 0.18s;
  }
  .rf-msp-xfer-link em { font-style: normal; transition: transform 0.15s; }
  .rf-msp-xfer-link:hover { background: rgba(37,99,235,0.2); }
  .rf-msp-xfer-link:hover em { transform: translateX(3px); }

  /* Flow diagram */
  .rf-flow {
    display: flex; flex-direction: column; gap: 12px;
  }
  .rf-flow-step {
    display: flex; align-items: flex-start; gap: 16px;
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px; padding: 18px 20px;
    transition: border-color 0.25s, background 0.25s;
  }
  .rf-flow-step:hover { background: rgba(37,99,235,0.07); border-color: rgba(37,99,235,0.25); }
  .rf-flow-num {
    width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
    background: rgba(37,99,235,0.18); border: 1px solid rgba(37,99,235,0.35);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: #60a5fa; font-family: 'Bricolage Grotesque', sans-serif;
  }
  .rf-flow-body {}
  .rf-flow-title { font-size: 13.5px; font-weight: 600; color: #eef2ff; margin-bottom: 3px; }
  .rf-flow-desc  { font-size: 12.5px; color: rgba(238,242,255,0.45); line-height: 1.55; }
  .rf-flow-arrow {
    text-align: center; color: rgba(37,99,235,0.4); font-size: 14px; letter-spacing: 0.1em;
    padding: 0 20px;
  }

  /* ── Pricing nav link ─────────────────────────────────────────── */
  .rf-nav-sep { width: 1px; height: 18px; background: var(--line-md); }

  /* ── CTA banner ──────────────────────────────────────────────── */
  .rf-cta-band {
    background: var(--accent); padding: 64px 56px;
    display: flex; align-items: center; justify-content: space-between; gap: 32px;
    position: relative; overflow: hidden;
  }
  .rf-cta-band::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 80% 50%, rgba(255,255,255,0.1), transparent 60%);
    pointer-events: none;
  }
  .rf-cta-band-text { position: relative; }
  .rf-cta-band-h {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: clamp(24px, 2.8vw, 38px); font-weight: 800;
    color: #fff; letter-spacing: -0.02em; margin-bottom: 8px;
  }
  .rf-cta-band-sub { font-size: 15px; color: rgba(255,255,255,0.72); }
  .rf-cta-band-actions { display: flex; gap: 12px; flex-shrink: 0; position: relative; }

  .rf-btn-white {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 22px; font-size: 14px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    color: var(--accent); background: #fff;
    border: none; border-radius: 9px; cursor: pointer;
    transition: box-shadow 0.18s, transform 0.12s;
  }
  .rf-btn-white:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.2); transform: translateY(-1px); }
  .rf-btn-white em { font-style: normal; transition: transform 0.16s; }
  .rf-btn-white:hover em { transform: translateX(3px); }

  .rf-btn-outline-w {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 22px; font-size: 14px; font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    color: #fff; background: transparent;
    border: 1.5px solid rgba(255,255,255,0.4);
    border-radius: 9px; cursor: pointer;
    transition: border-color 0.18s, background 0.18s;
  }
  .rf-btn-outline-w:hover { border-color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.08); }

  /* ── Footer ─────────────────────────────────────────────────── */
  .rf-footer {
    background: var(--bg); padding: 28px 56px;
    border-top: 1px solid var(--line);
    display: flex; align-items: center; justify-content: space-between; gap: 20px;
  }
  .rf-footer-logo { height: 22px; object-fit: contain; filter: brightness(0) opacity(0.35); }
  .rf-footer-copy { font-size: 12px; color: var(--muted); }
  .rf-footer-link {
    font-size: 13px; font-weight: 500; color: var(--muted);
    background: none; border: none; cursor: pointer;
    display: flex; align-items: center; gap: 5px; transition: color 0.16s;
  }
  .rf-footer-link:hover { color: var(--accent); }
  .rf-footer-link em { font-style: normal; transition: transform 0.16s; }
  .rf-footer-link:hover em { transform: translateX(3px); }

  /* ── Shared animations ──────────────────────────────────────── */
  @keyframes rfReveal {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes rfFade {
    from { opacity: 0; } to { opacity: 1; }
  }

  /* ── Responsive ─────────────────────────────────────────────── */
  @media (max-width: 1060px) {
    .rf-nav { padding: 0 28px; }
    .rf-hero {
      grid-template-columns: 1fr; min-height: auto;
    }
    .rf-hero::after { display: none; }
    .rf-hero-left { padding: 56px 28px 32px; }
    .rf-hero-right { padding: 0 28px 48px; background: var(--bg-panel);
      background-image: radial-gradient(rgba(37,99,235,0.12) 1px, transparent 1px);
      background-size: 24px 24px; }
    .rf-screens-wrap { width: 100%; max-width: 540px; }
    .rf-features { padding: 64px 28px; }
    .rf-feat-grid { grid-template-columns: repeat(2, 1fr); }
    .rf-footer { padding: 22px 28px; }
    .rf-strip { display: none; }
    .rf-cta-band { padding: 48px 28px; flex-direction: column; gap: 24px; }
  }
  @media (max-width: 640px) {
    .rf-feat-grid { grid-template-columns: 1fr; }
    .rf-headline  { font-size: 40px; }
    .rf-footer    { flex-direction: column; gap: 8px; text-align: center; }
    .rf-so-l, .rf-so-r { display: none; }
    .rf-cta-band-actions { flex-direction: column; width: 100%; }
  }
`

// ── Component ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate()
  const { _hasHydrated, accessToken, user } = useAuthStore()

  const isLoggedIn = _hasHydrated && !!accessToken && !!user
  const ctaLabel   = isLoggedIn ? 'Naar portaal' : 'Inloggen'

  const handleLogin    = () => navigate(isLoggedIn && user ? (ROLE_HOME[user.role] ?? '/login') : '/login')
  const handleRegister = () => navigate('/register')

  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>('.rf-feat-item')
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('rf-visible') }),
      { threshold: 0.08 }
    )
    items.forEach((el, i) => { el.style.transitionDelay = `${i * 0.07}s`; io.observe(el) })
    return () => io.disconnect()
  }, [])

  return (
    <>
      <style>{CSS}</style>
      <div className="rf-land">

        {/* ── Nav ── */}
        <nav className="rf-nav">
          <img src={logo} alt="RokaFlow" className="rf-nav-logo" />
          <div className="rf-nav-actions">
            <button className="rf-nav-link" onClick={() => navigate('/pricing')}>
              Prijzen
            </button>
            <div className="rf-nav-sep" />
            <button className="rf-nav-link" onClick={handleLogin}>
              {ctaLabel} <em>→</em>
            </button>
            {!isLoggedIn && (
              <button className="rf-nav-cta" onClick={handleRegister}>
                Gratis starten <em>→</em>
              </button>
            )}
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="rf-hero">

          {/* LEFT — text */}
          <div className="rf-hero-left">
            <h1 className="rf-headline">
              <div className="rf-lw"><span className="rf-l1">Alles over uw</span></div>
              <div className="rf-lw"><span className="rf-l2">medewerkers</span></div>
              <div className="rf-lw"><span className="rf-l3">op één plek.</span></div>
            </h1>

            <p className="rf-sub">
              IT-beheer van onboarding tot offboarding — hardware, licenties
              en telefonie voor elke medewerker in uw organisatie.
            </p>

            <div className="rf-ctas">
              <button className="rf-btn-primary" onClick={handleLogin}>
                {ctaLabel} <em>→</em>
              </button>
              {!isLoggedIn && (
                <button className="rf-btn-ghost" onClick={handleRegister}>
                  Gratis starten <em>→</em>
                </button>
              )}
            </div>

            {!isLoggedIn && (
              <p className="rf-notice">30 dagen gratis uitproberen</p>
            )}

            <div className="rf-trust">
              <div className="rf-trust-item">
                <div className="rf-trust-icon">🔒</div>
                Veilig & versleuteld
              </div>
              <div className="rf-trust-item">
                <div className="rf-trust-icon">⚡</div>
                Direct operationeel
              </div>
              <div className="rf-trust-item">
                <div className="rf-trust-icon">🏢</div>
                Multi-tenant MSP beheer
              </div>
            </div>
          </div>

          {/* RIGHT — screens */}
          <div className="rf-hero-right" aria-hidden="true">

            {/* App badge */}
            <div className="rf-app-badge">
              <img src={logo} alt="" className="rf-app-badge-logo" />
              <span className="rf-app-badge-label">RokaFlow</span>
              <span className="rf-app-badge-pill">Platform</span>
            </div>

            {/* 3-D screen cluster */}
            <div className="rf-screens-wrap">

              {/* Left — Medewerkers */}
              <div className="rf-so rf-so-l">
                <div className="rf-screen rf-screen-ls">
                  <div className="rf-sc-chrome">
                    <span className="rf-sc-dot rf-sc-dot-r" />
                    <span className="rf-sc-dot rf-sc-dot-y" />
                    <span className="rf-sc-dot rf-sc-dot-g" />
                    <span className="rf-sc-title">Medewerkers</span>
                  </div>
                  <div className="rf-sc-body">
                    <div className="rf-sc-tabs">
                      <div className="rf-sc-tab active">Alle</div>
                      <div className="rf-sc-tab">In dienst</div>
                      <div className="rf-sc-tab">Vertrek</div>
                    </div>
                    <EmpRow color="#10b981" badge="In dienst" bCls="rf-badge-g" />
                    <EmpRow color="#2563eb" w1="52%" w2="38%" badge="In dienst" bCls="rf-badge-g" />
                    <EmpRow color="#f59e0b" w1="64%" w2="44%" badge="Vertrek" bCls="rf-badge-a" />
                    <EmpRow color="#8b5cf6" w1="48%" w2="36%" badge="In dienst" bCls="rf-badge-g" />
                    <EmpRow color="#06b6d4" w1="56%" w2="40%" badge="Start" bCls="rf-badge-b" />
                  </div>
                </div>
                <span className="rf-so-caption">Alle medewerkers in één overzicht — van onboarding tot vertrek altijd bijgewerkt.</span>
              </div>

              {/* Center — Hardware */}
              <div className="rf-so rf-so-c">
                <div className="rf-screen rf-screen-c">
                  <div className="rf-sc-chrome">
                    <span className="rf-sc-dot rf-sc-dot-r" />
                    <span className="rf-sc-dot rf-sc-dot-y" />
                    <span className="rf-sc-dot rf-sc-dot-g" />
                    <span className="rf-sc-title">Hardware Assets</span>
                  </div>
                  <div className="rf-sc-body">
                    <div className="rf-sc-stats">
                      <div className="rf-sc-stat">
                        <div className="rf-sc-stat-n">47</div>
                        <div className="rf-sc-stat-l">Totaal</div>
                      </div>
                      <div className="rf-sc-stat">
                        <div className="rf-sc-stat-n">31</div>
                        <div className="rf-sc-stat-l">In gebruik</div>
                      </div>
                      <div className="rf-sc-stat">
                        <div className="rf-sc-stat-n">€24.8k</div>
                        <div className="rf-sc-stat-l">Waarde</div>
                      </div>
                    </div>
                    <div className="rf-sc-bar-main-track">
                      <div className="rf-sc-bar-main-fill"
                        style={{ width: '66%', background: 'linear-gradient(90deg, #2563eb, #38bdf8)' }} />
                    </div>
                    <HwRow icon="💻" w1="58%" w2="36%" pct={100} barClr="#2563eb" badge="In gebruik" bCls="rf-badge-b" />
                    <HwRow icon="💻" w1="50%" w2="42%" pct={100} barClr="#2563eb" badge="In gebruik" bCls="rf-badge-b" />
                    <HwRow icon="🖥"  w1="52%" w2="30%" pct={0}   barClr="#10b981" badge="Op voorraad" bCls="rf-badge-g" />
                    <HwRow icon="📱" w1="45%" w2="38%" pct={100} barClr="#f59e0b" badge="In reparatie" bCls="rf-badge-a" />
                  </div>
                </div>
                <span className="rf-so-caption">Elke laptop, telefoon en monitor inzichtelijk — statussen en waarde altijd up-to-date.</span>
              </div>

              {/* Right — Licenties */}
              <div className="rf-so rf-so-r">
                <div className="rf-screen rf-screen-ls">
                  <div className="rf-sc-chrome">
                    <span className="rf-sc-dot rf-sc-dot-r" />
                    <span className="rf-sc-dot rf-sc-dot-y" />
                    <span className="rf-sc-dot rf-sc-dot-g" />
                    <span className="rf-sc-title">Licenties</span>
                  </div>
                  <div className="rf-sc-body">
                    <LicCard name="Microsoft 365" vendor="Microsoft" used={45} max={50} pct={90} barClr="#f59e0b" delay="1.3s" />
                    <LicCard name="Adobe Creative Cloud" vendor="Adobe" used={8} max={25} pct={32} barClr="#2563eb" delay="1.5s" />
                    <LicCard name="Slack Pro" vendor="Salesforce" used={24} max={24} pct={100} barClr="#ef4444" delay="1.7s" />
                  </div>
                </div>
                <span className="rf-so-caption">Nooit meer een licentie overschrijden — gebruik per medewerker in één oogopslag.</span>
              </div>

            </div>
          </div>

          {/* Bottom strip */}
          <div className="rf-strip" style={{ gridColumn: '1 / -1' }}>
            {['Medewerkerbeheer','Hardware & Assets','Licenties','Telefonie','Onboarding','MSP-platform'].map(s => (
              <div key={s} className="rf-strip-item">{s}</div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section className="rf-features">
          <div className="rf-feat-head">
            <div className="rf-feat-tag">Wat doet RokaFlow?</div>
            <h2 className="rf-feat-title">Alles wat uw IT-team nodig heeft</h2>
            <p className="rf-feat-sub">
              Van één medewerker tot honderden — RokaFlow houdt alles overzichtelijk.
            </p>
          </div>
          <div className="rf-feat-grid">
            {FEATURES.map(f => (
              <div key={f.n} className="rf-feat-item">
                <div className="rf-feat-icon-wrap">{f.icon}</div>
                <div className="rf-feat-n">{f.n}</div>
                <div className="rf-feat-name">{f.name}</div>
                <div className="rf-feat-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── MSP Transfer section ── */}
        <section className="rf-msp-xfer">
          <div className="rf-msp-xfer-inner" style={{ gridTemplateColumns: '1fr', maxWidth: 640, textAlign: 'center', gap: 16 }}>
            <h2 className="rf-msp-xfer-h">Eenvoudig clients overdragen</h2>
            <p className="rf-msp-xfer-p" style={{ margin: '0 auto 28px' }}>
              Vanuit het MSP-dashboard kunt u bestaande klanten overnemen en overdragen — zonder handmatig werk.
            </p>
            <button className="rf-msp-xfer-link" style={{ margin: '0 auto' }} onClick={() => navigate('/pricing')}>
              Bekijk MSP-abonnement <em>→</em>
            </button>
          </div>
        </section>

        {/* ── CTA band ── */}
        {!isLoggedIn && (
          <div className="rf-cta-band">
            <div className="rf-cta-band-text">
              <h2 className="rf-cta-band-h">Klaar om te beginnen?</h2>
              <p className="rf-cta-band-sub">Gratis proefperiode</p>
            </div>
            <div className="rf-cta-band-actions">
              <button className="rf-btn-white" onClick={handleRegister}>
                Gratis starten <em>→</em>
              </button>
              <button className="rf-btn-outline-w" onClick={handleLogin}>
                Inloggen
              </button>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <footer className="rf-footer">
          <img src={logo} alt="RokaFlow" className="rf-footer-logo" />
          <p className="rf-footer-copy">© {new Date().getFullYear()} RokaFlow · Alle rechten voorbehouden</p>
          <button className="rf-footer-link" onClick={handleLogin}>
            {ctaLabel} <em>→</em>
          </button>
        </footer>

      </div>
    </>
  )
}
