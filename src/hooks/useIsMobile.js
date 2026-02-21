import { useEffect, useState } from 'react'

const checkMobile = () => {
  if (typeof window === 'undefined') return true
  const coarse = window.matchMedia?.('(pointer: coarse)')?.matches
  const narrow = window.innerWidth <= 900
  const ua = navigator.userAgent.toLowerCase()
  const isMobileUA = /iphone|ipad|ipod|android|mobile/.test(ua)
  return Boolean(coarse || narrow || isMobileUA)
}

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(checkMobile)

  useEffect(() => {
    const handleResize = () => setIsMobile(checkMobile())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isMobile
}
