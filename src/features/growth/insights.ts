import { differenceInCalendarDays, parseISO } from 'date-fns'
import { signedKg } from '../../lib/format'

export interface WeightInsight { code: string; emoji: string; text: string }
type Point = { logged_at: string; weight_kg: number | string }

const RECENT_DAYS = 90
const CHANGE_DAYS = 30
const STABLE_MIN = 3
const STABLE_KG = 0.2
const GAP_DAYS = 30


/** Plain statements of what was recorded. No judgement, no diagnosis. Points must be oldest first. */
export function weightInsights(points: Point[], now = new Date()): WeightInsight[] {
  if (!points.length) return []
  const rows = points.map(p => ({ at: parseISO(p.logged_at), kg: Number(p.weight_kg) }))
  const last = rows[rows.length - 1]
  const out: WeightInsight[] = []

  const recent = rows.filter(r => differenceInCalendarDays(now, r.at) <= RECENT_DAYS)
  out.push({ code: 'count', emoji: '📒', text: `${recent.length} weigh-in${recent.length === 1 ? '' : 's'} recorded in the last ${RECENT_DAYS} days.` })

  const base = [...rows].reverse().find(r => differenceInCalendarDays(last.at, r.at) >= CHANGE_DAYS)
  if (base) {
    const days = differenceInCalendarDays(last.at, base.at)
    out.push({ code: 'change', emoji: last.kg >= base.kg ? '📈' : '📉', text: `${signedKg(last.kg - base.kg)} between weigh-ins ${days} days apart.` })
  }

  const tail = rows.slice(-STABLE_MIN)
  if (tail.length === STABLE_MIN) {
    const spread = Math.max(...tail.map(r => r.kg)) - Math.min(...tail.map(r => r.kg))
    if (spread <= STABLE_KG) out.push({ code: 'steady', emoji: '🟰', text: `The last ${STABLE_MIN} weigh-ins were within ${spread.toFixed(2)} kg of each other.` })
  }

  const gap = differenceInCalendarDays(now, last.at)
  if (gap > GAP_DAYS) out.push({ code: 'gap', emoji: '⏳', text: `Last weigh-in was ${gap} days ago.` })

  return out
}
