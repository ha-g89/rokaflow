---
name: RokaFlow
description: Multi-tenant IT-asset en medewerker-lifecycle platform voor MSP's en hun klanten
colors:
  primary: "#2563eb"
  primary-deep: "#1d4ed8"
  danger: "#dc2626"
  danger-soft: "#ef4444"
  unlink-accent: "#f97316"
  success: "#059669"
  neutral-bg: "#ffffff"
  neutral-surface: "#f8fafc"
  neutral-surface-dark: "#0f172a"
  neutral-card-dark: "#1e293b"
  neutral-border: "#e2e8f0"
  neutral-border-dark: "#334155"
  neutral-text: "#0f172a"
  neutral-text-dark: "#f1f5f9"
  neutral-text-secondary: "#64748b"
typography:
  body:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    letterSpacing: "0.05em"
  brand-display:
    fontFamily: "Syne, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2.25rem)"
    fontWeight: 700
  brand-body:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "20px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
  button-secondary:
    backgroundColor: "#f1f5f9"
    textColor: "#334155"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.neutral-bg}"
    rounded: "{rounded.md}"
  modal:
    backgroundColor: "{colors.neutral-bg}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: RokaFlow

## 1. Overview

**Creative North Star: "The Efficient Desk"**

RokaFlow is where a beheerder sits down between other tasks — never for its own sake — to add a laptop, close out an offboarding, check a license before it lapses. Everything on the desk is within reach, nothing is decorative, and the surface stays calm even though what's on it (personnel data, contracts, financial commitments) is sensitive. Premium here does not mean ornamental; it means every corner, shadow and transition is deliberate enough that the tool never feels like the grey, dated IT-ticketing software it explicitly refuses to resemble.

The system runs two registers side by side. The **product surface** (MSP-portaal, klant-portaal, superuser-beheer — the vast majority of screens) is quiet, dense, system-native: system-ui type, Tailwind slate neutrals, blue as the one recurring accent. The **brand surface** (login, registratie, landingspagina, pricing) is where RokaFlow gets to introduce itself, and picks up a distinct display voice (Syne + DM Sans) — but even there, restraint wins over spectacle.

**Key Characteristics:**
- Flat, dense information layout; shadows are used sparingly and only to signal a layer change (card → modal), never for decoration
- One accent color (blue-600) carries almost all interactive weight; red, orange and emerald are reserved for specific, narrow semantic roles, never general decoration
- Confirmation before consequence: every destructive or unlink action stops at a modal first
- Dark mode is a first-class, fully-considered surface, not an inverted afterthought

## 2. Colors

Overwegend neutraal (Restrained strategy): getinte slate-neutrals dragen het gros van elk scherm, blauw is de enige brede interactie-accent. Rood, oranje en emerald zijn functioneel ingezet, niet decoratief.

### Primary
- **Actief Blauw** (`#2563eb`): primaire acties (opslaan, toevoegen, bevestigen), actieve navigatie-items, links, focus-states. Hover verdiept naar **Diep Blauw** (`#1d4ed8`). In dark mode wordt de focus-ring `#60a5fa` (blue-400) om zichtbaar te blijven op de donkere ondergrond.

### Secondary
- **Waarschuwend Rood** (`#dc2626`): uitsluitend destructieve acties (verwijderen) en foutmeldingen. De zachtere `#ef4444` (rood-500) is de hover-tint op verwijder-iconen (`hover:text-red-500 hover:bg-red-50`) — nooit als vlakvulling.

### Tertiary
- **Ontkoppel-Oranje** (`#f97316`): een bewust aparte kleur van rood, uitsluitend voor "ontkoppelen"-acties (simkaart van telefoon, hardware/telefoon van medewerker). Ontkoppelen is geen destructieve actie — het verwijdert niets, het maakt alleen een koppeling los — en krijgt daarom nooit de rode kleur van verwijderen.

### Neutral
- **Kaart-wit** (`#ffffff`) / **Slate-950** (`#0f172a` als donkere achtergrond): basisoppervlak licht/donker.
- **Slate-50** (`#f8fafc`) / **Slate-800** (`#1e293b` donker): subtiele oppervlak-laag (rij-hover, lijst-headers).
- **Slate-200** (`#e2e8f0`) / **Slate-600** (`#334155` donker): randen en dividers.
- **Slate-900** (`#0f172a`, tekst) / **Slate-100** (`#f1f5f9` donker): primaire tekstkleur.
- **Slate-500** (`#64748b`): secundaire/ondersteunende tekst, in beide modi ongewijzigd.
- **Emerald** (`#059669`): klein, spaarzaam gebruikt success-/bevestigingsaccent (bv. onderstreepte bevestigingslinks) — geen brede rol, geen eigen sectie nodig.

