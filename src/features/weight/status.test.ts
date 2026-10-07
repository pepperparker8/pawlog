import { describe, expect, it } from 'vitest'
import { getWeightStatus, statusView, stability, type WeightPoint } from './status'

const now = new Date('2026-10-07T12:00:00Z')
const at = (daysAgo: number, kg: number, extra: Partial<WeightPoint> = {}): WeightPoint =>
  ({ logged_at: new Date(now.getTime() - daysAgo * 86_400_000).toISOString(), weight_kg: kg, ...extra })
const refs = [{ sex: 'female' as const, min_kg: 3, max_kg: 4.5, source: 'Ref org', source_url: 'https://example.org' }]

describe('getWeightStatus', () => {
  it('kitten gaining is GROWING, never judged against the adult range', () => {
    const r = getWeightStatus({ dateOfBirth: '2026-05-10', sex: 'female', weights: [at(30, 1.0), at(0, 1.4)], breedRefs: refs, now })
    expect(r.status).toBe('GROWING')
    expect(r.lifeStage).toBe('kitten')
    expect(statusView(r).label).toBe('Growing nicely')
    expect(r.attention).toBeNull()
  })

  it('kitten losing weight raises a vet-discussion note without a diagnosis', () => {
    const r = getWeightStatus({ dateOfBirth: '2026-05-10', sex: 'female', weights: [at(20, 1.4), at(0, 1.3)], now })
    expect(r.status).toBe('GROWING')
    expect(r.attention).toMatch(/worth discussing with your veterinarian/)
  })

  it('adult inside the vet target is HEALTHY_MAINTENANCE with high confidence', () => {
    const r = getWeightStatus({ dateOfBirth: '2022-01-01', sex: 'female', weights: [at(0, 4)], breedRefs: refs, now,
      targets: [{ source: 'vet', min_kg: 3.8, max_kg: 4.2, target_kg: null, set_on: '2026-09-01' }] })
    expect(r.status).toBe('HEALTHY_MAINTENANCE')
    expect(r.confidence).toBe('high')
    expect(r.basis).toBe('vet_target')
  })

  it('vet target outranks owner target, which outranks the breed range', () => {
    const r = getWeightStatus({ dateOfBirth: '2022-01-01', sex: 'female', weights: [at(0, 4.4)], breedRefs: refs, now,
      targets: [{ source: 'owner', min_kg: 3, max_kg: 5, target_kg: null, set_on: '2026-01-01' }, { source: 'vet', min_kg: 3.5, max_kg: 4.0, target_kg: null, set_on: '2026-09-01' }] })
    expect(r.status).toBe('OVERWEIGHT')
    expect(r.source).toBe('Vet target')
  })

  it('recent vet body condition outranks targets', () => {
    const r = getWeightStatus({ dateOfBirth: '2020-01-01', sex: 'male', weights: [at(0, 6.5, { body_condition_score: 7, body_condition_source: 'vet' })], now,
      targets: [{ source: 'owner', min_kg: 5, max_kg: 7, target_kg: null, set_on: '2026-01-01' }] })
    expect(r.status).toBe('OVERWEIGHT')
    expect(r.basis).toBe('vet_bcs')
    expect(statusView(r).label).toBe('Above ideal body condition')
  })

  it('old body condition scores are ignored', () => {
    const r = getWeightStatus({ dateOfBirth: '2020-01-01', sex: 'male', weights: [at(400, 6.5, { body_condition_score: 7, body_condition_source: 'vet' }), at(0, 5)], now })
    expect(r.basis).not.toBe('vet_bcs')
  })

  it('breed reference alone gives low confidence and a sex-specific label', () => {
    const r = getWeightStatus({ dateOfBirth: '2021-01-01', sex: 'female', weights: [at(0, 2.7)], breedName: 'Test', breedRefs: refs, now })
    expect(r.status).toBe('UNDERWEIGHT')
    expect(r.confidence).toBe('low')
    expect(r.referenceRange?.label).toBe('Typical adult range, Test (female)')
  })

  it('no reference and no target is UNKNOWN and says so', () => {
    const r = getWeightStatus({ dateOfBirth: '2021-01-01', sex: 'male', weights: [at(20, 4.1), at(0, 4.2)], now })
    expect(r.status).toBe('UNKNOWN')
    expect(r.reason).toMatch(/Breed-specific reference unavailable/)
  })

  it('no weigh-ins is UNKNOWN', () => {
    expect(getWeightStatus({ dateOfBirth: null, sex: 'unknown', weights: [], now }).status).toBe('UNKNOWN')
  })

  it('adult losing 5% or more in two months raises a note', () => {
    const r = getWeightStatus({ dateOfBirth: '2018-01-01', sex: 'male', weights: [at(40, 5), at(0, 4.6)], now })
    expect(r.attention).toMatch(/8% lower/)
  })

  it('young adult of a slow-maturing breed is still growing, not a kitten', () => {
    const r = getWeightStatus({ dateOfBirth: '2024-10-01', sex: 'female', weights: [at(0, 4)], breedRefs: refs, breedName: 'British Shorthair', maturityMonths: 60, now })
    expect(r.lifeStage).toBe('adult')
    expect(r.status).toBe('GROWING')
    expect(r.reason).toMatch(/British Shorthair often keeps filling out until about 60 months/)
  })

  it('young adult above the breed range is not reported as growing', () => {
    const r = getWeightStatus({ dateOfBirth: '2024-10-01', sex: 'female', weights: [at(0, 5.2)], breedRefs: refs, breedName: 'British Shorthair', maturityMonths: 60, now })
    expect(r.status).toBe('OVERWEIGHT')
  })

  it('stability measures the spread over the window', () => {
    const s = stability([at(40, 4.8), at(25, 4.1), at(10, 4.2), at(0, 4.15)], 30)
    expect(s).toMatchObject({ min: 4.1, max: 4.2, count: 3 })
  })
})
