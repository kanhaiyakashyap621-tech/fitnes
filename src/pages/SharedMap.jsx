import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Polygon, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { colorFromId } from '../utils/colors'

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
  const [territories, setTerritories] = useState([])

  useEffect(() => {
    const q = query(collection(db, 'territories'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      }))
      setTerritories(items)
    })
    return () => unsub()
  }, [])

  const coloredTerritories = useMemo(
    () =>
      territories.map((territory) => ({
        ...territory,
        color: colorFromId(territory.userId),
      })),
    [territories]
  )

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pb-28 pt-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-neonBlue">Shared Map</p>
        <h1 className="text-2xl font-semibold text-white">Live territories</h1>
        <p className="text-sm text-white/70">
          Watch new captures appear in real time across the city.
        </p>
      </div>

      <div className="h-[65vh] overflow-hidden rounded-3xl border border-white/10 shadow-glow">
        <MapContainer center={DEFAULT_CENTER} zoom={5} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitTerritories territories={coloredTerritories} />
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
