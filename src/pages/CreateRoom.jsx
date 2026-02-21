import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

const generateTeamCode = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let code = ''
  for (let i = 0; i < 6; i += 1) {
    code += letters[Math.floor(Math.random() * letters.length)]
  }
  return code
}

const CreateRoom = () => {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [roomName, setRoomName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event) => {
    event.preventDefault()
    if (!user) return
    if (profile?.currentRoomId) {
      setError('Leave your current room before creating a new one.')
      return
    }
    setLoading(true)
    setError('')
    try {
      let createdCode = ''
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const teamCode = generateTeamCode()
        const roomRef = doc(db, 'rooms', teamCode)
        const userRef = doc(db, 'users', user.uid)
        try {
          await runTransaction(db, async (transaction) => {
            const roomSnap = await transaction.get(roomRef)
            if (roomSnap.exists()) {
              throw new Error('CODE_EXISTS')
            }
            transaction.set(roomRef, {
              roomName: roomName.trim(),
              teamCode,
              createdBy: user.uid,
              members: [user.uid],
              createdAt: serverTimestamp(),
            })
            transaction.set(userRef, { currentRoomId: teamCode }, { merge: true })
          })
          createdCode = teamCode
          break
        } catch (err) {
          if (err.message === 'CODE_EXISTS') {
            continue
          }
          throw err
        }
      }

      if (!createdCode) {
        throw new Error('Unable to generate a unique team code. Please try again.')
      }
      await refreshProfile()
      navigate('/room')
    } catch (err) {
      setError(err.message || 'Unable to create room.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="glass-card w-full max-w-md rounded-3xl p-8 shadow-glow">
        <p className="text-xs uppercase tracking-[0.35em] text-neonBlue">Create Room</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Start a private race</h1>
        <p className="mt-2 text-sm text-white/70">
          Generate a team code and invite your crew to compete together.
        </p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm text-white/70">
            Room name
            <input
              type="text"
              required
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b1423]/70 px-4 py-3 text-white outline-none transition focus:border-neonBlue"
              placeholder="Midnight Sprinters"
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
            className="w-full rounded-xl bg-neonBlue px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#0b1423] transition hover:shadow-glow disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Room'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-white/70">
          Already have a code?{' '}
          <Link className="text-neonGreen hover:text-neonBlue" to="/room/join">
            Join a room
          </Link>
        </p>
      </div>
    </div>
  )
}

export default CreateRoom
