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
import TransferApprovePage from '@/pages/TransferApprovePage'
import PricingPage from '@/pages/PricingPage'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuthStore } from '@/store/authStore'

const ROLE_HOME: Record<string, string> = {
  superuser:    '/superuser',
  msp_admin:    '/org',
  msp_member:   '/org',
  portal_admin: '/client',
  employee:     '/client',
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

export default function App() {
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
            <ProtectedRoute roles={['portal_admin', 'employee']}>
              <ClientPortal />
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
