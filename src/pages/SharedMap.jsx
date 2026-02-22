import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import { Timestamp, collection, onSnapshot, query, where } from 'firebase/firestore'
import L from 'leaflet'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useToast } from '../contexts/ToastContext'
import FilterToggle from '../components/FilterToggle'
import LocationLoader from '../components/LocationLoader'
import LiveRunnerMarker from '../components/LiveRunnerMarker'
import UserLocationMarker from '../components/UserLocationMarker'
import { db } from '../firebase'
import { useUserLocation } from '../hooks/useUserLocation'
import { colorFromId } from '../utils/colors'
import { calculateBoundingBox, formatAreaMeters, haversineDistance } from '../utils/geo'

const DEFAULT_CENTER = [39.5, -98.35]
const RADIUS_METERS = 5000

const FitTerritories = ({ territories }) => {
  const map = useMap()

  useEffect(() => {
    if (!territories.length) return
    const bounds = territories.reduce((acc, territory) => {
      territory.coordinates.forEach((point) => acc.push([point.lat, point.lng]))
      return acc
    }, [])
    if (bounds.length) {
      map.fitBounds(bounds, { padding: [30, 30] })
    }
  }, [map, territories])

  return null
}

const FlyToUser = ({ position, enabled }) => {
  const map = useMap()
  const lastKeyRef = useRef('')

  useEffect(() => {
    if (!enabled || !position) return
    const key = `${position.lat.toFixed(4)}:${position.lng.toFixed(4)}`
    if (key === lastKeyRef.current) return
    lastKeyRef.current = key
    map.flyTo([position.lat, position.lng], 15, { animate: true })
  }, [enabled, map, position])

  return null
}

const UserRadiusLayer = ({ position, radius }) => {
  const map = useMap()
  const circleRef = useRef(null)

  useEffect(() => {
    return () => {
      if (circleRef.current) {
        map.removeLayer(circleRef.current)
        circleRef.current = null
      }
    }
  }, [map])

  useEffect(() => {
    if (!position) return
    if (!circleRef.current) {
      circleRef.current = L.circle([position.lat, position.lng], {
        radius,
        color: '#00D4FF',
        weight: 1,
        fillColor: '#00D4FF',
        fillOpacity: 0.08,
        dashArray: '4 6',
      }).addTo(map)
      return
    }
    circleRef.current.setLatLng([position.lat, position.lng])
    circleRef.current.setRadius(radius)
  }, [map, position, radius])

  return null
}

