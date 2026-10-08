import { describe, expect, it } from 'vitest'
import { audienceMatches, catTriggers, pickTips, type CareTip, type CatProfile } from './engine'

const now = new Date('2026-10-08T10:00:00Z')
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString()
const summary = { cat_id: 'c1', last_weight_at: daysAgo(3), last_grooming_at: daysAgo(2), next_vaccine_due: null, next_parasite_due: null }
const profile: CatProfile = { catId: 'c1', lifeStage: 'adult', coat: 'short', sex: 'female', neutered: true, breedCode: 'british-shorthair' }
const tip = (p: Partial<CareTip>): CareTip => ({
  code: 'x', kind: 'tip', topic: 'care', icon: null, title: 't', body: 'b', audience: {}, trigger: null, source: 's', source_url: 'https://x', reviewed: '2026-10-08', ...p,
})

describe('catTriggers', () => {
  it('is quiet for a well-logged cat', () => {
    expect([...catTriggers({ summary, now })]).toEqual([])
  })
  it('flags log gaps and upcoming care', () => {
    const t = catTriggers({ summary: { ...summary, last_weight_at: null, last_grooming_at: daysAgo(20), next_vaccine_due: daysAgo(-5) }, now })
    expect(t).toEqual(new Set(['no_weight_30d', 'no_grooming_14d', 'vaccine_due']))
  })
  it('takes only this cat’s patterns', () => {
    const t = catTriggers({ summary, now, patterns: [{ cat_id: 'c1', code: 'appetite_drop' }, { cat_id: 'c2', code: 'weight_drop' }, { cat_id: 'c1', code: 'unknown' }] })
    expect(t).toEqual(new Set(['appetite_drop']))
  })
  it('separates BCS-based and range-based weight states', () => {
    expect(catTriggers({ summary, now, weight: { status: 'OVERWEIGHT', basis: 'vet_bcs' } })).toEqual(new Set(['bcs_high']))
    expect(catTriggers({ summary, now, weight: { status: 'OVERWEIGHT', basis: 'breed_reference' } })).toEqual(new Set(['overweight']))
    expect(catTriggers({ summary, now, weight: { status: 'GROWING', basis: 'age' } })).toEqual(new Set(['growing']))
  })
  it('marks a new cat for two weeks', () => {
    expect(catTriggers({ summary, now, createdAt: daysAgo(5) }).has('new_cat')).toBe(true)
    expect(catTriggers({ summary, now, createdAt: daysAgo(30) }).has('new_cat')).toBe(false)
  })
})

describe('audienceMatches', () => {
  it('matches empty audiences', () => expect(audienceMatches({}, profile)).toBe(true))
  it('requires every set key', () => {
    expect(audienceMatches({ life_stage: ['adult'], coat: ['short'] }, profile)).toBe(true)
    expect(audienceMatches({ coat: ['long'] }, profile)).toBe(false)
    expect(audienceMatches({ sex: 'male' }, profile)).toBe(false)
    expect(audienceMatches({ breeds: ['ragdoll'] }, profile)).toBe(false)
  })
  it('does not guess unknown details', () => {
    expect(audienceMatches({ neutered: true }, { ...profile, neutered: null })).toBe(false)
    expect(audienceMatches({ coat: ['short'] }, { ...profile, coat: null })).toBe(false)
  })
})

describe('pickTips', () => {
  const all = [
    tip({ code: 'h-weigh', kind: 'hint', trigger: 'no_weight_30d' }),
    tip({ code: 'h-appetite', kind: 'hint', trigger: 'appetite_drop' }),
    tip({ code: 'h-appetite-2', kind: 'hint', trigger: 'appetite_drop' }),
    tip({ code: 'h-groom', kind: 'hint', trigger: 'no_grooming_14d' }),
    tip({ code: 'f1', kind: 'fact' }), tip({ code: 'f2', kind: 'fact' }), tip({ code: 'f3', kind: 'fact', audience: { coat: ['long'] } }),
    tip({ code: 'bsh', kind: 'fact', audience: { breeds: ['british-shorthair'] } }),
    tip({ code: 't1' }),
  ]
  it('orders hints by priority, one per trigger, capped', () => {
    const r = pickTips(all, profile, new Set(['no_weight_30d', 'appetite_drop', 'no_grooming_14d']), { now })
    expect(r.hints.map(h => h.code)).toEqual(['h-appetite', 'h-weigh'])
  })
  it('keeps breed insight apart from facts and filters by audience', () => {
    const r = pickTips(all, profile, new Set(), { now })
    expect(r.breedInsight?.code).toBe('bsh')
    expect(['f1', 'f2']).toContain(r.fact?.code)
    expect(r.factCount).toBe(2)
    expect(r.tip?.code).toBe('t1')
  })
  it('is stable within a day and advances with the offset', () => {
    const a = pickTips(all, profile, new Set(), { now }).fact
    expect(pickTips(all, profile, new Set(), { now }).fact).toEqual(a)
    expect(pickTips(all, profile, new Set(), { now, factOffset: 1 }).fact?.code).not.toBe(a?.code)
  })
  it('skips dismissed tips', () => {
    const r = pickTips(all, profile, new Set(['appetite_drop']), { now, dismissed: new Set(['h-appetite']) })
    expect(r.hints.map(h => h.code)).toEqual(['h-appetite-2'])
  })
})
