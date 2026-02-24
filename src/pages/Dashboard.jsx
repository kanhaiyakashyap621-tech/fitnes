import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import GlassCard from '../components/GlassCard'
import InstallPrompt from '../components/InstallPrompt'
import NotificationPrompt from '../components/NotificationPrompt'
import { formatAreaMeters, formatMeters } from '../utils/geo'

const Dashboard = () => {
  const { profile, room, leaveRoom } = useAuth()
  const navigate = useNavigate()
  const [roomStatus, setRoomStatus] = useState('')
  const [roomBusy, setRoomBusy] = useState(false)
  const inRoom = Boolean(profile?.currentRoomId)

  const handleLeaveRoom = async () => {
    if (!profile?.currentRoomId) return
    setRoomBusy(true)
    setRoomStatus('')
    try {
      await leaveRoom()
      setRoomStatus('Left room. You are back in global mode.')
    } catch (err) {
      setRoomStatus(err.message || 'Unable to leave room.')
    } finally {
      setRoomBusy(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pb-28 pt-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-neonBlue">Runner Control</p>
          <h1 className="text-3xl font-semibold text-white">
            Welcome back{profile?.username ? `, ${profile.username}` : ''}.
          </h1>
          <p className="text-sm text-white/70">
            Every loop you close becomes a glowing territory. Run smart and claim more.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/notifications')}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-neonBlue/40 bg-[#0b1423]/70 text-neonBlue transition hover:border-neonBlue hover:shadow-glow"
          aria-label="Open notifications"
          title="Notifications"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 17H9m6-6V8a3 3 0 10-6 0v3l-2 3h10l-2-3z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M18 9a6 6 0 10-12 0c0 5-2 6-2 6h16s-2-1-2-6z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.7"
            />
          </svg>
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Total Distance</p>
          <p className="mt-3 text-2xl font-semibold text-neonGreen">
            {formatMeters(profile?.totalDistance || 0)}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Total Area</p>
          <p className="mt-3 text-2xl font-semibold text-neonBlue">
            {formatAreaMeters(profile?.totalArea || 0)}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Total Captures</p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {profile?.totalCaptures || 0}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">EXP Points</p>
          <p className="mt-3 text-2xl font-semibold text-neonGreen">
            {profile?.expPoints || 0}
          </p>
        </GlassCard>
      </div>

      <NotificationPrompt />
      <InstallPrompt />

      <div className="glass-card rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Mode</p>
            <p className="mt-2 text-xl font-semibold text-white">
              {inRoom ? 'Room Mode' : 'Global Mode'}
            </p>
            <p className="mt-1 text-sm text-white/70">
              {inRoom
                ? `Room: ${room?.roomName || 'Private room'}`
                : 'Compete with runners worldwide.'}
            </p>
          </div>
          <span
            className={`rounded-full border px-4 py-1 text-[10px] uppercase tracking-[0.3em] ${
              inRoom ? 'border-neonGreen/40 text-neonGreen' : 'border-neonBlue/40 text-neonBlue'
            }`}
          >
            {inRoom ? 'Room' : 'Global'}
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {inRoom ? (
            <>
              <button
                type="button"
                onClick={() => navigate('/room')}
                className="rounded-2xl border border-white/10 bg-[#0b1423]/70 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:border-neonGreen"
              >
                Room Dashboard
              </button>
              <button
                type="button"
                onClick={handleLeaveRoom}
                disabled={roomBusy}
                className="rounded-2xl border border-white/10 bg-[#0b1423]/70 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:border-red-400 disabled:opacity-60"
              >
                {roomBusy ? 'Leaving...' : 'Leave Room'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate('/room/create')}
                className="rounded-2xl bg-neonBlue px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-[#0b1423] transition hover:shadow-glow"
              >
                Create Room
              </button>
              <button
                type="button"
                onClick={() => navigate('/room/join')}
                className="rounded-2xl border border-white/10 bg-[#0b1423]/70 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:border-neonBlue"
              >
                Join Room
              </button>
            </>
          )}
        </div>
        {roomStatus && (
          <p className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">
            {roomStatus}
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => navigate('/run')}
          className="rounded-2xl bg-neonBlue px-6 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-[#0b1423] transition hover:shadow-glow"
        >
          Start Run
        </button>
        <button
          type="button"
          onClick={() => navigate('/map')}
          className="rounded-2xl border border-white/10 bg-[#0b1423]/70 px-6 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:border-neonBlue"
        >
          View Shared Map
        </button>
      </div>
    </div>
  )
}

export default Dashboard
