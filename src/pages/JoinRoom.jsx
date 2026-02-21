import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { doc, runTransaction } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

const JoinRoom = () => {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [teamCode, setTeamCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event) => {
    event.preventDefault()
    if (!user) return
    if (profile?.currentRoomId) {
      setError('Leave your current room before joining a new one.')
      return
    }
    const code = teamCode.trim().toUpperCase()
    if (code.length !== 6) {
      setError('Team code must be 6 characters.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const roomRef = doc(db, 'rooms', code)
      const userRef = doc(db, 'users', user.uid)
      await runTransaction(db, async (transaction) => {
        const roomSnap = await transaction.get(roomRef)
        if (!roomSnap.exists()) {
          throw new Error('ROOM_NOT_FOUND')
        }
        const members = roomSnap.data().members || []
        if (!members.includes(user.uid)) {
          transaction.update(roomRef, { members: [...members, user.uid] })
        }
        transaction.set(userRef, { currentRoomId: code }, { merge: true })
      })
      await refreshProfile()
      navigate('/room')
    } catch (err) {
      if (err.message === 'ROOM_NOT_FOUND') {
        setError('No room was found for that team code.')
      } else {
        setError(err.message || 'Unable to join room.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="glass-card w-full max-w-md rounded-3xl p-8 shadow-glow">
        <p className="text-xs uppercase tracking-[0.35em] text-neonBlue">Join Room</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Enter a team code</h1>
        <p className="mt-2 text-sm text-white/70">
          Use the 6-character code shared by your team.
        </p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm text-white/70">
            Team code
            <input
              type="text"
              required
              maxLength={6}
              minLength={6}
              value={teamCode}
              onChange={(event) => setTeamCode(event.target.value.toUpperCase())}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b1423]/70 px-4 py-3 text-center text-lg uppercase tracking-[0.4em] text-white outline-none transition focus:border-neonGreen"
              placeholder="ABC123"
            />
          </label>
          {error && (
            <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-neonGreen px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#0b1423] transition hover:shadow-green disabled:opacity-50"
          >
            {loading ? 'Joining...' : 'Join Room'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-white/70">
          Need a new room?{' '}
          <Link className="text-neonBlue hover:text-neonGreen" to="/room/create">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}

export default JoinRoom
