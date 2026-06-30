# Notificatiesysteem — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bouw de frontend voor het interne notificatiesysteem: een belletje met badge in zowel `ClientPortal.tsx` (portal-admins) als `OrgDashboard.tsx` (MSP), een dropdown met klik-door-navigatie in de portal, een cross-tenant berichtencentrum in het MSP-dashboard, en een superuser-tabblad om notificatietypen aan/uit te zetten en prioriteit te overschrijven.

**Architecture:** Een herbruikbare `NotificationBell`-component (badge + 60s-polling) wordt in beide topbars geplaatst. De portal krijgt een dropdown (`NotificationDropdown`) met klik-door naar de specifieke entiteit via het bestaande `navHistory`-mechanisme. Het MSP-dashboard krijgt een volledige sectie (`NotificationCenterView`, naar het patroon van `TransfersView`) waar een klik eerst automatisch naar de juiste client-tenant context-switcht (hergebruik van het bestaande `switchToClient`-mechanisme) en daarna via een URL-query-param (`?openEntity=...`) de specifieke entiteit opent zodra `ClientPortal.tsx` opnieuw mount.

**Tech Stack:** React 19, TypeScript, TailwindCSS 4, react-router-dom v7, axios, Zustand, lucide-react.

**Backend-afhankelijkheid:** dit plan veronderstelt dat het backend-plan (`docs/superpowers/plans/2026-06-30-notifications-backend.md` in de `RokaFlow`-repo) al is uitgevoerd en lokaal draait op `http://localhost:5000`, met endpoints `/portal/notifications*`, `/msp/notifications*` en `/platform/notification-types*` beschikbaar.

**Bekende pre-existing gap:** de `'contracts'`-view in `ClientPortal.tsx` (Licenties) is op dit moment een `PlaceholderView` — er bestaat nog geen echte licentie-detailweergave. Klikken op een licentie-notificatie navigeert wel naar die view, maar landt op de placeholder totdat Licenties een eigen view krijgt (buiten scope van dit plan).

**Niet in scope:** real-time updates (SignalR), paginering in de dropdown/berichtencentrum, deep-select binnen de Telefonie-tabs (Subscription-notificaties landen op de Telefonie-view in het algemeen, niet specifiek op de Abonnementen-subtab).

---

### Task 1: Types

**Files:**
- Create: `src/types/notification.ts`

- [ ] **Step 1: Create the notification types**

```tsx
export type NotificationPriority = 'Low' | 'Medium' | 'High'

export interface NotificationDto {
  id: string
  tenantId: string
  tenantName: string | null
  type: string
  priority: NotificationPriority
  entityType: 'License' | 'Subscription' | 'HardwareAsset' | 'Phone' | 'User'
  entityId: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export interface UnreadCountDto {
  unread: number
}

export interface NotificationTypeDto {
  type: string
  displayName: string
  description: string
  entityType: string
  isEnabled: boolean
  priority: NotificationPriority
}

export interface NotificationRunLogDto {
  runAt: string
  tenantsProcessed: number
  notificationsCreated: number
  durationMs: number
}
```

- [ ] **Step 2: Build to verify**

Run: `npm run build`
Expected: build succeeds (TypeScript compiles, no unused-file errors since nothing imports it yet).

- [ ] **Step 3: Commit**

```bash
git add src/types/notification.ts
git commit -m "feat: notification DTO types"
```

---

### Task 2: NotificationBell component (herbruikbaar)

**Files:**
- Create: `src/components/NotificationBell.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import api from '@/lib/axios'
import type { UnreadCountDto } from '@/types/notification'

interface NotificationBellProps {
  countEndpoint: string
  onClick: () => void
}

export function NotificationBell({ countEndpoint, onClick }: NotificationBellProps) {
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let cancelled = false
    const fetchCount = async () => {
      try {
        const { data } = await api.get<UnreadCountDto>(countEndpoint)
        if (!cancelled) setUnread(data.unread)
      } catch {
        // stil falen, volgende poll probeert opnieuw
      }
    }
    fetchCount()
    const timer = setInterval(fetchCount, 60000)
    return () => { cancelled = true; clearInterval(timer) }
  }, [countEndpoint])

  return (
    <button
      onClick={onClick}
      title="Notificaties"
      className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
    >
      <Bell size={16} className="text-slate-500 dark:text-slate-400" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </button>
  )
}
```

