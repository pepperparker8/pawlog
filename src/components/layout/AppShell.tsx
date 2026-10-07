import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Cat, Clock, Home, MoreHorizontal, Plus } from 'lucide-react'
import { QuickLogSheet } from '../../features/logs/QuickLogSheet'
import { cx } from '../ui'
import { useOnlineStatus } from '../../lib/useOnlineStatus'

const tabs = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/cats', label: 'Cats', icon: Cat },
  { to: '/timeline', label: 'Timeline', icon: Clock },
  { to: '/more', label: 'More', icon: MoreHorizontal },
]

export function AppShell() {
  const [logOpen, setLogOpen] = useState(false)
  const online = useOnlineStatus()
  const { pathname } = useLocation()
  const hideNav = pathname.startsWith('/log')
  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col">
      {!online && <div className="bg-stone-800 px-4 py-1 text-center text-xs text-white">Offline. Logs are queued and will sync.</div>}
      <main className="flex-1 px-4 pb-28 pt-4"><Outlet /></main>
      {!hideNav && (
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur">
          <div className="mx-auto grid max-w-2xl grid-cols-5 items-end">
            {tabs.slice(0, 2).map(t => <Tab key={t.to} {...t} />)}
            <div className="flex justify-center">
              <button onClick={() => setLogOpen(true)} aria-label="Quick log"
                className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-paw-500 text-white shadow-lg shadow-paw-500/40 active:scale-95">
                <Plus className="h-7 w-7" />
              </button>
            </div>
            {tabs.slice(2).map(t => <Tab key={t.to} {...t} />)}
          </div>
        </nav>
      )}
      <QuickLogSheet open={logOpen} onClose={() => setLogOpen(false)} />
    </div>
  )
}

function Tab({ to, label, icon: Icon, end }: { to: string; label: string; icon: typeof Home; end?: boolean }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) =>
      cx('flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium', isActive ? 'text-paw-600' : 'text-stone-500')}>
      <Icon className="h-5 w-5" />{label}
    </NavLink>
  )
}
