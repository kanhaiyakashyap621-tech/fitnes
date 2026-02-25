import { useEffect, useMemo, useRef, useState } from 'react'
import { updateProfile } from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import Avatar from '../components/Avatar'
import { useAuth } from '../contexts/AuthContext'
import { auth, db, storage } from '../firebase'
import { fetchBadges } from '../utils/badges'
import { AI_AVATARS } from '../utils/aiAvatars'
import { formatAreaMeters, formatMeters } from '../utils/geo'

const Profile = () => {
  const { user, profile, refreshProfile, logout } = useAuth()
  const [username, setUsername] = useState(profile?.username || '')
  const [status, setStatus] = useState('')
  const [avatarStatus, setAvatarStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [savingAvatar, setSavingAvatar] = useState(false)
  const [badges, setBadges] = useState([])
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || user?.photoURL || '')
  const fileInputRef = useRef(null)
  const isAvatarBusy = uploadingAvatar || savingAvatar

  const earnedSet = useMemo(() => new Set(profile?.earnedBadges || []), [profile?.earnedBadges])

  useEffect(() => {
    if (profile?.username) {
      setUsername(profile.username)
    }
  }, [profile?.username])

  useEffect(() => {
    setAvatarUrl(profile?.avatarUrl || user?.photoURL || '')
  }, [profile?.avatarUrl, user?.photoURL])

  useEffect(() => {
    let active = true
    fetchBadges()
      .then((items) => {
        if (active) setBadges(items)
      })
      .catch(() => {
        if (active) setBadges([])
      })
    return () => {
      active = false
    }
  }, [])

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

  const handleAvatarSelect = () => {
    if (isAvatarBusy) return
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !user) return
    if (!file.type.startsWith('image/')) {
      setAvatarStatus('Please select a valid image file.')
      return
    }
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      setAvatarStatus('Avatar must be under 2MB.')
      return
    }
    setUploadingAvatar(true)
    setAvatarStatus('')
    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const safeExtension = extension.replace(/[^a-z0-9]/g, '') || 'jpg'
      const avatarRef = ref(
        storage,
        `avatars/${user.uid}/${Date.now()}-avatar.${safeExtension}`
      )
      await uploadBytes(avatarRef, file, { contentType: file.type })
      const url = await getDownloadURL(avatarRef)
      await updateDoc(doc(db, 'users', user.uid), { avatarUrl: url })
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: url })
      }
      await refreshProfile()
      setAvatarUrl(url)
      setAvatarStatus('Avatar updated.')
    } catch (err) {
      setAvatarStatus(err.message || 'Unable to upload avatar.')
    } finally {
      setUploadingAvatar(false)
      event.target.value = ''
    }
  }

  const applyAiAvatar = async (avatar) => {
    if (!user || !avatar?.src || isAvatarBusy) return
    setSavingAvatar(true)
    setAvatarStatus('')
    try {
      await updateDoc(doc(db, 'users', user.uid), { avatarUrl: avatar.src })
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: avatar.src })
      }
      await refreshProfile()
      setAvatarUrl(avatar.src)
      setAvatarStatus('Avatar updated.')
    } catch (err) {
      setAvatarStatus(err.message || 'Unable to update avatar.')
    } finally {
      setSavingAvatar(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pb-28 pt-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-neonBlue">Profile</p>
        <h1 className="text-2xl font-semibold text-white">Manage your Athletes Arena identity</h1>
        <p className="text-sm text-white/70">Update your username and review your stats.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Account</p>
          <div className="mt-4 flex items-center gap-4">
            <Avatar
              src={avatarUrl}
              name={profile?.username || user?.displayName || 'Runner'}
              size={72}
              className="border-neonGreen/40 text-neonGreen"
            />
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={handleAvatarSelect}
                disabled={isAvatarBusy}
                className="rounded-xl border border-neonGreen/40 bg-[#0b1423]/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-neonGreen transition hover:border-neonGreen disabled:opacity-60"
              >
                {uploadingAvatar ? 'Uploading...' : 'Change Avatar'}
              </button>
              <p className="mt-2 text-xs text-white/50">PNG/JPG up to 2MB.</p>
              {avatarStatus && (
                <p className="mt-2 text-xs text-neonGreen/80">{avatarStatus}</p>
              )}
            </div>
          </div>
          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Cartoon Avatars</p>
            <div className="mt-3 grid grid-cols-5 gap-3">
              {AI_AVATARS.map((avatar) => {
                const selected = avatar.src === avatarUrl
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => applyAiAvatar(avatar)}
                    disabled={isAvatarBusy}
                    className={`rounded-full p-1 transition ${
                      selected
                        ? 'ring-2 ring-neonGreen shadow-green'
                        : 'ring-1 ring-white/10 hover:ring-neonBlue/60'
                    }`}
                    title={avatar.name}
                  >
                    <Avatar src={avatar.src} name={avatar.name} size={44} />
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-xs text-white/50">Tap any avatar to apply.</p>
          </div>
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
              <span className="font-semibold text-neonBlue">
                {formatAreaMeters(profile?.totalArea || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total Captures</span>
              <span className="font-semibold text-white">{profile?.totalCaptures || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>EXP Points</span>
              <span className="font-semibold text-neonGreen">{profile?.expPoints || 0}</span>
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

      <div className="glass-card rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Badges</p>
            <p className="mt-2 text-lg font-semibold text-white">Your achievement wall</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/60">
            {earnedSet.size}/{badges.length || 0} earned
          </span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((badge) => {
            const earned = earnedSet.has(badge.id)
            return (
              <div
                key={badge.id}
                className={`badge-card glass-card rounded-2xl border border-white/10 p-4 transition ${
                  earned ? 'badge-earned' : 'badge-locked'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="badge-icon">{badge.icon || '🏁'}</div>
                  <div>
                    <p className="text-sm font-semibold text-white">{badge.name || 'Badge'}</p>
                    <p className="mt-1 text-xs text-white/60">
                      {badge.description || 'Unlock by reaching an Athletes Arena milestone.'}
                    </p>
                  </div>
                </div>
                {!earned && (
                  <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-white/40">
                    Locked
                  </p>
                )}
              </div>
            )
          })}
          {!badges.length && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/60">
              Badges will appear once the badges collection is seeded.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
