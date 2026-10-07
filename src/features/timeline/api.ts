import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { keys } from '../../lib/queryClient'
import type { HouseholdToday, Pattern, TimelineEvent, TimelineKind } from '../../lib/types'

export interface TimelineFilters { catId?: string; kinds?: TimelineKind[]; from?: string; to?: string }
const PAGE = 40

export function useTimeline(hid: string, filters: TimelineFilters = {}) {
  return useInfiniteQuery({
    queryKey: keys.timeline(hid, filters),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      let q = supabase.from('timeline_events').select('*').eq('household_id', hid)
        .order('occurred_at', { ascending: false }).range(pageParam, pageParam + PAGE - 1)
      if (filters.catId) q = q.eq('cat_id', filters.catId)
      if (filters.kinds?.length) q = q.in('kind', filters.kinds)
      if (filters.from) q = q.gte('occurred_at', filters.from)
      if (filters.to) q = q.lte('occurred_at', filters.to)
      const { data, error } = await q
      if (error) throw error
      return data as TimelineEvent[]
    },
    getNextPageParam: (last, all) => (last.length < PAGE ? undefined : all.length * PAGE),
  })
}

export function useHouseholdToday(hid: string) {
  return useQuery({
    queryKey: keys.today(hid),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('household_today', { p_household: hid })
      if (error) throw error
      return data as unknown as HouseholdToday
    },
  })
}

export function usePatterns(hid: string) {
  return useQuery({
    queryKey: keys.patterns(hid),
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('detect_patterns', { p_household: hid })
      if (error) throw error
      return data as Pattern[]
    },
  })
}

export function useOnThisDay(hid: string) {
  return useQuery({
    queryKey: keys.onThisDay(hid),
    staleTime: 60 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('on_this_day', { p_household: hid })
      if (error) throw error
      return data as TimelineEvent[]
    },
  })
}

export const KIND_META: Record<TimelineKind, { emoji: string; label: string }> = {
  weight: { emoji: '⚖️', label: 'Weight' }, feeding: { emoji: '🍽️', label: 'Feeding' }, water: { emoji: '💧', label: 'Water' },
  litter: { emoji: '🧹', label: 'Litter' }, symptom: { emoji: '🩺', label: 'Symptom' }, medication: { emoji: '💊', label: 'Medication' },
  grooming: { emoji: '🧼', label: 'Grooming' }, behavior: { emoji: '🐈', label: 'Behavior' }, activity: { emoji: '🧶', label: 'Play' },
  journal: { emoji: '📓', label: 'Journal' }, photo: { emoji: '📷', label: 'Photo' }, vet_visit: { emoji: '🏥', label: 'Vet visit' },
  vaccination: { emoji: '💉', label: 'Vaccination' }, parasite: { emoji: '🛡️', label: 'Parasite' }, care_task: { emoji: '✅', label: 'Care task' },
  milestone: { emoji: '🏆', label: 'Milestone' },
}
