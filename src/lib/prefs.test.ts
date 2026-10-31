import { describe, expect, it } from 'vitest'
import { readXpEnabled, setXpEnabled } from './prefs'

describe('XP preference', () => {
  it('is off by default and follows the toggle', () => {
    expect(readXpEnabled()).toBe(false)
    setXpEnabled(true)
    expect(readXpEnabled()).toBe(true)
    setXpEnabled(false)
    expect(readXpEnabled()).toBe(false)
  })
})
