import { useMutation } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { invalidateHousehold } from '../../lib/queryClient'
import { enqueue } from '../../lib/offlineQueue'

export type LogTable =
  | 'weight_logs' | 'feeding_logs' | 'water_logs' | 'litter_logs' | 'symptom_logs' | 'medication_logs'
  | 'grooming_logs' | 'behavior_logs' | 'activity_logs' | 'journal_entries' | 'vet_visits'
  | 'vaccination_records' | 'parasite_treatments' | 'care_task_completions'

export interface LogRequest {
  table: LogTable
  householdId: string
  catIds: string[]              // one row per cat, each with its own client_event_id
  fields: Record<string, unknown>
}

export interface LogResult { table: LogTable; inserted: number; queued: number }

/**
 * Inserts one row per cat. Offline (or network failure) → queued in IndexedDB with the
 * same client_event_id so the retry can never award XP twice.
 */
export async function submitLog(req: LogRequest): Promise<LogResult> {
  let inserted = 0, queued = 0
  const rows = req.catIds.map(catId => ({
    ...req.fields,
    household_id: req.householdId,
    cat_id: catId,
    client_event_id: crypto.randomUUID(),
  }))
  if (!navigator.onLine) {
    for (const row of rows) await enqueue({ id: row.client_event_id, table: req.table, row, queuedAt: new Date().toISOString() })
    return { table: req.table, inserted: 0, queued: rows.length }
  }
  const { error } = await supabase.from(req.table).insert(rows)
  if (error) {
    if (error.message.includes('fetch')) {
      for (const row of rows) await enqueue({ id: row.client_event_id, table: req.table, row, queuedAt: new Date().toISOString() })
      queued = rows.length
    } else throw error
  } else inserted = rows.length
  return { table: req.table, inserted, queued }
}

export function useSubmitLog() {
  return useMutation({
    mutationFn: submitLog,
    onSuccess: (_r, req) => invalidateHousehold(req.householdId),
  })
}

export async function deleteLog(table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}

export const KIND_TO_TABLE: Record<string, string> = {
  weight: 'weight_logs', feeding: 'feeding_logs', water: 'water_logs', litter: 'litter_logs', symptom: 'symptom_logs',
  medication: 'medication_logs', grooming: 'grooming_logs', behavior: 'behavior_logs', activity: 'activity_logs',
  journal: 'journal_entries', photo: 'photos', vet_visit: 'vet_visits', vaccination: 'vaccination_records',
  parasite: 'parasite_treatments', care_task: 'care_task_completions',
}
