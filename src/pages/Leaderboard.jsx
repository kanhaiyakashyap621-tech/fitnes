import { useEffect, useMemo, useRef, useState } from 'react'
import { collection, documentId, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import Avatar from '../components/Avatar'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useToast } from '../contexts/ToastContext'
import { db } from '../firebase'
import { formatAreaMeters, formatMeters } from '../utils/geo'

const chunkMembers = (members, size) => {
  const chunks = []
  for (let i = 0; i < members.length; i += size) {
    chunks.push(members.slice(i, i + size))
  }
  return chunks
}

const Leaderboard = () => {
  const { user, profile, room } = useAuth()
  const { addToast } = useToast()
  const { showLocalNotification } = useNotifications()
  const [leaders, setLeaders] = useState([])
  const [mode, setMode] = useState('global')
  const memberMapRef = useRef(new Map())
  const previousRankRef = useRef(null)
  const membersKey = (room?.members || []).join('|')

  useEffect(() => {
    const roomId = profile?.currentRoomId
    if (!roomId) {
      setMode('global')
      const q = query(collection(db, 'users'), orderBy('totalArea', 'desc'), limit(10))
      const unsub = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        }))
        setLeaders(items)
      })
      return () => unsub()
    }

    setMode('room')
    const members = room?.members || []
    if (!members.length) {
      setLeaders([])
      return () => undefined
    }

    memberMapRef.current = new Map()
    const chunks = chunkMembers(members, 10)
    const unsubscribers = chunks.map((chunk) => {
      const q = query(collection(db, 'users'), where(documentId(), 'in', chunk))
      return onSnapshot(q, (snapshot) => {
        snapshot.docs.forEach((docSnapshot) => {
          memberMapRef.current.set(docSnapshot.id, { id: docSnapshot.id, ...docSnapshot.data() })
        })
        const items = Array.from(memberMapRef.current.values()).sort(
          (a, b) => (b.totalArea || 0) - (a.totalArea || 0)
        )
        setLeaders(items)
      })
    })

    return () => unsubscribers.forEach((unsub) => unsub())
  }, [profile?.currentRoomId, membersKey])

  const ranked = useMemo(
    () =>
      leaders.map((leader, index) => ({
        ...leader,
        rank: index + 1,
        isYou: leader.id === user?.uid,
      })),
    [leaders, user?.uid]
  )

  useEffect(() => {
    const you = ranked.find((leader) => leader.isYou)
    if (!you) return
    if (previousRankRef.current !== null && previousRankRef.current !== you.rank) {
      const improved = you.rank < previousRankRef.current
      const message = improved
        ? `You moved up to #${you.rank}.`
        : `You dropped to #${you.rank}.`
      addToast({
        title: 'Rank update',
        message,
        tone: improved ? 'success' : 'warning',
      })
      showLocalNotification({
        title: 'Runner rank update',
        body: message,
      })
    }
    previousRankRef.current = you.rank
  }, [addToast, ranked, showLocalNotification])

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pb-28 pt-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-neonBlue">Leaderboard</p>
        <h1 className="text-2xl font-semibold text-white">
          {mode === 'room' ? 'Room leaderboard' : 'Top territory capturers'}
        </h1>
        <p className="text-sm text-white/70">
          {mode === 'room'
            ? `Room: ${room?.roomName || 'Private room'}`
            : 'Ranked by total captured area across every live run.'}
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
            <div className="flex items-center gap-4">
              <Avatar
                src={leader.avatarUrl}
                name={leader.username || 'Runner'}
                size={48}
                className={leader.isYou ? 'border-neonGreen/60 text-neonGreen' : ''}
              />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">#{leader.rank}</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {leader.username || 'Runner'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Area</p>
              <p className="mt-1 text-lg font-semibold text-neonBlue">
                {formatAreaMeters(leader.totalArea || 0)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">Your stats</p>
        <div className="mt-3 grid gap-3 text-sm text-white/80 md:grid-cols-4">
          <div>
            <p className="text-white/50">Username</p>
            <p className="text-lg font-semibold text-white">{profile?.username || 'Runner'}</p>
          </div>
          <div>
            <p className="text-white/50">Total Area</p>
            <p className="text-lg font-semibold text-neonGreen">
              {formatAreaMeters(profile?.totalArea || 0)}
            </p>
          </div>
          <div>
            <p className="text-white/50">Total Distance</p>
            <p className="text-lg font-semibold text-neonBlue">
              {formatMeters(profile?.totalDistance || 0)}
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
