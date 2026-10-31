import { describe, expect, it } from 'vitest'
import { checkinFlags, localDay, USUAL } from './api'

describe('checkinFlags', () => {
  it('is empty for a usual day', () => {
    expect(checkinFlags(USUAL)).toEqual([])
  })
  it('lists answers that differ from usual in form order', () => {
    expect(checkinFlags({ eating: 'none', litter: 'changed', vomiting: true, energy: 'low' }))
      .toEqual(['Not eating', 'Litter changed', 'Vomited', 'Low energy'])
    expect(checkinFlags({ ...USUAL, eating: 'less' })).toEqual(['Eating less'])
  })
})

describe('localDay', () => {
  it('uses the local calendar date', () => {
    expect(localDay(new Date(2026, 9, 31, 23, 30))).toBe('2026-10-31')
    expect(localDay(new Date(2026, 0, 1, 0, 5))).toBe('2026-01-01')
  })
})
