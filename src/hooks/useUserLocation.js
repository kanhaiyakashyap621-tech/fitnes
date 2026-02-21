import { useEffect, useRef, useState } from 'react'

const DEFAULT_ERROR = 'Location access is required for live running.'

export const useUserLocation = ({ enabled = true, throttleMs = 3000, enableHighAccuracy = true } = {}) => {
  const [position, setPosition] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const watchIdRef = useRef(null)
  const lastUpdateRef = useRef(0)
  const lastKeyRef = useRef('')

  useEffect(() => {
    if (!enabled) {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      return undefined
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported on this device.')
      setLoading(false)
      return undefined
    }

    let active = true

    const handleSuccess = (pos, force = false) => {
      if (!active) return
      const now = Date.now()
      if (!force && now - lastUpdateRef.current < throttleMs) return
      const { latitude, longitude, accuracy } = pos.coords
      const key = `${latitude.toFixed(5)}:${longitude.toFixed(5)}`
      if (!force && key === lastKeyRef.current) return
      lastUpdateRef.current = now
      lastKeyRef.current = key
      setPosition({
        lat: latitude,
        lng: longitude,
        accuracy,
        timestamp: pos.timestamp,
      })
      setError('')
      setLoading(false)
    }

    const handleError = (err) => {
      if (!active) return
      const message = err?.code === 1 ? DEFAULT_ERROR : err?.message || 'Unable to retrieve location.'
      setError(message)
      setLoading(false)
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => handleSuccess(pos, true),
      handleError,
      { enableHighAccuracy, maximumAge: 0, timeout: 10000 }
    )

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => handleSuccess(pos),
      (err) => {
        if (err?.code === 1) handleError(err)
      },
      { enableHighAccuracy, maximumAge: 0, timeout: 10000 }
    )

    return () => {
      active = false
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [enabled, enableHighAccuracy, throttleMs])

  return { position, loading, error }
}
