import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase, untypedDb } from '../../lib/supabase'
import { keys, queryClient, invalidateHousehold } from '../../lib/queryClient'
import type { CareTask, FoodProfile } from '../../lib/types'

export function useCareTasks(hid: string) {
  return useQuery({
    queryKey: keys.careTasks(hid),
    queryFn: async () => {
      const { data, error } = await supabase.from('care_tasks').select('*').eq('household_id', hid).eq('active', true)
        .order('next_due_on', { ascending: true, nullsFirst: false })
      if (error) throw error
      return data as CareTask[]
    },
  })
}

export function useSaveCareTask(hid: string) {
  return useMutation({
    mutationFn: async ({ id, ...row }: Partial<CareTask> & { name: string }) => {
      const clean = Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v === '' ? null : v]))
      const q = id ? untypedDb.from('care_tasks').update(clean).eq('id', id) : untypedDb.from('care_tasks').insert({ ...clean, household_id: hid })
      const { error } = await q
      if (error) throw error
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: keys.careTasks(hid) }),
  })
}

export function useCompleteCareTask(hid: string) {
  return useMutation({
    mutationFn: async (task: CareTask) => {
      const { error } = await supabase.from('care_task_completions').insert({
        household_id: hid, task_id: task.id, cat_id: task.cat_id, client_event_id: crypto.randomUUID(),
      })
      if (error) throw error
    },
    onSuccess: () => invalidateHousehold(hid),
  })
}

export function useFoods(hid: string) {
  return useQuery({
    queryKey: keys.foods(hid),
    queryFn: async () => {
      const { data, error } = await supabase.from('food_profiles').select('*').eq('household_id', hid).is('archived_at', null).order('product')
      if (error) throw error
      return data as FoodProfile[]
    },
  })
}

export function useSaveFood(hid: string) {
  return useMutation({
    mutationFn: async ({ id, ...row }: Partial<FoodProfile> & { product: string }) => {
      const clean = Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v === '' ? null : v]))
      const q = id ? untypedDb.from('food_profiles').update(clean).eq('id', id) : untypedDb.from('food_profiles').insert({ ...clean, household_id: hid })
      const { error } = await q
      if (error) throw error
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: keys.foods(hid) }),
  })
}

/** Hides a food from pickers; past meals keep their stored name. */
export function useDeleteFood(hid: string) {
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await untypedDb.from('food_profiles').update({ archived_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: keys.foods(hid) }),
  })
}

/** Stops a recurring task; its completions stay in the timeline. */
export function useDeleteCareTask(hid: string) {
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await untypedDb.from('care_tasks').update({ active: false }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => invalidateHousehold(hid),
  })
}
