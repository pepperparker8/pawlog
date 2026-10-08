import { useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase, untypedDb } from '../../lib/supabase'
import { keys, queryClient, invalidateHousehold } from '../../lib/queryClient'
import { useToast } from '../../components/ui/Toast'
import type { Notification } from '../../lib/types'

const CELEBRATE = new Set(['level_up', 'badge'])

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
  const { show } = useToast()
  useEffect(() => {
    if (!hid || !uid) return
    const ch = supabase.channel(`household:${hid}`)
    const tables = ['cats', 'weight_logs', 'feeding_logs', 'water_logs', 'litter_logs', 'symptom_logs', 'medication_logs',
      'grooming_logs', 'behavior_logs', 'activity_logs', 'journal_entries', 'photos', 'care_tasks', 'care_task_completions', 'xp_transactions']
    let t: number | undefined
    const bump = () => { window.clearTimeout(t); t = window.setTimeout(() => invalidateHousehold(hid), 400) }
    for (const table of tables) ch.on('postgres_changes', { event: '*', schema: 'public', table, filter: `household_id=eq.${hid}` }, bump)
    ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
      payload => {
        void queryClient.invalidateQueries({ queryKey: keys.notifications(uid) })
        const n = payload.new as Partial<Notification>
        if (n.kind && CELEBRATE.has(n.kind) && n.title) show(`🏆 ${n.title}`, 'milestone')
      })
    ch.on('postgres_changes', { event: '*', schema: 'public', table: 'user_stats', filter: `user_id=eq.${uid}` },
      () => void queryClient.invalidateQueries({ queryKey: keys.stats(uid) }))
    ch.subscribe()
    return () => { void supabase.removeChannel(ch) }
  }, [hid, uid, show])
}

const REFRESH_GAP_MS = 30 * 60 * 1000

/** Creates due care, vaccination and parasite reminders when the app opens or returns after a gap. */
export function useReminderRefresh(hid: string | null, uid: string | null) {
  useEffect(() => {
    if (!hid || !uid) return
    let last = 0
    const run = async () => {
      if (Date.now() - last < REFRESH_GAP_MS) return
      last = Date.now()
      const { data, error } = await untypedDb.rpc('refresh_reminders', { p_household: hid })
      if (!error && Number(data) > 0) void queryClient.invalidateQueries({ queryKey: keys.notifications(uid) })
    }
    void run()
    const onVisible = () => { if (document.visibilityState === 'visible') void run() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [hid, uid])
}
