import { useMemo } from 'react'
import { Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'

const LiveRunnerMarker = ({ position, color, username }) => {
  const icon = useMemo(
    () =>
      L.divIcon({
        className: 'live-runner-icon',
        html: `<div class="live-runner-dot" style="--runner-color: ${color};"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      }),
    [color]
  )

  return (
    <Marker position={position} icon={icon}>
      <Tooltip className="runner-label" direction="top" offset={[0, -8]} permanent>
        {username}
      </Tooltip>
    </Marker>
  )
}

export default LiveRunnerMarker
