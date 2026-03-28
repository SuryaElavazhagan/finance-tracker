import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { AppData } from '../types'
import { loadData, saveData } from '../store/storage'

interface AppContextValue {
  data: AppData
  update: (next: AppData) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData())

  const update = useCallback((next: AppData) => {
    setData(next)
    saveData(next)
  }, [])

  return <AppContext.Provider value={{ data, update }}>{children}</AppContext.Provider>
}

export function useAppData() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppData must be used within AppProvider')
  return ctx
}
