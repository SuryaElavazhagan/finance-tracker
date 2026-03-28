import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

const PRIVACY_KEY = 'finance-tracker-hide-amounts'

interface PrivacyContextValue {
  hidden: boolean
  toggle: () => void
}

const PrivacyContext = createContext<PrivacyContextValue | null>(null)

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PRIVACY_KEY) === 'true'
    } catch {
      return false
    }
  })

  const toggle = useCallback(() => {
    setHidden((prev) => {
      const next = !prev
      try { localStorage.setItem(PRIVACY_KEY, String(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  return (
    <PrivacyContext.Provider value={{ hidden, toggle }}>
      {children}
    </PrivacyContext.Provider>
  )
}

export function usePrivacy() {
  const ctx = useContext(PrivacyContext)
  if (!ctx) throw new Error('usePrivacy must be used within PrivacyProvider')
  return ctx
}