### Named Rules
**The One-Accent Rule.** Blauw is de enige kleur die op elk scherm interactieve betekenis draagt. Rood, oranje en emerald verschijnen alleen op hun exacte, functionele plek — nooit als algemene highlight of decoratie.

**The Never-Color-Alone Rule.** Statuskleur (status-pills, meldingsniveaus) verschijnt altijd samen met een label of icoon, nooit als enige signaaldrager — direct uit PRODUCT.md's toegankelijkheids-principe.

## 3. Typography

**Display Font (brand-oppervlakken):** Syne (met system-ui fallback)
**Body Font (brand-oppervlakken):** DM Sans (met system-ui fallback)
**Product Font (portalen/dashboards):** system-ui, -apple-system, sans-serif — geen custom webfont

**Character:** Twee stemmen naast elkaar. Het product-oppervlak spreekt native systeemtaal: neutraal, snel ladend, geen typografische persoonlijkheid die afleidt van de taak. Het merk-oppervlak (login/landing/pricing) krijgt met Syne een geometrische, iets architecturale display-stem, gebalanceerd door de zachtere, humanistische DM Sans voor lopende tekst.

### Hierarchy
- **Body** (400, 14px, 1.5 line-height): standaardtekst in tabellen, formulieren, detail-panelen door de hele product-oppervlakte.
- **Label** (600, 12px, letter-spacing 0.05em, vaak uppercase): kolomkoppen in tabellen, sectie-labels.
- **Brand Display** (700, `clamp(1.5rem, 3vw, 2.25rem)`): koppen op login/landing/pricing-pagina's, Syne.
- **Brand Body** (400, 14px): lopende tekst en formulieren op diezelfde merk-pagina's, DM Sans.

### Named Rules
**The Two-Voice Rule.** Product-schermen spreken system-ui; merk-schermen (login, registratie, landing, pricing) spreken Syne/DM Sans. Een scherm mixt nooit beide binnen dezelfde flow.

## 4. Elevation

Overwegend vlak, met schaduw uitsluitend ingezet om een laag-wissel te markeren: kaarten krijgen een zachte, ambient schaduw (Tailwind `shadow`), modals — die een echte interrupt-laag boven de rest van de UI vormen — krijgen de zwaardere `shadow-2xl`. Formuliervelden in dark mode krijgen geen schaduw naar buiten, maar een **inset**-schaduw naar binnen: het "verzonken" recept, dat een invoerveld laat aanvoelen als een uitsparing in het oppervlak in plaats van een los, zwevend blokje.

### Shadow Vocabulary
- **Card ambient** (`box-shadow: Tailwind 'shadow'` default): rustlaag onder kaarten, licht en donker (donker: geen schaduw, alleen randcontrast).
- **Modal interrupt** (`shadow-2xl` + `bg-black/50 backdrop-blur-sm` overlay): maximale prominentie voor het enige element dat de gebruiker's aandacht mag onderbreken.
- **Sunken field** (`inset 0 1px 3px 0 rgba(0,0,0,0.4)`, alleen dark mode): formuliervelden ogen verzonken i.p.v. verheven.

### Named Rules
**The Sunken Field Rule.** Formuliervelden zweven nooit boven het oppervlak — in dark mode zitten ze er zichtbaar in verzonken via een inset-schaduw, zodat een invoerbaar veld nooit verward wordt met een statische kaart.

## 5. Components

### Buttons
- **Shape:** `rounded-lg` (8px), consistent over alle varianten.
- **Primary:** achtergrond Actief Blauw (`#2563eb`) → hover Diep Blauw (`#1d4ed8`), witte tekst, `px-4 py-2` (md).
- **Secondary:** achtergrond slate-100 → hover slate-200, slate-700 tekst; dark: slate-700 → hover slate-600, slate-200 tekst.
- **Ghost:** transparant, `hover:bg-white/10`, erft tekstkleur van context.
- **Danger:** achtergrond Waarschuwend Rood (`#dc2626`) → hover rood-700, witte tekst — uitsluitend voor bevestigde destructieve acties.

### Icon-only knoppen (signature pattern)
Kleine detail-panelen (hardware, telefonie) gebruiken náást de titel uitsluitend icoon-knoppen, nooit tekst-knoppen — elke actie heeft een eigen, vaste hover-kleur zodat de betekenis van de actie al zichtbaar is vóór de klik:
- **Wijzigen** (potlood): `hover:text-blue-600 hover:bg-blue-50`
- **Verwijderen** (prullenbak): `hover:text-red-500 hover:bg-red-50`
- **Volledig openen** (maximize): `hover:text-slate-600 hover:bg-slate-100`
- **Ontkoppelen** (unlink): oranje trigger, `hover:text-orange-500`

