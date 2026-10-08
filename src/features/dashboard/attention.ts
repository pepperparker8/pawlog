import { dueLabel } from '../../lib/format'
import type { CatSummary } from '../../lib/types'

export type AttentionLevel = 0 | 1 | 2

/** 2 = something is overdue, 1 = symptoms noted this week, 0 = on track. */
export function attention(c: Pick<CatSummary, 'next_task_due' | 'next_vaccine_due' | 'next_parasite_due' | 'symptoms_7d'>): AttentionLevel {
  if ([c.next_task_due, c.next_vaccine_due, c.next_parasite_due].some(d => dueLabel(d).tone === 'overdue')) return 2
  return c.symptoms_7d > 0 ? 1 : 0
}

/** Cats needing attention first, then by name, so the order is stable. */
export function byAttention<T extends Parameters<typeof attention>[0] & { name: string }>(cats: T[]): T[] {
  return [...cats].sort((a, b) => attention(b) - attention(a) || a.name.localeCompare(b.name))
}
