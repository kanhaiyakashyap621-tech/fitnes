import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { arrayUnion, doc, updateDoc } from 'firebase/firestore'
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging'
import { app, db } from '../firebase'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

const NotificationContext = createContext(null)

export const useNotifications = () => useContext(NotificationContext)

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [permission, setPermission] = useState(() => {
    if (typeof Notification === 'undefined') return 'unsupported'
    return Notification.permission
  })
  const [messagingSupported, setMessagingSupported] = useState(false)
  const [token, setToken] = useState(null)
  const registrationRef = useRef(null)

  useEffect(() => {
    let active = true
    isSupported()
      .then((supported) => {
        if (active) setMessagingSupported(supported)
      })
      .catch(() => {
        if (active) setMessagingSupported(false)
      })
    return () => {
      active = false
    }
  }, [])

  const ensureServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return null
    if (registrationRef.current) return registrationRef.current
    registrationRef.current = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    return registrationRef.current
  }, [])

  const registerToken = useCallback(async () => {
    if (!user || permission !== 'granted' || !messagingSupported) return null
    const registration = await ensureServiceWorker()
    if (!registration) return null
    try {
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
      const messaging = getMessaging(app)
      const currentToken = await getToken(
        messaging,
        vapidKey
          ? { vapidKey, serviceWorkerRegistration: registration }
          : { serviceWorkerRegistration: registration }
      )
      if (currentToken) {
        setToken(currentToken)
        await updateDoc(doc(db, 'users', user.uid), {
          fcmTokens: arrayUnion(currentToken),
        })
      }
      return currentToken
    } catch {
      return null
    }
  }, [app, ensureServiceWorker, messagingSupported, permission, user])

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') {
      setPermission('unsupported')
      return 'unsupported'
    }
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === 'granted') {
      await registerToken()
      addToast({
        title: 'Notifications enabled',
        message: 'Badge and room alerts will appear here.',
        tone: 'success',
      })
    } else if (result === 'denied') {
      addToast({
        title: 'Notifications blocked',
        message: 'Enable notifications in your browser settings to receive Runner alerts.',
        tone: 'warning',
      })
    }
    return result
  }, [addToast, registerToken])

  const showLocalNotification = useCallback(
    ({ title, body }) => {
      if (permission !== 'granted' || typeof Notification === 'undefined') return
      try {
        new Notification(title, {
          body,
          icon: '/vite.svg',
          tag: `runner-${title}`,
        })
      } catch {
        // Ignore notification errors silently
      }
    },
    [permission]
  )

  useEffect(() => {
    if (!messagingSupported || permission !== 'granted' || !user) return undefined
    const messaging = getMessaging(app)
    const unsubscribe = onMessage(messaging, (payload) => {
      const title = payload.notification?.title || 'Runner update'
      const body = payload.notification?.body || payload.data?.body || ''
      addToast({
        title,
        message: body,
        tone: 'info',
      })
    })
    registerToken()
    return () => unsubscribe()
  }, [addToast, app, messagingSupported, permission, registerToken, user])

  const value = useMemo(
    () => ({
      permission,
      messagingSupported,
      token,
      requestPermission,
      registerToken,
      showLocalNotification,
    }),
    [messagingSupported, permission, requestPermission, registerToken, showLocalNotification, token]
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}
