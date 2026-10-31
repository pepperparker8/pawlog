import { describe, expect, it } from 'vitest'
import type { TreatmentCourse } from '../../lib/types'
import { offDays } from '../trends/classify'
import { weekSummary } from './weekly'

const today = '2026-10-31'
const kg = (day: string, n: number) => ({ logged_at: `${day}T08:00:00`, weight_kg: n })
const course: TreatmentCourse = {
  id: 'c1', cat_id: 'x', condition_id: null, name: 'Antiviral', started_on: '2026-10-19', planned_days: 84,
  review_on: null, status: 'active', ended_on: null, note: null,
}
const empty = { weights: [], days: [], missed: [], courses: [], today }

describe('weekSummary', () => {
  it('covers today and the six days before it', () => {
    expect(weekSummary(empty)).toMatchObject({ from: '2026-10-25', to: today, weight: null, offDays: 0, missed: 0, courses: [] })
  })

  it('compares the last weigh-in this week with the last one before the week', () => {
    const s = weekSummary({ ...empty, weights: [kg('2026-10-20', 3.2), kg('2026-10-24', 3.3), kg('2026-10-28', 3.4), kg('2026-10-30', 3.5)] })
    expect(s.weight).toMatchObject({ kg: 3.5, day: '2026-10-30' })
    expect(s.weight?.change).toBeCloseTo(0.2)
  })

  it('uses the first weigh-in of the week when there is none before it', () => {
    const s = weekSummary({ ...empty, weights: [kg('2026-10-26', 3.0), kg('2026-10-30', 2.9)] })
    expect(s.weight?.change).toBeCloseTo(-0.1)
  })

  it('has no change for a single weigh-in and no weight when nothing was weighed this week', () => {
    expect(weekSummary({ ...empty, weights: [kg('2026-10-30', 3.0)] }).weight).toMatchObject({ kg: 3, change: null })
    const s = weekSummary({ ...empty, weights: [kg('2026-10-10', 3.0)] })
    expect(s.weight).toBeNull()
    expect(s.lastWeighed).toBe('2026-10-10')
  })

  it('counts off days and missed doses inside the week only', () => {
    const days = offDays({ checkins: ['2026-10-20', '2026-10-27', '2026-10-30'].map(day => ({ day, eating: 'less' as const, litter: 'usual' as const, vomiting: day === '2026-10-30', energy: 'usual' as const })) })
    const missed = [{ logged_at: '2026-10-24T08:00:00', medication_name: 'A' }, { logged_at: '2026-10-29T08:00:00', medication_name: 'A' }]
    const s = weekSummary({ ...empty, days, missed })
    expect(s.offDays).toBe(2)
    expect(s.byKind).toEqual([['vomiting', 1], ['appetite', 2]])
    expect(s.missed).toBe(1)
  })

  it('lists active courses with their day', () => {
    const s = weekSummary({ ...empty, courses: [course, { ...course, id: 'c2', status: 'completed', ended_on: '2026-10-25' }] })
    expect(s.courses).toEqual([{ id: 'c1', name: 'Antiviral', day: 13, of: 84 }])
  })
})
