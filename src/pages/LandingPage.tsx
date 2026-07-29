import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Laptop, Monitor, Smartphone } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import logo from '@/assets/RokaFlow_icon_dark_transparent.png'

const ROLE_HOME: Record<string, string> = {
  superuser:    '/superuser',
  msp_admin:    '/org',
  msp_member:   '/org',
  portal_admin: '/client',
  employee:     '/mijn-omgeving',
}

const FEATURES = [
  { n: '01', name: 'Medewerkerbeheer',
    desc: 'Van aantreden tot vertrek: lifecycle, afdeling, manager en contract in één overzicht, met automatische statusovergangen op start- en vertrekdatum.' },
  { n: '02', name: 'Hardware & Assets',
    desc: 'Laptops en apparatuur per medewerker, met uitgifte- en inleverhistorie die zichzelf bijhoudt.' },
  { n: '03', name: 'Licenties & Software',
    desc: 'Bezetting per seat, kosten per licentie en signalen voordat een limiet in zicht komt.' },
  { n: '04', name: 'Telefonie & Internet',
    desc: 'Telefoons, simkaarten, abonnementen en vaste internetverbindingen in samenhang, inclusief kosten en contracten.' },
  { n: '05', name: 'Onboarding & Offboarding',
    desc: 'Checklists die meelopen met start- en vertrekdatum, zodat niets wordt vergeten.' },
  { n: '06', name: 'MSP-platform',
    desc: 'Beheer meerdere organisaties vanuit één dashboard: context-wisselen per klant, geconsolideerde notificaties en eenvoudige overdrachten.' },
]

