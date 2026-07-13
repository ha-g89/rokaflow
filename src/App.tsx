import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import InvitePage from '@/pages/InvitePage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import LoginPage from '@/pages/LoginPage'
import LandingPage from '@/pages/LandingPage'
import SuperUserLoginPage from '@/pages/SuperUserLoginPage'
import SuperUserDashboard from '@/pages/superuser/SuperUserDashboard'
import OrgDashboard from '@/pages/org/OrgDashboard'
import OrgSettings from '@/pages/org/OrgSettings'
import RegisterPage from '@/pages/RegisterPage'
import ClientPortal from '@/pages/client/ClientPortal'
import SelfServicePortal from '@/pages/client/SelfServicePortal'
import TransferApprovePage from '@/pages/TransferApprovePage'
import PricingPage from '@/pages/PricingPage'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuthStore } from '@/store/authStore'

const ROLE_HOME: Record<string, string> = {
  superuser:    '/superuser',
  msp_admin:    '/org',
  msp_member:   '/org',
  portal_admin: '/client',
  employee:     '/mijn-omgeving',
}

function RootRedirect() {
  const { _hasHydrated, accessToken, user } = useAuthStore()

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={ROLE_HOME[user.role] ?? '/login'} replace />
}

// Browser back/forward fires a native 'popstate' event — unlike navigate()
// (pushState), it never fires for the "switch into client" flow itself, so
// this can safely restore the MSP context the moment the user actually
// navigates back to an /org URL while still switched into a client portal.
// Runs before React re-renders the matched route, so ProtectedRoute never
// sees the stale client-scoped token for the /org route.
function useRestoreMspContextOnBrowserBack() {
  useEffect(() => {
    const handlePopState = () => {
      const { user, switchBack } = useAuthStore.getState()
      if (user?.switchedFromOrgId && window.location.pathname.startsWith('/org')) {
        switchBack()
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])
}

export default function App() {
  useRestoreMspContextOnBrowserBack()

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/invite" element={<InvitePage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/superuser/login" element={<SuperUserLoginPage />} />
        <Route path="/transfer/approve" element={<TransferApprovePage />} />

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
          path="/org/settings"
          element={
            <ProtectedRoute roles={['msp_admin', 'msp_member']}>
              <OrgSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/org/*"
          element={
            <ProtectedRoute roles={['msp_admin', 'msp_member']}>
              <OrgDashboard />
            </ProtectedRoute>
          }
        />

        {/* Client */}
        <Route
          path="/client/*"
          element={
            <ProtectedRoute roles={['portal_admin']}>
              <ClientPortal />
            </ProtectedRoute>
          }
        />

        {/* Medewerker zelfbediening (read-only) */}
        <Route
          path="/mijn-omgeving/*"
          element={
            <ProtectedRoute roles={['employee']}>
              <SelfServicePortal />
            </ProtectedRoute>
          }
        />

        {/* Landing & fallback */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}
