import { useMemo } from 'react'
import { Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'

const UserLocationMarker = ({ position, username }) => {
  const icon = useMemo(
    () =>
      L.divIcon({
        className: 'user-location-icon',
        html: '<div class="user-location-dot"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
    []
  )

  return (
    <Marker position={position} icon={icon}>
      <Tooltip className="runner-label" direction="top" offset={[0, -8]} permanent>
        {username}
      </Tooltip>
    </Marker>
  )
}

export default UserLocationMarker
