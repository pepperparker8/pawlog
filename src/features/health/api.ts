import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase, untypedDb } from '../../lib/supabase'
import { invalidateHousehold, keys, queryClient } from '../../lib/queryClient'
import { startOfDay } from 'date-fns'
import { todayInput } from '../../lib/format'
import { submitLog } from '../logs/api'
import type { CatCondition, CatMedication, Milestone, ParasiteTreatment, TreatmentCourse, VaccinationRecord, VetVisit, WeightLog, WeightWeekly } from '../../lib/types'

export function useCatHealth(catId: string) {
  return useQuery({
    queryKey: keys.health(catId),
    queryFn: async () => {
      const [meds, conds, visits, vacc, para, crs] = await Promise.all([
        supabase.from('cat_medications').select('*').eq('cat_id', catId).order('active', { ascending: false }).order('start_on', { ascending: false }),
        supabase.from('cat_conditions').select('*').eq('cat_id', catId).order('noted_on', { ascending: false }),
        supabase.from('vet_visits').select('*').eq('cat_id', catId).order('visited_on', { ascending: false }),
        supabase.from('vaccination_records').select('*').eq('cat_id', catId).order('given_on', { ascending: false }),
        supabase.from('parasite_treatments').select('*').eq('cat_id', catId).order('given_on', { ascending: false }),
        supabase.from('treatment_courses').select('*').eq('cat_id', catId).order('started_on', { ascending: false }),
      ])
      for (const r of [meds, conds, visits, vacc, para, crs]) if (r.error) throw r.error
      return {
        medications: meds.data as CatMedication[], conditions: conds.data as CatCondition[], visits: visits.data as VetVisit[],
        vaccinations: vacc.data as VaccinationRecord[], parasites: para.data as ParasiteTreatment[], courses: crs.data as TreatmentCourse[],
      }
    },
  })
}

export function useWeights(catId: string) {
  return useQuery({
    queryKey: keys.weights(catId),
    queryFn: async () => {
      const { data, error } = await untypedDb.from('weight_logs').select('id, cat_id, logged_at, weight_kg, body_condition_score, body_condition_source, note')
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
      const { data, error } = await supabase.from('milestones').select('*').eq('cat_id', catId).is('archived_at', null).order('reached_at', { ascending: false })
      if (error) throw error
      return data as Milestone[]
    },
  })
}

type Table = 'cat_medications' | 'cat_conditions' | 'treatment_courses' | 'vet_visits' | 'vaccination_records' | 'parasite_treatments'
export function useSaveHealthRow(table: Table, hid: string, catId: string) {
  return useMutation({
    mutationFn: async ({ id, ...row }: Record<string, unknown> & { id?: string }) => {
      const clean = Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v === '' ? null : v]))
      const q = id
        ? untypedDb.from(table).update(clean).eq('id', id)
        : untypedDb.from(table).insert({ ...clean, household_id: hid, cat_id: catId, client_event_id: crypto.randomUUID() })
      const { error } = await q
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.health(catId) })
      void queryClient.invalidateQueries({ queryKey: keys.catSummaries(hid) })
      void queryClient.invalidateQueries({ queryKey: keys.trends(catId) })
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
      void queryClient.invalidateQueries({ queryKey: keys.trends(catId) })
    },
  })
}

export interface MedToday extends CatMedication { given_today: number; missed_today: number }

/** Active medication courses running today, with the doses logged and marked missed today. */
export function useMedsToday(hid: string) {
  return useQuery({
    queryKey: ['meds-today', hid],
    queryFn: async () => {
      const today = todayInput()
      const [meds, logs] = await Promise.all([
        supabase.from('cat_medications').select('*').eq('household_id', hid).eq('active', true),
        supabase.from('medication_logs').select('cat_medication_id, skipped').eq('household_id', hid)
          .not('cat_medication_id', 'is', null).gte('logged_at', startOfDay(new Date()).toISOString()),
      ])
      if (meds.error) throw meds.error
      if (logs.error) throw logs.error
      const given = new Map<string, number>(), missed = new Map<string, number>()
      for (const l of logs.data) {
        const m = l.skipped ? missed : given
        m.set(l.cat_medication_id!, (m.get(l.cat_medication_id!) ?? 0) + 1)
      }
      return (meds.data as CatMedication[])
        .filter(m => (!m.start_on || m.start_on <= today) && (!m.end_on || m.end_on >= today))
        .map(m => ({ ...m, given_today: given.get(m.id) ?? 0, missed_today: missed.get(m.id) ?? 0 }))
    },
  })
}

function doseLog(hid: string, m: CatMedication, skipped: boolean) {
  return submitLog({
    table: 'medication_logs', householdId: hid, catIds: [m.cat_id],
    fields: { logged_at: new Date().toISOString(), cat_medication_id: m.id, medication_name: m.name, dose: m.dose, skipped },
  })
}

/** Logs one dose against a medication course so schedule checks can count it. */
export function useGiveDose(hid: string) {
  return useMutation({ mutationFn: (m: CatMedication) => doseLog(hid, m, false), onSuccess: () => invalidateHousehold(hid) })
}

/** Doses are assumed given; only a missed one is recorded. */
export function useMissDose(hid: string) {
  return useMutation({ mutationFn: (m: CatMedication) => doseLog(hid, m, true), onSuccess: () => invalidateHousehold(hid) })
}
