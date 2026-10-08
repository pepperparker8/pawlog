import { useAuth } from '../../auth/AuthProvider'
import { useHousehold } from '../../household/HouseholdProvider'
import { Card, ProgressBar, cx } from '../../components/ui'
import { levelProgress, rhythmWeeks, useCareRhythm, useHouseholdStats, useLevels, useUserStats } from './api'

export function LevelCard({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth()
  const { current } = useHousehold()
  const stats = useUserStats(user!.id)
  const levels = useLevels()
  const hs = useHouseholdStats(current!.id)
  const rhythm = useCareRhythm(current!.id)
  if (!stats.data || !levels.data) return null
  const p = levelProgress(stats.data.total_xp, levels.data)
  const weeks = rhythmWeeks(rhythm.data ?? [])
  const active = weeks.filter(w => w.active).length
  return (
    <Card className="bg-gradient-to-br from-paw-500 to-paw-700 text-white ring-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-white/80">Care journey · Level {p.current?.level ?? 1}</div>
          <div className="text-lg font-bold">{p.current?.title ?? 'Getting Started'}</div>
        </div>
        {weeks.length > 0 && (
          <div className="text-right" aria-label={`Care rhythm: weekly goals met in ${active} of the last ${weeks.length} weeks`}>
            <div className="flex justify-end gap-1" aria-hidden>
              {weeks.map(w => (
                <span key={w.week} className={cx('h-2.5 w-2.5 rounded-full', w.active ? 'bg-white' : 'bg-white/30')} />
              ))}
            </div>
            <div className="mt-1 text-xs text-white/80">In rhythm {active} of {weeks.length} weeks</div>
          </div>
        )}
      </div>
      <div className="mt-3">
        <ProgressBar value={p.into} max={p.span} className="bg-white/30 [&>div]:bg-white" />
        <div className="mt-1 flex justify-between text-xs text-white/80">
          <span>{stats.data.total_xp.toLocaleString()} XP</span>
          {p.next ? <span>{(p.next.min_xp - stats.data.total_xp).toLocaleString()} to {p.next.title}</span> : <span>Top level</span>}
        </div>
      </div>
      {!compact && hs.data && (
        <div className="mt-3 border-t border-white/20 pt-2 text-xs text-white/90">
          Household Lv {hs.data.level} · {hs.data.total_xp.toLocaleString()} XP
        </div>
      )}
    </Card>
  )
}
