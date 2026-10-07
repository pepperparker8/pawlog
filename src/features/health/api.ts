import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { keys, queryClient } from '../../lib/queryClient'
import type { CatCondition, CatMedication, Milestone, ParasiteTreatment, VaccinationRecord, VetVisit, WeightLog, WeightWeekly } from '../../lib/types'

export function useCatHealth(catId: string) {
  return useQuery({
    queryKey: keys.health(catId),
    queryFn: async () => {
      const [meds, conds, visits, vacc, para] = await Promise.all([
        supabase.from('cat_medications').select('*').eq('cat_id', catId).order('active', { ascending: false }).order('start_on', { ascending: false }),
        supabase.from('cat_conditions').select('*').eq('cat_id', catId).order('noted_on', { ascending: false }),
        supabase.from('vet_visits').select('*').eq('cat_id', catId).order('visited_on', { ascending: false }),
        supabase.from('vaccination_records').select('*').eq('cat_id', catId).order('given_on', { ascending: false }),
        supabase.from('parasite_treatments').select('*').eq('cat_id', catId).order('given_on', { ascending: false }),
      ])
      for (const r of [meds, conds, visits, vacc, para]) if (r.error) throw r.error
      return {
        medications: meds.data as CatMedication[], conditions: conds.data as CatCondition[], visits: visits.data as VetVisit[],
        vaccinations: vacc.data as VaccinationRecord[], parasites: para.data as ParasiteTreatment[],
      }
    },
  })
}

export function useWeights(catId: string) {
  return useQuery({
    queryKey: keys.weights(catId),
    queryFn: async () => {
      const { data, error } = await supabase.from('weight_logs').select('id, cat_id, logged_at, weight_kg, body_condition_score, note')
        .eq('cat_id', catId).order('logged_at').limit(400)
      if (error) throw error
      return data as WeightLog[]
    },
  })
}

export function useWeightWeekly(catId: string) {
  return useQuery({
    queryKey: keys.weightWeekly(catId),
    queryFn: async () => {
      const { data, error } = await supabase.from('weight_weekly').select('*').eq('cat_id', catId).order('week_start')
      if (error) throw error
      return data as WeightWeekly[]
    },
  })
}

export function useMilestones(catId: string) {
  return useQuery({
    queryKey: keys.milestones(catId),
    queryFn: async () => {
      const { data, error } = await supabase.from('milestones').select('*').eq('cat_id', catId).order('reached_at', { ascending: false })
      if (error) throw error
      return data as Milestone[]
    },
  })
}

type Table = 'cat_medications' | 'cat_conditions' | 'vet_visits' | 'vaccination_records' | 'parasite_treatments'
export function useSaveHealthRow(table: Table, hid: string, catId: string) {
  return useMutation({
    mutationFn: async ({ id, ...row }: Record<string, unknown> & { id?: string }) => {
      const clean = Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v === '' ? null : v]))
      const q = id
        ? supabase.from(table).update(clean).eq('id', id)
        : supabase.from(table).insert({ ...clean, household_id: hid, cat_id: catId, client_event_id: crypto.randomUUID() })
      const { error } = await q
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.health(catId) })
      void queryClient.invalidateQueries({ queryKey: keys.catSummaries(hid) })
      void queryClient.invalidateQueries({ queryKey: ['timeline', hid] })
    },
  })
}

export function useDeleteHealthRow(table: Table, hid: string, catId: string) {
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.health(catId) })
      void queryClient.invalidateQueries({ queryKey: keys.catSummaries(hid) })
    },
  })
}
