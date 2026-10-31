import { format, parseISO, subDays } from 'date-fns'
import type { TreatmentCourse } from '../../lib/types'
import { OFF_KINDS, dayOf, type OffDay, type OffKind } from '../trends/classify'
import { courseWindow, type Missed } from '../vet/courseReport'

export const WEEK_DAYS = 7

export const weekStart = (today: string) => format(subDays(parseISO(today), WEEK_DAYS - 1), 'yyyy-MM-dd')

type Point = { logged_at: string; weight_kg: number | string }

export interface WeekSummary {
  from: string; to: string
  /** Last weigh-in this week against the last one before it. Null when nothing was weighed this week. */
  weight: { kg: number; change: number | null; day: string } | null
  lastWeighed: string | null
  offDays: number; byKind: Array<[OffKind, number]>
  missed: number
  courses: Array<{ id: string; name: string; day: number; of: number | null }>
}

/** The last seven days including today, from what was recorded. No scoring. */
export function weekSummary({ weights, days, missed, courses, today }: {
  weights: Point[]; days: OffDay[]; missed: Missed[]; courses: TreatmentCourse[]; today: string
}): WeekSummary {
  const from = weekStart(today)
  const inWeek = (day: string) => day >= from && day <= today
  const rows = weights.map(p => ({ day: dayOf(p.logged_at), kg: Number(p.weight_kg) })).filter(r => r.day <= today)
  const week = rows.filter(r => inWeek(r.day))
  const last = week[week.length - 1]
  const before = [...rows].reverse().find(r => r.day < from) ?? (week.length > 1 ? week[0] : undefined)
  const off = days.filter(d => inWeek(d.day))
  return {
    from, to: today,
    weight: last ? { kg: last.kg, day: last.day, change: before ? last.kg - before.kg : null } : null,
    lastWeighed: rows[rows.length - 1]?.day ?? null,
    offDays: off.length,
    byKind: OFF_KINDS.map(k => [k, off.filter(d => d.kinds.includes(k)).length] as [OffKind, number]).filter(([, n]) => n > 0),
    missed: missed.filter(m => inWeek(dayOf(m.logged_at))).length,
    courses: courses.filter(c => c.status === 'active' && c.started_on <= today).map(c => {
      const w = courseWindow(c, today)
      return { id: c.id, name: c.name, day: w.day, of: w.of }
    }),
  }
}
