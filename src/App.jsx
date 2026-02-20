import { BrowserRouter, Route, Routes } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './contexts/AuthContext'
import Dashboard from './pages/Dashboard'
import Leaderboard from './pages/Leaderboard'
import LiveRun from './pages/LiveRun'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Profile from './pages/Profile'
import SharedMap from './pages/SharedMap'
import Signup from './pages/Signup'

const AppShell = ({ children }) => {
  const { profile, logout } = useAuth()

  return (
    <div className="min-h-screen bg-night text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b1423]/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-neonBlue">Runner</p>
            <p className="text-sm text-white/70">{profile?.username || 'Anonymous Runner'}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-neonBlue hover:text-white"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col">{children}</main>
      <BottomNav />
    </div>
  )
}

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell>
              <Dashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/run"
        element={
          <ProtectedRoute>
            <AppShell>
              <LiveRun />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/map"
        element={
          <ProtectedRoute>
            <AppShell>
              <SharedMap />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute>
            <AppShell>
              <Leaderboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppShell>
              <Profile />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
)

export default App
