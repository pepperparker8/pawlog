// Offline queue for Quick Log. Every entry carries client_event_id so a retry never double-logs.
import { get, set } from 'idb-keyval'
import { untypedDb } from './supabase'

export interface QueuedInsert {
  id: string                 // client_event_id
  table: string
  row: Record<string, unknown>
  queuedAt: string
}

const KEY = 'pawlog.queue.v1'
const listeners = new Set<() => void>()

export async function readQueue(): Promise<QueuedInsert[]> {
  return (await get<QueuedInsert[]>(KEY)) ?? []
}

async function writeQueue(q: QueuedInsert[]) {
  await set(KEY, q)
  listeners.forEach(l => l())
}

export function subscribeQueue(l: () => void) {
  listeners.add(l)
  return () => { listeners.delete(l) }
}

export async function enqueue(item: QueuedInsert) {
  const q = await readQueue()
  if (!q.some(x => x.id === item.id)) await writeQueue([...q, item])
}

let flushing = false
export async function flushQueue(): Promise<{ sent: number; failed: number }> {
  if (flushing) return { sent: 0, failed: 0 }
  flushing = true
  let sent = 0, failed = 0
  try {
    const q = await readQueue()
    const remaining: QueuedInsert[] = []
    for (const item of q) {
      const { error } = await untypedDb.from(item.table).insert(item.row)
      if (!error || error.code === '23505') sent++       // duplicate = already synced
      else if (error.message.includes('fetch')) remaining.push(item)   // still offline
      else { failed++; console.warn('queue item rejected', item, error) }
    }
    await writeQueue(remaining)
  } finally {
    flushing = false
  }
  return { sent, failed }
}

export function startQueueSync(onSynced?: (sent: number) => void) {
  const run = () => { if (navigator.onLine) void flushQueue().then(r => { if (r.sent > 0) onSynced?.(r.sent) }) }
  window.addEventListener('online', run)
  const t = window.setInterval(run, 30_000)
  run()
  return () => { window.removeEventListener('online', run); window.clearInterval(t) }
}
