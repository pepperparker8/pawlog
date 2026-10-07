import { useRef, useState } from 'react'
import { Camera, Heart, Star, Trash2, X } from 'lucide-react'
import { useHousehold } from '../../household/HouseholdProvider'
import { Button, EmptyState, Spinner, cx } from '../../components/ui'
import { useToast } from '../../components/ui/Toast'
import { friendlyError } from '../../lib/errors'
import { dateLabel } from '../../lib/format'
import { useSignedUrl } from '../cats/api'
import { useDeletePhoto, usePhotos, useSetProfilePhoto, useUploadPhoto } from './api'
import type { Photo } from '../../lib/types'

export function PhotoGrid({ catId }: { catId?: string }) {
  const { current, canEdit } = useHousehold()
  const hid = current!.id
  const q = usePhotos(hid, catId)
  const upload = useUploadPhoto()
  const toast = useToast()
  const file = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState<Photo | null>(null)
  const photos = q.data?.pages.flat() ?? []

  async function onPick(files: FileList | null) {
    if (!files?.length || !catId) return
    let n = 0
    for (const f of Array.from(files)) {
      try { await upload.mutateAsync({ hid, catId, file: f, takenAt: new Date(f.lastModified).toISOString() }); n++ } catch (e) { toast.show(friendlyError(e), 'bad') }
    }
    if (n) toast.show(`+${5 * n} XP · ${n} photo${n > 1 ? 's' : ''} added`, 'xp')
    if (file.current) file.current.value = ''
  }

  return (
    <div>
      {canEdit && catId && (
        <div className="mb-3">
          <input ref={file} type="file" accept="image/*" multiple className="hidden" onChange={e => void onPick(e.target.files)} />
          <Button variant="secondary" className="w-full" loading={upload.isPending} onClick={() => file.current?.click()}><Camera className="h-4 w-4" />Add photos</Button>
        </div>
      )}
      {q.isLoading ? <Spinner /> : photos.length === 0 ? (
        <EmptyState emoji="📷" title="No photos yet" body="Every photo becomes part of the timeline and the yearly memory." />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-1">{photos.map(p => <Thumb key={p.id} p={p} onClick={() => setOpen(p)} />)}</div>
          {q.hasNextPage && <Button variant="ghost" className="mt-3 w-full" loading={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>Load more</Button>}
        </>
      )}
      {open && <Lightbox p={open} onClose={() => setOpen(null)} canEdit={canEdit} hid={hid} />}
    </div>
  )
}

function Thumb({ p, onClick }: { p: Photo; onClick: () => void }) {
  const u = useSignedUrl(p.thumbnail_path ?? p.storage_path)
  return (
    <button onClick={onClick} className="relative aspect-square overflow-hidden rounded-lg bg-stone-100">
      {u.data && <img src={u.data} alt={p.caption ?? ''} className="h-full w-full object-cover" loading="lazy" />}
      {p.is_favorite && <Heart className="absolute right-1 top-1 h-4 w-4 fill-white text-white drop-shadow" />}
    </button>
  )
}

function Lightbox({ p, onClose, canEdit, hid }: { p: Photo; onClose: () => void; canEdit: boolean; hid: string }) {
  const u = useSignedUrl(p.storage_path)
  const del = useDeletePhoto(hid)
  const prof = useSetProfilePhoto(hid)
  const toast = useToast()
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <div className="flex items-center justify-between p-3">
        <span className="text-sm">{dateLabel(p.taken_at)}</span>
        <button onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-white/10"><X className="h-5 w-5" /></button>
      </div>
      <div className="flex flex-1 items-center justify-center">{u.data ? <img src={u.data} alt={p.caption ?? ''} className="max-h-full max-w-full object-contain" /> : <Spinner />}</div>
      <div className="flex items-center justify-between p-3">
        <span className="text-sm text-white/80">{p.caption}</span>
        {canEdit && (
          <div className="flex gap-2">
            <button onClick={() => prof.mutateAsync({ catId: p.cat_id, photoId: p.id }).then(() => toast.show('Profile photo set')).catch(e => toast.show(friendlyError(e), 'bad'))}
              className={cx('rounded-full p-2 hover:bg-white/10')} aria-label="Set as profile"><Star className="h-5 w-5" /></button>
            <button onClick={() => { if (confirm('Delete this photo?')) del.mutateAsync(p).then(onClose).catch(e => toast.show(friendlyError(e), 'bad')) }}
              className="rounded-full p-2 hover:bg-white/10" aria-label="Delete"><Trash2 className="h-5 w-5" /></button>
          </div>
        )}
      </div>
    </div>
  )
}
