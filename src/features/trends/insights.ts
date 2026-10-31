import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { countDays, type OffDay } from './classify'

export type InsightTone = 'info' | 'watch' | 'act'
export interface Source { name: string; url: string }
export interface TrendInsight { code: string; tone: InsightTone; text: string; source?: Source }

const VCA_ILLNESS: Source = { name: 'VCA: Signs of illness in cats', url: 'https://vcahospitals.com/know-your-pet/recognizing-signs-of-illness-in-cats' }
const VCA_EMERGENCY: Source = { name: 'VCA: Emergencies in cats', url: 'https://vcahospitals.com/know-your-pet/emergencies-in-cats' }
const VCA_WEIGHT: Source = { name: 'VCA: Weight reduction plan for cats', url: 'https://vcahospitals.com/know-your-pet/creating-a-weight-reduction-plan-for-cats' }

/** Same rule as detect_patterns: latest weigh-in at least 5% under the median of the 30 days before it. */
const DROP_PCT = 5
const MEDIAN_DAYS = 30
/** Planned weight loss is kept to 1 to 2% per week; faster loss is worth raising. */
const RATE_PCT_WEEK = 2
const RATE_MIN_DAYS = 14
const RATE_WINDOW_DAYS = 42
const WEEK = 7
const MONTH = 30

type Point = { logged_at: string; weight_kg: number | string }
export interface CourseInput { name: string; started_on: string }

const pct = (v: number) => `${Math.abs(v).toFixed(1)}%`
const kg = (v: number) => `${v.toFixed(2)} kg`
const short = (day: string) => format(parseISO(day), 'd MMM')
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b), m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/**
 * Plain statements of what was recorded, each with the published guidance it is measured against.
 * Weights must be oldest first. Nothing here is a diagnosis.
 */
export function trendInsights({ weights, days, course = null, missed = 0, now = new Date() }: {
  weights: Point[]; days: OffDay[]; course?: CourseInput | null; missed?: number; now?: Date
}): TrendInsight[] {
  const out: TrendInsight[] = []
  const rows = weights.map(p => ({ at: parseISO(p.logged_at), kg: Number(p.weight_kg) }))
  const last = rows[rows.length - 1]

  if (last) {
    const window = rows.filter(r => r.at < last.at && differenceInCalendarDays(last.at, r.at) <= MEDIAN_DAYS)
    if (window.length) {
      const base = median(window.map(r => r.kg))
      const change = (last.kg - base) / base * 100
      if (change <= -DROP_PCT) out.push({ code: 'weight_drop', tone: 'act', source: VCA_ILLNESS,
        text: `Latest weigh-in ${kg(last.kg)} is ${pct(change)} under the ${MEDIAN_DAYS}-day median (${kg(base)}). Unplanned weight loss is worth discussing with your vet.` })
    }
    const base = rows.find(r => differenceInCalendarDays(last.at, r.at) <= RATE_WINDOW_DAYS)
    const span = base ? differenceInCalendarDays(last.at, base.at) : 0
    if (base && span >= RATE_MIN_DAYS) {
      const perWeek = (last.kg - base.kg) / base.kg * 100 / (span / WEEK)
      if (perWeek < -RATE_PCT_WEEK) out.push({ code: 'weight_rate', tone: 'watch', source: VCA_WEIGHT,
        text: `Down about ${pct(perWeek)} of body weight per week over ${span} days. Even planned weight loss is kept to 1 to 2% per week under vet supervision.` })
    }
  }

  const today = format(now, 'yyyy-MM-dd')
  const recent = days.filter(d => d.day <= today && differenceInCalendarDays(now, parseISO(d.day)) < WEEK)
  const notEating = recent.filter(d => d.items.some(i => i.kind === 'appetite' && i.severe)).map(d => d.day)
  if (notEating.length) out.push({ code: 'not_eating', tone: 'act', source: VCA_ILLNESS,
    text: `Not eating recorded on ${notEating.map(short).join(', ')}. VCA advises a vet visit if a cat has not eaten properly for 24 hours.` })

  const blood = recent.filter(d => d.items.some(i => i.severe && (i.kind === 'diarrhea' || i.kind === 'urine'))).map(d => d.day)
  if (blood.length) out.push({ code: 'blood', tone: 'act', source: VCA_EMERGENCY,
    text: `Blood or no urine recorded on ${blood.map(short).join(', ')}. This is a reason to call your vet the same day.` })

  for (const [kind, noun] of [['vomiting', 'Vomiting'], ['diarrhea', 'Diarrhoea']] as const) {
    const week = countDays(days, kind, WEEK, now), month = countDays(days, kind, MONTH, now)
    if (!month) continue
    out.push({ code: kind, tone: week >= 2 ? 'watch' : 'info', source: week ? VCA_EMERGENCY : undefined,
      text: `${noun} on ${week} of the last ${WEEK} days, ${month} of the last ${MONTH}.${week ? ' VCA advises calling the vet if it lasts beyond 6 to 12 hours, contains blood, or comes with weakness.' : ''}` })
  }

  if (missed) out.push({ code: 'missed', tone: missed >= 2 ? 'watch' : 'info',
    text: `${missed} missed dose${missed === 1 ? '' : 's'} in the last ${WEEK} days.` })

  if (course && last) {
    const start = parseISO(course.started_on)
    const before = [...rows].reverse().find(r => r.at <= start) ?? rows.find(r => r.at > start)
    if (before && before !== last) out.push({ code: 'course_weight', tone: 'info',
      text: `Since ${course.name} started (${short(course.started_on)}): ${kg(before.kg)} to ${kg(last.kg)}, ${last.kg >= before.kg ? '+' : '-'}${Math.abs(last.kg - before.kg).toFixed(2)} kg.` })
    const during = days.filter(d => d.day >= course.started_on && d.day <= today).length
    out.push({ code: 'course_days', tone: 'info', text: `${during} off day${during === 1 ? '' : 's'} recorded since the course started.` })
  }

  const order: Record<InsightTone, number> = { act: 0, watch: 1, info: 2 }
  return out.sort((a, b) => order[a.tone] - order[b.tone])
}
