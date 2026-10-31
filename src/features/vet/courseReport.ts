import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import type { LabReport, LabRow, TreatmentCourse } from '../../lib/types'
import { OFF_KINDS, OFF_META, dayOf, type OffDay, type OffKind } from '../trends/classify'
import { isOutside, rangeStatus, sameAnalyte, sortReports, unitKey, type RangeStatus } from '../labs/status'

/** A weight change this large since the start is worth a dosing question, since many courses are dosed per kg. */
const DOSE_CHANGE_PCT = 5
const MAX_LAB_QUESTIONS = 4

type Point = { logged_at: string; weight_kg: number | string }
export interface Missed { logged_at: string; medication_name: string }

export interface CourseWindow { start: string; end: string; day: number; of: number | null; endedEarly: boolean }
export interface WeightSummary { start: { day: string; kg: number } | null; last: { day: string; kg: number } | null; change: number | null; pct: number | null; points: Array<{ day: string; kg: number }> }
export interface LabLine { row: LabRow; status: RangeStatus; before: { sampled_on: string; value: number } | null }
export interface LabSummary { baseline: LabReport | null; latest: LabReport | null; lines: LabLine[] }

const short = (day: string) => format(parseISO(day), 'd MMM')

/** The days a report covers: start to end date, or to today while the course runs. */
export function courseWindow(c: TreatmentCourse, today: string): CourseWindow {
  const end = c.status === 'active' || !c.ended_on ? today : c.ended_on < today ? c.ended_on : today
  return {
    start: c.started_on, end,
    day: differenceInCalendarDays(parseISO(end), parseISO(c.started_on)) + 1,
    of: c.planned_days, endedEarly: c.status === 'stopped',
  }
}

const inside = (w: CourseWindow, day: string) => day >= w.start && day <= w.end

/** Starting weight is the last weigh-in on or before day 1, else the first one after it. */
export function weightSummary(weights: Point[], w: CourseWindow): WeightSummary {
  const rows = weights.map(p => ({ day: dayOf(p.logged_at), kg: Number(p.weight_kg) })).filter(r => r.day <= w.end)
  const start = [...rows].reverse().find(r => r.day <= w.start) ?? rows.find(r => r.day > w.start) ?? null
  const points = rows.filter(r => inside(w, r.day) || r === start)
  const last = points[points.length - 1] ?? null
  const change = start && last && last !== start ? last.kg - start.kg : null
  return { start, last, change, pct: change != null && start ? change / start.kg * 100 : null, points }
}

export function offDaysIn(days: OffDay[], w: CourseWindow): { days: OffDay[]; byKind: Array<[OffKind, number]> } {
  const list = days.filter(d => inside(w, d.day))
  const byKind = OFF_KINDS.map(k => [k, list.filter(d => d.kinds.includes(k)).length] as [OffKind, number]).filter(([, n]) => n > 0)
  return { days: list, byKind }
}

export const missedIn = (missed: Missed[], w: CourseWindow) => missed.filter(m => inside(w, dayOf(m.logged_at)))

/**
 * Newest report inside the course against the last report before it.
 * Only results with matching units are compared.
 */
export function labSummary(reports: LabReport[], w: CourseWindow): LabSummary {
  const sorted = sortReports(reports)
  const latest = sorted.find(r => inside(w, r.sampled_on)) ?? null
  const baseline = sorted.find(r => r.sampled_on < w.start) ?? null
  const shown = latest ?? baseline
  if (!shown) return { baseline, latest, lines: [] }
  const lines = shown.lab_results.map(row => {
    const prev = latest && baseline ? baseline.lab_results.find(b => sameAnalyte(b, row)) : undefined
    const before = prev && prev.value != null && unitKey(prev.unit) === unitKey(row.unit) ? { sampled_on: baseline!.sampled_on, value: prev.value } : null
    return { row, status: rangeStatus(row), before }
  })
  return { baseline, latest, lines }
}

const signed = (n: number) => `${n >= 0 ? '+' : '-'}${Math.abs(n).toFixed(2)} kg`

/** Questions built from what was recorded. Worded as questions for the vet, never as findings. */
export function courseQuestions({ course, window: w, weight, off, missed, labs }: {
  course: TreatmentCourse; window: CourseWindow; weight: WeightSummary; off: ReturnType<typeof offDaysIn>; missed: Missed[]; labs: LabSummary
}): string[] {
  const q: string[] = []
  q.push(`How is the response to ${course.name} at day ${w.day}${w.of ? ` of ${w.of}` : ''}?`)
  if (w.of) q.push(`What is the plan after day ${w.of}: stop, extend or change the dose?`)
  if (weight.change != null && weight.start && weight.last) {
    q.push(`Weight went from ${weight.start.kg.toFixed(2)} kg to ${weight.last.kg.toFixed(2)} kg (${signed(weight.change)}) since the course started. Is this what you expect?`)
    if (weight.pct != null && Math.abs(weight.pct) >= DOSE_CHANGE_PCT) q.push(`Does the dose need to change for the current weight of ${weight.last.kg.toFixed(2)} kg?`)
  }
  if (off.byKind.length) q.push(`Off days during the course: ${off.byKind.map(([k, n]) => `${OFF_META[k].label.toLowerCase()} ${n}`).join(', ')}. Is any of this a concern?`)
  if (missed.length) q.push(`${missed.length} dose${missed.length === 1 ? ' was' : 's were'} missed (${[...new Set(missed.map(m => short(dayOf(m.logged_at))))].join(', ')}). Does this change the plan?`)
  if (labs.latest) {
    const out = labs.lines.filter(l => isOutside(l.status)).slice(0, MAX_LAB_QUESTIONS)
    for (const l of out) q.push(`${l.row.analyte} was ${l.status} on ${short(labs.latest.sampled_on)} (${l.row.value ?? l.row.value_text}${l.row.unit ? ` ${l.row.unit}` : ''}). What does this mean for the course?`)
  }
  q.push(labs.latest ? 'When should the bloodwork be repeated?' : 'Which bloodwork should be done now to compare with the start?')
  return q
}
