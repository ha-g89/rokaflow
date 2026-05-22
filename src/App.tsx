import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'
import SuperUserLoginPage from '@/pages/SuperUserLoginPage'
import SuperUserDashboard from '@/pages/superuser/SuperUserDashboard'
import OrgDashboard from '@/pages/org/OrgDashboard'
import ClientPortal from '@/pages/client/ClientPortal'
import ProtectedRoute from '@/components/ProtectedRoute'

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
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
