import { BrowserRouter, Route, Routes } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import MobileNotice from './components/MobileNotice'
import OfflineIndicator from './components/OfflineIndicator'
import ProtectedRoute from './components/ProtectedRoute'
import SplashGate from './components/SplashGate'
import { useAuth } from './contexts/AuthContext'
import CreateRoom from './pages/CreateRoom'
import Dashboard from './pages/Dashboard'
import JoinRoom from './pages/JoinRoom'
import Leaderboard from './pages/Leaderboard'
import LiveRun from './pages/LiveRun'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Profile from './pages/Profile'
import Room from './pages/Room'
import SharedMap from './pages/SharedMap'
import Signup from './pages/Signup'

const AppShell = ({ children }) => {
  const { profile, room, logout } = useAuth()
  const inRoom = Boolean(profile?.currentRoomId)

  return (
    <div className="min-h-screen bg-night text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b1423]/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-neonBlue">Runner</p>
            <p className="text-sm text-white/70">{profile?.username || 'Anonymous Runner'}</p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/60">
              <span className={inRoom ? 'text-neonGreen' : 'text-neonBlue'}>
                {inRoom ? 'Room Mode' : 'Global Mode'}
              </span>
              {inRoom && (
                <span className="text-white/60">{room?.roomName || 'Private Room'}</span>
              )}
            </div>
            <div className="mt-2">
              <OfflineIndicator />
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-neonBlue hover:text-white"
          >
            Logout
          </button>
        </div>
        <div className="mx-auto w-full max-w-5xl px-4 pb-3">
          <MobileNotice />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col">{children}</main>
      <BottomNav />
    </div>
  )
}

const App = () => (
  <BrowserRouter>
    <SplashGate />
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
        path="/room"
        element={
          <ProtectedRoute>
            <AppShell>
              <Room />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/room/create"
        element={
          <ProtectedRoute>
            <AppShell>
              <CreateRoom />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/room/join"
        element={
          <ProtectedRoute>
            <AppShell>
              <JoinRoom />
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
