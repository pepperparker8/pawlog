import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
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
      const q = id ? supabase.from('care_tasks').update(clean).eq('id', id) : supabase.from('care_tasks').insert({ ...clean, household_id: hid })
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
      const q = id ? supabase.from('food_profiles').update(clean).eq('id', id) : supabase.from('food_profiles').insert({ ...clean, household_id: hid })
      const { error } = await q
      if (error) throw error
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: keys.foods(hid) }),
  })
}
