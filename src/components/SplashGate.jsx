import { useEffect } from 'react'

const SplashGate = () => {
  useEffect(() => {
    const splash = document.getElementById('splash')
    if (!splash) return
    splash.classList.add('splash-hide')
    const timer = setTimeout(() => {
      splash.remove()
    }, 450)
    return () => clearTimeout(timer)
  }, [])

  return null
}

export default SplashGate