const TerritoryLayer = ({ territories }) => {
  const map = useMap()
  const layerRef = useRef(null)
  const polygonsRef = useRef([])

  useEffect(() => {
    if (!layerRef.current) {
      layerRef.current = L.layerGroup().addTo(map)
    }
    return () => {
      if (layerRef.current) {
        layerRef.current.clearLayers()
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
    }
  }, [map])

  useEffect(() => {
    if (!layerRef.current) return
    layerRef.current.clearLayers()
    polygonsRef.current = []

    territories.forEach((territory) => {
      const coords = (territory.coordinates || [])
        .map((point) => [point.lat, point.lng])
        .filter((point) => Number.isFinite(point[0]) && Number.isFinite(point[1]))

      if (coords.length < 3) return

      const polygon = L.polygon(coords, {
        color: territory.color,
        weight: 2,
        fillOpacity: 0.35,
      })

      polygon.bindTooltip(territory.username || 'Runner', {
        permanent: true,
        direction: 'center',
        className: 'runner-label',
      })

      polygon.addTo(layerRef.current)
      polygonsRef.current.push(polygon)
    })
  }, [territories])

  return null
}

const SharedMap = () => {
  const { profile, room, user } = useAuth()
  const { addToast } = useToast()
  const { showLocalNotification } = useNotifications()
  const [territories, setTerritories] = useState([])
  const [activeRunners, setActiveRunners] = useState([])
  const [now, setNow] = useState(Date.now())
  const [selectedFilter, setSelectedFilter] = useState('24h')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const mapRef = useRef(null)
  const roomId = profile?.currentRoomId ?? null
  const initialLoadRef = useRef(true)
  const { position: userLocation, loading: locating, error: locationError } = useUserLocation({
    enabled: true,
    throttleMs: 3000,
  })

  const fallbackLocation = useMemo(
    () => ({
      lat: DEFAULT_CENTER[0],
      lng: DEFAULT_CENTER[1],
    }),
    []
  )

  const effectiveLocation = userLocation || fallbackLocation

  const filterSince = useMemo(() => {
    const nowMs = Date.now()
    if (selectedFilter === '24h') {
      return Timestamp.fromDate(new Date(nowMs - 24 * 60 * 60 * 1000))
    }
    if (selectedFilter === '7d') {
      return Timestamp.fromDate(new Date(nowMs - 7 * 24 * 60 * 60 * 1000))
    }
    return null
  }, [selectedFilter])

  const bbox = useMemo(
    () => calculateBoundingBox(effectiveLocation, RADIUS_METERS),
    [effectiveLocation]
  )

  useEffect(() => {
    if (!bbox) return undefined
    const constraints = [
      where('centerLat', '>=', bbox.minLat),
      where('centerLat', '<=', bbox.maxLat),
      where('centerLng', '>=', bbox.minLng),
      where('centerLng', '<=', bbox.maxLng),
    ]
    if (roomId) {
      constraints.unshift(where('roomId', '==', roomId))
    } else {
      constraints.unshift(where('roomId', '==', null))
    }
    if (filterSince) {
      constraints.push(where('createdAt', '>=', filterSince))
    }
    const q = query(collection(db, 'territories'), ...constraints)
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      }))
      setTerritories(items)
      if (initialLoadRef.current) {
        initialLoadRef.current = false
        return
      }
      snapshot.docChanges().forEach((change) => {
        if (change.type !== 'added') return
        const data = change.doc.data()
        if (data.userId === user?.uid) return
        const message = `${data.username || 'Runner'} captured ${formatAreaMeters(
          data.area || 0
        )}`
        addToast({
          title: 'New territory captured',
          message,
          tone: 'info',
        })
        showLocalNotification({
          title: 'Runner room update',
          body: message,
        })
      })
    })
    return () => unsub()
  }, [addToast, bbox, filterSince, roomId, showLocalNotification, user?.uid])

  useEffect(() => {
    initialLoadRef.current = true
    setTerritories([])
  }, [roomId, selectedFilter])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(interval)
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
    const q = query(collection(db, 'activeRunners'), where('roomId', '==', roomId))
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      }))
      setActiveRunners(items)
    })
    return () => unsub()
  }, [roomId])

  const coloredTerritories = useMemo(
    () =>
      territories
        .map((territory) => ({
          ...territory,
          color: colorFromId(territory.userId),
        }))
        .filter((territory) => {
          const center = {
            lat: territory.centerLat,
            lng: territory.centerLng,
          }
          if (!Number.isFinite(center.lat) || !Number.isFinite(center.lng)) return false
          return haversineDistance(center, effectiveLocation) <= RADIUS_METERS
        }),
    [effectiveLocation, territories]
  )

  const liveRunners = useMemo(() => {
    const cutoff = 15000
    return activeRunners
      .map((runner) => ({
        ...runner,
        lastUpdatedMs: runner.lastUpdated?.toMillis?.() || 0,
      }))
      .filter((runner) => now - runner.lastUpdatedMs <= cutoff)
  }, [activeRunners, now])

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pb-28 pt-6">
      {!isFullscreen && (
        <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-neonBlue">Shared Map</p>
        <h1 className="text-2xl font-semibold text-white">Live territories</h1>
        <p className="text-sm text-white/70">
          {roomId
            ? `Room mode: ${room?.roomName || 'Private room'}`
            : 'Watch new captures appear in real time across the city.'}
        </p>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/60">
          <span className="live-indicator" />
          {liveRunners.length} live runners
        </div>
      </div>
      )}

      {!isFullscreen && (
        <FilterToggle value={selectedFilter} onChange={setSelectedFilter} />
      )}

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
        className={`relative overflow-hidden rounded-3xl border border-white/10 shadow-glow transition-all duration-300 ${
          isFullscreen
            ? 'fixed inset-0 z-50 h-[100vh] w-full'
            : 'h-[60vh]'
        }`}
      >
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={5}
          scrollWheelZoom
          whenCreated={(mapInstance) => {
            mapRef.current = mapInstance
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FlyToUser position={effectiveLocation} enabled />
          <UserRadiusLayer position={effectiveLocation} radius={RADIUS_METERS} />
          {userLocation && (
            <UserLocationMarker
              position={[userLocation.lat, userLocation.lng]}
              username={profile?.username || user?.displayName || 'You'}
            />
          )}
          <FitTerritories territories={coloredTerritories} />
          <TerritoryLayer territories={coloredTerritories} />
          {liveRunners.map((runner) => (
            <LiveRunnerMarker
              key={runner.id}
              position={[runner.lat, runner.lng]}
              color={colorFromId(runner.userId)}
              username={runner.username || 'Runner'}
            />
          ))}
        </MapContainer>
        {locating && <LocationLoader message="Tracking location..." />}
      </div>

      {locationError && (
        <div className="rounded-2xl border border-neonPink/30 bg-neonPink/10 px-4 py-3 text-sm text-neonPink">
          {locationError}
        </div>
      )}

      {!isFullscreen && (
        <div className="glass-card rounded-2xl border border-white/10 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Nearby activity</p>
            <span className="text-xs text-white/50">
              {coloredTerritories.length} territories
            </span>
          </div>
          <div className="mt-4 max-h-56 space-y-3 overflow-y-auto pr-2 text-sm text-white/80">
            {coloredTerritories.length === 0 && (
              <p className="text-white/60">No territories in range for this time window.</p>
            )}
            {coloredTerritories.map((territory) => {
              const createdAt = territory.createdAt?.toDate?.()
              return (
                <div
                  key={territory.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {territory.username || 'Runner'}
                    </p>
                    <p className="text-xs text-white/50">
                      {createdAt ? createdAt.toLocaleString() : 'Unknown time'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">Area</p>
                    <p className="text-sm font-semibold text-neonBlue">
                      {formatAreaMeters(territory.area || 0)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default SharedMap
