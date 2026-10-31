import { useState } from 'react'
import { createPortal } from 'react-dom'
import { differenceInDays, differenceInMonths, format, parseISO } from 'date-fns'
import { Camera, Heart, Pencil, Star, Trash, X, G } from '../../components/icons'
import { useHousehold } from '../../household/HouseholdProvider'
import { Button, EmptyState, ErrorNote, Input, Field, Sheet, Spinner, cx } from '../../components/ui'
import { useToast } from '../../components/ui/Toast'
import { friendlyError } from '../../lib/errors'
import { dateLabel } from '../../lib/format'
import type { Cat, Photo } from '../../lib/types'
import { useCat, useSignedUrl } from '../cats/api'
import { ageAt, ageGroup } from './age'
import { takenAtFor, useDeletePhoto, usePhotos, useSetProfilePhoto, useUpdatePhoto } from './api'
import { PhotoDateFields } from './PhotoDateFields'
import { PhotoPicker } from './PhotoPicker'

const label = (p: Photo, cat: Cat | undefined) => {
  const age = cat?.date_of_birth ? ageAt(cat.date_of_birth, p.taken_at, cat.dob_is_estimate) : null
  return [age, dateLabel(p.taken_at)].filter(Boolean).join(' · ')
}

export function PhotoGrid({ catId }: { catId?: string }) {
  const { current, canEdit } = useHousehold()
  const hid = current!.id
  const q = usePhotos(hid, catId)
  const cat = useCat(catId).data
  const [openId, setOpenId] = useState<string | null>(null)
  const photos = q.data?.pages.flat() ?? []
  const open = photos.find(p => p.id === openId)

  return (
    <div>
      {canEdit && catId && (
        <PhotoPicker hid={hid} catId={catId} multiple label="Add photos"
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-paw-300 bg-paw-50 px-4 py-3 text-sm font-semibold text-paw-700 active:scale-[.99]">
          <Camera className="h-4 w-4" />Add photos
        </PhotoPicker>
      )}
      {q.error ? <ErrorNote message={friendlyError(q.error)} /> : q.isLoading ? <Spinner /> : photos.length === 0 ? (
        <EmptyState icon={G.photo} title="No photos yet" />
      ) : (
        <>
          {catId && <ThenAndNow cat={cat} photos={photos} onOpen={p => setOpenId(p.id)} />}
          {cat?.date_of_birth ? <AgeTimeline dob={cat.date_of_birth} photos={photos} onOpen={p => setOpenId(p.id)} /> : (
            <div className="grid grid-cols-3 gap-1">{photos.map(p => <Thumb key={p.id} p={p} onClick={() => setOpenId(p.id)} />)}</div>
          )}
          {q.hasNextPage && <Button variant="ghost" className="mt-3 w-full" loading={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>Load more</Button>}
        </>
      )}
      {open && <Lightbox p={open} cat={cat} onClose={() => setOpenId(null)} canEdit={canEdit} hid={hid} />}
    </div>
  )
}

/** Sections by age, newest first: each month of the first year, then each year. */
function AgeTimeline({ dob, photos, onOpen }: { dob: string; photos: Photo[]; onOpen: (p: Photo) => void }) {
  const groups: Array<{ key: string; label: string; photos: Photo[] }> = []
  for (const p of photos) {
    const g = ageGroup(dob, p.taken_at)
    const key = g ? String(g.key) : 'before'
    const last = groups[groups.length - 1]
    if (last?.key === key) last.photos.push(p)
    else groups.push({ key, label: g?.label ?? 'Before birth date', photos: [p] })
  }
  return (
    <div className="space-y-4">
      {groups.map(g => {
        const first = g.photos[g.photos.length - 1].taken_at, last = g.photos[0].taken_at
        const range = [first, last].map(d => format(parseISO(d), 'MMM yyyy'))
        return (
          <section key={g.key} aria-label={g.label}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <h3 className="text-sm font-semibold text-stone-800">{g.label}</h3>
              <span className="text-xs text-stone-500">{range[0] === range[1] ? range[0] : `${range[0]} to ${range[1]}`}</span>
            </div>
            <div className="grid grid-cols-3 gap-1">{g.photos.map(p => <Thumb key={p.id} p={p} onClick={() => onOpen(p)} />)}</div>
          </section>
        )
      })}
    </div>
  )
}

const THEN_NOW_MIN_DAYS = 30
const YOUNG_MONTHS = 18

/** Oldest and newest loaded photo side by side once they are at least a month apart. */
function ThenAndNow({ cat, photos, onOpen }: { cat: Cat | undefined; photos: Photo[]; onOpen: (p: Photo) => void }) {
  const now = photos[0]
  const then = photos[photos.length - 1]
  if (!now || !then || differenceInDays(new Date(now.taken_at), new Date(then.taken_at)) < THEN_NOW_MIN_DAYS) return null
  const dob = cat?.date_of_birth
  const young = !!dob && differenceInMonths(new Date(then.taken_at), new Date(dob)) < YOUNG_MONTHS
  return (
    <section className="mb-4">
      <h3 className="mb-2 text-sm font-semibold text-stone-800">{young ? 'Growing up' : 'Then and now'}</h3>
      <div className="grid grid-cols-2 gap-2">
        {[then, now].map(p => (
          <div key={p.id}>
            <Thumb p={p} onClick={() => onOpen(p)} className="rounded-xl" />
            <p className="mt-1 text-center text-xs text-stone-500">{label(p, cat)}</p>
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

function Lightbox({ p, cat, onClose, canEdit, hid }: { p: Photo; cat: Cat | undefined; onClose: () => void; canEdit: boolean; hid: string }) {
  const u = useSignedUrl(p.storage_path)
  const del = useDeletePhoto(hid)
  const prof = useSetProfilePhoto(hid)
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const isProfile = cat?.profile_photo_id === p.id
  const pill = 'flex items-center gap-1.5 rounded-full px-3 py-2 text-sm disabled:opacity-100'
  return createPortal(
    <>
      <div className="fixed inset-0 z-50 flex flex-col bg-black text-white" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center justify-between p-3">
          <span className="text-sm">{label(p, cat)}</span>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-white/10"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center">{u.data ? <img src={u.data} alt={p.caption ?? ''} className="max-h-full max-w-full object-contain" /> : <Spinner />}</div>
        <div className="safe-bottom-pad space-y-2 p-3">
          {p.caption && <p className="text-sm text-white/80">{p.caption}</p>}
          {canEdit && (
            <div className="flex flex-wrap justify-end gap-2">
              <button onClick={() => setEditing(true)} className={cx(pill, 'bg-white/10')}><Pencil className="h-4 w-4" />Edit</button>
              <button disabled={isProfile || prof.isPending}
                onClick={() => prof.mutateAsync({ catId: p.cat_id, photoId: p.id }).then(() => toast.show('Profile photo updated')).catch(e => toast.show(friendlyError(e), 'bad'))}
                className={cx(pill, isProfile ? 'bg-paw-500' : 'bg-white/10')}><Star className="h-4 w-4" weight={isProfile ? 'fill' : 'regular'} />{isProfile ? 'Profile photo' : 'Set as profile'}</button>
              <button onClick={() => { if (confirm('Delete this photo?')) del.mutateAsync(p).then(onClose).catch(e => toast.show(friendlyError(e), 'bad')) }}
                className={cx(pill, 'bg-white/10')}><Trash className="h-4 w-4" />Delete</button>
            </div>
          )}
        </div>
      </div>
      {editing && <EditPhotoSheet p={p} cat={cat} hid={hid} onClose={() => setEditing(false)} />}
    </>,
    document.body,
  )
}

function EditPhotoSheet({ p, cat, hid, onClose }: { p: Photo; cat: Cat | undefined; hid: string; onClose: () => void }) {
  const update = useUpdatePhoto(hid)
  const toast = useToast()
  const [day, setDay] = useState(() => format(parseISO(p.taken_at), 'yyyy-MM-dd'))
  const [caption, setCaption] = useState(p.caption ?? '')
  const save = () => update.mutateAsync({ id: p.id, taken_at: takenAtFor(day, p.taken_at), caption: caption.trim() || null })
    .then(() => { toast.show('Photo updated'); onClose() }).catch(e => toast.show(friendlyError(e), 'bad'))
  return (
    <Sheet open onClose={onClose} title="Edit photo" footer={<Button className="w-full" loading={update.isPending} onClick={() => void save()}>Save</Button>}>
      <div className="space-y-3 pt-1">
        <PhotoDateFields day={day} onDay={setDay} dob={cat?.date_of_birth ?? null} estimate={cat?.dob_is_estimate} />
        <Field label="Caption"><Input value={caption} onChange={e => setCaption(e.target.value)} maxLength={200} /></Field>
      </div>
    </Sheet>
  )
}
