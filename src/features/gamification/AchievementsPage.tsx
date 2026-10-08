import { useAuth } from '../../auth/AuthProvider'
import { useHousehold } from '../../household/HouseholdProvider'
import { Card, SectionTitle, Spinner } from '../../components/ui'
import { PageHeader } from '../../components/layout/PageHeader'
import { LevelCard } from './LevelCard'
import { useBadges, useLevels, useRecentXp, useUserBadges, useXpRules } from './api'
import { ago } from '../../lib/format'
import type { XpRule } from '../../lib/types'
import { IconTile, BADGE } from '../../components/icons'


export function AchievementsPage() {
  const { user } = useAuth()
  const { current } = useHousehold()
  const badges = useBadges()
  const mine = useUserBadges(user!.id)
  const levels = useLevels()
  const rules = useXpRules()
  const recent = useRecentXp(current!.id)
  if (!badges.data || !mine.data) return <Spinner />
  const earned = new Set(mine.data.map(b => b.badge_code))
  const shown = badges.data.filter(b => !b.retired || earned.has(b.code))
  return (
    <div className="space-y-5">
      <PageHeader title="Achievements" back="/more" />
      <LevelCard />
      <section>
        <SectionTitle>Badges · {shown.filter(b => earned.has(b.code)).length}/{shown.length}</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {shown.map(b => {
            const has = earned.has(b.code)
            return (
              <Card key={b.code} className={`flex flex-col items-center p-3 text-center ${has ? '' : 'opacity-60'}`}>
                <IconTile icon={(BADGE[b.icon] ?? BADGE.star).icon} tone={has ? (BADGE[b.icon] ?? BADGE.star).tone : 'stone'} size="lg" />
                <div className="mt-1 text-xs font-bold leading-tight">{b.name}</div>
                <div className="mt-0.5 text-[10px] leading-tight text-stone-500">{b.description}</div>
              </Card>
            )
          })}
        </div>
      </section>
      <section>
        <SectionTitle>Recent XP</SectionTitle>
        <Card className="divide-y divide-stone-100 p-0">
          {recent.data?.length ? recent.data.map(x => (
            <div key={x.id} className="flex items-center justify-between px-4 py-2 text-sm">
              <span>{rules.data?.find(r => r.event_type === x.event_type)?.label ?? x.event_type}{x.reason?.startsWith('quest') ? ' (quest)' : x.reason?.startsWith('weekly') ? '' : x.reason === 'diminished' ? ' (repeat)' : ''}</span>
              <span className="text-xs text-stone-500">{ago(x.created_at)}</span>
              <span className={`ml-3 font-bold ${x.xp > 0 ? 'text-paw-600' : 'text-stone-400'}`}>+{x.xp}</span>
            </div>
          )) : <p className="px-4 py-6 text-center text-sm text-stone-500">Log something to start earning XP.</p>}
        </Card>
      </section>
      <section>
        <SectionTitle>How XP works</SectionTitle>
        <Card className="divide-y divide-stone-100 p-0">
          {rules.data?.filter(r => r.xp > 0).map(r => (
            <div key={r.event_type} className="flex items-center justify-between px-4 py-2 text-sm">
              <span>{r.label}</span>
              <span className="text-xs text-stone-500">{xpRuleNote(r)}</span>
              <span className="ml-3 font-bold text-paw-600">+{r.xp}</span>
            </div>
          ))}
        </Card>
        <p className="mt-2 text-xs text-stone-500">XP rewards care actions, never a cat's weight or health. After the daily full-XP count, each extra log of the same kind earns half the one before, so logging more than needed adds little.</p>
      </section>
      <section>
        <SectionTitle>Levels</SectionTitle>
        <Card className="divide-y divide-stone-100 p-0">
          {levels.data?.map(l => (
            <div key={l.level} className="flex items-center justify-between px-4 py-2 text-sm">
              <span><b>Lv {l.level}</b> {l.title}</span><span className="text-xs text-stone-500">{l.min_xp.toLocaleString()} XP{l.perk && ` · ${l.perk}`}</span>
            </div>
          ))}
        </Card>
      </section>
    </div>
  )
}

function xpRuleNote(r: XpRule) {
  if (r.full_per_day > 0) return r.full_per_day === 1 ? 'full XP once a day per cat' : `full XP ${r.full_per_day}× a day per cat`
  if (r.window_minutes) return `once per ${r.window_minutes >= 60 ? `${r.window_minutes / 60} h` : `${r.window_minutes} min`} per cat`
  return 'every time'
}
