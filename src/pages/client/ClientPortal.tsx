import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Users, LogOut, Laptop, Shield, Phone as PhoneIcon,
  ClipboardList, BarChart3, History, FileText,
  Settings, Building2, MapPin,
  ChevronDown, Moon, Sun, ArrowLeftCircle, ArrowLeft,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/axios'
import { AddUserModal } from '@/components/AddUserModal'
import { AddEmployeeModal } from '@/components/AddEmployeeModal'
import { SectionLabel, NavItem, PlaceholderView } from '@/components/portal/PortalUI'
import { OverviewView } from './views/OverviewView'
import { HistoryView } from './views/HistoryView'
import { SettingsView } from './views/SettingsView'
import { HardwareView, HardwareDetailFullView } from './views/HardwareView'
import { SoftwareView } from './views/SoftwareView'
import { TelefonieView, PhoneDetailFullView } from './views/TelefonieView'
import { DepartmentsView } from './views/DepartmentsView'
import { LocationsView } from './views/LocationsView'
import { EmployeeListView, EmployeeDetailView, DeleteEmployeeModal } from './views/EmployeesView'
import { ProcessesView } from './views/ProcessesView'
import type { ClientUserListItem, ClientUserDetailResponse } from '@/types/clientUser'
import type { LocationListItem } from '@/types/location'
import type { DepartmentListItem } from '@/types/department'

// ── Types ─────────────────────────────────────────────────────────────────────

type View =
  | 'employees' | 'employee-detail'
  | 'departments' | 'locations'
  | 'hardware' | 'hardware-detail' | 'software' | 'phones' | 'phone-detail'
  | 'processes'
  | 'overviews' | 'history' | 'contracts'
  | 'settings' | 'help'

