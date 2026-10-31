import { describe, expect, it } from 'vitest'
import { offDays } from './classify'
import { trendInsights } from './insights'

const now = new Date('2026-10-31T12:00:00')
const w = (day: string, kg: number) => ({ logged_at: `${day}T08:00:00`, weight_kg: kg })

describe('trendInsights', () => {
  it('flags a drop of 5% or more under the 30-day median', () => {
    const out = trendInsights({ weights: [w('2026-10-10', 4.0), w('2026-10-20', 4.0), w('2026-10-30', 3.7)], days: [], now })
    expect(out[0]).toMatchObject({ code: 'weight_drop', tone: 'act' })
    expect(out[0].source?.url).toContain('vcahospitals.com')
  })

  it('stays quiet for a small change', () => {
    const out = trendInsights({ weights: [w('2026-10-10', 4.0), w('2026-10-30', 3.95)], days: [], now })
    expect(out.find(i => i.code === 'weight_drop')).toBeUndefined()
    expect(out.find(i => i.code === 'weight_rate')).toBeUndefined()
  })

  it('flags loss faster than 2% per week', () => {
    const out = trendInsights({ weights: [w('2026-10-01', 4.0), w('2026-10-29', 3.6)], days: [], now })
    expect(out.find(i => i.code === 'weight_rate')?.tone).toBe('watch')
  })

  it('reports not eating and blood first', () => {
    const days = offDays({
      checkins: [{ day: '2026-10-30', eating: 'none', litter: 'usual', vomiting: false, energy: 'usual' }],
      litter: [{ logged_at: '2026-10-29T08:00:00', stool: 'blood', urine: null }],
    })
    const codes = trendInsights({ weights: [], days, now }).map(i => i.code)
    expect(codes.slice(0, 2).sort()).toEqual(['blood', 'not_eating'])
  })

  it('counts vomiting and diarrhoea days over 7 and 30 days', () => {
    const days = offDays({ checkins: ['2026-10-10', '2026-10-29', '2026-10-30'].map(day => ({ day, eating: 'usual' as const, litter: 'usual' as const, vomiting: true, energy: 'usual' as const })) })
    const v = trendInsights({ weights: [], days, now }).find(i => i.code === 'vomiting')
    expect(v?.text).toContain('2 of the last 7 days, 3 of the last 30')
    expect(v?.tone).toBe('watch')
  })

  it('summarises weight since a course started', () => {
    const out = trendInsights({ weights: [w('2026-10-15', 3.2), w('2026-10-30', 3.4)], days: [], course: { name: 'Antiviral', started_on: '2026-10-19' }, now })
    expect(out.find(i => i.code === 'course_weight')?.text).toContain('+0.20 kg')
  })

  it('uses no emoji', () => {
    const days = offDays({ checkins: [{ day: '2026-10-30', eating: 'less', litter: 'changed', vomiting: true, energy: 'low' }] })
    const text = trendInsights({ weights: [w('2026-10-01', 4), w('2026-10-30', 3.5)], days, missed: 2, now }).map(i => i.text).join(' ')
    expect(/\p{Extended_Pictographic}/u.test(text)).toBe(false)
  })
})
