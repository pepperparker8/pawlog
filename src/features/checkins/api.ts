import { useMutation, useQuery } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import { supabase } from '../../lib/supabase'
import { invalidateHousehold, keys } from '../../lib/queryClient'
import type { CheckinTag, DailyCheckin } from '../../lib/types'

export const CHECKIN_TAGS: Record<CheckinTag, string> = {
  visitors: 'Visitors', travel: 'Travel', new_pet: 'New pet', vet_visit: 'Vet visit', routine_change: 'Routine change',
}

export type CheckinDraft = Pick<DailyCheckin, 'eating' | 'litter' | 'vomiting' | 'energy' | 'tags' | 'note'>
export const USUAL: CheckinDraft = { eating: 'usual', litter: 'usual', vomiting: false, energy: 'usual', tags: [], note: null }

export const localDay = (d = new Date()) => format(d, 'yyyy-MM-dd')

/** Answers that differ from the cat's usual day, in the order the form asks them. */
export function checkinFlags(c: Pick<DailyCheckin, 'eating' | 'litter' | 'vomiting' | 'energy'>): string[] {
  return [
    c.eating === 'less' ? 'Eating less' : c.eating === 'none' ? 'Not eating' : null,
    c.litter === 'changed' ? 'Litter changed' : null,
    c.vomiting ? 'Vomited' : null,
    c.energy === 'low' ? 'Low energy' : null,
  ].filter((x): x is string => x !== null)
}

/** Check-ins for the last `days` local days, newest first. */
export function useCheckins(hid: string, days = 7) {
  return useQuery({
    queryKey: keys.checkins(hid, days),
    queryFn: async () => {
      const { data, error } = await supabase.from('daily_checkins')
        .select('id, household_id, cat_id, day, checked_at, eating, litter, vomiting, energy, tags, note')
        .eq('household_id', hid).gte('day', localDay(subDays(new Date(), days - 1)))
        .order('day', { ascending: false })
      if (error) throw error
      return data as DailyCheckin[]
    },
  })
}

/**
 * One check-in per cat per local day; saving again replaces that day's answers.
 * Needs a connection: the offline queue only inserts, so a later edit of the same day would be dropped.
 */
export function useSaveCheckin(hid: string) {
  return useMutation({
    mutationFn: async ({ catIds, day, draft }: { catIds: string[]; day: string; draft: CheckinDraft }) => {
      if (!navigator.onLine) throw new Error('Check-ins need a connection')
      const checked_at = day === localDay() ? new Date().toISOString() : new Date(`${day}T21:00:00`).toISOString()
      const rows = catIds.map(cat_id => ({
        household_id: hid, cat_id, day, checked_at, ...draft, note: draft.note?.trim() || null,
      }))
      const { error } = await supabase.from('daily_checkins').upsert(rows, { onConflict: 'cat_id,day' })
      if (error) throw error
    },
    onSuccess: () => invalidateHousehold(hid),
  })
}
