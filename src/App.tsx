import { useState } from 'react'
import { AppProvider } from './hooks/useAppData'
import { PrivacyProvider, usePrivacy } from './hooks/usePrivacy'
import { CheckInView } from './views/CheckInView'
import { SummaryView } from './views/SummaryView'
import { DebtsView } from './views/DebtsView'
import { GoalsView } from './views/GoalsView'
import { TrendsView } from './views/TrendsView'
import { SettingsView } from './views/SettingsView'
import { ExportImportView } from './views/ExportImportView'
import {
  ClipboardList,
  LayoutDashboard,
  CreditCard,
  Target,
  TrendingUp,
  Settings,
  HardDrive,
  Eye,
  EyeOff,
} from 'lucide-react'

type Tab = 'summary' | 'checkin' | 'debts' | 'goals' | 'trends' | 'settings' | 'backup'

const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: 'summary', label: 'Summary', Icon: LayoutDashboard },
  { id: 'checkin', label: 'Check-in', Icon: ClipboardList },
  { id: 'debts', label: 'Debts', Icon: CreditCard },
  { id: 'goals', label: 'Goals', Icon: Target },
  { id: 'trends', label: 'Trends', Icon: TrendingUp },
  { id: 'settings', label: 'Settings', Icon: Settings },
  { id: 'backup', label: 'Backup', Icon: HardDrive },
]

function AppContent() {
  const [tab, setTab] = useState<Tab>('summary')
  const { hidden, toggle } = usePrivacy()

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <header className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 px-4 py-3 safe-top flex items-center justify-between">
        <h1 className="text-base font-semibold text-slate-100 tracking-tight">
          Finance Tracker
        </h1>
        <button
          onClick={toggle}
          aria-label={hidden ? 'Show amounts' : 'Hide amounts'}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
        >
          {hidden ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        {tab === 'summary' && <SummaryView />}
        {tab === 'checkin' && <CheckInView />}
        {tab === 'debts' && <DebtsView />}
        {tab === 'goals' && <GoalsView />}
        {tab === 'trends' && <TrendsView />}
        {tab === 'settings' && <SettingsView />}
        {tab === 'backup' && <ExportImportView />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 z-10 safe-bottom">
        <div className="flex justify-around">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              aria-label={label}
              aria-current={tab === id ? 'page' : undefined}
              className={`flex flex-col items-center py-2 px-1 flex-1 transition-colors ${
                tab === id ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon size={20} />
              <span className="mt-0.5 text-[10px]">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <PrivacyProvider>
        <AppContent />
      </PrivacyProvider>
    </AppProvider>
  )
}
