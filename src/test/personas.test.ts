import { describe, expect, it } from 'vitest'
import { getWeightStatus, statusView, type WeightPoint } from '../features/weight/status'
import { catTriggers } from '../features/tips/engine'
import { attention, byAttention } from '../features/dashboard/attention'

/** Household scenarios A to G, checked against the client-side rules that drive what each owner sees. */

const now = new Date()
const DAY = 86_400_000
const ago = (d: number) => new Date(now.getTime() - d * DAY).toISOString()
const at = (d: number, kg: number, extra: Partial<WeightPoint> = {}): WeightPoint => ({ logged_at: ago(d), weight_kg: kg, ...extra })
const refs = [{ sex: 'any' as const, min_kg: 3.6, max_kg: 5.4, source: 'Breed profile', source_url: 'https://example.org' }]
const CELEBRATORY = /nicely|great|well done|keep it up|goal/i

const cat = (name: string, extra: Partial<{ next_task_due: string | null; next_vaccine_due: string | null; next_parasite_due: string | null; symptoms_7d: number }> = {}) =>
  ({ name, next_task_due: null, next_vaccine_due: null, next_parasite_due: null, symptoms_7d: 0, ...extra })

describe('A: one kitten, tracking growth', () => {
  it('a gaining kitten is growing nicely and never judged against the adult range', () => {
    const r = getWeightStatus({ dateOfBirth: ago(120), sex: 'female', weights: [at(28, 1.1), at(14, 1.4), at(0, 1.7)], breedRefs: refs, now })
    expect(r.status).toBe('GROWING')
    expect(statusView(r)).toMatchObject({ label: 'Growing nicely', emoji: '🌱', tone: 'ok' })
  })
})

describe('B: two adults, simple health records', () => {
  it('both cats are on track when nothing is overdue', () => {
    expect([cat('Bella'), cat('Max')].map(attention)).toEqual([0, 0])
  })
})

describe('C and D: five and ten cats', () => {
  it('cats needing attention come first, the rest stay in name order', () => {
    const cats = [cat('Oreo'), cat('Luna', { symptoms_7d: 2 }), cat('Gipi'), cat('Simba', { next_task_due: ago(3).slice(0, 10) }), cat('Milo')]
    expect(byAttention(cats).map(c => c.name)).toEqual(['Simba', 'Luna', 'Gipi', 'Milo', 'Oreo'])
  })
  it('ten cats sort without losing anyone', () => {
    const ten = Array.from({ length: 10 }, (_, i) => cat(`Cat ${String(i).padStart(2, '0')}`, i % 4 === 0 ? { symptoms_7d: 1 } : {}))
    expect(byAttention(ten)).toHaveLength(10)
    expect(byAttention(ten).slice(0, 3).every(c => c.symptoms_7d > 0)).toBe(true)
  })
})

describe('E: healthy adult weight, encourage maintenance', () => {
  it('a gain inside the range still reads as maintenance, not growth', () => {
    const r = getWeightStatus({ dateOfBirth: ago(365 * 4), sex: 'male', weights: [at(30, 4.4), at(0, 4.7)], breedRefs: refs, now,
      targets: [{ source: 'vet', min_kg: 4.2, max_kg: 4.9, target_kg: null, set_on: ago(60).slice(0, 10) }] })
    expect(r.status).toBe('HEALTHY_MAINTENANCE')
    expect(statusView(r).label).toBe('Steady is good')
    expect(catTriggers({ summary: { cat_id: 'e', last_weight_at: ago(0), last_grooming_at: ago(1), next_vaccine_due: null, next_parasite_due: null }, weight: r, now }).has('growing')).toBe(false)
  })
})

describe('F: overweight cat, no gamified gain', () => {
  it('above the target is flagged calmly and further gain is never praised', () => {
    const r = getWeightStatus({ dateOfBirth: ago(365 * 6), sex: 'female', weights: [at(30, 6.0), at(0, 6.3)], breedRefs: refs, now,
      targets: [{ source: 'vet', min_kg: 4.5, max_kg: 5.2, target_kg: null, set_on: ago(60).slice(0, 10) }] })
    expect(r.status).toBe('OVERWEIGHT')
    const v = statusView(r)
    expect(v.tone).toBe('warn')
    expect(v.label).not.toMatch(CELEBRATORY)
    expect(r.reason).not.toMatch(CELEBRATORY)
  })
  it('gradual loss toward the target does not raise an alarm', () => {
    const r = getWeightStatus({ dateOfBirth: ago(365 * 6), sex: 'female', weights: [at(60, 6.3), at(0, 6.1)], breedRefs: refs, now })
    expect(r.attention).toBeNull()
  })
})

describe('G: recurring symptoms, pattern without diagnosis', () => {
  it('a repeated symptom pattern becomes a hint trigger for that cat only', () => {
    const summary = { cat_id: 'g', last_weight_at: ago(2), last_grooming_at: ago(2), next_vaccine_due: null, next_parasite_due: null }
    const t = catTriggers({ summary, patterns: [{ cat_id: 'g', code: 'symptom_repeat' }, { cat_id: 'other', code: 'appetite_drop' }], now })
    expect([...t]).toEqual(['symptom_repeat'])
  })
  it('symptoms move the cat to the watch group, not the overdue group', () => {
    expect(attention(cat('Luna', { symptoms_7d: 4 }))).toBe(1)
  })
})
