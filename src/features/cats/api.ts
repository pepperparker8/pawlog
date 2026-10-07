import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase, PHOTO_BUCKET } from '../../lib/supabase'
import { keys, queryClient } from '../../lib/queryClient'
import type { Cat, CatSummary } from '../../lib/types'

export function useCatSummaries(hid: string, includeArchived = false) {
  return useQuery({
    queryKey: [...keys.catSummaries(hid), includeArchived],
    queryFn: async () => {
      let q = supabase.from('cat_summaries').select('*').eq('household_id', hid).order('name')
      if (!includeArchived) q = q.is('archived_at', null)
      const { data, error } = await q
      if (error) throw error
      return data as CatSummary[]
    },
  })
}

export function useCat(id: string | undefined) {
  return useQuery({
    queryKey: keys.cat(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('cats').select('*').eq('id', id!).single()
      if (error) throw error
      return data as Cat
    },
  })
}

export type CatInput = Partial<Omit<Cat, 'id' | 'household_id' | 'created_at'>> & { name: string }

export function useSaveCat(hid: string) {
  return useMutation({
    mutationFn: async ({ id, ...input }: CatInput & { id?: string }) => {
      const clean = Object.fromEntries(Object.entries(input).map(([k, v]) => [k, v === '' ? null : v]))
      const q = id
        ? supabase.from('cats').update(clean).eq('id', id).select().single()
        : supabase.from('cats').insert({ ...clean, household_id: hid }).select().single()
      const { data, error } = await q
      if (error) throw error
      return data as Cat
    },
    onSuccess: cat => {
      void queryClient.invalidateQueries({ queryKey: keys.catSummaries(hid) })
      void queryClient.invalidateQueries({ queryKey: keys.cat(cat.id) })
    },
  })
}

export function useArchiveCat(hid: string) {
  return useMutation({
    mutationFn: async ({ id, archive }: { id: string; archive: boolean }) => {
      const { error } = await supabase.from('cats').update({ archived_at: archive ? new Date().toISOString() : null }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: keys.catSummaries(hid) }),
  })
}

export function photoUrl(path: string | null | undefined): string | null {
  if (!path) return null
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl
}

/** Signed URL for a private object; cached per path for the session. */
const signed = new Map<string, Promise<string>>()
export function useSignedUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ['signed', path],
    enabled: !!path,
    staleTime: 50 * 60_000,
    queryFn: () => {
      if (!signed.has(path!)) {
        signed.set(path!, supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path!, 3600).then(r => {
          if (r.error) throw r.error
          return r.data.signedUrl
        }))
      }
      return signed.get(path!)!
    },
  })
}