- [ ] **Step 2: Build to verify**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/NotificationBell.tsx
git commit -m "feat: reusable NotificationBell component"
```

---

### Task 3: NotificationDropdown component (portal)

**Files:**
- Create: `src/components/NotificationDropdown.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useEffect, useState } from 'react'
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'
import api from '@/lib/axios'
import type { NotificationDto, NotificationPriority } from '@/types/notification'

const PRIORITY_ICON: Record<NotificationPriority, React.ReactNode> = {
  High:   <AlertCircle size={14} className="text-red-500 flex-shrink-0" />,
  Medium: <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />,
  Low:    <Info size={14} className="text-slate-400 flex-shrink-0" />,
}

interface NotificationDropdownProps {
  listEndpoint: string
  readAllEndpoint: string
  onItemClick: (notification: NotificationDto) => void
}

export function NotificationDropdown({ listEndpoint, readAllEndpoint, onItemClick }: NotificationDropdownProps) {
  const [items, setItems] = useState<NotificationDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api.get<NotificationDto[]>(listEndpoint)
      .then(({ data }) => { if (!cancelled) setItems(data) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [listEndpoint])

  const handleMarkAllRead = async () => {
    await api.put(readAllEndpoint)
    setItems(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-96 max-h-[28rem] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Notificaties</span>
        <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:underline">Alles gelezen</button>
      </div>
      {loading && <p className="px-4 py-6 text-sm text-slate-400 text-center">Laden…</p>}
      {!loading && items.length === 0 && <p className="px-4 py-6 text-sm text-slate-400 text-center">Geen meldingen.</p>}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {items.map(n => (
          <button
            key={n.id}
            onClick={() => onItemClick(n)}
            className={`w-full text-left px-4 py-3 flex items-start gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${!n.isRead ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}
          >
            <span className="mt-0.5">{PRIORITY_ICON[n.priority]}</span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{n.title}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{n.message}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build to verify**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/NotificationDropdown.tsx
git commit -m "feat: NotificationDropdown component"
```

---

### Task 4: Wire bell + dropdown + klik-door into ClientPortal.tsx

**Files:**
- Modify: `src/pages/client/ClientPortal.tsx`

- [ ] **Step 1: Add imports**

Near the top of `src/pages/client/ClientPortal.tsx`, alongside the other component imports (after the `EmployeesView` import line), add:

```tsx
import { NotificationBell } from '@/components/NotificationBell'
import { NotificationDropdown } from '@/components/NotificationDropdown'
import type { NotificationDto } from '@/types/notification'
```

Also add `useSearchParams` to the existing `react-router-dom` import (or add a new import line if routing isn't already imported in this file):

```tsx
import { useSearchParams } from 'react-router-dom'
```

- [ ] **Step 2: Add state and outside-click handling**

Near the existing `userMenuRef` declaration (line 93), add:

```tsx
  const notificationMenuRef = useRef<HTMLDivElement>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
```

Extend the existing outside-click `useEffect` (lines 117–124) to also close the notification dropdown:

```tsx
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setShowUserMenu(false)
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(e.target as Node))
        setShowNotifications(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
```

- [ ] **Step 3: Add the click-through handler**

Near the existing `handleExpandPhone`/`handlePhoneFromEmployee` handlers (after line 204), add:

```tsx
  const openNotificationTarget = async (entityType: string, entityId: string) => {
    switch (entityType) {
      case 'User':
        handleSelectEmployee(entityId)
        break
      case 'HardwareAsset': {
        const { data } = await api.get<import('@/types/hardware').HardwareAssetListItem[]>('/portal/hardware')
        const asset = data.find(a => a.id === entityId)
        if (asset) handleExpandHardware(asset)
        break
      }
      case 'Phone': {
        const { data } = await api.get<import('@/types/phone').PhoneListItem[]>('/portal/phones')
        const phone = data.find(p => p.id === entityId)
        if (phone) handleExpandPhone(phone)
        break
      }
      case 'License':
        handleNavClick('contracts')
        break
      case 'Subscription':
        handleNavClick('phones')
        break
    }
  }

  const handleNotificationClick = async (n: NotificationDto) => {
    setShowNotifications(false)
    try {
      await api.put(`/portal/notifications/${n.id}/read`)
    } catch {
      // niet blokkerend — navigatie gaat sowieso door
    }
    await openNotificationTarget(n.entityType, n.entityId)
  }
```

- [ ] **Step 4: Handle the `openEntity` query param on mount**

Note this relies on `openNotificationTarget` from Step 3, so place this `useEffect` after that function is defined. Add it near the other top-level `useEffect`s (e.g. right after the outside-click effect from Step 2):

```tsx
  useEffect(() => {
    const target = searchParams.get('openEntity')
    if (!target) return
    const [entityType, entityId] = target.split(':')
    if (entityType && entityId) openNotificationTarget(entityType, entityId)
    setSearchParams({}, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
```

Dit vangt de redirect op die het MSP-berichtencentrum stuurt na een automatische context-switch (`/client?openEntity=HardwareAsset:<id>`).

- [ ] **Step 5: Place the bell + dropdown in the topbar**

In the topbar JSX, right before the "Account dropdown" `<div className="relative" ref={userMenuRef}>` (line 244), add:

```tsx
          <div className="relative" ref={notificationMenuRef}>
            <NotificationBell
              countEndpoint="/portal/notifications/count"
              onClick={() => setShowNotifications(v => !v)}
            />
            {showNotifications && (
              <NotificationDropdown
                listEndpoint="/portal/notifications"
                readAllEndpoint="/portal/notifications/read-all"
                onItemClick={handleNotificationClick}
              />
            )}
          </div>
```

- [ ] **Step 6: Build to verify**

Run: `npm run build`
Expected: build succeeds, no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add src/pages/client/ClientPortal.tsx
git commit -m "feat: wire notification bell and click-through into ClientPortal"
```

---

### Task 5: Wire bell + sectie into OrgDashboard.tsx

**Files:**
- Modify: `src/pages/org/OrgDashboard.tsx`
- Create: `src/pages/org/views/NotificationCenterView.tsx` (created in Task 6, referenced here)

- [ ] **Step 1: Add the import**

Near the top of `src/pages/org/OrgDashboard.tsx`, add:

```tsx
import { NotificationBell } from '@/components/NotificationBell'
import { NotificationCenterView } from './views/NotificationCenterView'
import { Bell } from 'lucide-react'
```

- [ ] **Step 2: Extend the `Section` type**

Change line 73 from:

```tsx
type Section = 'clients' | 'transfers'
```

to:

```tsx
type Section = 'clients' | 'transfers' | 'notifications'
```

- [ ] **Step 3: Add the sidebar NavItem**

After the existing `Overdrachten` `NavItem` (around line 246–248), add:

```tsx
            <NavItem icon={<Bell size={14} />} label="Berichtencentrum" active={activeSection === 'notifications'} onClick={() => setActiveSection('notifications')} />
```

- [ ] **Step 4: Add the bell to the topbar**

In the topbar JSX, right before the "User avatar + dropdown" `<div className="relative" ref={userMenuRef}>` (around line 274), add:

```tsx
          <NotificationBell
            countEndpoint="/msp/notifications/count"
            onClick={() => setActiveSection('notifications')}
          />
```

- [ ] **Step 5: Update the topbar title and section rendering**

Change the title logic (around line 260):

```tsx
  <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
    {activeSection === 'clients' ? 'Clients' : activeSection === 'transfers' ? 'Overdrachten' : 'Berichtencentrum'}
  </h1>
```

Add the section render condition near where `TransfersView` is rendered:

```tsx
{activeSection === 'notifications' && <NotificationCenterView />}
```

- [ ] **Step 6: Build to verify**

Run: `npm run build`
Expected: this will fail until Task 6 creates `NotificationCenterView.tsx` — that's expected; complete Task 6 before running this verification.

- [ ] **Step 7: Commit (after Task 6 is also done)**

```bash
git add src/pages/org/OrgDashboard.tsx
git commit -m "feat: wire notification bell and message center section into OrgDashboard"
```

---

### Task 6: NotificationCenterView (MSP berichtencentrum)

**Files:**
- Create: `src/pages/org/views/NotificationCenterView.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'
import api from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'
import { Card } from '@/components/ui/Card'
import type { NotificationDto, NotificationPriority } from '@/types/notification'

const PRIORITY_FILTERS: { value: NotificationPriority | 'all'; label: string }[] = [
  { value: 'all',    label: 'Alles' },
  { value: 'High',   label: 'Hoog' },
  { value: 'Medium', label: 'Middel' },
  { value: 'Low',    label: 'Laag' },
]

const PRIORITY_ICON: Record<NotificationPriority, React.ReactNode> = {
  High:   <AlertCircle size={14} className="text-red-500" />,
  Medium: <AlertTriangle size={14} className="text-amber-500" />,
  Low:    <Info size={14} className="text-slate-400" />,
}

interface SwitchToClientResponse {
  switchToken: string
}

export function NotificationCenterView() {
  const [notifications, setNotifications] = useState<NotificationDto[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<NotificationPriority | 'all'>('all')
  const [openingId, setOpeningId] = useState<string | null>(null)
  const navigate = useNavigate()
  const { switchToClient } = useAuthStore()

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const { data } = await api.get<NotificationDto[]>('/msp/notifications')
      setNotifications(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNotifications() }, [])

  const counts: Record<NotificationPriority | 'all', number> = {
    all:    notifications.length,
    High:   notifications.filter(n => n.priority === 'High').length,
    Medium: notifications.filter(n => n.priority === 'Medium').length,
    Low:    notifications.filter(n => n.priority === 'Low').length,
  }

  const visible = activeFilter === 'all' ? notifications : notifications.filter(n => n.priority === activeFilter)

  const handleOpen = async (n: NotificationDto) => {
    setOpeningId(n.id)
    try {
      await api.put(`/msp/notifications/${n.id}/read`)
      const { data } = await api.post<SwitchToClientResponse>(`/clients/${n.tenantId}/switch`)
      switchToClient(data.switchToken)
      navigate(`/client?openEntity=${n.entityType}:${n.entityId}`)
    } catch {
      // afgehandeld door globale interceptor
    } finally {
      setOpeningId(null)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <div className="flex items-center gap-1.5 flex-wrap">
        {PRIORITY_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeFilter === f.value
                ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            {f.label}
            {counts[f.value] > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeFilter === f.value
                  ? 'bg-white/20 text-white dark:bg-black/20 dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              }`}>
                {counts[f.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-slate-400 text-center py-10">Laden…</p>}
      {!loading && visible.length === 0 && <p className="text-sm text-slate-400 text-center py-10">Geen meldingen.</p>}

      {!loading && visible.length > 0 && (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-[24px_1fr_1fr_100px] gap-3 px-4 py-2.5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            {['', 'Melding', 'Klant', 'Datum'].map(h => (
              <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{h}</span>
            ))}
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {visible.map(n => (
              <button
                key={n.id}
                onClick={() => handleOpen(n)}
                disabled={openingId === n.id}
                className={`w-full grid grid-cols-[24px_1fr_1fr_100px] gap-3 px-4 py-3 items-center text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 disabled:opacity-50 ${
                  !n.isRead ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
                }`}
              >
                <span>{PRIORITY_ICON[n.priority]}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{n.title}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">{n.message}</span>
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-300 truncate">{n.tenantName}</span>
                <span className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleDateString('nl-NL')}</span>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Build to verify (this also completes Task 5's verification)**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/pages/org/views/NotificationCenterView.tsx src/pages/org/OrgDashboard.tsx
git commit -m "feat: MSP notification center view"
```

---

### Task 7: Superuser-beheer (aan/uit, prioriteit, laatste run)

**Files:**
- Create: `src/pages/superuser/views/NotificationsView.tsx`
- Modify: `src/pages/superuser/SuperUserDashboard.tsx`

- [ ] **Step 1: Create `NotificationsView.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { Check, X, Edit2 } from 'lucide-react'
import api from '@/lib/axios'
import type { NotificationTypeDto, NotificationRunLogDto, NotificationPriority } from '@/types/notification'

const PRIORITY_OPTIONS: NotificationPriority[] = ['Low', 'Medium', 'High']

// Dit project gebruikt geen JsonStringEnumConverter — PUT/POST-bodies verwachten enums als
// integers (zie feedback-backend-patterns), ook al geven GET-responses ze als string terug.
const PRIORITY_TO_INT: Record<NotificationPriority, number> = { Low: 0, Medium: 1, High: 2 }

function TypeRow({ item, onSaved }: { item: NotificationTypeDto; onSaved: (t: NotificationTypeDto) => void }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ isEnabled: item.isEnabled, priority: item.priority })

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/platform/notification-types/${item.type}`, {
        isEnabled: form.isEnabled,
        priority: PRIORITY_TO_INT[form.priority],
      })
      onSaved({ ...item, isEnabled: form.isEnabled, priority: form.priority })
      setEditing(false)
    } catch {
      // afgehandeld door globale interceptor
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{item.displayName}</td>
        <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{item.description}</td>
        <td className="px-4 py-3 text-sm text-center text-slate-600 dark:text-slate-400">{item.priority}</td>
        <td className="px-4 py-3 text-center">
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${item.isEnabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
            {item.isEnabled ? 'Actief' : 'Uit'}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
            <Edit2 size={13} />
          </button>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b border-slate-100 dark:border-slate-800 bg-blue-50/40 dark:bg-blue-900/10">
      <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{item.displayName}</td>
      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{item.description}</td>
      <td className="px-4 py-2 text-center">
        <select
          value={form.priority}
          onChange={e => setForm(p => ({ ...p, priority: e.target.value as NotificationPriority }))}
          className="text-sm px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </td>
      <td className="px-4 py-2 text-center">
        <button onClick={() => setForm(p => ({ ...p, isEnabled: !p.isEnabled }))}
          className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${form.isEnabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
          {form.isEnabled ? 'Actief' : 'Uit'}
        </button>
      </td>
      <td className="px-4 py-2 text-right">
        <div className="flex items-center justify-end gap-1">
          <button onClick={handleSave} disabled={saving} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50">
            <Check size={13} />
          </button>
          <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={13} />
          </button>
        </div>
      </td>
    </tr>
  )
}

export function NotificationsView() {
  const [types, setTypes] = useState<NotificationTypeDto[]>([])
  const [lastRun, setLastRun] = useState<NotificationRunLogDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [typesRes, lastRunRes] = await Promise.all([
        api.get<NotificationTypeDto[]>('/platform/notification-types'),
        api.get<NotificationRunLogDto | null>('/platform/notification-types/last-run'),
      ])
      setTypes(typesRes.data)
      setLastRun(lastRunRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const handleRunNow = async () => {
    setRunning(true)
    try {
      await api.post('/platform/notification-types/run-check')
      await fetchAll()
    } finally {
      setRunning(false)
    }
  }

  if (loading) return <p className="p-6 text-sm text-slate-400">Laden…</p>

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {lastRun
            ? `Laatste run: ${new Date(lastRun.runAt).toLocaleString('nl-NL')} — ${lastRun.tenantsProcessed} tenants, ${lastRun.notificationsCreated} nieuwe meldingen (${lastRun.durationMs}ms)`
            : 'Nog geen run uitgevoerd.'}
        </div>
        <button
          onClick={handleRunNow}
          disabled={running}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50"
        >
          {running ? 'Bezig…' : 'Nu uitvoeren'}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Type</th>
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Omschrijving</th>
              <th className="px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">Prioriteit</th>
              <th className="px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {types.map(t => (
              <TypeRow key={t.type} item={t} onSaved={updated => setTypes(prev => prev.map(x => x.type === updated.type ? updated : x))} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire the tab into `SuperUserDashboard.tsx`**

Add the import:

```tsx
import { NotificationsView } from './views/NotificationsView'
import { Bell } from 'lucide-react'
```

Change the `activeSection` state type (line 168) from:

```tsx
const [activeSection, setActiveSection] = useState<'organisations' | 'subscriptions'>('organisations')
```

to:

```tsx
const [activeSection, setActiveSection] = useState<'organisations' | 'subscriptions' | 'notifications'>('organisations')
```

Add a tab entry to the nav array (around line 277–280):

```tsx
    ['organisations', Building2, 'Organisaties'],
    ['subscriptions', CreditCard, 'Abonnementen'],
    ['notifications', Bell, 'Notificaties'],
```

Add the render condition near `{activeSection === 'subscriptions' && <SubscriptionsView />}` (around line 323):

```tsx
{activeSection === 'notifications' && <NotificationsView />}
```

- [ ] **Step 3: Build to verify**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/pages/superuser/views/NotificationsView.tsx src/pages/superuser/SuperUserDashboard.tsx
git commit -m "feat: superuser notification-type management tab"
```

---

### Task 8: Lokale eindverificatie

Geen geautomatiseerde tests in deze codebase — dit is de handmatige doorloop. Vereist dat het backend-plan al lokaal draait (`http://localhost:5000`) met testdata zoals beschreven in Task 13 van het backend-plan.

- [ ] **Step 1: Start de frontend lokaal**

Run: `npm run dev`
Expected: Vite dev server start op `http://localhost:5173`.

- [ ] **Step 2: Portal — belletje en dropdown**

Log in als portal-admin van een tenant met testdata (verlopende licentie / verouderde hardware). Bevestig: belletje toont een rood badge-getal binnen 60s (of ververs handmatig), klik opent dropdown met de juiste items, prioriteit-iconen kloppen (rood/amber/grijs).

- [ ] **Step 3: Portal — klik-door navigatie**

Klik op een hardware-notificatie → bevestig dat je op `HardwareDetailFullView` van het juiste asset landt. Klik op een medewerker-notificatie (bv. "vertrekt binnenkort met bedrijfseigendommen") → bevestig dat je op `EmployeeDetailView` van de juiste medewerker landt.

- [ ] **Step 4: Portal — alles gelezen**

Klik "Alles gelezen" in de dropdown, sluit en heropen — bevestig dat het badge-getal naar 0 is gegaan (kan tot 60s duren voor de bell zelf herpolled, of ververs de pagina).

- [ ] **Step 5: MSP — belletje en berichtencentrum**

Log in als MSP-admin met minstens één client die testdata heeft. Bevestig: belletje in `OrgDashboard`-topbar toont het geaggregeerde aantal, klik navigeert naar "Berichtencentrum", filter-pills (Hoog/Middel/Laag) werken en tonen correcte counts.

- [ ] **Step 6: MSP — klik-door met context-switch**

Klik op een notificatie in het berichtencentrum die bij een andere client hoort dan waar je nu "in" zit. Bevestig: je wordt naar `/client` geredirect, de juiste client-tenant is actief (topbar toont de juiste tenant-naam), en de specifieke entiteit (hardware/medewerker) opent automatisch.

- [ ] **Step 7: Superuser — type-beheer**

Log in als superuser, open het "Notificaties"-tabblad. Bevestig: alle 11 typen worden getoond. Zet één type uit, sla op, klik "Nu uitvoeren" — bevestig (via de backend-logs of door de database te controleren) dat dat type wordt overgeslagen bij de volgende evaluatie. Zet het weer aan.

- [ ] **Step 8: Superuser — prioriteit-override**

Wijzig de prioriteit van een type (bv. zet "Hardware is verouderd" van Laag naar Hoog), sla op. Verwijder de bestaande notificatie van dat type uit de database (om de dedupe-check te omzeilen) en klik "Nu uitvoeren" opnieuw — bevestig in de portal-dropdown dat de nieuwe notificatie nu met het overschreven prioriteitsniveau verschijnt.
