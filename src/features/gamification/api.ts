import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { keys } from '../../lib/queryClient'
import type { Badge, HouseholdStats, LevelConfig, QuestProgress, UserBadge, UserStats, XpRule, XpTransaction } from '../../lib/types'

export function useUserStats(uid: string) {
  return useQuery({
    queryKey: keys.stats(uid),
    queryFn: async () => {
      const { data, error } = await supabase.from('user_stats').select('*').eq('user_id', uid).maybeSingle()
      if (error) throw error
      return (data ?? { user_id: uid, total_xp: 0, level: 1, streak_current: 0, streak_best: 0, streak_last_on: null, freezes_left: 1 }) as UserStats
    },
  })
}

export function useHouseholdStats(hid: string) {
  return useQuery({
    queryKey: keys.householdStats(hid),
    queryFn: async () => {
      const { data, error } = await supabase.from('household_stats').select('*').eq('household_id', hid).maybeSingle()
      if (error) throw error
      return (data ?? { household_id: hid, total_xp: 0, level: 1, streak_current: 0, streak_best: 0 }) as HouseholdStats
    },
  })
}

export function useLevels() {
  return useQuery({
    queryKey: keys.levels(), staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.from('level_config').select('*').order('level')
      if (error) throw error
      return data as LevelConfig[]
    },
  })
}

export function useXpRules() {
  return useQuery({
    queryKey: keys.xpRules(), staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.from('xp_rules').select('*').eq('active', true).order('xp', { ascending: false })
      if (error) throw error
      return data as XpRule[]
    },
  })
}

export function useBadges() {
  return useQuery({
    queryKey: keys.badges(), staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.from('badges').select('*').order('sort_order')
      if (error) throw error
      return data as Badge[]
    },
  })
}

export function useUserBadges(uid: string) {
  return useQuery({
    queryKey: keys.userBadges(uid),
    queryFn: async () => {
      const { data, error } = await supabase.from('user_badges').select('*').eq('user_id', uid).order('earned_at', { ascending: false })
      if (error) throw error
      return data as UserBadge[]
    },
  })
}

export function useQuests(hid: string) {
  return useQuery({
    queryKey: keys.quests(hid),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('quest_progress', { p_household: hid })
      if (error) throw error
      return data as QuestProgress[]
    },
  })
}

export function useRecentXp(hid: string, limit = 20) {
  return useQuery({
    queryKey: keys.xpRecent(hid),
    queryFn: async () => {
      const { data, error } = await supabase.from('xp_transactions').select('*').eq('household_id', hid)
        .order('created_at', { ascending: false }).limit(limit)
      if (error) throw error
      return data as XpTransaction[]
    },
  })
}

export function levelProgress(xp: number, levels: LevelConfig[]) {
  const sorted = [...levels].sort((a, b) => a.level - b.level)
  const current = [...sorted].reverse().find(l => l.min_xp <= xp) ?? sorted[0]
  const next = sorted.find(l => l.level > (current?.level ?? 1))
  return {
    current,
    next,
    into: xp - (current?.min_xp ?? 0),
    span: next ? next.min_xp - (current?.min_xp ?? 0) : 1,
  }
}
