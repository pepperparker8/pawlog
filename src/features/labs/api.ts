import { useMutation, useQuery } from '@tanstack/react-query'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase, untypedDb, PHOTO_BUCKET } from '../../lib/supabase'
import { keys, queryClient } from '../../lib/queryClient'
import type { LabRead, LabReport, LabRow } from '../../lib/types'
import { blobToBase64 } from './image'
import { sortReports } from './status'

export function useLabs(catId: string) {
  return useQuery({
    queryKey: keys.labs(catId),
    queryFn: async () => {
      const { data, error } = await untypedDb.from('lab_reports').select('*, lab_results(*)').eq('cat_id', catId)
      if (error) throw error
      const reports = (data as LabReport[]).map(r => ({ ...r, lab_results: [...r.lab_results].sort((a, b) => a.position - b.position) }))
      return sortReports(reports)
    },
  })
}

/** The caller keeps `eventId` per image, so a retry after a dropped connection returns the draft already read. */
export async function readLab(catId: string, eventId: string, image: Blob): Promise<LabRead> {
  const { data, error } = await supabase.functions.invoke<{ read: LabRead }>('lab-read', {
    body: { cat_id: catId, client_event_id: eventId, image: await blobToBase64(image) },
  })
  if (error instanceof FunctionsHttpError) {
    const body = await (error.context as Response).json().catch(() => null) as { error?: string } | null
    throw new Error(body?.error ?? 'Could not read this paper. Try again or enter the values by hand.')
  }
  if (error) throw error
  return data!.read
}

export interface SaveLabInput {
  eventId: string; hid: string; catId: string; image: Blob | null; readId: string | null
  sampledOn: string; labName: string; visitId: string | null; newVisit: { clinic: string; reason: string } | null; rows: LabRow[]
}

export function useSaveLab() {
  return useMutation({
    mutationFn: async (v: SaveLabInput) => {
      // The event id doubles as the report id, so a retried save lands on the same file and row.
      const id = v.eventId
      let path: string | null = null
      if (v.image) {
        path = `household/${v.hid}/cats/${v.catId}/labs/${id}.jpg`
        const up = await supabase.storage.from(PHOTO_BUCKET).upload(path, v.image, { contentType: 'image/jpeg', upsert: true })
        if (up.error) throw up.error
      }
      const { error } = await untypedDb.rpc('save_lab_report', { p: {
        id, client_event_id: v.eventId, household_id: v.hid, cat_id: v.catId, vet_visit_id: v.visitId, read_id: v.readId,
        sampled_on: v.sampledOn, lab_name: v.labName, storage_path: path, rows: v.rows, ...(v.newVisit ? { new_visit: v.newVisit } : {}),
      } })
      if (error) {
        if (path) await supabase.storage.from(PHOTO_BUCKET).remove([path])
        throw error
      }
      return id
    },
    onSuccess: (_id, v) => {
      void queryClient.invalidateQueries({ queryKey: keys.labs(v.catId) })
      if (v.newVisit) void queryClient.invalidateQueries({ queryKey: keys.health(v.catId) })
    },
  })
}

export function useDeleteLab(catId: string) {
  return useMutation({
    mutationFn: async (r: LabReport) => {
      const { error } = await untypedDb.from('lab_reports').delete().eq('id', r.id)
      if (error) throw error
      if (r.storage_path) await supabase.storage.from(PHOTO_BUCKET).remove([r.storage_path])
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: keys.labs(catId) }),
  })
}

export function useLabImage(path: string | null) {
  return useQuery({
    queryKey: ['lab-image', path],
    enabled: !!path,
    staleTime: 50 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path!, 3600)
      if (error) throw error
      return data.signedUrl
    },
  })
}
