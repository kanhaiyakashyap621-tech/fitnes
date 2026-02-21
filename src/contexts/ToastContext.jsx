import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

const ToastContext = createContext(null)

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

export const useToast = () => useContext(ToastContext)

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef(new Map())

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const addToast = useCallback(
    (toast) => {
      const id = toast.id ?? createId()
      const payload = {
        id,
        title: toast.title || 'Runner',
        message: toast.message || '',
        tone: toast.tone || 'default',
        icon: toast.icon || '',
        duration: typeof toast.duration === 'number' ? toast.duration : 4500,
      }
      setToasts((prev) => [...prev.slice(-3), payload])
      if (payload.duration > 0) {
        const timer = setTimeout(() => removeToast(id), payload.duration)
        timersRef.current.set(id, timer)
      }
      return id
    },
    [removeToast]
  )

  const value = useMemo(() => ({ addToast, removeToast }), [addToast, removeToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.tone}`}>
            {toast.icon && <span className="toast-icon">{toast.icon}</span>}
            <div className="toast-body">
              <p className="toast-title">{toast.title}</p>
              {toast.message && <p className="toast-message">{toast.message}</p>}
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="toast-close"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
