import { useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { keys, queryClient, invalidateHousehold } from '../../lib/queryClient'
import type { Notification } from '../../lib/types'

export function useNotifications(uid: string) {
  return useQuery({
    queryKey: keys.notifications(uid),
    queryFn: async () => {
      const { data, error } = await supabase.from('notifications').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(100)
      if (error) throw error
      return data as Notification[]
    },
  })
}

export function useMarkRead(uid: string) {
  return useMutation({
    mutationFn: async (ids: string[] | 'all') => {
      let q = supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', uid).is('read_at', null)
      if (ids !== 'all') q = q.in('id', ids)
      const { error } = await q
      if (error) throw error
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: keys.notifications(uid) }),
  })
}

/** Realtime: refresh household queries when any member writes, and personal notifications. */
export function useRealtime(hid: string | null, uid: string | null) {
  useEffect(() => {
    if (!hid || !uid) return
    const ch = supabase.channel(`household:${hid}`)
    const tables = ['cats', 'weight_logs', 'feeding_logs', 'water_logs', 'litter_logs', 'symptom_logs', 'medication_logs',
      'grooming_logs', 'behavior_logs', 'activity_logs', 'journal_entries', 'photos', 'care_tasks', 'care_task_completions', 'xp_transactions']
    let t: number | undefined
    const bump = () => { window.clearTimeout(t); t = window.setTimeout(() => invalidateHousehold(hid), 400) }
    for (const table of tables) ch.on('postgres_changes', { event: '*', schema: 'public', table, filter: `household_id=eq.${hid}` }, bump)
    ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
      () => void queryClient.invalidateQueries({ queryKey: keys.notifications(uid) }))
    ch.on('postgres_changes', { event: '*', schema: 'public', table: 'user_stats', filter: `user_id=eq.${uid}` },
      () => void queryClient.invalidateQueries({ queryKey: keys.stats(uid) }))
    ch.subscribe()
    return () => { void supabase.removeChannel(ch) }
  }, [hid, uid])
}
