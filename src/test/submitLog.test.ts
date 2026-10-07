import { beforeEach, describe, expect, it, vi } from 'vitest'

const insert = vi.fn(async (_rows: unknown) => ({ error: null }))
vi.mock('../lib/supabase', () => ({ supabase: { from: () => ({ insert }) } }))
vi.mock('../lib/offlineQueue', () => ({ enqueue: vi.fn(async () => {}) }))

import { submitLog } from '../features/logs/api'

describe('submitLog', () => {
  beforeEach(() => insert.mockClear())
  it('inserts one row per cat, each with its own client_event_id', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    const r = await submitLog({ table: 'feeding_logs', householdId: 'h1', catIds: ['c1', 'c2', 'c3'], fields: { amount: 40 } })
    expect(r.inserted).toBe(3)
    const rows = insert.mock.calls[0][0] as Array<Record<string, unknown>>
    expect(rows).toHaveLength(3)
    expect(new Set(rows.map(x => x.client_event_id)).size).toBe(3)
    expect(rows.every(x => x.household_id === 'h1' && x.amount === 40 as unknown)).toBe(true)
  })
})
