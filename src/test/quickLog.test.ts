import { describe, expect, it } from 'vitest'
import { buildFields } from '../features/logs/QuickLogSheet'

describe('buildFields', () => {
  it('rejects impossible weights', () => {
    expect(buildFields('weight', { weight_kg: '0' })).toHaveProperty('error')
    expect(buildFields('weight', { weight_kg: '75' })).toHaveProperty('error')
    expect(buildFields('weight', { weight_kg: '' })).toHaveProperty('error')
  })
  it('builds a weight row with iso timestamp', () => {
    const r = buildFields('weight', { weight_kg: '3.5', logged_at: '2026-10-07T08:30' })
    expect(r).toHaveProperty('row')
    if ('row' in r) { expect(r.row.weight_kg).toBe(3.5); expect(typeof r.row.logged_at).toBe('string'); expect(r.row.body_condition_score).toBeNull() }
  })
  it('requires a symptom name and defaults severity', () => {
    expect(buildFields('symptom', {})).toHaveProperty('error')
    const r = buildFields('symptom', { symptom: ' Sneezing ' })
    if ('row' in r) { expect(r.row.symptom).toBe('Sneezing'); expect(r.row.severity).toBe('mild') }
  })
  it('keeps feeding free text when no food profile chosen', () => {
    const r = buildFields('feeding', { food_name: 'Tuna', amount: '40', unit: 'g' })
    if ('row' in r) { expect(r.row.food_id).toBeNull(); expect(r.row.amount).toBe(40); expect(r.row.unit).toBe('g') }
  })
})
