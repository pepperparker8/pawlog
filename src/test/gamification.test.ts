import { describe, expect, it } from 'vitest'
import { levelProgress } from '../features/gamification/api'

const levels = [
  { level: 1, min_xp: 0, title: 'New Pawrent', perk: null },
  { level: 2, min_xp: 100, title: 'Kitten Keeper', perk: null },
  { level: 3, min_xp: 300, title: 'Cat Companion', perk: null },
]

describe('levelProgress', () => {
  it('starts at level 1 with 0 xp', () => {
    const p = levelProgress(0, levels)
    expect(p.current.level).toBe(1); expect(p.next?.level).toBe(2); expect(p.into).toBe(0); expect(p.span).toBe(100)
  })
  it('picks the highest level whose threshold is met', () => {
    const p = levelProgress(150, levels)
    expect(p.current.level).toBe(2); expect(p.into).toBe(50); expect(p.span).toBe(200)
  })
  it('caps at max level', () => {
    const p = levelProgress(9999, levels)
    expect(p.current.level).toBe(3); expect(p.next).toBeUndefined(); expect(p.span).toBe(1)
  })
  it('is order independent', () => {
    expect(levelProgress(150, [...levels].reverse()).current.level).toBe(2)
  })
})
