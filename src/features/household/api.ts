import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { keys, queryClient } from '../../lib/queryClient'
import type { Household, HouseholdMember, HouseholdRole } from '../../lib/types'

export function useMembers(hid: string) {
  return useQuery({
    queryKey: keys.members(hid),
    queryFn: async () => {
      const { data, error } = await supabase.from('household_members').select('*, profiles(*)').eq('household_id', hid).order('joined_at')
      if (error) throw error
      return data as HouseholdMember[]
    },
  })
}

export function useInvites(hid: string, enabled: boolean) {
  return useQuery({
    queryKey: ['invites', hid], enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from('household_invites').select('*').eq('household_id', hid).is('accepted_at', null).order('created_at', { ascending: false })
      if (error) throw error
      return data as Array<{ id: string; email: string; role: HouseholdRole; token: string; expires_at: string }>
    },
  })
}

export function useCreateInvite(hid: string) {
  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: HouseholdRole }) => {
      const { data, error } = await supabase.from('household_invites').insert({ household_id: hid, email, role }).select().single()
      if (error) throw error
      return data as { token: string }
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['invites', hid] }),
  })
}

export function useAcceptInvite() {
  return useMutation({
    mutationFn: async (token: string) => {
      const { data, error } = await supabase.rpc('accept_invite', { p_token: token })
      if (error) throw error
      return data as Household
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['memberships'] }),
  })
}

export function useUpdateMemberRole(hid: string) {
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: HouseholdRole }) => {
      const { error } = await supabase.from('household_members').update({ role }).eq('household_id', hid).eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: keys.members(hid) }),
  })
}

export function useRemoveMember(hid: string) {
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from('household_members').delete().eq('household_id', hid).eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: keys.members(hid) }); void queryClient.invalidateQueries({ queryKey: ['memberships'] }) },
  })
}

export function useCreateHousehold() {
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.rpc('create_household', { p_name: name })
      if (error) throw error
      return data as Household
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['memberships'] }),
  })
}

export function useRenameHousehold() {
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from('households').update({ name }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['memberships'] }),
  })
}

export function useSeedDemo() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('seed_demo_household')
      if (error) throw error
      return data as string
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['memberships'] }),
  })
}
