import { useNotifications } from '../contexts/NotificationContext'

const NotificationPrompt = () => {
  const { permission, messagingSupported, requestPermission } = useNotifications()

  if (!messagingSupported) return null
  if (permission === 'granted') return null

  const blocked = permission === 'denied'

  return (
    <div className="glass-card rounded-2xl border border-white/10 p-5">
      <p className="text-xs uppercase tracking-[0.3em] text-white/60">Notifications</p>
      <p className="mt-2 text-lg font-semibold text-white">Stay ahead of every capture</p>
      <p className="mt-2 text-sm text-white/70">
        Enable push alerts for badge unlocks, room captures, and rank changes.
      </p>
      {blocked ? (
        <p className="mt-3 text-sm text-neonPink">
          Notifications are blocked in your browser settings.
        </p>
      ) : (
        <button
          type="button"
          onClick={requestPermission}
          className="mt-4 rounded-2xl bg-neonGreen px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#0b1423] transition hover:shadow-green"
        >
          Enable Notifications
        </button>
      )}
    </div>
  )
}

export default NotificationPrompt
