import { useEffect, useState } from 'react'
import { updateProfile } from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import { auth, db } from '../firebase'
import { formatArea, formatMeters } from '../utils/geo'

const Profile = () => {
  const { user, profile, refreshProfile, logout } = useAuth()
  const [username, setUsername] = useState(profile?.username || '')
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile?.username) {
      setUsername(profile.username)
    }
  }, [profile?.username])

  const handleUpdate = async (event) => {
    event.preventDefault()
    if (!user) return
    setSaving(true)
    setStatus('')
    try {
      await updateDoc(doc(db, 'users', user.uid), { username })
      await updateProfile(auth.currentUser, { displayName: username })
      await refreshProfile()
      setStatus('Username updated.')
    } catch (err) {
      setStatus(err.message || 'Unable to update username.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pb-28 pt-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-neonBlue">Profile</p>
        <h1 className="text-2xl font-semibold text-white">Manage your Runner identity</h1>
        <p className="text-sm text-white/70">Update your username and review your stats.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Account</p>
          <form className="mt-4 space-y-4" onSubmit={handleUpdate}>
            <label className="block text-sm text-white/70">
              Username
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b1423]/70 px-4 py-3 text-white outline-none transition focus:border-neonBlue"
                required
              />
            </label>
            <label className="block text-sm text-white/70">
              Email
              <input
                type="email"
                value={profile?.email || user?.email || ''}
                disabled
                className="mt-2 w-full cursor-not-allowed rounded-xl border border-white/10 bg-[#0b1423]/40 px-4 py-3 text-white/60"
              />
            </label>
            {status && (
              <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">
                {status}
              </p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-neonBlue px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#0b1423] transition hover:shadow-glow disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save username'}
            </button>
          </form>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Totals</p>
          <div className="mt-4 space-y-3 text-sm text-white/80">
            <div className="flex items-center justify-between">
              <span>Total Distance</span>
              <span className="font-semibold text-neonGreen">
                {formatMeters(profile?.totalDistance || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total Area</span>
              <span className="font-semibold text-neonBlue">{formatArea(profile?.totalArea || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total Captures</span>
              <span className="font-semibold text-white">{profile?.totalCaptures || 0}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="mt-6 w-full rounded-xl border border-white/10 bg-[#0b1423]/70 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:border-neonBlue"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile
