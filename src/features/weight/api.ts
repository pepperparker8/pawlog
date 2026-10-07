import { useMemo } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { untypedDb } from '../../lib/supabase'
import { invalidateHousehold, keys, queryClient } from '../../lib/queryClient'
import { useCat } from '../cats/api'
import { useWeights } from '../health/api'
import { getWeightStatus, type BreedRef, type Target } from './status'

export interface Breed {
  code: string; name: string; aliases: string[]; coat: 'short' | 'semi-long' | 'long' | 'hairless' | null
  maturity_months_min: number | null; maturity_months_max: number | null
  growth_notes: string | null; maturity_notes: string | null; care_notes: string | null
  source: string | null; source_url: string | null; last_reviewed: string | null
  breed_weight_references: (BreedRef & { last_reviewed: string })[]
}

export interface WeightTarget extends Target { id: string; cat_id: string; note: string | null }

export function useBreeds() {
  return useQuery({
    queryKey: keys.breeds(),
    staleTime: 60 * 60_000,
    queryFn: async () => {
      const { data, error } = await untypedDb.from('breeds').select('*, breed_weight_references(*)').order('name')
      if (error) throw error
      return data as Breed[]
    },
  })
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '')

export function findBreed(breeds: Breed[] | undefined, code: string | null | undefined, text: string | null | undefined): Breed | null {
  if (!breeds?.length) return null
  if (code) { const b = breeds.find(x => x.code === code); if (b) return b }
  if (!text) return null
  const t = norm(text)
  return breeds.find(b => norm(b.name) === t || b.aliases.some(a => norm(a) === t)) ?? null
}

export function useTargets(catId: string) {
  return useQuery({
    queryKey: keys.targets(catId),
    queryFn: async () => {
      const { data, error } = await untypedDb.from('cat_weight_targets').select('id, cat_id, source, min_kg, max_kg, target_kg, set_on, note')
        .eq('cat_id', catId).is('archived_at', null)
      if (error) throw error
      return data as WeightTarget[]
    },
  })
}

export interface TargetInput { catId: string; source: 'vet' | 'owner'; min_kg: number | null; max_kg: number | null; target_kg: number | null; set_on: string; note: string | null }

export function useSaveTarget(hid: string) {
  return useMutation({
    mutationFn: async (t: TargetInput) => {
      const old = await untypedDb.from('cat_weight_targets').update({ archived_at: new Date().toISOString() })
        .eq('cat_id', t.catId).eq('source', t.source).is('archived_at', null)
      if (old.error) throw old.error
      const { error } = await untypedDb.from('cat_weight_targets').insert({
        household_id: hid, cat_id: t.catId, source: t.source, min_kg: t.min_kg, max_kg: t.max_kg, target_kg: t.target_kg, set_on: t.set_on, note: t.note,
      })
      if (error) throw error
    },
    onSuccess: (_r, v) => { void queryClient.invalidateQueries({ queryKey: keys.targets(v.catId) }); invalidateHousehold(hid) },
  })
}

export function useRemoveTarget(hid: string) {
  return useMutation({
    mutationFn: async ({ id }: { id: string; catId: string }) => {
      const { error } = await untypedDb.from('cat_weight_targets').update({ archived_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_r, v) => { void queryClient.invalidateQueries({ queryKey: keys.targets(v.catId) }); invalidateHousehold(hid) },
  })
}

/** Everything the weight status needs for one cat, computed on read. */
export function useWeightStatus(catId: string) {
  const cat = useCat(catId)
  const weights = useWeights(catId)
  const breeds = useBreeds()
  const targets = useTargets(catId)
  const breed = findBreed(breeds.data, cat.data?.breed_code, cat.data?.breed)
  const result = useMemo(() => {
    if (!cat.data || !weights.data) return null
    return getWeightStatus({
      dateOfBirth: cat.data.date_of_birth, sex: cat.data.sex, weights: weights.data,
      breedName: breed?.name ?? null, breedRefs: breed?.breed_weight_references, maturityMonths: breed?.maturity_months_min ?? null,
      targets: targets.data ?? [],
    })
  }, [cat.data, weights.data, breed, targets.data])
  return { result, breed, targets: targets.data ?? [], isLoading: cat.isLoading || weights.isLoading }
}
