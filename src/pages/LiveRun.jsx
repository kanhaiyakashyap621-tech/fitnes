import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Polygon, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { addDoc, collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../firebase'
import { colorFromId } from '../utils/colors'
import { formatArea, formatMeters, haversineDistance, polygonAreaMeters2 } from '../utils/geo'

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

const LiveRun = () => {
  const { user, profile, refreshProfile } = useAuth()
  const [positions, setPositions] = useState([])
  const [distance, setDistance] = useState(0)
  const [timer, setTimer] = useState(0)
  const [isTracking, setIsTracking] = useState(false)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [captured, setCaptured] = useState(null)
  const [saving, setSaving] = useState(false)

  const watchIdRef = useRef(null)
  const timerRef = useRef(null)
  const positionsRef = useRef([])
  const distanceRef = useRef(0)
  const capturedRef = useRef(false)

  const latestPosition = positions[positions.length - 1]
  const userColor = useMemo(() => colorFromId(user?.uid), [user?.uid])

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsTracking(false)
    setStatus('idle')
  }

  const resetRun = () => {
    stopTracking()
    setPositions([])
    positionsRef.current = []
    setDistance(0)
    distanceRef.current = 0
    setTimer(0)
    setCaptured(null)
    capturedRef.current = false
    setError('')
  }

  const finalizeCapture = async (points, totalDistance) => {
    if (!user) return
    setSaving(true)
    try {
      const area = polygonAreaMeters2(points)
      const payload = {
        userId: user.uid,
        username: profile?.username || user.displayName || 'Runner',
        coordinates: points,
        area,
        distance: totalDistance,
        createdAt: serverTimestamp(),
      }
      await addDoc(collection(db, 'territories'), payload)
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid)
        const snapshot = await transaction.get(userRef)
        const current = snapshot.exists() ? snapshot.data() : {}
        transaction.set(
          userRef,
          {
            username: payload.username,
            email: user.email || current.email || '',
            totalArea: (current.totalArea || 0) + area,
            totalDistance: (current.totalDistance || 0) + totalDistance,
            totalCaptures: (current.totalCaptures || 0) + 1,
          },
          { merge: true }
        )
      })
      await refreshProfile()
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
        if (loopDistance <= 20) {
          capturedRef.current = true
          stopTracking()
          finalizeCapture(updated, distanceRef.current)
        }
      }

      return updated
    })
  }

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported on this device.')
      return
    }
    setError('')
    setStatus('locating')
    setIsTracking(true)
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      (err) => {
        setError(err.message || 'Unable to retrieve location.')
        stopTracking()
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    )

    timerRef.current = setInterval(() => {
      setTimer((prev) => prev + 1)
    }, 1000)
  }

  useEffect(() => {
    return () => stopTracking()
  }, [])

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timer / 60)
    const seconds = timer % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }, [timer])

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pb-28 pt-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-neonBlue">Live Run</p>
        <h1 className="text-2xl font-semibold text-white">Capture a new territory</h1>
        <p className="text-sm text-white/70">
          Start tracking and close a loop within 20 meters to lock in your territory.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Timer</p>
          <p className="mt-2 text-2xl font-semibold text-neonBlue">{formattedTime}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Distance</p>
          <p className="mt-2 text-2xl font-semibold text-neonGreen">{formatMeters(distance)}</p>
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
                  : isTracking
                    ? 'Tracking'
                    : 'Idle'}
          </p>
        </div>
      </div>

      <div className="h-[55vh] overflow-hidden rounded-3xl border border-white/10 shadow-glow">
        <MapContainer
          center={latestPosition ? [latestPosition.lat, latestPosition.lng] : DEFAULT_CENTER}
          zoom={16}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {latestPosition && <Recenter position={[latestPosition.lat, latestPosition.lng]} />}
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
      </div>

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
              <p className="text-lg font-semibold text-neonBlue">{formatArea(captured.area)}</p>
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
            className="rounded-2xl bg-neonGreen px-6 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-[#0b1423] transition hover:shadow-green"
          >
            Start Tracking
          </button>
        )}
        {isTracking && (
          <button
            type="button"
            onClick={stopTracking}
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
