import { useInfiniteQuery, useMutation } from '@tanstack/react-query'
import { supabase, PHOTO_BUCKET } from '../../lib/supabase'
import { keys, queryClient, invalidateHousehold } from '../../lib/queryClient'
import type { Photo } from '../../lib/types'

const PAGE = 30
export function usePhotos(hid: string, catId?: string) {
  return useInfiniteQuery({
    queryKey: keys.photos(hid, catId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      let q = supabase.from('photos').select('*').eq('household_id', hid).order('taken_at', { ascending: false }).range(pageParam, pageParam + PAGE - 1)
      if (catId) q = q.eq('cat_id', catId)
      const { data, error } = await q
      if (error) throw error
      return data as Photo[]
    },
    getNextPageParam: (last, all) => (last.length < PAGE ? undefined : all.length * PAGE),
  })
}

/** Client-side resize so uploads stay small; returns JPEG blobs for full and thumbnail. */
async function resize(file: File, maxSide: number, quality = 0.85): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale), h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h)
  const blob = await new Promise<Blob>((res, rej) => canvas.toBlob(b => (b ? res(b) : rej(new Error('encode failed'))), 'image/jpeg', quality))
  return { blob, width: w, height: h }
}

export interface UploadInput { hid: string; catId: string; file: File; caption?: string; tags?: string[]; takenAt?: string; setAsProfile?: boolean }

export async function uploadPhoto({ hid, catId, file, caption, tags, takenAt, setAsProfile }: UploadInput): Promise<Photo> {
  const id = crypto.randomUUID()
  const base = `household/${hid}/cats/${catId}/photos/${id}`
  const [full, thumb] = await Promise.all([resize(file, 1600), resize(file, 320, 0.8)])
  const up1 = await supabase.storage.from(PHOTO_BUCKET).upload(`${base}.jpg`, full.blob, { contentType: 'image/jpeg', upsert: false })
  if (up1.error) throw up1.error
  const up2 = await supabase.storage.from(PHOTO_BUCKET).upload(`${base}_thumb.jpg`, thumb.blob, { contentType: 'image/jpeg', upsert: false })
  if (up2.error) throw up2.error
  const { data, error } = await supabase.from('photos').insert({
    id, household_id: hid, cat_id: catId, storage_path: `${base}.jpg`, thumbnail_path: `${base}_thumb.jpg`,
    caption: caption || null, tags: tags ?? [], taken_at: takenAt ?? new Date().toISOString(),
    width: full.width, height: full.height, bytes: full.blob.size, client_event_id: id,
  }).select().single()
  if (error) throw error
  if (setAsProfile) await supabase.from('cats').update({ profile_photo_id: id }).eq('id', catId)
  return data as Photo
}

export function useUploadPhoto() {
  return useMutation({
    mutationFn: uploadPhoto,
    onSuccess: (_p, v) => { invalidateHousehold(v.hid); void queryClient.invalidateQueries({ queryKey: keys.cat(v.catId) }) },
  })
}

export function useDeletePhoto(hid: string) {
  return useMutation({
    mutationFn: async (p: Photo) => {
      await supabase.storage.from(PHOTO_BUCKET).remove([p.storage_path, p.thumbnail_path].filter(Boolean) as string[])
      const { error } = await supabase.from('photos').delete().eq('id', p.id)
      if (error) throw error
    },
    onSuccess: () => invalidateHousehold(hid),
  })
}

export function useSetProfilePhoto(hid: string) {
  return useMutation({
    mutationFn: async ({ catId, photoId }: { catId: string; photoId: string | null }) => {
      const { error } = await supabase.from('cats').update({ profile_photo_id: photoId }).eq('id', catId)
      if (error) throw error
    },
    onSuccess: (_r, v) => { invalidateHousehold(hid); void queryClient.invalidateQueries({ queryKey: keys.cat(v.catId) }) },
  })
}
