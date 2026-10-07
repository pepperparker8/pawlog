import { Link } from 'react-router-dom'
import { Bell, Bowl, Camera, ChevronRight, ClipboardList, FileText, Home, LogOut, Search, Trophy, Users } from './icons'
import { useAuth } from '../auth/AuthProvider'
import { useHousehold } from '../household/HouseholdProvider'
import { Card } from '../components/ui'
import { PageHeader } from '../components/layout/PageHeader'
import { useNotifications } from '../features/notifications/api'
import { LevelCard } from '../features/gamification/LevelCard'

export function MorePage() {
  const { user, signOut } = useAuth()
  const { current, memberships, switchTo, role } = useHousehold()
  const notif = useNotifications(user!.id)
  const unread = notif.data?.filter(n => !n.read_at).length ?? 0

  const items = [
    { to: '/more/achievements', icon: Trophy, label: 'Achievements & XP' },
    { to: '/more/care', icon: ClipboardList, label: 'Care schedule' },
    { to: '/more/photos', icon: Camera, label: 'Photo memories' },
    { to: '/more/foods', icon: Bowl, label: 'Food profiles' },
    { to: '/more/notifications', icon: Bell, label: 'Notifications', badge: unread },
    { to: '/more/search', icon: Search, label: 'Search' },
    { to: '/more/vet-summary', icon: FileText, label: 'Vet summary' },
    { to: '/more/household', icon: Users, label: 'Household & members' },
  ]

  return (
    <div>
      <PageHeader title="More" subtitle={user?.email} />
      <LevelCard />
      <Card className="mt-4 divide-y divide-stone-100 p-0">
        {items.map(({ to, icon: Icon, label, badge }) => (
          <Link key={to} to={to} className="flex items-center gap-3 px-4 py-3.5 active:bg-stone-50">
            <Icon className="h-5 w-5 text-paw-600" />
            <span className="flex-1 font-medium">{label}</span>
            {badge ? <span className="rounded-full bg-paw-500 px-2 py-0.5 text-xs font-bold text-white">{badge}</span> : null}
            <ChevronRight className="h-4 w-4 text-stone-400" />
          </Link>
        ))}
      </Card>
      {memberships.length > 1 && (
        <Card className="mt-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Home className="h-4 w-4" /> Switch household</div>
          <div className="flex flex-wrap gap-2">
            {memberships.map(m => (
              <button key={m.household.id} onClick={() => switchTo(m.household.id)}
                className={`rounded-full px-3 py-1.5 text-sm ${m.household.id === current?.id ? 'bg-paw-500 text-white' : 'bg-stone-100'}`}>
                {m.household.name}
              </button>
            ))}
          </div>
        </Card>
      )}
      <p className="mt-4 text-center text-xs text-stone-400">Role in {current?.name}: {role}</p>
      <button onClick={() => void signOut()} className="mx-auto mt-2 flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-stone-600 hover:bg-stone-100">
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  )
}
