import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'

/** Kinds of off day, most important first. A day can carry several. */
export const OFF_KINDS = ['diarrhea', 'vomiting', 'appetite', 'sick', 'energy', 'urine'] as const
export type OffKind = typeof OFF_KINDS[number]

export const OFF_META: Record<OffKind, { label: string; color: string; dot: string }> = {
  diarrhea: { label: 'Diarrhoea', color: '#b45309', dot: 'bg-amber-700' },
  vomiting: { label: 'Vomiting', color: '#7c3aed', dot: 'bg-violet-600' },
  appetite: { label: 'Eating less', color: '#0284c7', dot: 'bg-sky-600' },
  sick: { label: 'Unwell', color: '#dc2626', dot: 'bg-red-600' },
  energy: { label: 'Low energy', color: '#64748b', dot: 'bg-slate-500' },
  urine: { label: 'Litter or urine', color: '#0d9488', dot: 'bg-teal-600' },
}

export interface OffItem { kind: OffKind; label: string; severe?: boolean }
export interface OffDay { day: string; kinds: OffKind[]; items: OffItem[] }

export interface SymptomRow { logged_at: string; symptom: string; severity?: string | null; started_on?: string | null; ended_on?: string | null; note?: string | null }
export interface LitterRow { logged_at: string; stool: string | null; urine: string | null }
export interface CheckinRow { day: string; eating: 'usual' | 'less' | 'none'; litter: 'usual' | 'changed'; vomiting: boolean; energy: 'usual' | 'low'; note?: string | null }

/** A symptom with no end date is shown up to the day it was logged; very long spans are capped. */
const MAX_SPAN_DAYS = 60

export const dayOf = (iso: string) => (iso.length === 10 ? iso : format(parseISO(iso), 'yyyy-MM-dd'))

/** Free-text symptom to an off-day kind. Unknown text counts as unwell. */
export function symptomKind(text: string): OffKind {
  const t = text.toLowerCase()
  if (/diarr|loose stool|soft stool|blood.*stool|stool.*blood|bloody stool/.test(t)) return 'diarrhea'
  if (/vomit|throw(ing)? up|regurgit|hairball/.test(t)) return 'vomiting'
  if (/not eating|appetite|anorex|refus.*food|eating less|inappet/.test(t)) return 'appetite'
  if (/letharg|low energy|weak|tired|sleep(ing)? more|hiding/.test(t)) return 'energy'
  if (/urin|pee|straining|litter box/.test(t)) return 'urine'
  return 'sick'
}

const isNotEating = (text: string) => /not eating|anorex|refus.*food/.test(text.toLowerCase())

function span(s: SymptomRow): string[] {
  const end = s.ended_on ?? dayOf(s.logged_at)
  const start = s.started_on && s.started_on <= end ? s.started_on : end
  const n = Math.min(differenceInCalendarDays(parseISO(end), parseISO(start)), MAX_SPAN_DAYS)
  return Array.from({ length: n + 1 }, (_, i) => format(addDays(parseISO(start), i), 'yyyy-MM-dd'))
}

/** Every day with something recorded off, oldest first. Quiet days are normal days and are not listed. */
export function offDays({ symptoms = [], litter = [], checkins = [] }: { symptoms?: SymptomRow[]; litter?: LitterRow[]; checkins?: CheckinRow[] }): OffDay[] {
  const map = new Map<string, OffItem[]>()
  const add = (day: string, item: OffItem) => {
    const list = map.get(day) ?? []
    if (!list.some(x => x.kind === item.kind && x.label === item.label)) list.push(item)
    map.set(day, list)
  }
  for (const s of symptoms) {
    const kind = symptomKind(s.symptom)
    const severe = s.severity === 'severe' || (kind === 'appetite' && isNotEating(s.symptom))
    for (const d of span(s)) add(d, { kind, label: s.symptom, severe })
  }
  for (const l of litter) {
    const d = dayOf(l.logged_at)
    if (l.stool === 'diarrhea') add(d, { kind: 'diarrhea', label: 'Diarrhoea in litter' })
    if (l.stool === 'blood') add(d, { kind: 'diarrhea', label: 'Blood in stool', severe: true })
    if (l.urine === 'blood') add(d, { kind: 'urine', label: 'Blood in urine', severe: true })
    if (l.urine === 'none') add(d, { kind: 'urine', label: 'No urine', severe: true })
    if (l.urine === 'frequent') add(d, { kind: 'urine', label: 'Frequent urination' })
  }
  for (const c of checkins) {
    if (c.eating === 'none') add(c.day, { kind: 'appetite', label: 'Not eating', severe: true })
    if (c.eating === 'less') add(c.day, { kind: 'appetite', label: 'Eating less' })
    if (c.vomiting) add(c.day, { kind: 'vomiting', label: 'Vomited' })
    if (c.energy === 'low') add(c.day, { kind: 'energy', label: 'Low energy' })
    if (c.litter === 'changed') add(c.day, { kind: 'urine', label: 'Litter changed' })
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, items]) => ({
    day, items, kinds: OFF_KINDS.filter(k => items.some(i => i.kind === k)),
  }))
}

export interface Band { kind: OffKind; start: string; end: string }

/** Runs of consecutive days per kind, for shading a chart. `end` is the last day of the run. */
export function bands(days: OffDay[], kinds: readonly OffKind[] = OFF_KINDS): Band[] {
  const out: Band[] = []
  for (const kind of kinds) {
    let run: Band | null = null
    for (const d of days.filter(x => x.kinds.includes(kind))) {
      if (run && differenceInCalendarDays(parseISO(d.day), parseISO(run.end)) === 1) run.end = d.day
      else { if (run) out.push(run); run = { kind, start: d.day, end: d.day } }
    }
    if (run) out.push(run)
  }
  return out
}

/** Days of a kind within the last `days` days, today included. */
export function countDays(days: OffDay[], kind: OffKind, within: number, now = new Date()): number {
  return days.filter(d => d.kinds.includes(kind) && differenceInCalendarDays(now, parseISO(d.day)) < within && d.day <= format(now, 'yyyy-MM-dd')).length
}
