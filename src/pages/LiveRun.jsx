import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Polygon, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useToast } from '../contexts/ToastContext'
import LocationLoader from '../components/LocationLoader'
import UserLocationMarker from '../components/UserLocationMarker'
import { db } from '../firebase'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useUserLocation } from '../hooks/useUserLocation'
import { colorFromId } from '../utils/colors'
import { awardBadges, fetchBadges } from '../utils/badges'
import {
  calculateCentroid,
  formatAreaMeters,
  formatMeters,
  formatSpeed,
  haversineDistance,
  polygonAreaMeters2,
} from '../utils/geo'

const DEFAULT_CENTER = [40.7128, -74.006]

const Recenter = ({ position }) => {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom(), { animate: true })
    }
  }, [map, position])
  return null
}

const FlyToUser = ({ position, enabled }) => {
  const map = useMap()
  const lastKeyRef = useRef('')

  useEffect(() => {
    if (!enabled || !position) return
    const key = `${position.lat.toFixed(5)}:${position.lng.toFixed(5)}`
    if (key === lastKeyRef.current) return
    lastKeyRef.current = key
    map.flyTo([position.lat, position.lng], 16, { animate: true })
  }, [enabled, map, position])

  return null
}

const LiveRun = () => {
  const { user, profile, refreshProfile } = useAuth()
  const { addToast } = useToast()
  const { showLocalNotification } = useNotifications()
  const isOnline = useOnlineStatus()
  const [positions, setPositions] = useState([])
  const [distance, setDistance] = useState(0)
  const [timer, setTimer] = useState(0)
  const [isTracking, setIsTracking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [captured, setCaptured] = useState(null)
  const [saving, setSaving] = useState(false)
  const { position: userLocation, loading: locating, error: locationError } = useUserLocation({
    enabled: !isTracking,
    throttleMs: 3000,
  })

  const watchIdRef = useRef(null)
  const timerRef = useRef(null)
  const activeRunnerRef = useRef(null)
  const mapRef = useRef(null)
  const positionsRef = useRef([])
  const distanceRef = useRef(0)
  const distanceSyncedRef = useRef(0)
  const distanceSyncingRef = useRef(false)
  const capturedRef = useRef(false)
  const latestPositionRef = useRef(null)

  const latestPosition = positions[positions.length - 1]
  const userColor = useMemo(() => colorFromId(user?.uid), [user?.uid])

  const syncDistanceProgress = async () => {
    if (!user || distanceSyncingRef.current) return
    const currentDistance = distanceRef.current
    const delta = currentDistance - distanceSyncedRef.current
    if (!Number.isFinite(delta) || delta <= 0) return
    distanceSyncingRef.current = true
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid)
        const snapshot = await transaction.get(userRef)
        const current = snapshot.exists() ? snapshot.data() : {}
        transaction.set(
          userRef,
          {
            username: profile?.username || user.displayName || 'Runner',
            email: user.email || current.email || '',
            totalDistance: (current.totalDistance || 0) + delta,
          },
          { merge: true }
        )
      })
      distanceSyncedRef.current = currentDistance
    } catch (err) {
      // ignore sync errors; distance will be retried next stop
    } finally {
      distanceSyncingRef.current = false
    }
  }

  const clearTrackingIntervals = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (activeRunnerRef.current) {
      clearInterval(activeRunnerRef.current)
      activeRunnerRef.current = null
    }
  }

  const stopTracking = ({ persistDistance = true } = {}) => {
    clearTrackingIntervals()
    if (persistDistance) {
      syncDistanceProgress()
    }
    setIsTracking(false)
    setIsPaused(false)
    setStatus('idle')
    if (user) {
      deleteDoc(doc(db, 'activeRunners', user.uid)).catch(() => undefined)
    }
  }

  const pauseTracking = () => {
    clearTrackingIntervals()
    setIsTracking(false)
    setIsPaused(true)
    setStatus('paused')
    if (user) {
      deleteDoc(doc(db, 'activeRunners', user.uid)).catch(() => undefined)
    }
  }

  const clearRunState = () => {
    setPositions([])
    positionsRef.current = []
    setDistance(0)
    distanceRef.current = 0
    distanceSyncedRef.current = 0
    setTimer(0)
    setCaptured(null)
    capturedRef.current = false
    setError('')
  }

  const resetRun = () => {
    stopTracking()
    clearRunState()
  }

  const finalizeCapture = async (points, totalDistance) => {
    if (!user) return
    setSaving(true)
    try {
      const area = polygonAreaMeters2(points)
      const safeDistance = Number.isFinite(totalDistance) ? totalDistance : 0
      const safeArea = Number.isFinite(area) ? area : 0
      const unsyncedDistance = Math.max(0, safeDistance - distanceSyncedRef.current)
      const center = calculateCentroid(points)
      const payload = {
        userId: user.uid,
        username: profile?.username || user.displayName || 'Runner',
        coordinates: points,
        centerLat: center?.lat ?? points[0]?.lat ?? 0,
        centerLng: center?.lng ?? points[0]?.lng ?? 0,
        area: safeArea,
        distance: safeDistance,
        roomId: profile?.currentRoomId ?? null,
        createdAt: serverTimestamp(),
      }
      await addDoc(collection(db, 'territories'), payload)
      const updatedTotals = await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid)
        const snapshot = await transaction.get(userRef)
        const current = snapshot.exists() ? snapshot.data() : {}
        const nextTotals = {
          totalArea: (current.totalArea || 0) + safeArea,
          totalDistance: (current.totalDistance || 0) + unsyncedDistance,
          totalCaptures: (current.totalCaptures || 0) + 1,
        }
        transaction.set(
          userRef,
          {
            username: payload.username,
            email: user.email || current.email || '',
            ...nextTotals,
          },
          { merge: true }
        )
        return nextTotals
      })
      distanceSyncedRef.current = safeDistance
      await refreshProfile()
      const badges = await fetchBadges()
      const newlyEarned = await awardBadges({
        userId: user.uid,
        badges,
        stats: updatedTotals,
        earnedBadges: profile?.earnedBadges || [],
      })
      if (newlyEarned.length) {
        newlyEarned.forEach((badge) => {
          addToast({
            title: 'Badge unlocked',
            message: badge.name || 'Achievement unlocked',
            icon: badge.icon || '🏆',
            tone: 'achievement',
          })
          showLocalNotification({
            title: 'Runner badge unlocked',
            body: badge.name || 'Achievement unlocked',
          })
        })
        await refreshProfile()
      }
      setCaptured({ ...payload, area, distance: totalDistance })
    } catch (err) {
      setError(err.message || 'Failed to save capture.')
    } finally {
      setSaving(false)
    }
  }

  const handlePosition = (position) => {
    const point = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    }
    latestPositionRef.current = point

    setStatus('tracking')
    setPositions((prev) => {
      const updated = [...prev, point]
      positionsRef.current = updated

      if (prev.length > 0) {
        const increment = haversineDistance(prev[prev.length - 1], point)
        distanceRef.current += increment
        setDistance(distanceRef.current)
      }

      if (!capturedRef.current && updated.length >= 4) {
        const loopDistance = haversineDistance(updated[0], updated[updated.length - 1])
        if (loopDistance <= 200) {
          capturedRef.current = true
          stopTracking({ persistDistance: false })
          finalizeCapture(updated, distanceRef.current)
        }
      }

      return updated
    })
  }

  const startTracking = () => {
    if (!isOnline) {
      setError('Live Run is unavailable offline. Reconnect to start tracking.')
      return
    }
    if (!navigator.geolocation) {
      setError('Geolocation is not supported on this device.')
      return
    }
    setError('')
    setStatus('locating')
    setIsTracking(true)
    setIsPaused(false)
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      (err) => {
        if (err?.code === 3) {
          setStatus('locating')
          setError('Location is taking too long. Please enable GPS or move to open sky.')
          return
        }
        setError(err.message || 'Unable to retrieve location.')
        stopTracking()
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 }
    )

    timerRef.current = setInterval(() => {
      setTimer((prev) => prev + 1)
    }, 1000)
  }

  const saveTerritory = async () => {
    if (saving) return
    const points = positionsRef.current
    if (!points || points.length < 4) {
      stopTracking({ persistDistance: true })
      clearRunState()
      return
    }
    const loopDistance = haversineDistance(points[0], points[points.length - 1])
    if (loopDistance > 200) {
      stopTracking({ persistDistance: true })
      clearRunState()
      return
    }
    setError('')
    stopTracking({ persistDistance: false })
    await finalizeCapture(points, distanceRef.current)
  }

  useEffect(() => {
    return () => stopTracking()
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return undefined
    const timer = setTimeout(() => {
      map.invalidateSize({ animate: true })
    }, 320)
    return () => clearTimeout(timer)
  }, [isFullscreen])

  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    if (isFullscreen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
    document.body.style.overflow = originalOverflow
    return undefined
  }, [isFullscreen])

  useEffect(() => {
    if (!isOnline && isTracking) {
      setError('Connection lost. Live Run paused.')
      stopTracking()
    }
  }, [isOnline, isTracking])

  useEffect(() => {
    if (!isTracking || !user) return undefined
    if (activeRunnerRef.current) return undefined
    const syncRunner = () => {
      if (!latestPositionRef.current) return
      setDoc(
        doc(db, 'activeRunners', user.uid),
        {
          userId: user.uid,
          username: profile?.username || user.displayName || 'Runner',
          lat: latestPositionRef.current.lat,
          lng: latestPositionRef.current.lng,
          roomId: profile?.currentRoomId ?? null,
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => undefined)
    }
    activeRunnerRef.current = setInterval(() => {
      syncRunner()
    }, 5000)
    syncRunner()
    return () => {
      if (activeRunnerRef.current) {
        clearInterval(activeRunnerRef.current)
        activeRunnerRef.current = null
      }
    }
  }, [isTracking, profile?.currentRoomId, profile?.username, user])

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timer / 60)
    const seconds = timer % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }, [timer])

  const formattedSpeed = useMemo(() => formatSpeed(distance, timer), [distance, timer])
  const saveState = useMemo(() => {
    if (!positions.length) {
      return { canSave: false, title: 'Start tracking to save territory.' }
    }
    if (positions.length < 4) {
      return { canSave: false, title: 'Need more points to save territory.' }
    }
    const loopDistance = haversineDistance(positions[0], positions[positions.length - 1])
    if (loopDistance > 200) {
      return { canSave: false, title: 'Close the loop within 200 meters to save.' }
    }
    return { canSave: true, title: 'Save territory' }
  }, [positions])

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pb-28 pt-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-neonBlue">Live Run</p>
        <h1 className="text-2xl font-semibold text-white">Capture a new territory</h1>
        <p className="text-sm text-white/70">Start tracking to claim new territory in real time.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Timer</p>
          <p className="mt-2 text-2xl font-semibold text-neonBlue">{formattedTime}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Distance</p>
          <p className="mt-2 text-2xl font-semibold text-neonGreen">{formatMeters(distance)}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Speed</p>
          <p className="mt-2 text-2xl font-semibold text-neonBlue">{formattedSpeed}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Status</p>
          <p className="mt-2 text-sm font-semibold text-white">
            {saving
              ? 'Saving capture...'
              : captured
                ? 'Territory captured'
                : status === 'locating'
                  ? 'Searching GPS'
                  : isPaused
                    ? 'Paused'
                    : isTracking
                      ? 'Tracking'
                      : 'Idle'}
          </p>
        </div>
      </div>

      <div className="fixed bottom-4 right-4 z-[80]">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-neonBlue bg-neonBlue text-[#0b1423] shadow-glow transition hover:scale-[1.03] hover:bg-neonBlue/90"
            aria-label={isFullscreen ? 'Minimize map' : 'Fullscreen map'}
            title={isFullscreen ? 'Minimize' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 3H3v6M15 21h6v-6M3 15v6h6M21 9V3h-6"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 9H3V3M15 15h6v6M3 21v-6h6M21 3v6h-6"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div
        className={`relative overflow-hidden border border-white/10 shadow-glow transition-all duration-300 ${
          isFullscreen
            ? 'fixed inset-0 z-50 h-[100vh] w-full rounded-none'
            : 'h-[50vh] md:h-[60vh] rounded-3xl'
        }`}
      >
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={16}
          scrollWheelZoom
          whenCreated={(mapInstance) => {
            mapRef.current = mapInstance
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FlyToUser position={userLocation} enabled={!isTracking && !positions.length} />
          {latestPosition && <Recenter position={[latestPosition.lat, latestPosition.lng]} />}
          {userLocation && (
            <UserLocationMarker
              position={[userLocation.lat, userLocation.lng]}
              username={profile?.username || user?.displayName || 'You'}
            />
          )}
          {positions.length > 1 && (
            <Polyline positions={positions} pathOptions={{ color: userColor, weight: 4 }} />
          )}
          {captured && (
            <Polygon positions={captured.coordinates} pathOptions={{ color: userColor, fillOpacity: 0.35 }}>
              <Tooltip className="runner-label" direction="center" permanent>
                {captured.username}
              </Tooltip>
            </Polygon>
          )}
        </MapContainer>
        {locating && <LocationLoader message="Requesting location..." />}
      </div>

      {locationError && (
        <div className="rounded-2xl border border-neonPink/30 bg-neonPink/10 px-4 py-3 text-sm text-neonPink">
          {locationError}
        </div>
      )}

      {!isOnline && (
        <div className="rounded-2xl border border-neonPink/30 bg-neonPink/10 px-4 py-3 text-sm text-neonPink">
          Offline Mode: Live Run is paused until you reconnect.
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {captured && (
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Capture Summary</p>
          <div className="mt-3 grid gap-3 text-sm text-white/80 md:grid-cols-3">
            <div>
              <p className="text-white/50">Area</p>
              <p className="text-lg font-semibold text-neonBlue">
                {formatAreaMeters(captured.area)}
              </p>
            </div>
            <div>
              <p className="text-white/50">Distance</p>
              <p className="text-lg font-semibold text-neonGreen">{formatMeters(captured.distance)}</p>
            </div>
            <div>
              <p className="text-white/50">Runner</p>
              <p className="text-lg font-semibold text-white">{captured.username}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {!isTracking && !captured && (
          <button
            type="button"
            onClick={startTracking}
            disabled={!isOnline}
            className="rounded-2xl bg-neonGreen px-6 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-[#0b1423] transition hover:shadow-green"
          >
            {isOnline ? (isPaused ? 'Resume Run' : 'Start Tracking') : 'Offline'}
          </button>
        )}
        {(isTracking || isPaused) && !captured && (
          <button
            type="button"
            onClick={saveTerritory}
            disabled={saving}
            title={saveState.title}
            className="rounded-2xl border border-neonBlue/60 bg-[#0b1423]/70 px-6 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-neonBlue transition hover:border-neonBlue disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Territory'}
          </button>
        )}
        {isTracking && (
          <button
            type="button"
            onClick={pauseTracking}
            className="rounded-2xl border border-white/10 bg-[#0b1423]/70 px-6 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:border-neonBlue"
          >
            Pause Run
          </button>
        )}
        {captured && (
          <button
            type="button"
            onClick={resetRun}
            className="rounded-2xl border border-white/10 bg-[#0b1423]/70 px-6 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:border-neonBlue"
          >
            Start Another Run
          </button>
        )}
      </div>
    </div>
  )
}

export default LiveRun
