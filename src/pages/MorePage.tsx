import { Link } from 'react-router-dom'
import { BookOpen, Bell, Bowl, CalendarCheck, Camera, CaretRight, Clipboard, House, IconTile, SignOut, Search, Trophy, Users, type Icon, type Tone } from '../components/icons'
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

  const items: Array<{ to: string; icon: Icon; tone: Tone; label: string; badge?: number }> = [
    { to: '/more/care', icon: CalendarCheck, tone: 'emerald', label: 'Care schedule' },
    { to: '/more/vet-summary', icon: Clipboard, tone: 'sky', label: 'Vet summary' },
    { to: '/more/notifications', icon: Bell, tone: 'amber', label: 'Notifications', badge: unread },
    { to: '/more/search', icon: Search, tone: 'stone', label: 'Search' },
    { to: '/more/photos', icon: Camera, tone: 'rose', label: 'Photo memories' },
    { to: '/more/foods', icon: Bowl, tone: 'paw', label: 'Food profiles' },
    { to: '/learn', icon: BookOpen, tone: 'violet', label: 'Learn: care guides' },
    { to: '/more/achievements', icon: Trophy, tone: 'paw', label: 'Achievements & XP' },
    { to: '/more/household', icon: Users, tone: 'stone', label: 'Household & members' },
  ]

  return (
    <div>
      <PageHeader title="More" subtitle={user?.email} />
      <LevelCard />
      <Card className="mt-4 divide-y divide-stone-100 p-0">
        {items.map(({ to, icon, tone, label, badge }) => (
          <Link key={to} to={to} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-stone-50 active:bg-stone-100">
            <IconTile icon={icon} tone={tone} size="sm" />
            <span className="flex-1 font-medium">{label}</span>
            {badge ? <span className="rounded-full bg-paw-500 px-2 py-0.5 text-xs font-bold text-white">{badge}</span> : null}
            <CaretRight className="h-4 w-4 text-stone-400" />
          </Link>
        ))}
      </Card>
      {memberships.length > 1 && (
        <Card className="mt-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><House className="h-4 w-4" /> Switch household</div>
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
        <SignOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  )
}
