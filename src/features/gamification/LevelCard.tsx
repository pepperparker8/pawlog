import { Flame, Snowflake } from 'lucide-react'
import { useAuth } from '../../auth/AuthProvider'
import { useHousehold } from '../../household/HouseholdProvider'
import { Card, ProgressBar } from '../../components/ui'
import { levelProgress, useHouseholdStats, useLevels, useUserStats } from './api'

export function LevelCard({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth()
  const { current } = useHousehold()
  const stats = useUserStats(user!.id)
  const levels = useLevels()
  const hs = useHouseholdStats(current!.id)
  if (!stats.data || !levels.data) return null
  const p = levelProgress(stats.data.total_xp, levels.data)
  return (
    <Card className="bg-gradient-to-br from-paw-500 to-paw-700 text-white ring-0">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-white/80">Level {p.current?.level ?? 1}</div>
          <div className="text-lg font-bold">{p.current?.title ?? 'New Pawrent'}</div>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-1 text-lg font-bold"><Flame className="h-5 w-5" />{stats.data.streak_current}</div>
          <div className="text-xs text-white/80">day streak{stats.data.freezes_left > 0 && <span className="ml-1 inline-flex items-center gap-0.5"><Snowflake className="h-3 w-3" />{stats.data.freezes_left}</span>}</div>
        </div>
      </div>
      <div className="mt-3">
        <ProgressBar value={p.into} max={p.span} className="bg-white/30 [&>div]:bg-white" />
        <div className="mt-1 flex justify-between text-xs text-white/80">
          <span>{stats.data.total_xp.toLocaleString()} XP</span>
          {p.next ? <span>{(p.next.min_xp - stats.data.total_xp).toLocaleString()} to {p.next.title}</span> : <span>Max level</span>}
        </div>
      </div>
      {!compact && hs.data && (
        <div className="mt-3 flex justify-between border-t border-white/20 pt-2 text-xs text-white/90">
          <span>Household Lv {hs.data.level} · {hs.data.total_xp.toLocaleString()} XP</span>
          <span>Best streak {stats.data.streak_best} d</span>
        </div>
      )}
    </Card>
  )
}