### Cards / Containers
- **Corner Style:** `rounded-xl` (12px, standaardkaart), `rounded-2xl` (16px, modal-paneel).
- **Background:** wit / slate-800 (dark); verzonken sub-tegels binnen kaarten (bv. hardware/telefoon-kaartjes in het medewerker-detailpaneel) gebruiken `bg-slate-50` / `bg-slate-900/60` (dark) om zich te onderscheiden van de kaart eromheen.
- **Shadow Strategy:** zie Elevation — ambient `shadow`, geen schaduw in dark mode (contrast via rand i.p.v. schaduw).
- **Border:** `border-slate-200` / `border-slate-700` (dark).
- **Klikbare sub-tegels** (hardware/telefoon/software/licentie-kaartjes die naar een detailweergave springen): bij hover krijgen ze een subtiele rand- en achtergrond-tint (`hover:border-blue-200 hover:bg-blue-50/30`, dark: `hover:border-blue-800/50 hover:bg-blue-900/10`) — hetzelfde Actief Blauw als de rest van de interactieve laag, nooit een aparte "klikbaar"-kleur.

### Inputs / Fields
- **Style (licht):** witte achtergrond, `border-slate-{kleur}`, `rounded-lg`.
- **Style (donker — "verzonken" recept):** `bg-slate-900/60` + `inset 0 1px 3px rgba(0,0,0,0.4)` in plaats van een vlakke donkere achtergrond die wegvalt tegen de kaart erachter.
- **Focus:** rand naar blue-400 (dark) / accentkleur (licht), plus `focus:ring-2 focus:ring-blue-100` (licht) of `focus:ring-blue-500/25` (donker) — zichtbaar genoeg om als gloed te lezen, niet als harde outline.

### Status pill
- `rounded-full`, kleine `px-2 py-0.5` badge, kleur + label altijd samen (nooit kleur alleen).
- Native `title`-tooltip voor aanvullende datumcontext bij hover: "In dienst per {datum}" (gepland), "Gepland op: {datum}" (uit-dienst gepland), "Uit dienst getreden op: {datum}" (al uit dienst).

### Bevestigingsmodal (unlink/destructief)
- Gecentreerde tekst, gekleurde icoon-cirkel boven de boodschap (oranje voor ontkoppelen, rood voor verwijderen), twee knoppen (Annuleren / bevestigen in de actiekleur).
- Sluit **nooit** via backdrop-klik — alleen via X of Annuleren — om per ongeluk wegklikken bij een halfweg-bevestigde actie te voorkomen.

### Navigatie (sidebar)
- Item met icoon + label + optionele amber pill-badge (aantal) rechts uitgelijnd; actieve staat via achtergrond-tint in Actief Blauw.

## 6. Do's and Don'ts

### Do:
- **Do** icoon-only knoppen gebruiken in kleine detailpanelen, elk met zijn eigen vaste hover-kleur (blauw/rood/slate/oranje) zodat betekenis vóór de klik al duidelijk is.
- **Do** een bevestigingsmodal tonen vóór elke destructieve of ontkoppel-actie — nooit direct uitvoeren.
- **Do** het "verzonken" inset-schaduw-recept gebruiken voor élk formulierveld in dark mode.
- **Do** status altijd combineren met een label of icoon, nooit kleur als enige drager van betekenis.
- **Do** native `title`-tooltips gebruiken voor lichte, aanvullende context (zoals een datum) in plaats van een zware custom tooltip-component te bouwen voor zulke gevallen.

### Don't:
- **Don't** de saaie, grijze esthetiek van verouderde IT-ticketsystemen benaderen — dichte tabellen zonder ademruimte, jaren-2000 admin-paneel-look.
- **Don't** speelse of consumer-achtige styling toevoegen — RokaFlow is zakelijk, geen playful branding.
- **Don't** modals laten sluiten op backdrop-klik.
- **Don't** rood gebruiken voor "ontkoppelen" — dat is oranje's exclusieve rol; rood is gereserveerd voor echt destructieve acties.
- **Don't** `border-left`/`border-right` als gekleurde accentstrip gebruiken op kaarten of lijst-items.
- **Don't** gradient-tekst, decoratieve glassmorphism, of identieke, eindeloos herhaalde kaart-grids toepassen.
