import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { Button, Card, EmptyState, Spinner, cx } from '../../components/ui'
import { PageHeader } from '../../components/layout/PageHeader'
import { ago } from '../../lib/format'
import { useMarkRead, useNotifications } from './api'

const EMOJI: Record<string, string> = { level_up: '🎉', badge: '🏅', reminder: '⏰', symptom: '🩺', medication: '💊', vet_visit: '🏥', vaccination: '💉', care_task: '✅', member: '👥' }

export function NotificationsPage() {
  const { user } = useAuth()
  const q = useNotifications(user!.id)
  const mark = useMarkRead(user!.id)
  const unread = q.data?.filter(n => !n.read_at).length ?? 0
  return (
    <div>
      <PageHeader title="Notifications" back="/more" action={unread > 0 && <Button variant="ghost" className="text-xs" onClick={() => mark.mutate('all')}>Mark all read</Button>} />
      {q.isLoading ? <Spinner /> : !q.data?.length ? <EmptyState emoji="🔔" title="All quiet" body="Level-ups, badges, reminders and household activity land here." /> : (
        <Card className="divide-y divide-stone-100 p-0">
          {q.data.map(n => {
            const inner = (
              <div className={cx('flex items-start gap-3 px-4 py-3', !n.read_at && 'bg-paw-50')} onClick={() => !n.read_at && mark.mutate([n.id])}>
                <span className="text-lg">{EMOJI[n.kind] ?? '•'}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{n.title}</div>
                  {n.body && <div className="text-xs text-stone-600">{n.body}</div>}
                  <div className="text-[11px] text-stone-400">{ago(n.created_at)}</div>
                </div>
              </div>)
            return n.link ? <Link key={n.id} to={n.link}>{inner}</Link> : <div key={n.id}>{inner}</div>
          })}
        </Card>
      )}
    </div>
  )
}
