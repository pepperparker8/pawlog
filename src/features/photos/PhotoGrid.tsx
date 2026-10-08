import { useState } from 'react'
import { differenceInDays, differenceInMonths } from 'date-fns'
import { Camera, Heart, CircleNotch, Star, Trash, X } from '../../components/icons'
import { useHousehold } from '../../household/HouseholdProvider'
import { Button, EmptyState, ErrorNote, Spinner, cx } from '../../components/ui'
import { useToast } from '../../components/ui/Toast'
import { friendlyError } from '../../lib/errors'
import { dateLabel } from '../../lib/format'
import { useCat, useSignedUrl } from '../cats/api'
import { useDeletePhoto, usePhotos, useSetProfilePhoto } from './api'
import { PhotoPicker } from './PhotoPicker'
import type { Photo } from '../../lib/types'

export function PhotoGrid({ catId }: { catId?: string }) {
  const { current, canEdit } = useHousehold()
  const hid = current!.id
  const q = usePhotos(hid, catId)
  const [open, setOpen] = useState<Photo | null>(null)
  const photos = q.data?.pages.flat() ?? []

  return (
    <div>
      {canEdit && catId && (
        <PhotoPicker hid={hid} catId={catId} multiple label="Add photos"
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-paw-300 bg-paw-50 px-4 py-3 text-sm font-semibold text-paw-700 active:scale-[.99] disabled:opacity-60">
          {busy => <>{busy ? <CircleNotch className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}{busy ? 'Uploading…' : 'Add photos'}</>}
        </PhotoPicker>
      )}
      {q.error ? <ErrorNote message={friendlyError(q.error)} /> : q.isLoading ? <Spinner /> : photos.length === 0 ? (
        <EmptyState icon={Camera} title="No photos yet" body="Photos land on the timeline and come back as On this day memories." />
      ) : (
        <>
          {catId && <ThenAndNow catId={catId} photos={photos} onOpen={setOpen} />}
          <div className="grid grid-cols-3 gap-1">{photos.map(p => <Thumb key={p.id} p={p} onClick={() => setOpen(p)} />)}</div>
          {q.hasNextPage && <Button variant="ghost" className="mt-3 w-full" loading={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>Load more</Button>}
        </>
      )}
      {open && <Lightbox p={open} onClose={() => setOpen(null)} canEdit={canEdit} hid={hid} />}
    </div>
  )
}

const THEN_NOW_MIN_DAYS = 30
const YOUNG_MONTHS = 18

/** Oldest and newest loaded photo side by side once they are at least a month apart. */
function ThenAndNow({ catId, photos, onOpen }: { catId: string; photos: Photo[]; onOpen: (p: Photo) => void }) {
  const cat = useCat(catId)
  const now = photos[0]
  const then = photos[photos.length - 1]
  if (!now || !then || differenceInDays(new Date(now.taken_at), new Date(then.taken_at)) < THEN_NOW_MIN_DAYS) return null
  const dob = cat.data?.date_of_birth
  const young = !!dob && differenceInMonths(new Date(then.taken_at), new Date(dob)) < YOUNG_MONTHS
  return (
    <section className="mb-4">
      <h3 className="mb-2 text-sm font-semibold text-stone-800">{young ? 'Look how much you\u2019ve grown' : 'Then and now'}</h3>
      <div className="grid grid-cols-2 gap-2">
        {[then, now].map(p => (
          <div key={p.id}>
            <Thumb p={p} onClick={() => onOpen(p)} className="rounded-xl" />
            <p className="mt-1 text-center text-xs text-stone-500">{dateLabel(p.taken_at)}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Thumb({ p, onClick, className }: { p: Photo; onClick: () => void; className?: string }) {
  const u = useSignedUrl(p.thumbnail_path ?? p.storage_path)
  return (
    <button onClick={onClick} aria-label={`Photo from ${dateLabel(p.taken_at)}`} className={cx('relative block w-full aspect-square overflow-hidden rounded-lg bg-stone-100', className)}>
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
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="flex items-center justify-between p-3">
        <span className="text-sm">{dateLabel(p.taken_at)}</span>
        <button onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-white/10"><X className="h-5 w-5" /></button>
      </div>
      <div className="flex flex-1 items-center justify-center">{u.data ? <img src={u.data} alt={p.caption ?? ''} className="max-h-full max-w-full object-contain" /> : <Spinner />}</div>
      <div className="safe-bottom-pad flex items-center justify-between gap-3 p-3">
        <span className="min-w-0 truncate text-sm text-white/80">{p.caption}</span>
        {canEdit && (
          <div className="flex gap-2">
            <button onClick={() => prof.mutateAsync({ catId: p.cat_id, photoId: p.id }).then(() => { toast.show('📸 Profile photo updated'); onClose() }).catch(e => toast.show(friendlyError(e), 'bad'))}
              className={cx('flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-sm')}><Star className="h-4 w-4" />Profile photo</button>
            <button onClick={() => { if (confirm('Delete this photo?')) del.mutateAsync(p).then(onClose).catch(e => toast.show(friendlyError(e), 'bad')) }}
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-sm"><Trash className="h-4 w-4" />Delete</button>
          </div>
        )}
      </div>
    </div>
  )
}