const STEPS = [
  { n: '1', title: 'Nieuwe collega? Eén formulier.',
    desc: 'Afdeling, startdatum en onboarding-checklist staan meteen goed. De rest volgt vanzelf.' },
  { n: '2', title: 'Hardware koppelen in twee klikken',
    desc: 'Kies het apparaat, kies de medewerker. Uitgifte en historie schrijven zichzelf.' },
  { n: '3', title: 'Licenties bewaken zichzelf',
    desc: 'Bezetting per seat in beeld. RokaFlow signaleert het voordat u een limiet overschrijdt.' },
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

const HwRow = ({ icon, w1 = '55%', w2 = '38%', pct, barClr, badge, bCls, className }: {
  icon: React.ReactNode; w1?: string; w2?: string; pct: number; barClr: string; badge: string; bCls: string; className?: string
}) => (
  <div className={`rf-sc-row ${className ?? ''}`}>
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

const Chrome = ({ title }: { title: string }) => (
  <div className="rf-sc-chrome">
    <span className="rf-sc-dot rf-sc-dot-r" />
    <span className="rf-sc-dot rf-sc-dot-y" />
    <span className="rf-sc-dot rf-sc-dot-g" />
    <span className="rf-sc-title">{title}</span>
  </div>
)

const CursorIcon = () => (
  <svg width="15" height="17" viewBox="0 0 15 17" fill="none" aria-hidden="true">
    <path d="M1 1l4.2 14 2.4-5.7L13.5 7 1 1z" fill="#fff" stroke="#1e293b" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
)

// ── Screens ───────────────────────────────────────────────────────────────────

const EmployeesScreen = () => (
  <div className="rf-screen rf-screen-md">
    <Chrome title="Medewerkers" />
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
)

const HardwareScreen = ({ hero }: { hero?: boolean }) => (
  <div className={`rf-screen ${hero ? 'rf-screen-hero' : 'rf-screen-md'}`}>
    <Chrome title="Hardware Assets" />
    {hero && (
      <div className="rf-sc-toolbar">
        <div className="rf-sc-search"><span /></div>
        <div className="rf-sc-btn">+ Toevoegen</div>
        <div className="rf-cursor"><CursorIcon /></div>
      </div>
    )}
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
        <div className="rf-sc-bar-main-fill" style={{ width: '66%', background: 'linear-gradient(90deg, #2563eb, #38bdf8)' }} />
      </div>
      {hero && (
        <HwRow className="rf-row-new" icon={<Laptop size={hero ? 14 : 12} />} w1="54%" w2="34%" pct={100} barClr="#10b981" badge="Nieuw" bCls="rf-badge-g" />
      )}
      <HwRow icon={<Laptop size={hero ? 14 : 12} />}     w1="58%" w2="36%" pct={100} barClr="#2563eb" badge="In gebruik" bCls="rf-badge-b" />
      <HwRow icon={<Laptop size={hero ? 14 : 12} />}     w1="50%" w2="42%" pct={100} barClr="#2563eb" badge="In gebruik" bCls="rf-badge-b" />
      <HwRow icon={<Monitor size={hero ? 14 : 12} />}    w1="52%" w2="30%" pct={0}   barClr="#10b981" badge="Op voorraad" bCls="rf-badge-g" />
      <HwRow icon={<Smartphone size={hero ? 14 : 12} />} w1="45%" w2="38%" pct={100} barClr="#f59e0b" badge="In reparatie" bCls="rf-badge-a" />
    </div>
  </div>
)

const LicensesScreen = () => (
  <div className="rf-screen rf-screen-md">
    <Chrome title="Licenties" />
    <div className="rf-sc-body">
      <LicCard name="Microsoft 365" vendor="Microsoft" used={45} max={50} pct={90} barClr="#f59e0b" delay="0.3s" />
      <LicCard name="Adobe Creative Cloud" vendor="Adobe" used={8} max={25} pct={32} barClr="#2563eb" delay="0.5s" />
      <LicCard name="Slack Pro" vendor="Salesforce" used={24} max={24} pct={100} barClr="#ef4444" delay="0.7s" />
    </div>
  </div>
)

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:          #fbfcfe;
    --bg-soft:     #f4f6fb;
    --text:        #0e1526;
    --text-2:      #3b4358;
    --muted:       #6b7488;
    --line:        rgba(14,21,38,0.08);
    --line-md:     rgba(14,21,38,0.14);
    --accent:      #2563eb;
    --accent-deep: #1d4ed8;
    --accent-soft: rgba(37,99,235,0.07);
    --nav-bg:      rgba(251,252,254,0.9);
    /* mock screens follow the active theme: light = product light UI */
    --sc-bg:         #ffffff;
    --sc-top:        #f8fafc;
    --sc-border:     rgba(15,23,42,0.1);
    --sc-shadow:     0 0 0 1px rgba(15,23,42,0.05), 0 24px 56px rgba(15,23,42,0.13), 0 8px 16px rgba(15,23,42,0.07);
    --sc-accent:     #2563eb;
    --sc-title:      rgba(15,23,42,0.55);
    --sc-text:       rgba(15,23,42,0.85);
    --sc-text-dim:   rgba(15,23,42,0.4);
    --sc-line:       rgba(15,23,42,0.12);
    --sc-line-s:     rgba(15,23,42,0.06);
    --sc-row-border: rgba(15,23,42,0.06);
    --sc-track:      rgba(15,23,42,0.08);
    --sc-tile-bg:    #eff6ff;
    --sc-tile-bd:    rgba(37,99,235,0.18);
    --sc-badge-g-bg: rgba(16,185,129,0.14);  --sc-badge-g-tx: #059669;
    --sc-badge-a-bg: rgba(245,158,11,0.16);  --sc-badge-a-tx: #b45309;
    --sc-badge-b-bg: rgba(37,99,235,0.12);   --sc-badge-b-tx: #2563eb;
  }
  html.dark {
    --bg:          #0b1020;
    --bg-soft:     #0e1528;
    --text:        #e8ecf7;
    --text-2:      #b6bfd4;
    --muted:       #8b94ab;
    --line:        rgba(232,236,247,0.08);
    --line-md:     rgba(232,236,247,0.15);
    --accent:      #60a5fa;
    --accent-deep: #3b82f6;
    --accent-soft: rgba(96,165,250,0.09);
    --nav-bg:      rgba(11,16,32,0.88);
    --sc-bg:         #071628;
    --sc-top:        #0d2244;
    --sc-border:     rgba(255,255,255,0.06);
    --sc-shadow:     0 0 0 1px rgba(0,0,0,0.3), 0 24px 56px rgba(0,0,0,0.35), 0 8px 16px rgba(0,0,0,0.2);
    --sc-accent:     #38bdf8;
    --sc-title:      rgba(238,242,255,0.4);
    --sc-text:       rgba(238,242,255,0.8);
    --sc-text-dim:   rgba(238,242,255,0.28);
    --sc-line:       rgba(238,242,255,0.1);
    --sc-line-s:     rgba(238,242,255,0.06);
    --sc-row-border: rgba(238,242,255,0.04);
    --sc-track:      rgba(238,242,255,0.07);
    --sc-tile-bg:    rgba(37,99,235,0.1);
    --sc-tile-bd:    rgba(37,99,235,0.18);
    --sc-badge-g-bg: rgba(16,185,129,0.18);  --sc-badge-g-tx: #34d399;
    --sc-badge-a-bg: rgba(245,158,11,0.18);  --sc-badge-a-tx: #fbbf24;
    --sc-badge-b-bg: rgba(37,99,235,0.22);   --sc-badge-b-tx: #93c5fd;
  }

  /* ── Base ───────────────────────────────────────────────────── */
  .rf-land {
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: 'Hanken Grotesk', system-ui, sans-serif;
    overflow-x: clip;
  }
  .rf-land button:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  /* ── Nav ────────────────────────────────────────────────────── */
  .rf-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 clamp(20px, 4vw, 56px); height: 62px;
    background: var(--nav-bg);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--line);
    animation: rfFade 0.4s ease both;
  }
  .rf-nav-logo { height: 46px; object-fit: contain; filter: brightness(0) opacity(0.82); }
  html.dark .rf-nav-logo { filter: brightness(0) invert(1) opacity(0.85); }
  .rf-nav-actions { display: flex; align-items: center; gap: 16px; }

  .rf-nav-link {
    font-size: 13.5px; font-weight: 500;
    color: var(--muted); background: none; border: none; cursor: pointer;
    transition: color 0.16s; display: flex; align-items: center; gap: 5px; padding: 0;
  }
  .rf-nav-link:hover { color: var(--text); }
  .rf-nav-link em { font-style: normal; transition: transform 0.16s; }
  .rf-nav-link:hover em { transform: translateX(3px); }
  .rf-nav-sep { width: 1px; height: 18px; background: var(--line-md); }

  .rf-nav-cta {
    font-size: 13.5px; font-weight: 600;
    color: #fff; background: #2563eb;
    border: none; cursor: pointer;
    padding: 8px 18px; border-radius: 8px;
    transition: background 0.18s, box-shadow 0.18s;
    display: flex; align-items: center; gap: 6px;
  }
  .rf-nav-cta:hover { background: #1d4ed8; box-shadow: 0 4px 14px rgba(37,99,235,0.35); }
  .rf-nav-cta em { font-style: normal; transition: transform 0.16s; }
  .rf-nav-cta:hover em { transform: translateX(3px); }

  .rf-theme-toggle {
    display: flex; align-items: center; justify-content: center;
    width: 32px; height: 32px; background: none;
    border: 1px solid var(--line-md); border-radius: 8px;
    cursor: pointer; color: var(--muted); padding: 0; flex-shrink: 0;
    transition: color 0.16s, border-color 0.16s, background 0.16s;
  }
  .rf-theme-toggle:hover { color: var(--text); border-color: var(--accent); background: var(--accent-soft); }

  /* ── Hero ───────────────────────────────────────────────────── */
  .rf-hero {
    min-height: 100vh;
    padding: 100px clamp(20px, 4vw, 56px) 48px;
    max-width: 1320px; margin: 0 auto;
    display: grid; grid-template-columns: 1.05fr 1fr;
    gap: clamp(32px, 5vw, 80px);
    align-items: center; align-content: center;
    text-align: left;
    position: relative;
  }
  .rf-hero-copy { display: flex; flex-direction: column; align-items: flex-start; }

  .rf-headline {
    font-family: 'Hanken Grotesk', sans-serif;
    font-size: clamp(40px, 4.6vw, 68px);
    font-weight: 800; line-height: 1.04;
    letter-spacing: -0.025em; color: var(--text);
    margin-bottom: 26px;
    max-width: 15ch;
  }
  .rf-lw { overflow: hidden; }
  .rf-l1 { display: block; animation: rfReveal 0.8s cubic-bezier(0.16,1,0.3,1) 0.12s both; }
  .rf-l2 { display: block; animation: rfReveal 0.8s cubic-bezier(0.16,1,0.3,1) 0.24s both; }
  .rf-l3 { display: block; color: var(--accent); animation: rfReveal 0.8s cubic-bezier(0.16,1,0.3,1) 0.36s both; }

  .rf-sub {
    font-size: clamp(15px, 1.6vw, 17px); line-height: 1.72;
    color: var(--muted); max-width: 52ch;
    margin-bottom: 36px;
    animation: rfReveal 0.7s cubic-bezier(0.16,1,0.3,1) 0.5s both;
  }

  .rf-ctas {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    animation: rfReveal 0.7s cubic-bezier(0.16,1,0.3,1) 0.62s both;
  }

  .rf-btn-primary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 13px 26px; font-size: 14.5px; font-weight: 600;
    font-family: 'Hanken Grotesk', sans-serif;
    color: #fff; background: #2563eb;
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
    padding: 13px 24px; font-size: 14.5px; font-weight: 500;
    font-family: 'Hanken Grotesk', sans-serif;
    color: var(--text-2);
    background: transparent; border: 1.5px solid var(--line-md);
    border-radius: 9px; cursor: pointer;
    transition: border-color 0.18s, color 0.18s, background 0.18s;
  }
  .rf-btn-ghost:hover {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--accent-soft);
  }
  .rf-btn-ghost em { font-style: normal; transition: transform 0.16s; }
  .rf-btn-ghost:hover em { transform: translateX(3px); }

  .rf-trustline {
    margin-top: 20px; font-size: 12.5px; color: var(--muted);
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    animation: rfReveal 0.6s ease 0.78s both;
  }
  .rf-trustline b { font-weight: 500; color: var(--text-2); }
  .rf-trustline span { opacity: 0.45; }

  /* ── Hero window ────────────────────────────────────────────── */
  .rf-hero-stage {
    perspective: 1200px;
    perspective-origin: 20% 30%;
    display: flex; justify-content: center;
    animation: rfRise 1s cubic-bezier(0.16,1,0.3,1) 0.55s both;
  }
  .rf-hero-window {
    transform: rotateX(6deg) rotateY(-6deg);
    will-change: transform;
  }
  @keyframes rfRise {
    from { opacity: 0; transform: translateY(48px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Screen shells ──────────────────────────────────────────── */
  .rf-screen {
    border-radius: 12px; overflow: hidden;
    background: var(--sc-bg);
    border: 1px solid var(--sc-border);
    box-shadow: var(--sc-shadow);
    position: relative;
    text-align: left;
    transition: background 0.3s, border-color 0.3s, box-shadow 0.3s;
  }
  .rf-screen-md   { width: 320px; }
  .rf-screen-hero { width: min(580px, 92vw); }

  .rf-sc-chrome {
    height: 28px; background: var(--sc-top);
    border-bottom: 1px solid var(--sc-border);
    display: flex; align-items: center; gap: 5px; padding: 0 11px;
    transition: background 0.3s, border-color 0.3s;
  }
  .rf-screen-hero .rf-sc-chrome { height: 34px; padding: 0 13px; }
  .rf-sc-dot { width: 7px; height: 7px; border-radius: 50%; }
  .rf-sc-dot-r { background: #ff5f57; }
  .rf-sc-dot-y { background: #febc2e; }
  .rf-sc-dot-g { background: #28c840; }
  .rf-sc-title {
    font-family: 'Hanken Grotesk', sans-serif;
    font-size: 10px; font-weight: 600;
    color: var(--sc-title); margin-left: 7px; letter-spacing: 0.04em;
  }
  .rf-screen-hero .rf-sc-title { font-size: 11.5px; }
  .rf-sc-body { padding: 10px 11px 11px; }
  .rf-screen-hero .rf-sc-body { padding: 12px 14px 14px; }

  /* toolbar (hero window only) */
  .rf-sc-toolbar {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 14px 0;
    position: relative;
  }
  .rf-sc-search {
    flex: 1; height: 24px; border-radius: 6px;
    background: var(--sc-track);
    display: flex; align-items: center; padding: 0 9px;
  }
  .rf-sc-search span { width: 42%; height: 5px; border-radius: 3px; background: var(--sc-line-s); }
  .rf-sc-btn {
    font-family: 'Hanken Grotesk', sans-serif;
    font-size: 10.5px; font-weight: 700; color: #fff;
    background: #2563eb; border-radius: 6px;
    padding: 5px 11px; white-space: nowrap;
    animation: rfBtnPress 9s cubic-bezier(0.16,1,0.3,1) 1.4s infinite;
  }
  .rf-cursor {
    position: absolute; top: 12px; right: 44px;
    z-index: 3; pointer-events: none;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    animation: rfCursorPath 9s cubic-bezier(0.45,0,0.2,1) 1.4s infinite both;
    opacity: 0;
  }
  @keyframes rfCursorPath {
    0%       { opacity: 0; transform: translate(150px, 140px); }
    8%       { opacity: 0; transform: translate(150px, 140px); }
    16%      { opacity: 1; }
    26%      { opacity: 1; transform: translate(4px, 6px); }
    29%      { opacity: 1; transform: translate(4px, 6px) scale(0.86); }
    33%      { opacity: 1; transform: translate(4px, 6px) scale(1); }
    46%      { opacity: 1; transform: translate(-30px, 78px); }
    56%,100% { opacity: 0; transform: translate(150px, 140px); }
  }
  @keyframes rfBtnPress {
    0%, 27.5%, 33%, 100% { transform: scale(1); }
    30%                  { transform: scale(0.92); }
  }
  .rf-row-new {
    animation: rfRowIn 9s cubic-bezier(0.16,1,0.3,1) 1.4s infinite both;
    opacity: 0;
  }
  @keyframes rfRowIn {
    0%, 32%   { opacity: 0; transform: translateY(-5px); }
    40%, 74%  { opacity: 1; transform: translateY(0); }
    84%, 100% { opacity: 0; transform: translateY(-5px); }
  }

  .rf-sc-stats { display: flex; gap: 5px; margin-bottom: 8px; }
  .rf-screen-hero .rf-sc-stats { gap: 8px; margin-bottom: 10px; }
  .rf-sc-stat {
    flex: 1; background: var(--sc-tile-bg);
    border: 1px solid var(--sc-tile-bd);
    border-radius: 6px; padding: 5px 7px;
  }
  .rf-screen-hero .rf-sc-stat { padding: 8px 10px; }
  .rf-sc-stat-n {
    font-family: 'Hanken Grotesk', sans-serif;
    font-size: 13px; font-weight: 700; color: var(--sc-accent); line-height: 1;
  }
  .rf-screen-hero .rf-sc-stat-n { font-size: 18px; }
  .rf-sc-stat-l { font-size: 7.5px; color: var(--sc-text-dim); margin-top: 2px; }
  .rf-screen-hero .rf-sc-stat-l { font-size: 9.5px; margin-top: 3px; }

  .rf-sc-bar-main-track {
    background: var(--sc-track); height: 5px;
    border-radius: 3px; overflow: hidden; margin-bottom: 8px;
  }
  .rf-screen-hero .rf-sc-bar-main-track { height: 6px; margin-bottom: 10px; }
  .rf-sc-bar-main-fill {
    height: 100%; border-radius: 3px;
    transform-origin: left center; transform: scaleX(0);
    animation: rfBarReveal 1s cubic-bezier(0.16,1,0.3,1) 1.1s both;
  }

  .rf-sc-row {
    display: flex; align-items: center; gap: 7px;
    padding: 4px 0; border-bottom: 1px solid var(--sc-row-border);
  }
  .rf-screen-hero .rf-sc-row { padding: 6px 0; gap: 10px; }
  .rf-sc-row:last-child { border-bottom: none; }
  .rf-sc-av { width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; }
  .rf-sc-icon {
    line-height: 1; flex-shrink: 0; width: 20px; text-align: center;
    display: flex; align-items: center; justify-content: center; color: var(--sc-accent);
  }
  .rf-sc-lines { flex: 1; }
  .rf-sc-line { height: 5px; border-radius: 2px; background: var(--sc-line); margin-bottom: 3px; }
  .rf-screen-hero .rf-sc-line { height: 6px; margin-bottom: 4px; }
  .rf-sc-line-s { background: var(--sc-line-s); margin-bottom: 0 !important; }

  .rf-sc-badge {
    font-size: 7px; font-weight: 700;
    padding: 2px 5px; border-radius: 3px;
    white-space: nowrap; flex-shrink: 0;
  }
  .rf-screen-hero .rf-sc-badge { font-size: 8.5px; padding: 2.5px 7px; }
  .rf-badge-g { background: var(--sc-badge-g-bg); color: var(--sc-badge-g-tx); }
  .rf-badge-a { background: var(--sc-badge-a-bg); color: var(--sc-badge-a-tx); }
  .rf-badge-b { background: var(--sc-badge-b-bg); color: var(--sc-badge-b-tx); }

  .rf-sc-bar-mini-track { width: 38px; height: 3px; border-radius: 2px; background: var(--sc-track); overflow: hidden; }
  .rf-screen-hero .rf-sc-bar-mini-track { width: 52px; }
  .rf-sc-bar-mini-fill  { height: 100%; border-radius: 2px; }

  .rf-sc-lic { background: var(--sc-tile-bg); border: 1px solid var(--sc-tile-bd); border-radius: 6px; padding: 8px 9px; margin-bottom: 6px; }
  .rf-sc-lic:last-child { margin-bottom: 0; }
  .rf-sc-lic-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1px; }
  .rf-sc-lic-name { font-size: 9px; font-weight: 700; color: var(--sc-text); }
  .rf-sc-lic-vendor { font-size: 7.5px; color: var(--sc-text-dim); margin-bottom: 5px; }
  .rf-sc-bar-track { background: var(--sc-track); height: 4px; border-radius: 2px; overflow: hidden; }
  .rf-sc-bar-fill {
    height: 100%; border-radius: 2px;
    transform-origin: left center; transform: scaleX(0);
    animation: rfBarReveal 0.9s cubic-bezier(0.16,1,0.3,1) both;
  }

  .rf-sc-tabs { display: flex; border-bottom: 1px solid var(--sc-row-border); margin-bottom: 7px; }
  .rf-sc-tab { font-size: 8px; font-weight: 600; padding: 4px 7px; color: var(--sc-text-dim); letter-spacing: 0.03em; }
  .rf-sc-tab.active { color: var(--sc-accent); border-bottom: 1px solid var(--sc-accent); margin-bottom: -1px; }

  @keyframes rfBarReveal { to { transform: scaleX(1); } }

  /* ── Scroll story ───────────────────────────────────────────── */
  .rf-story {
    border-top: 1px solid var(--line);
    background: var(--bg-soft);
    padding: 96px clamp(20px, 4vw, 56px) 40px;
  }
  .rf-story-head { max-width: 1080px; margin: 0 auto 24px; }
  .rf-story-title {
    font-family: 'Hanken Grotesk', sans-serif;
    font-size: clamp(30px, 3.6vw, 48px); font-weight: 800;
    letter-spacing: -0.02em; line-height: 1.1; color: var(--text);
    max-width: 14ch;
  }
  .rf-story-sub { font-size: 15.5px; color: var(--muted); margin-top: 12px; max-width: 46ch; line-height: 1.7; }

  .rf-story-grid {
    max-width: 1080px; margin: 0 auto;
    display: grid; grid-template-columns: 1fr 1fr; gap: clamp(32px, 6vw, 96px);
  }

  .rf-story-stage {
    position: sticky; top: 0;
    height: 100vh;
    align-self: start;
    display: flex; align-items: center; justify-content: center;
  }
  .rf-story-frame { position: relative; width: 460px; height: 430px; max-width: 100%; }
  .rf-story-shot {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transform: translateY(20px) scale(0.97);
    transition: opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.55s cubic-bezier(0.16,1,0.3,1);
    pointer-events: none;
  }
  .rf-story-shot.active { opacity: 1; transform: translateY(0) scale(1); }
  .rf-story-shot .rf-screen { transform: scale(1.4); }
  @media (max-width: 1160px) {
    .rf-story-frame { width: 390px; }
    .rf-story-shot .rf-screen { transform: scale(1.18); }
  }

  .rf-story-steps { padding: 8vh 0 16vh; }
  .rf-step {
    min-height: 62vh;
    display: flex; flex-direction: column; justify-content: center;
    opacity: 0.32;
    transition: opacity 0.4s ease;
  }
  .rf-step.active { opacity: 1; }
  .rf-step-n {
    font-family: 'Hanken Grotesk', sans-serif;
    font-size: 13px; font-weight: 700; color: var(--accent);
    margin-bottom: 12px;
  }
  .rf-step-title {
    font-family: 'Hanken Grotesk', sans-serif;
    font-size: clamp(22px, 2.4vw, 30px); font-weight: 700;
    letter-spacing: -0.015em; color: var(--text); margin-bottom: 10px;
  }
  .rf-step-desc { font-size: 15px; line-height: 1.72; color: var(--muted); max-width: 40ch; }
  .rf-step-shot { display: none; margin-bottom: 28px; }

  /* ── Statement ──────────────────────────────────────────────── */
  .rf-statement {
    padding: 140px clamp(20px, 4vw, 56px);
    text-align: center;
    border-top: 1px solid var(--line);
  }
  .rf-statement-h {
    font-family: 'Hanken Grotesk', sans-serif;
    font-size: clamp(28px, 4.2vw, 58px); font-weight: 800;
    letter-spacing: -0.02em; line-height: 1.14;
    color: var(--text);
    max-width: 22ch; margin: 0 auto;
  }
  .rf-statement-h em { font-style: normal; color: var(--accent); }
  .rf-statement-sub {
    font-size: 15.5px; color: var(--muted); line-height: 1.7;
    max-width: 52ch; margin: 20px auto 0;
  }

  /* ── Features index ─────────────────────────────────────────── */
  .rf-features {
    padding: 110px clamp(20px, 4vw, 56px) 120px;
    border-top: 1px solid var(--line);
    background: var(--bg-soft);
  }
  .rf-feat-head {
    max-width: 1080px; margin: 0 auto 48px;
    display: flex; align-items: baseline; justify-content: space-between; gap: 24px; flex-wrap: wrap;
  }
  .rf-feat-title {
    font-family: 'Hanken Grotesk', sans-serif;
    font-size: clamp(28px, 3.2vw, 44px); font-weight: 800;
    letter-spacing: -0.02em; color: var(--text);
  }
  .rf-feat-link {
    font-size: 14px; font-weight: 600; color: var(--accent);
    background: none; border: none; cursor: pointer;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .rf-feat-link em { font-style: normal; transition: transform 0.16s; }
  .rf-feat-link:hover em { transform: translateX(3px); }

  .rf-feat-list { max-width: 1080px; margin: 0 auto; }
  .rf-feat-row {
    display: grid; grid-template-columns: 64px 0.9fr 1.1fr;
    gap: clamp(16px, 3vw, 48px); align-items: baseline;
    padding: 26px 8px;
    border-top: 1px solid var(--line-md);
    opacity: 0; transform: translateY(14px);
    transition: opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.55s cubic-bezier(0.16,1,0.3,1),
                background 0.2s ease;
  }
  .rf-feat-row:last-child { border-bottom: 1px solid var(--line-md); }
  .rf-feat-row.rf-visible { opacity: 1; transform: translateY(0); }
  .rf-feat-row:hover { background: var(--accent-soft); }
  .rf-feat-n {
    font-family: 'Hanken Grotesk', sans-serif;
    font-size: 13px; font-weight: 700; color: var(--muted);
  }
  .rf-feat-name {
    font-family: 'Hanken Grotesk', sans-serif;
    font-size: clamp(17px, 1.9vw, 22px); font-weight: 700;
    letter-spacing: -0.01em; color: var(--text);
    transition: color 0.18s, transform 0.25s cubic-bezier(0.16,1,0.3,1);
  }
  .rf-feat-row:hover .rf-feat-name { color: var(--accent); transform: translateX(6px); }
  .rf-feat-desc { font-size: 14px; line-height: 1.7; color: var(--muted); max-width: 58ch; }

  /* ── MSP ────────────────────────────────────────────────────── */
  .rf-msp {
    padding: 110px clamp(20px, 4vw, 56px);
    text-align: center;
  }
  .rf-msp-h {
    font-family: 'Hanken Grotesk', sans-serif;
    font-size: clamp(26px, 3vw, 40px); font-weight: 800;
    letter-spacing: -0.02em; color: var(--text); margin-bottom: 14px;
  }
  .rf-msp-p {
    font-size: 15.5px; color: var(--muted); line-height: 1.72;
    max-width: 52ch; margin: 0 auto 30px;
  }
  .rf-msp-link {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 14px; font-weight: 600; color: var(--accent);
    background: var(--accent-soft); border: 1px solid var(--line-md);
    padding: 11px 24px; border-radius: 10px; cursor: pointer;
    transition: border-color 0.18s, background 0.18s;
  }
  .rf-msp-link:hover { border-color: var(--accent); }
  .rf-msp-link em { font-style: normal; transition: transform 0.15s; }
  .rf-msp-link:hover em { transform: translateX(3px); }

  /* ── CTA band ───────────────────────────────────────────────── */
  .rf-cta-band {
    background: #2563eb;
    padding: 96px clamp(20px, 4vw, 56px);
    text-align: center;
  }
  .rf-cta-band-h {
    font-family: 'Hanken Grotesk', sans-serif;
    font-size: clamp(30px, 4vw, 54px); font-weight: 800;
    color: #fff; letter-spacing: -0.02em; margin-bottom: 12px;
  }
  .rf-cta-band-sub { font-size: 15.5px; color: rgba(255,255,255,0.75); margin-bottom: 34px; }
  .rf-cta-band-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

  .rf-btn-white {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 13px 26px; font-size: 14.5px; font-weight: 600;
    font-family: 'Hanken Grotesk', sans-serif;
    color: #1d4ed8; background: #fff;
    border: none; border-radius: 9px; cursor: pointer;
    transition: box-shadow 0.18s, transform 0.12s;
  }
  .rf-btn-white:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.2); transform: translateY(-1px); }
  .rf-btn-white em { font-style: normal; transition: transform 0.16s; }
  .rf-btn-white:hover em { transform: translateX(3px); }

  .rf-btn-outline-w {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 13px 24px; font-size: 14.5px; font-weight: 500;
    font-family: 'Hanken Grotesk', sans-serif;
    color: #fff; background: transparent;
    border: 1.5px solid rgba(255,255,255,0.4);
    border-radius: 9px; cursor: pointer;
    transition: border-color 0.18s, background 0.18s;
  }
  .rf-btn-outline-w:hover { border-color: rgba(255,255,255,0.85); background: rgba(255,255,255,0.08); }

  /* ── Footer ─────────────────────────────────────────────────── */
  .rf-footer {
    background: var(--bg); padding: 28px clamp(20px, 4vw, 56px);
    border-top: 1px solid var(--line);
    display: flex; align-items: center; justify-content: space-between; gap: 20px;
  }
  .rf-footer-logo { height: 22px; object-fit: contain; filter: brightness(0) opacity(0.35); }
  html.dark .rf-footer-logo { filter: brightness(0) invert(1) opacity(0.3); }
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
  @keyframes rfFade { from { opacity: 0; } to { opacity: 1; } }

  /* ── Responsive ─────────────────────────────────────────────── */
  @media (max-width: 900px) {
    .rf-hero {
      min-height: 0;
      padding-top: 120px; padding-bottom: 72px;
      grid-template-columns: 1fr; gap: 48px;
      text-align: center;
    }
    .rf-hero-copy { align-items: center; }
    .rf-ctas { justify-content: center; }
    .rf-trustline { justify-content: center; }
    .rf-hero-window { transform: none !important; }
    .rf-story { padding-top: 72px; }
    .rf-story-grid { grid-template-columns: 1fr; }
    .rf-story-stage { display: none; }
    .rf-story-steps { padding: 0; }
    .rf-step { min-height: 0; padding: 40px 0; opacity: 1; }
    .rf-step-shot { display: flex; justify-content: center; }
    .rf-feat-row { grid-template-columns: 44px 1fr; }
    .rf-feat-desc { grid-column: 2; }
    .rf-statement { padding: 96px clamp(20px, 4vw, 56px); }
    .rf-msp { padding: 80px clamp(20px, 4vw, 56px); }
    .rf-cta-band { padding: 72px clamp(20px, 4vw, 56px); }
  }
  @media (max-width: 640px) {
    .rf-nav { padding: 0 14px; }
    .rf-nav-actions { gap: 10px; }
    .rf-nav-link { font-size: 12.5px; }
    .rf-nav-cta { padding: 7px 12px; font-size: 12.5px; white-space: nowrap; }
    .rf-footer { flex-direction: column; gap: 8px; text-align: center; }
    .rf-ctas { width: 100%; }
    .rf-ctas button { width: 100%; justify-content: center; }
  }

  /* ── Reduced motion ─────────────────────────────────────────── */
  @media (prefers-reduced-motion: reduce) {
    .rf-land *, .rf-land *::before, .rf-land *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
    .rf-cursor { display: none; }
    .rf-row-new { opacity: 1; }
    .rf-hero-window { transform: none !important; }
  }
`

// ── Component ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate()
  const { _hasHydrated, accessToken, user } = useAuthStore()
  const [step, setStep] = useState(0)
  const winRef = useRef<HTMLDivElement>(null)
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])

  const isLoggedIn = _hasHydrated && !!accessToken && !!user
  const ctaLabel   = isLoggedIn ? 'Naar portaal' : 'Inloggen'

  const handleLogin    = () => navigate(isLoggedIn && user ? (ROLE_HOME[user.role] ?? '/login') : '/login')
  const handleRegister = () => navigate('/register')

  // Hero window straightens as you scroll
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const el = winRef.current
        if (!el) return
        const t = Math.min(1, window.scrollY / 420)
        el.style.transform = `rotateX(${(1 - t) * 6}deg) rotateY(${(1 - t) * -6}deg) translateY(${t * -8}px)`
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf) }
  }, [])

  // Scroll story: active step follows the block nearest the viewport center
  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) setStep(Number((e.target as HTMLElement).dataset.step))
      }),
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    )
    stepRefs.current.forEach(el => el && io.observe(el))
    return () => io.disconnect()
  }, [])

  // Features index reveal
  useEffect(() => {
    const rows = document.querySelectorAll<HTMLElement>('.rf-feat-row')
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('rf-visible') }),
      { threshold: 0.15 }
    )
    rows.forEach((el, i) => { el.style.transitionDelay = `${i * 0.06}s`; io.observe(el) })
    return () => io.disconnect()
  }, [])

  const stepScreens = [<EmployeesScreen key="e" />, <HardwareScreen key="h" />, <LicensesScreen key="l" />]

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
            <ThemeToggle className="rf-theme-toggle" />
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="rf-hero">
          <div className="rf-hero-copy">
          <h1 className="rf-headline">
            <div className="rf-lw"><span className="rf-l1">Heel uw IT.</span></div>
            <div className="rf-lw"><span className="rf-l2">Eén systeem.</span></div>
            <div className="rf-lw"><span className="rf-l3">Nul gedoe.</span></div>
          </h1>

          <p className="rf-sub">
            Hardware, software, licenties, telefonie en internetverbindingen:
            alles wat uw organisatie aan IT heeft, bijgehouden op één plek.
            Zo eenvoudig dat het zichzelf wijst.
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

          <p className="rf-trustline">
            {!isLoggedIn && <><b>30 dagen gratis uitproberen</b><span>·</span></>}
            <b>Veilig &amp; versleuteld</b><span>·</span>
            <b>Direct operationeel</b><span>·</span>
            <b>Multi-tenant MSP-beheer</b>
          </p>
          </div>

          {/* Live product window */}
          <div className="rf-hero-stage" aria-hidden="true">
            <div className="rf-hero-window" ref={winRef}>
              <HardwareScreen hero />
            </div>
          </div>
        </section>

        {/* ── Scroll story ── */}
        <section className="rf-story">
          <div className="rf-story-head">
            <h2 className="rf-story-title">Zo eenvoudig werkt het</h2>
            <p className="rf-story-sub">Drie dagelijkse handelingen, zonder training of handleiding.</p>
          </div>
          <div className="rf-story-grid">
            <div className="rf-story-stage" aria-hidden="true">
              <div className="rf-story-frame">
                {stepScreens.map((screen, i) => (
                  <div key={i} className={`rf-story-shot ${step === i ? 'active' : ''}`}>
                    {screen}
                  </div>
                ))}
              </div>
            </div>
            <div className="rf-story-steps">
              {STEPS.map((s, i) => (
                <div
                  key={s.n}
                  data-step={i}
                  ref={el => { stepRefs.current[i] = el }}
                  className={`rf-step ${step === i ? 'active' : ''}`}
                >
                  <div className="rf-step-shot" aria-hidden="true">{stepScreens[i]}</div>
                  <div className="rf-step-n">Stap {s.n}</div>
                  <h3 className="rf-step-title">{s.title}</h3>
                  <p className="rf-step-desc">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Statement ── */}
        <section className="rf-statement">
          <h2 className="rf-statement-h">
            Als het met IT te maken heeft, <em>staat het in RokaFlow.</em>
          </h2>
          <p className="rf-statement-sub">
            Laptops, monitors, licenties, simkaarten, abonnementen, internetverbindingen
            en contracten. Plus de medewerkers die ermee werken, van eerste werkdag
            tot offboarding. Geen handleiding of implementatietraject nodig: registreren,
            importeren, klaar.
          </p>
        </section>

        {/* ── Features index ── */}
        <section className="rf-features">
          <div className="rf-feat-head">
            <h2 className="rf-feat-title">Alles wat u bijhoudt</h2>
            <button className="rf-feat-link" onClick={() => navigate('/pricing')}>
              Bekijk prijzen <em>→</em>
            </button>
          </div>
          <div className="rf-feat-list">
            {FEATURES.map(f => (
              <div key={f.n} className="rf-feat-row">
                <span className="rf-feat-n">{f.n}</span>
                <h3 className="rf-feat-name">{f.name}</h3>
                <p className="rf-feat-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── MSP ── */}
        <section className="rf-msp">
          <h2 className="rf-msp-h">Ook voor MSP's</h2>
          <p className="rf-msp-p">
            Beheer al uw klantorganisaties vanuit één omgeving, met dezelfde eenvoud.
            Klanten overdragen of overnemen kost één bevestiging.
          </p>
          <button className="rf-msp-link" onClick={() => navigate('/pricing')}>
            Bekijk MSP-abonnement <em>→</em>
          </button>
        </section>

        {/* ── CTA band ── */}
        {!isLoggedIn && (
          <div className="rf-cta-band">
            <h2 className="rf-cta-band-h">Vandaag nog alles op een rij.</h2>
            <p className="rf-cta-band-sub">30 dagen gratis uitproberen.</p>
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
