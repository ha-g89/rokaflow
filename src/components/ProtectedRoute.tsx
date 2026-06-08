import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/auth'

interface Props {
  children: React.ReactNode
  roles: UserRole[]
}

const ROLE_HOME: Record<UserRole, string> = {
  superuser:   '/superuser',
  org_admin:   '/org',
  org_member:  '/org',
  client_user: '/client',
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { _hasHydrated, accessToken, user } = useAuthStore()
  const location = useLocation()

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!accessToken || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // MSP context-switch: an org_admin operating inside a client portal
  // is allowed to access /client/* even though their role is not client_user.
  // Use !! to treat both null and undefined as falsy (backend sends null explicitly,
  // but old persisted state might have undefined).
  const isMspAdminInClientPortal =
    user.role === 'org_admin' &&
    !!user.switchedFromOrgId &&
    roles.includes('client_user')

  if (!roles.includes(user.role) && !isMspAdminInClientPortal) {
    const home = ROLE_HOME[user.role]
    if (home && !location.pathname.startsWith(home)) {
      return <Navigate to={home} replace />
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-300">403</h1>
          <p className="mt-2 text-lg text-gray-600">You don't have access to this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
