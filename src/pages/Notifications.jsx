import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import GlassCard from '../components/GlassCard'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../firebase'

const Notifications = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setItems([])
      setLoading(false)
      return undefined
    }
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        }))
        setItems(data)
        setLoading(false)
      },
      () => {
        setLoading(false)
      }
    )
    return () => unsub()
  }, [user])

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pb-28 pt-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-neonBlue">Notifications</p>
          <h1 className="text-3xl font-semibold text-white">All alerts</h1>
          <p className="text-sm text-white/70">
            Badge unlocks, room captures, and system updates live here.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-neonBlue hover:text-white"
        >
          Back
        </button>
      </div>

      <GlassCard>
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Recent</p>
          <span className="text-xs text-white/50">{items.length} alerts</span>
        </div>
        <div className="mt-4 space-y-3">
          {loading && <p className="text-sm text-white/50">Loading notifications...</p>}
          {!loading && items.length === 0 && (
            <p className="text-sm text-white/50">No notifications yet.</p>
          )}
          {items.map((item) => {
            const createdAt = item.createdAt?.toDate?.()
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border border-neonBlue/40 bg-neonBlue/10 text-lg">
                  {item.icon || '🔔'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">
                    {item.title || 'Athletes Arena'}
                  </p>
                  {item.message && <p className="text-xs text-white/70">{item.message}</p>}
                  <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/40">
                    {createdAt ? createdAt.toLocaleString() : 'Just now'}
                  </p>
                </div>
                {item.read === false && (
                  <span className="mt-1 h-2 w-2 rounded-full bg-neonGreen shadow-[0_0_8px_rgba(0,255,156,0.6)]" />
                )}
              </div>
            )
          })}
        </div>
      </GlassCard>
    </div>
  )
}

export default Notifications
