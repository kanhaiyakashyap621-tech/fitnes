import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Polygon, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useToast } from '../contexts/ToastContext'
import LiveRunnerMarker from '../components/LiveRunnerMarker'
import { db } from '../firebase'
import { colorFromId } from '../utils/colors'
import { formatArea } from '../utils/geo'

const DEFAULT_CENTER = [39.5, -98.35]

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

const SharedMap = () => {
  const { profile, room, user } = useAuth()
  const { addToast } = useToast()
  const { showLocalNotification } = useNotifications()
  const [territories, setTerritories] = useState([])
  const [activeRunners, setActiveRunners] = useState([])
  const [now, setNow] = useState(Date.now())
  const roomId = profile?.currentRoomId ?? null
  const initialLoadRef = useRef(true)

  useEffect(() => {
    const q = query(
      collection(db, 'territories'),
      where('roomId', '==', roomId),
      orderBy('createdAt', 'desc')
    )
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
        const message = `${data.username || 'Runner'} captured ${formatArea(
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
  }, [addToast, roomId, showLocalNotification, user?.uid])

  useEffect(() => {
    initialLoadRef.current = true
  }, [roomId])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(interval)
  }, [])

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
      territories.map((territory) => ({
        ...territory,
        color: colorFromId(territory.userId),
      })),
    [territories]
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

      <div className="h-[100vh] overflow-hidden rounded-3xl border border-white/10 shadow-glow">
        <MapContainer center={DEFAULT_CENTER} zoom={5} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitTerritories territories={coloredTerritories} />
          {liveRunners.map((runner) => (
            <LiveRunnerMarker
              key={runner.id}
              position={[runner.lat, runner.lng]}
              color={colorFromId(runner.userId)}
              username={runner.username || 'Runner'}
            />
          ))}
          {coloredTerritories.map((territory) => (
            <Polygon
              key={territory.id}
              positions={territory.coordinates}
              pathOptions={{ color: territory.color, fillOpacity: 0.35 }}
            >
              <Tooltip className="runner-label" direction="center" permanent>
                {territory.username}
              </Tooltip>
            </Polygon>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}

export default SharedMap
