import { beforeEach, describe, expect, it, vi } from 'vitest'

const store = new Map<string, unknown>()
vi.mock('idb-keyval', () => ({ get: async (k: string) => store.get(k), set: async (k: string, v: unknown) => { store.set(k, v) } }))
const insert = vi.fn()
vi.mock('../lib/supabase', () => ({ untypedDb: { from: () => ({ insert }) } }))

import { enqueue, flushQueue, readQueue } from '../lib/offlineQueue'

describe('offline queue', () => {
  beforeEach(() => { store.clear(); insert.mockReset() })

  it('never stores the same client_event_id twice', async () => {
    const item = { id: 'evt-1', table: 'weight_logs', row: { client_event_id: 'evt-1' }, queuedAt: 'now' }
    await enqueue(item); await enqueue(item)
    expect(await readQueue()).toHaveLength(1)
  })

  it('treats a duplicate-key response as synced', async () => {
    await enqueue({ id: 'evt-2', table: 'weight_logs', row: { client_event_id: 'evt-2' }, queuedAt: 'now' })
    insert.mockResolvedValueOnce({ error: { code: '23505', message: 'duplicate key' } })
    const r = await flushQueue()
    expect(r.sent).toBe(1)
    expect(await readQueue()).toHaveLength(0)
  })

  it('keeps items when still offline, drops items the server rejects', async () => {
    await enqueue({ id: 'a', table: 'weight_logs', row: {}, queuedAt: 'now' })
    await enqueue({ id: 'b', table: 'weight_logs', row: {}, queuedAt: 'now' })
    insert.mockResolvedValueOnce({ error: { code: '', message: 'TypeError: Failed to fetch' } })
    insert.mockResolvedValueOnce({ error: { code: '42501', message: 'row-level security' } })
    const r = await flushQueue()
    expect(r).toEqual({ sent: 0, failed: 1 })
    expect((await readQueue()).map(x => x.id)).toEqual(['a'])
  })
})
