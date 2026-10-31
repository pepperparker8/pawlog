import { describe, expect, it } from 'vitest'
import { AGE_CHOICES, ageAt, ageGroup, choiceFor, dateForAge, monthsAt } from './age'

const dob = '2025-06-10'

describe('photo age', () => {
  it('labels weeks, months and years', () => {
    expect(ageAt(dob, '2025-06-13')).toBe('3 d')
    expect(ageAt(dob, '2025-07-08')).toBe('4 wk')
    expect(ageAt(dob, '2025-10-10')).toBe('4 mo')
    expect(ageAt(dob, '2026-01-12T09:30:00Z')).toBe('7 mo')
    expect(ageAt(dob, '2027-03-01')).toBe('20 mo')
    expect(ageAt(dob, '2027-06-10')).toBe('2 y')
    expect(ageAt(dob, '2028-01-10', true)).toBe('~2 y 7 mo')
  })

  it('has no age before the birth date', () => {
    expect(monthsAt(dob, '2025-05-01')).toBeNull()
    expect(ageAt(dob, '2025-05-01')).toBeNull()
    expect(ageGroup(dob, '2025-05-01')).toBeNull()
  })

  it('groups by month in the first year, then by year', () => {
    expect(ageGroup(dob, '2025-06-20')).toEqual({ key: 0, label: 'First month' })
    expect(ageGroup(dob, '2025-07-15')).toEqual({ key: 1, label: '1 month' })
    expect(ageGroup(dob, '2025-10-10')).toEqual({ key: 4, label: '4 months' })
    expect(ageGroup(dob, '2026-08-01')).toEqual({ key: 12, label: '1 year' })
    expect(ageGroup(dob, '2028-01-01')).toEqual({ key: 24, label: '2 years' })
  })

  it('turns a chosen age into a date and back', () => {
    expect(dateForAge(dob, 4)).toBe('2025-10-10')
    expect(dateForAge(dob, 7)).toBe('2026-01-10')
    expect(choiceFor(dob, dateForAge(dob, 7))).toBe(7)
    expect(choiceFor(dob, '2028-01-10')).toBe(24)
    expect(AGE_CHOICES.some(c => c.months === choiceFor(dob, '2030-03-01'))).toBe(true)
  })
})
