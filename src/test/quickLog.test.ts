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
  it('names a meal by its type when no product is chosen', () => {
    const r = buildFields('feeding', { food_type: 'wet', amount: '1' })
    expect(r).toMatchObject({ row: { food_id: null, food_name: 'Wet food', amount: 1, unit: 'pouch' } })
  })
  it('names a meal by the chosen product', () => {
    const r = buildFields('feeding', { food_type: 'supplement', food_id: 'f1', food_name: 'Salmon oil' })
    expect(r).toMatchObject({ row: { food_id: 'f1', food_name: 'Salmon oil', amount: null, unit: null } })
  })
})
