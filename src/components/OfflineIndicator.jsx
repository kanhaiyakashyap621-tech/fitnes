import { useOnlineStatus } from '../hooks/useOnlineStatus'

const OfflineIndicator = () => {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <span className="offline-pill">offline </span>
  )
}

export default OfflineIndicator
