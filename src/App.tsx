import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Employees } from './pages/Employees'
import { EmployeeDetail } from './pages/EmployeeDetail'
import { CalendarPage } from './pages/CalendarPage'
import { DaysOffPage } from './pages/DaysOffPage'
import { SickLeavesPage } from './pages/SickLeavesPage'
import { SettingsPage } from './pages/SettingsPage'
import { Spinner } from './components/ui/Spinner'

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-ink-soft">
        <Spinner size={20} />
      </div>
    )
  }
  if (!user) return <Navigate to="/connexion" replace state={{ from: location }} />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/connexion" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/equipe"
        element={
          <RequireAuth>
            <Employees />
          </RequireAuth>
        }
      />
      <Route
        path="/equipe/:id"
        element={
          <RequireAuth>
            <EmployeeDetail />
          </RequireAuth>
        }
      />
      <Route
        path="/calendrier"
        element={
          <RequireAuth>
            <CalendarPage />
          </RequireAuth>
        }
      />
      <Route
        path="/conges"
        element={
          <RequireAuth>
            <DaysOffPage />
          </RequireAuth>
        }
      />
      <Route
        path="/arrets-maladie"
        element={
          <RequireAuth>
            <SickLeavesPage />
          </RequireAuth>
        }
      />
      <Route
        path="/reglages"
        element={
          <RequireAuth>
            <SettingsPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
