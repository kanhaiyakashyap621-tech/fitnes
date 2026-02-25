import { useEffect, useState } from 'react'

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const handleBeforeInstall = (event) => {
      event.preventDefault()
      setDeferredPrompt(event)
    }

    const handleInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  if (isInstalled || !deferredPrompt) return null

  return (
    <div className="install-banner">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-neonGreen">
            Install Athletes Arena
          </p>
          <p className="mt-1 text-sm text-white/70">
            Add Athletes Arena to your home screen for a full-screen experience.
          </p>
        </div>
        <button
          type="button"
          onClick={handleInstall}
          className="rounded-2xl bg-neonGreen px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#0b1423]"
        >
          Install
        </button>
      </div>
    </div>
  )
}

export default InstallPrompt
