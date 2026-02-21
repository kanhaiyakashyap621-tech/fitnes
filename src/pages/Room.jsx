import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Room = () => {
  const { profile, room, leaveRoom } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLeave = async () => {
    setLoading(true)
    setStatus('')
    try {
      await leaveRoom()
      setStatus('You have left the room.')
      navigate('/')
    } catch (err) {
      setStatus(err.message || 'Unable to leave room.')
    } finally {
      setLoading(false)
    }
  }

  if (!profile?.currentRoomId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-neonBlue">Room Mode</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">No active room</h1>
          <p className="mt-2 text-sm text-white/70">
            Create a room or join an existing team to compete together.
          </p>
        </div>
        <div className="grid w-full max-w-md gap-3">
          <Link
            to="/room/create"
            className="rounded-2xl bg-neonBlue px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-[#0b1423] transition hover:shadow-glow"
          >
            Create Room
          </Link>
          <Link
            to="/room/join"
            className="rounded-2xl border border-white/10 bg-[#0b1423]/70 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:border-neonBlue"
          >
            Join Room
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pb-28 pt-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-neonBlue">Room</p>
        <h1 className="text-2xl font-semibold text-white">{room?.roomName || 'Team Room'}</h1>
        <p className="text-sm text-white/70">
          Share the team code to invite runners into this room.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Team Code</p>
          <p className="mt-3 text-3xl font-semibold uppercase tracking-[0.4em] text-neonGreen">
            {room?.teamCode || profile.currentRoomId}
          </p>
          <p className="mt-2 text-sm text-white/60">
            Anyone with this code can join the room.
          </p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Members</p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {room?.members?.length ?? 0}
          </p>
          <p className="mt-2 text-sm text-white/60">
            Compete together on room-specific leaderboards and maps.
          </p>
        </div>
      </div>

      {status && (
        <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">
          {status}
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={() => navigate('/leaderboard')}
          className="rounded-2xl border border-white/10 bg-[#0b1423]/70 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:border-neonGreen"
        >
          Room Leaderboard
        </button>
        <button
          type="button"
          onClick={() => navigate('/map')}
          className="rounded-2xl border border-white/10 bg-[#0b1423]/70 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:border-neonBlue"
        >
          Room Map
        </button>
        <button
          type="button"
          onClick={handleLeave}
          disabled={loading}
          className="rounded-2xl border border-white/10 bg-[#0b1423]/70 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:border-red-400 disabled:opacity-60 md:col-span-2"
        >
          {loading ? 'Leaving...' : 'Leave Room'}
        </button>
      </div>
    </div>
  )
}

export default Room
