const toRad = (value) => (value * Math.PI) / 180

export const haversineDistance = (pointA, pointB) => {
  if (!pointA || !pointB) return 0
  const R = 6371000
  const dLat = toRad(pointB.lat - pointA.lat)
  const dLng = toRad(pointB.lng - pointA.lng)
  const lat1 = toRad(pointA.lat)
  const lat2 = toRad(pointB.lat)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export const polygonAreaMeters2 = (points) => {
  if (!points || points.length < 3) return 0
  const R = 6371000
  let sum = 0

  for (let i = 0; i < points.length; i += 1) {
    const { lat: lat1, lng: lng1 } = points[i]
    const { lat: lat2, lng: lng2 } = points[(i + 1) % points.length]
    const lon1 = toRad(lng1)
    const lon2 = toRad(lng2)
    const phi1 = toRad(lat1)
    const phi2 = toRad(lat2)
    sum += (lon2 - lon1) * (2 + Math.sin(phi1) + Math.sin(phi2))
  }

  const area = (sum * R * R) / 2
  return Math.abs(area)
}

export const formatMeters = (value) => {
  if (value < 1000) return `${value.toFixed(0)} m`
  return `${(value / 1000).toFixed(2)} km`
}

export const formatArea = (value) => {
  if (value < 1000000) return `${value.toFixed(0)} m²`
  return `${(value / 1000000).toFixed(2)} km²`
}
