import { Card, ProgressBar, SectionTitle, cx } from '../../components/ui'
import type { WeeklyQuest } from '../../lib/types'
import { useWeeklyQuests } from './api'

/** Per-cat weekly goals. On Home every cat is listed; on a profile pass catId. */
export function WeeklyGoals({ hid, catId }: { hid: string; catId?: string }) {
  const q = useWeeklyQuests(hid)
  const rows = (q.data ?? []).filter(r => !catId || r.cat_id === catId)
  if (!rows.length) return null
  const groups = new Map<string, WeeklyQuest[]>()
  for (const r of rows) groups.set(r.cat_id, [...(groups.get(r.cat_id) ?? []), r])
  const done = rows.filter(r => r.completed).length
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
                  <span aria-hidden className={cx('grid h-8 w-8 shrink-0 place-items-center rounded-full text-base', g.completed ? 'bg-emerald-100' : 'bg-stone-100')}>{g.completed ? '✓' : g.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={cx('truncate text-sm font-medium', g.completed && 'text-stone-400')}>{g.title}</span>
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
