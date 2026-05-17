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
import { useStoreStatus } from './hooks/useStore'

function FullScreenLoader({ label }: { label?: string }) {
  return (
    <div className="min-h-screen grid place-items-center text-ink-soft">
      <div className="flex flex-col items-center gap-3">
        <Spinner size={22} />
        {label && <span className="text-[12.5px] tracking-tightish">{label}</span>}
      </div>
    </div>
  )
}

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth()
  const { loading: storeLoading, hydrated, error } = useStoreStatus()
  const location = useLocation()

  if (loading) return <FullScreenLoader />
  if (!user) return <Navigate to="/connexion" replace state={{ from: location }} />

  if (error && !hydrated) {
    return (
      <div className="min-h-screen grid place-items-center px-6 text-center">
        <div className="max-w-md">
          <div className="label-caps mb-2 text-sick">Erreur de connexion à la base</div>
          <p className="text-[14px] text-ink mb-3">
            Impossible de récupérer les données depuis Supabase.
          </p>
          <p className="text-[12.5px] text-ink-soft font-mono bg-surface border border-line rounded-md p-3">
            {error}
          </p>
          <button
            onClick={() => location.pathname && window.location.reload()}
            className="mt-4 text-[12.5px] text-tonton-600 hover:underline"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (storeLoading && !hydrated) return <FullScreenLoader label="Chargement des données…" />

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
