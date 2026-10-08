import { describe, expect, it } from 'vitest'
import { weightInsights } from './insights'

const now = new Date('2026-10-08T12:00:00Z')
const p = (d: string, kg: number) => ({ logged_at: `${d}T08:00:00Z`, weight_kg: kg })

describe('weightInsights', () => {
  it('returns nothing without data', () => {
    expect(weightInsights([], now)).toEqual([])
  })

  it('counts recent weigh-ins and reports a 30+ day change', () => {
    const r = weightInsights([p('2026-08-01', 4.0), p('2026-09-01', 4.1), p('2026-10-05', 4.3)], now)
    expect(r.find(i => i.code === 'count')?.text).toBe('3 weigh-ins recorded in the last 90 days.')
    expect(r.find(i => i.code === 'change')?.text).toBe('+0.20 kg between weigh-ins 34 days apart.')
    expect(r.some(i => i.code === 'gap')).toBe(false)
  })

  it('notes steady weights and long gaps', () => {
    const r = weightInsights([p('2026-06-01', 4.0), p('2026-06-15', 4.05), p('2026-07-01', 4.1)], now)
    expect(r.find(i => i.code === 'steady')).toBeTruthy()
    expect(r.find(i => i.code === 'gap')?.text).toBe('Last weigh-in was 99 days ago.')
    expect(r.find(i => i.code === 'count')?.text).toBe('0 weigh-ins recorded in the last 90 days.')
  })

  it('never uses judgement words', () => {
    const r = weightInsights([p('2026-08-01', 6), p('2026-10-01', 4)], now)
    for (const i of r) expect(i.text).not.toMatch(/healthy|unhealthy|obese|sick|diagnos|good|bad/i)
  })
})
