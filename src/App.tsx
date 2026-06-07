import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'
import SuperUserLoginPage from '@/pages/SuperUserLoginPage'
import SuperUserDashboard from '@/pages/superuser/SuperUserDashboard'
import OrgDashboard from '@/pages/org/OrgDashboard'
import ClientPortal from '@/pages/client/ClientPortal'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuthStore } from '@/store/authStore'

const ROLE_HOME: Record<string, string> = {
  superuser:   '/superuser',
  org_admin:   '/org',
  org_member:  '/org',
  client_user: '/client',
}

function RootRedirect() {
  const { _hasHydrated, accessToken, user } = useAuthStore()

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={ROLE_HOME[user.role] ?? '/login'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/superuser/login" element={<SuperUserLoginPage />} />

        {/* SuperUser */}
        <Route
          path="/superuser/*"
          element={
            <ProtectedRoute roles={['superuser']}>
              <SuperUserDashboard />
            </ProtectedRoute>
          }
        />

        {/* Organisation */}
        <Route
          path="/org/*"
          element={
            <ProtectedRoute roles={['org_admin', 'org_member']}>
              <OrgDashboard />
            </ProtectedRoute>
          }
        />

        {/* Client */}
        <Route
          path="/client/*"
          element={
            <ProtectedRoute roles={['client_user']}>
              <ClientPortal />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}
