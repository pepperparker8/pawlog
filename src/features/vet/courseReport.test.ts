import { describe, expect, it } from 'vitest'
import type { LabReport, LabRow, TreatmentCourse } from '../../lib/types'
import { offDays } from '../trends/classify'
import { courseQuestions, courseWindow, labSummary, missedIn, offDaysIn, weightSummary } from './courseReport'

const course: TreatmentCourse = {
  id: 'c1', cat_id: 'x', condition_id: null, name: 'Antiviral', started_on: '2026-10-19', planned_days: 84,
  review_on: '2026-11-29', status: 'active', ended_on: null, note: null,
}
const w = courseWindow(course, '2026-10-31')
const kg = (day: string, n: number) => ({ logged_at: `${day}T08:00:00`, weight_kg: n })
const row = (analyte: string, value: number, ref_low: number | null, ref_high: number | null, unit = 'g/dL'): LabRow =>
  ({ analyte, analyte_key: null, value, value_text: null, unit, ref_low, ref_high, ref_text: null, printed_flag: null, about: null }) as unknown as LabRow
const report = (id: string, sampled_on: string, rows: LabRow[]) =>
  ({ id, sampled_on, created_at: `${sampled_on}T10:00:00Z`, lab_name: null, lab_results: rows }) as unknown as LabReport

describe('courseWindow', () => {
  it('counts day 1 as the start date and runs to today while active', () => {
    expect(w).toMatchObject({ start: '2026-10-19', end: '2026-10-31', day: 13, of: 84 })
  })

  it('stops at the end date of a finished course', () => {
    expect(courseWindow({ ...course, status: 'completed', ended_on: '2026-10-25' }, '2026-10-31')).toMatchObject({ end: '2026-10-25', day: 7 })
  })
})

describe('weightSummary', () => {
  it('starts from the last weigh-in before day 1', () => {
    const s = weightSummary([kg('2026-10-01', 3.0), kg('2026-10-16', 3.1), kg('2026-10-30', 3.4)], w)
    expect(s.start).toEqual({ day: '2026-10-16', kg: 3.1 })
    expect(s.last?.kg).toBe(3.4)
    expect(s.change).toBeCloseTo(0.3)
    expect(s.points).toHaveLength(2)
  })

  it('falls back to the first weigh-in after day 1', () => {
    const s = weightSummary([kg('2026-10-20', 3.0), kg('2026-10-28', 2.9)], w)
    expect(s.start?.day).toBe('2026-10-20')
    expect(s.change).toBeCloseTo(-0.1)
  })

  it('has no change with a single weigh-in', () => {
    expect(weightSummary([kg('2026-10-10', 3.0)], w).change).toBeNull()
  })
})

describe('offDaysIn and missedIn', () => {
  const days = offDays({ checkins: ['2026-10-10', '2026-10-20', '2026-10-21'].map(day => ({ day, eating: 'usual' as const, litter: 'usual' as const, vomiting: true, energy: day === '2026-10-21' ? 'low' as const : 'usual' as const })) })

  it('keeps only days inside the course', () => {
    const off = offDaysIn(days, w)
    expect(off.days.map(d => d.day)).toEqual(['2026-10-20', '2026-10-21'])
    expect(off.byKind).toEqual([['vomiting', 2], ['energy', 1]])
  })

  it('keeps only missed doses inside the course', () => {
    expect(missedIn([{ logged_at: '2026-10-18T08:00:00', medication_name: 'A' }, { logged_at: '2026-10-22T08:00:00', medication_name: 'A' }], w)).toHaveLength(1)
  })
})

describe('labSummary', () => {
  const before = report('a', '2026-10-16', [row('Albumin', 2.0, 2.5, 4.0), row('Globulin', 6.0, 2.5, 5.0)])
  const after = report('b', '2026-10-30', [row('Albumin', 2.6, 2.5, 4.0), row('Globulin', 5.5, 2.5, 5.0, 'mg/dL')])

  it('compares the newest report in the course with the one before it', () => {
    const s = labSummary([before, after], w)
    expect(s.baseline?.id).toBe('a')
    expect(s.latest?.id).toBe('b')
    expect(s.lines[0]).toMatchObject({ status: 'in', before: { value: 2.0 } })
  })

  it('does not compare results with different units', () => {
    expect(labSummary([before, after], w).lines[1].before).toBeNull()
  })

  it('shows the baseline alone when nothing was sampled during the course', () => {
    const s = labSummary([before], w)
    expect(s.latest).toBeNull()
    expect(s.lines.map(l => l.status)).toEqual(['low', 'high'])
  })
})

describe('courseQuestions', () => {
  const base = { course, window: w, off: { days: [], byKind: [] }, missed: [], labs: { baseline: null, latest: null, lines: [] } }

  it('always asks about the response, the plan and the bloodwork', () => {
    const q = courseQuestions({ ...base, weight: weightSummary([], w) })
    expect(q[0]).toContain('day 13 of 84')
    expect(q[1]).toContain('after day 84')
    expect(q.at(-1)).toContain('bloodwork')
  })

  it('asks about dosing when weight changed by 5% or more', () => {
    const q = courseQuestions({ ...base, weight: weightSummary([kg('2026-10-16', 3.0), kg('2026-10-30', 3.3)], w) })
    expect(q.some(s => s.includes('+0.30 kg'))).toBe(true)
    expect(q.some(s => s.startsWith('Does the dose need to change'))).toBe(true)
  })

  it('lists out-of-range results from the latest report', () => {
    const latest = report('b', '2026-10-30', [row('Globulin', 6.0, 2.5, 5.0)])
    const q = courseQuestions({ ...base, weight: weightSummary([], w), labs: labSummary([latest], w) })
    expect(q.some(s => s.startsWith('Globulin was high on 30 Oct'))).toBe(true)
  })

  it('asks no questions as findings and uses no emoji', () => {
    const q = courseQuestions({ ...base, weight: weightSummary([kg('2026-10-16', 3.0), kg('2026-10-30', 2.7)], w), missed: [{ logged_at: '2026-10-22T08:00:00', medication_name: 'A' }] })
    expect(q.every(s => s.endsWith('?'))).toBe(true)
    expect(/\p{Extended_Pictographic}/u.test(q.join(' '))).toBe(false)
  })
})
