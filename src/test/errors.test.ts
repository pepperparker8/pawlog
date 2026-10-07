import { describe, expect, it } from 'vitest'
import { friendlyError } from '../lib/errors'

describe('friendlyError', () => {
  it('explains RLS denials without leaking internals', () => {
    const m = friendlyError({ code: '42501', message: 'new row violates row-level security policy for table "cats"' })
    expect(m.toLowerCase()).toContain('permission')
    expect(m).not.toContain('row-level')
  })
  it('treats duplicates as already saved', () => {
    expect(friendlyError({ code: '23505', message: 'duplicate key' }).toLowerCase()).toContain('already')
  })
  it('falls back to message or generic text', () => {
    expect(friendlyError(new Error('boom'))).toBe('boom')
    expect(friendlyError(undefined)).toBeTruthy()
  })
})