const VIEW_TITLES: Record<View, string> = {
  employees:         'Medewerkers',
  'employee-detail': 'Medewerker details',
  departments:       'Afdelingen',
  locations:         'Locaties',
  hardware:          'Hardware',
  'hardware-detail': 'Hardware details',
  software:          'Software',
  phones:            'Telefonie',
  'phone-detail':    'Telefoon details',
  processes:         'Processen',
  overviews:         'Overzichten',
  history:           'Historie',
  contracts:         'Contracten',
  settings:          'Instellingen',
  help:              'Help',
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ClientPortal() {
  const { user, login, logout, switchBack } = useAuthStore()
  const { darkMode, toggleDarkMode }        = useThemeStore()
  const navigate = useNavigate()

  const isMspMode = user?.switchedFromOrgId !== null && user?.switchedFromOrgId !== undefined

  const handleSwitchBack = () => { switchBack(); navigate('/org') }

  const [view, setView]                     = useState<View>('employees')
  const [teammates, setTeammates]           = useState<ClientUserListItem[]>([])
  const [selectedUser, setSelectedUser]     = useState<ClientUserDetailResponse | null>(null)
  const [loadingUsers, setLoadingUsers]     = useState(true)
  const [loadingDetail, setLoadingDetail]   = useState(false)
  const [search, setSearch]                 = useState('')
  const [showAddUser, setShowAddUser]       = useState(false)
  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [deleteTarget, setDeleteTarget]     = useState<{ id: string; name: string } | null>(null)
  const [clientLogoUrl, setClientLogoUrl]   = useState<string | null>(null)
  const [departmentOptions, setDepartmentOptions] = useState<{ id: string; name: string; managerName: string; managerId: string | null }[]>([])
  const [managers, setManagers]             = useState<{ id: string; fullName: string }[]>([])
  const [locationOptions, setLocationOptions] = useState<LocationListItem[]>([])

  // ── User menu + MSP ───────────────────────────────────────────────────────
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [mspStatus, setMspStatus]       = useState<{
    hasMspAccount: boolean; orgName?: string; hasMspManager: boolean; mspManagerName?: string
    transferCode?: string; hasPendingTransfer?: boolean
  } | null>(null)
  const [mspSwitching, setMspSwitching] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const fetchMspStatus = useCallback(async () => {
    try {
      const { data } = await api.get('/portal/msp-status')
      setMspStatus(data)
    } catch { /* non-critical */ }
  }, [])

  const handleSwitchToMsp = async () => {
    setMspSwitching(true)
    setShowUserMenu(false)
    try {
      const { data } = await api.post<import('@/types/auth').LoginResponse>('/portal/msp-token')
      login(data.accessToken, data.refreshToken, data.user)
      navigate('/org')
    } catch { /* ignore */ } finally { setMspSwitching(false) }
  }

  useEffect(() => {
    if (!isMspMode) fetchMspStatus()
  }, [fetchMspStatus, isMspMode])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Data loaders ──────────────────────────────────────────────────────────

  const fetchDepartmentOptions = useCallback(async () => {
    try {
      const { data } = await api.get<DepartmentListItem[]>('/portal/departments')
      setDepartmentOptions(data.map(d => ({ id: d.id, name: d.name, managerName: d.managerName, managerId: d.managerUserId })))
    } catch { /* non-critical */ }
  }, [])

  const fetchManagers = useCallback(async () => {
    try {
      const { data } = await api.get<{ id: string; fullName: string }[]>('/portal/managers')
      setManagers(data)
    } catch { /* non-critical */ }
  }, [])

  const fetchLocationOptions = useCallback(async () => {
    try {
      const { data } = await api.get<LocationListItem[]>('/portal/locations')
      setLocationOptions(data)
    } catch { /* non-critical */ }
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await api.get<ClientUserListItem[]>('/portal/users')
      setTeammates(data)
    } finally { setLoadingUsers(false) }
  }, [])

  const fetchUserDetail = useCallback(async (userId: string) => {
    setLoadingDetail(true)
    setSelectedUser(null)
    try {
      const { data } = await api.get<ClientUserDetailResponse>(`/portal/users/${userId}`)
      setSelectedUser(data)
    } finally { setLoadingDetail(false) }
  }, [])

  useEffect(() => { fetchUsers() },             [fetchUsers])
  useEffect(() => { fetchDepartmentOptions() }, [fetchDepartmentOptions])
  useEffect(() => { fetchManagers() },          [fetchManagers])
  useEffect(() => { fetchLocationOptions() },   [fetchLocationOptions])
  useEffect(() => {
    api.get<{ logoDataUrl: string | null }>('/portal/logo')
      .then(r => setClientLogoUrl(r.data.logoDataUrl))
      .catch(() => {})
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSelectEmployee   = (id: string) => { fetchUserDetail(id); setView('employee-detail') }
  const handleBackToList       = () => { setView('employees'); setSelectedUser(null) }
  const handleOpenDelete       = (id: string, name: string) => setDeleteTarget({ id, name })

  const [selectedHardwareAsset, setSelectedHardwareAsset] = useState<import('@/types/hardware').HardwareAssetListItem | null>(null)
  const [navHistory, setNavHistory] = useState<Array<{ view: View; backLabel: string }>>([])

  const pushAndNavigate = (target: View, backLabel: string) => {
    setNavHistory(h => [...h, { view, backLabel }])
    setView(target)
  }
  const goBack = () => {
    const entry = navHistory[navHistory.length - 1]
    if (!entry) return
    setNavHistory(h => h.slice(0, -1))
    setView(entry.view)
    setSelectedHardwareAsset(null)
  }

  const handleExpandHardware   = (asset: import('@/types/hardware').HardwareAssetListItem) => { setSelectedHardwareAsset(asset); pushAndNavigate('hardware-detail', 'Terug naar hardware') }
  const handleBackToHardware   = () => { setView('hardware'); setSelectedHardwareAsset(null); setNavHistory([]) }
  const handleHardwareDeleted  = () => { setView('hardware'); setSelectedHardwareAsset(null); setNavHistory([]) }
  const handleHardwareFromEmployee = (asset: import('@/types/hardware').HardwareAssetListItem) => { setSelectedHardwareAsset(asset); pushAndNavigate('hardware-detail', 'Terug naar medewerker') }

  const [selectedPhone, setSelectedPhone] = useState<import('@/types/phone').PhoneListItem | null>(null)
  const handleExpandPhone      = (phone: import('@/types/phone').PhoneListItem) => { setSelectedPhone(phone); pushAndNavigate('phone-detail', 'Terug naar telefonie') }
  const handleBackToPhones     = () => { setView('phones'); setSelectedPhone(null); setNavHistory([]) }
  const handlePhoneDeleted     = () => { setView('phones'); setSelectedPhone(null); setNavHistory([]) }
  const handlePhoneFromEmployee = (phone: import('@/types/phone').PhoneListItem) => { setSelectedPhone(phone); pushAndNavigate('phone-detail', 'Terug naar medewerker') }

  const handleEmployeeDeleted = () => {
    setDeleteTarget(null)
    setView('employees')
    setSelectedUser(null)
    fetchUsers()
  }

  const handleNavClick = (v: View) => {
    setView(v)
    if (v !== 'employee-detail') setSelectedUser(null)
    if (v !== 'hardware-detail') setSelectedHardwareAsset(null)
    if (v !== 'phone-detail') setSelectedPhone(null)
    fetchUsers()
    fetchDepartmentOptions()
    fetchManagers()
  }

  const handleLogout = () => { logout(); navigate('/login') }
  const tenantName   = user?.tenantName ?? 'Portal'
  const employeesActive = view === 'employees' || view === 'employee-detail'
  const hardwareActive  = view === 'hardware'  || view === 'hardware-detail'

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-100 dark:bg-slate-950">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-shrink-0 h-16">
        <div className="w-56 bg-slate-900 dark:bg-slate-950 px-4 flex flex-col justify-center flex-shrink-0 border-b border-slate-800">
          <span className="font-bold text-white text-sm truncate">{tenantName}</span>
          <p className="text-xs text-slate-500 mt-0.5">Portaal</p>
        </div>
        <div className="flex-1 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between">
          <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{VIEW_TITLES[view]}</h1>

          {/* Account dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(v => !v)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 group-hover:bg-blue-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 transition-colors select-none">
                {(user?.email?.[0] ?? '?').toUpperCase()}
              </div>
              <ChevronDown size={13} className={`text-slate-400 dark:text-slate-500 transition-transform duration-150 ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-12 z-50 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-4 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white text-base font-bold flex items-center justify-center flex-shrink-0 select-none">
                      {(user?.email?.[0] ?? '?').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{tenantName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="py-1">
                  {mspStatus?.hasMspAccount && (
                    <button
                      onClick={handleSwitchToMsp}
                      disabled={mspSwitching}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
                    >
                      <ArrowLeftCircle size={15} className="flex-shrink-0 rotate-180" />
                      <span className="flex-1 text-left">{mspSwitching ? 'Even wachten…' : `MSP Portaal — ${mspStatus.orgName}`}</span>
                    </button>
                  )}
                  <button
                    onClick={() => { setShowUserMenu(false); handleNavClick('settings') }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <Settings size={15} className="text-slate-400 flex-shrink-0" />
                    Instellingen
                  </button>
                  <button
                    onClick={toggleDarkMode}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    {darkMode
                      ? <Sun size={15} className="text-slate-400 flex-shrink-0" />
                      : <Moon size={15} className="text-slate-400 flex-shrink-0" />
                    }
                    <span className="flex-1 text-left">{darkMode ? 'Lichte modus' : 'Donkere modus'}</span>
                    <span className={`w-9 h-5 rounded-full flex items-center px-0.5 flex-shrink-0 transition-colors ${darkMode ? 'bg-blue-600' : 'bg-slate-300'}`}>
                      <span className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${darkMode ? 'translate-x-4' : 'translate-x-0'}`} />
                    </span>
                  </button>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-700 py-1">
                  <button
                    onClick={() => { setShowUserMenu(false); handleLogout() }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut size={15} className="flex-shrink-0" />
                    Uitloggen
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <aside className="w-56 bg-slate-900 dark:bg-slate-950 flex flex-col flex-shrink-0">
          <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-1">
            <SectionLabel label="Medewerkers" />
            <NavItem icon={<Users size={14} />}     label="Medewerkers" active={employeesActive}          onClick={() => handleNavClick('employees')} />
            <NavItem icon={<Building2 size={14} />} label="Afdelingen"  active={view === 'departments'}   onClick={() => handleNavClick('departments')} />
            <NavItem icon={<MapPin size={14} />}    label="Locaties"    active={view === 'locations'}     onClick={() => handleNavClick('locations')} />

            <SectionLabel label="Assets" />
            <NavItem icon={<Laptop size={14} />}   label="Hardware"   active={hardwareActive}     onClick={() => handleNavClick('hardware')} />
            <NavItem icon={<Shield size={14} />}   label="Software"   active={view === 'software'} onClick={() => handleNavClick('software')} />
            <NavItem icon={<PhoneIcon size={14} />} label="Telefonie" active={view === 'phones'}   onClick={() => handleNavClick('phones')} />

            <SectionLabel label="Processen" />
            <NavItem icon={<ClipboardList size={14} />} label="Checklist Templates" active={view === 'processes'} onClick={() => handleNavClick('processes')} />

            <SectionLabel label="Rapportages" />
            <NavItem icon={<BarChart3 size={14} />} label="Overzichten" active={view === 'overviews'} onClick={() => handleNavClick('overviews')} />
            <NavItem icon={<History size={14} />}   label="Historie"    active={view === 'history'}   onClick={() => handleNavClick('history')} />
            <NavItem icon={<FileText size={14} />}  label="Contracten"  active={view === 'contracts'} onClick={() => handleNavClick('contracts')} />
          </nav>

          <div className="px-2 pb-3 flex-shrink-0 border-t border-slate-800 pt-2 space-y-1">
            {clientLogoUrl && (
              <div className="px-3 py-2">
                <img src={clientLogoUrl} alt="Logo" className="h-8 max-w-full object-contain opacity-90" />
              </div>
            )}
            <NavItem icon={<Settings size={14} />} label="Instellingen" active={view === 'settings'} onClick={() => handleNavClick('settings')} />
            <NavItem icon={<LogOut size={14} />}   label="Uitloggen"    active={false}               onClick={handleLogout} />
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* MSP banner */}
          {isMspMode && (
            <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700 px-6 py-2 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <ArrowLeftCircle size={15} />
                <span className="text-xs font-medium">
                  MSP beheer modus — je beheert <strong>{user?.tenantName}</strong> namens{' '}
                  <strong>{user?.switchedFromOrgName}</strong>
                </span>
              </div>
              <button
                onClick={handleSwitchBack}
                className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
              >
                <ArrowLeft size={13} />
                Terug naar {user?.switchedFromOrgName}
              </button>
            </div>
          )}

          <div className="flex-1 overflow-hidden p-6 bg-slate-200 dark:bg-slate-900">

            {view === 'employees' && (
              <EmployeeListView
                teammates={teammates}
                loading={loadingUsers}
                search={search}
                currentUserId={user?.id}
                onSearch={setSearch}
                onSelect={handleSelectEmployee}
                onAddEmployee={() => { fetchDepartmentOptions(); setShowAddEmployee(true) }}
                onDelete={handleOpenDelete}
              />
            )}

            {view === 'employee-detail' && (
              <EmployeeDetailView
                user={selectedUser}
                loading={loadingDetail}
                onBack={handleBackToList}
                onUserUpdated={() => { if (selectedUser) { fetchUserDetail(selectedUser.id); fetchUsers() } }}
                onDelete={handleOpenDelete}
                departments={departmentOptions}
                managers={managers}
                locations={locationOptions}
                teammates={teammates}
                onHardwareClick={handleHardwareFromEmployee}
                onPhoneClick={handlePhoneFromEmployee}
              />
            )}

            {view === 'settings' && (
              <SettingsView
                teammates={teammates}
                tenantName={tenantName}
                onAddUser={() => setShowAddUser(true)}
                mspStatus={mspStatus}
                onMspStatusRefresh={fetchMspStatus}
                onSwitchToMsp={handleSwitchToMsp}
                mspSwitching={mspSwitching}
              />
            )}

            {view === 'hardware'        && <HardwareView teammates={teammates} onExpand={handleExpandHardware} />}
            {view === 'hardware-detail' && selectedHardwareAsset && (
              <HardwareDetailFullView
                initialAsset={selectedHardwareAsset}
                teammates={teammates}
                onBack={navHistory.length > 0 ? goBack : handleBackToHardware}
                onDeleted={handleHardwareDeleted}
                backLabel={navHistory[navHistory.length - 1]?.backLabel ?? 'Terug naar hardware'}
              />
            )}
            {view === 'software'     && <SoftwareView teammates={teammates} />}
            {view === 'phones'       && <TelefonieView teammates={teammates} onExpand={handleExpandPhone} />}
            {view === 'phone-detail' && selectedPhone && (
              <PhoneDetailFullView
                initialPhone={selectedPhone}
                teammates={teammates}
                onBack={navHistory.length > 0 ? goBack : handleBackToPhones}
                onDeleted={handlePhoneDeleted}
                backLabel={navHistory[navHistory.length - 1]?.backLabel ?? 'Terug naar telefonie'}
              />
            )}
            {view === 'departments'  && <DepartmentsView />}
            {view === 'locations'    && <LocationsView />}
            {view === 'overviews'    && <OverviewView />}
            {view === 'history'      && <HistoryView />}
            {view === 'processes'    && <ProcessesView />}

            {(view === 'contracts' || view === 'help') && (
              <PlaceholderView title={VIEW_TITLES[view]} />
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <AddUserModal
        open={showAddUser}
        onClose={() => setShowAddUser(false)}
        onSuccess={() => { fetchUsers(); setShowAddUser(false) }}
        clientName={tenantName}
        apiEndpoint="/portal/users"
        departments={departmentOptions}
      />

      <AddEmployeeModal
        open={showAddEmployee}
        onClose={() => setShowAddEmployee(false)}
        onSuccess={() => { fetchUsers(); setShowAddEmployee(false) }}
        departments={departmentOptions}
        managers={managers}
        locations={locationOptions}
      />

      {deleteTarget && (
        <DeleteEmployeeModal
          userId={deleteTarget.id}
          userName={deleteTarget.name}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleEmployeeDeleted}
        />
      )}
    </div>
  )
}
