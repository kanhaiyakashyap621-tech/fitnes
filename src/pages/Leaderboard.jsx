import { useEffect, useMemo, useState } from 'react'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../firebase'
import { formatArea } from '../utils/geo'

const Leaderboard = () => {
  const { user, profile } = useAuth()
  const [leaders, setLeaders] = useState([])

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('totalArea', 'desc'), limit(10))
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      }))
      setLeaders(items)
    })
    return () => unsub()
  }, [])

  const ranked = useMemo(
    () =>
      leaders.map((leader, index) => ({
        ...leader,
        rank: index + 1,
        isYou: leader.id === user?.uid,
      })),
    [leaders, user?.uid]
  )

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pb-28 pt-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-neonBlue">Leaderboard</p>
        <h1 className="text-2xl font-semibold text-white">Top territory capturers</h1>
        <p className="text-sm text-white/70">
          Ranked by total captured area across every live run.
        </p>
      </div>

      <div className="space-y-3">
        {ranked.map((leader) => (
          <div
            key={leader.id}
            className={`glass-card flex items-center justify-between rounded-2xl px-5 py-4 ${
              leader.isYou ? 'border border-neonGreen/40 shadow-green' : ''
            }`}
          >
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">#{leader.rank}</p>
              <p className="mt-1 text-lg font-semibold text-white">{leader.username || 'Runner'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Area</p>
              <p className="mt-1 text-lg font-semibold text-neonBlue">
                {formatArea(leader.totalArea || 0)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">Your stats</p>
        <div className="mt-3 grid gap-3 text-sm text-white/80 md:grid-cols-3">
          <div>
            <p className="text-white/50">Username</p>
            <p className="text-lg font-semibold text-white">{profile?.username || 'Runner'}</p>
          </div>
          <div>
            <p className="text-white/50">Total Area</p>
            <p className="text-lg font-semibold text-neonGreen">
              {formatArea(profile?.totalArea || 0)}
            </p>
          </div>
          <div>
            <p className="text-white/50">Captures</p>
            <p className="text-lg font-semibold text-white">{profile?.totalCaptures || 0}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Leaderboard
