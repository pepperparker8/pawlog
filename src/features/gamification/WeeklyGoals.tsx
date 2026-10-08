import { Card, ProgressBar, SectionTitle, cx } from '../../components/ui'
import type { WeeklyQuest } from '../../lib/types'
import { useWeeklyQuests } from './api'
import { IconTile, CareTile, Check } from '../../components/icons'

/** Per-cat weekly goals. On Home every cat is listed; on a profile pass catId. */

const QUEST_KIND: Record<string, string> = { weigh: 'weight', moment: 'photo', play: 'activity', brush: 'grooming' }
export function WeeklyGoals({ hid, catId }: { hid: string; catId?: string }) {
  const q = useWeeklyQuests(hid)
  const rows = (q.data ?? []).filter(r => !catId || r.cat_id === catId)
  if (!rows.length) return null
  const groups = new Map<string, WeeklyQuest[]>()
  for (const r of rows) groups.set(r.cat_id, [...(groups.get(r.cat_id) ?? []), r])
  // The completion row is written by a trigger; treat a met target as done even before it lands.
  const met = (r: WeeklyQuest) => r.completed || r.done >= r.target
  const done = rows.filter(met).length
  return (
    <section>
      <SectionTitle action={<span className="text-xs text-stone-500">{done}/{rows.length} this week</span>}>Weekly goals</SectionTitle>
      <div className="space-y-2">
        {[...groups.values()].map(list => (
          <Card key={list[0].cat_id} className="p-0">
            {!catId && groups.size > 1 && <div className="px-4 pt-3 text-xs font-semibold uppercase tracking-wide text-stone-500">{list[0].cat_name}</div>}
            <ul className="divide-y divide-stone-100">
              {list.map(g => (
                <li key={g.quest_code} className="flex items-center gap-3 px-4 py-2.5">
                  {met(g) ? <IconTile icon={Check} tone="emerald" size="sm" /> : <CareTile kind={QUEST_KIND[g.quest_code] ?? 'care_task'} size="sm" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={cx('truncate text-sm font-medium', met(g) && 'text-stone-400')}>{g.title}</span>
                      <span className="shrink-0 text-xs text-stone-500">{g.done}/{g.target}</span>
                    </div>
                    <ProgressBar value={g.done} max={g.target} className="mt-1 h-1.5" />
                  </div>
                  <span className="shrink-0 text-xs font-bold text-paw-600">+{g.xp_reward}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <p className="mt-1 text-[11px] text-stone-400">Goals reset every Monday. A missed week simply starts fresh.</p>
    </section>
  )
}
