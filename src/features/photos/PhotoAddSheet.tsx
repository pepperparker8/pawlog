import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Star, X } from '../../components/icons'
import { Button, Input, Sheet, cx } from '../../components/ui'
import { useToast } from '../../components/ui/Toast'
import { friendlyError } from '../../lib/errors'
import { useCat } from '../cats/api'
import { takenAtFor, useUploadPhoto } from './api'
import { fileTakenAt } from './exif'
import { PhotoDateFields } from './PhotoDateFields'

interface Draft { key: string; file: File; original: string; day: string; caption: string }

const localIso = (ms: number) => format(new Date(ms), "yyyy-MM-dd'T'HH:mm:ss")

function draftOf(file: File, i: number): Draft {
  const original = localIso(file.lastModified || Date.now())
  return { key: `${i}-${file.name}-${file.size}`, file, original, day: original.slice(0, 10), caption: '' }
}

/** Sets the date or age for each picked photo before upload. Camera photos keep their EXIF date. */
export function PhotoAddSheet({ hid, catId, files, setAsProfile, onClose }: {
  hid: string; catId: string; files: File[]; setAsProfile?: boolean; onClose: () => void
}) {
  const cat = useCat(catId)
  const upload = useUploadPhoto()
  const toast = useToast()
  const [drafts, setDrafts] = useState<Draft[]>(() => files.map(draftOf))
  const [profile, setProfile] = useState<string | null>(() => (setAsProfile ? drafts[0]?.key ?? null : null))
  const [done, setDone] = useState(0)
  const [busy, setBusy] = useState(false)
  const dob = cat.data?.date_of_birth ?? null

  useEffect(() => {
    let live = true
    const initial = drafts
    void Promise.all(initial.map(d => fileTakenAt(d.file))).then(dates => {
      if (!live) return
      setDrafts(ds => ds.map(d => {
        const at = dates[initial.findIndex(x => x.key === d.key)]
        return at && d.day === d.original.slice(0, 10) ? { ...d, original: at, day: at.slice(0, 10) } : d
      }))
    })
    return () => { live = false }
    // Reads the files once when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const set = (key: string, patch: Partial<Draft>) => setDrafts(ds => ds.map(d => (d.key === key ? { ...d, ...patch } : d)))
  const remove = (key: string) => {
    const next = drafts.filter(d => d.key !== key)
    if (!next.length) return onClose()
    setDrafts(next)
    if (profile === key) setProfile(null)
  }

  async function save() {
    setBusy(true)
    let n = 0
    for (const d of drafts) {
      try {
        await upload.mutateAsync({ hid, catId, file: d.file, caption: d.caption.trim() || undefined, takenAt: takenAtFor(d.day, d.original), setAsProfile: profile === d.key })
        n++
        setDone(n)
      } catch (e) { toast.show(friendlyError(e) || 'That photo could not be read. Try a JPG or PNG.', 'bad') }
    }
    setBusy(false)
    if (n) toast.show(profile && n === drafts.length && n === 1 ? 'Profile photo updated' : `${n} photo${n === 1 ? '' : 's'} saved`, 'xp')
    onClose()
  }

  const one = drafts.length === 1
  return (
    <Sheet open onClose={busy ? () => {} : onClose} title={setAsProfile ? 'Profile photo' : one ? 'Add photo' : `Add ${drafts.length} photos`}
      footer={<Button className="w-full" loading={busy} onClick={() => void save()}>{busy ? `Saving ${done + 1} of ${drafts.length}` : one ? 'Save photo' : `Save ${drafts.length} photos`}</Button>}>
      <div className="divide-y divide-stone-100">
        {drafts.map(d => (
          <div key={d.key} className="flex gap-3 py-3">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-stone-100">
              <Preview file={d.file} />
              {!one && (
                <button type="button" onClick={() => remove(d.key)} aria-label="Remove photo" disabled={busy}
                  className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white"><X className="h-3.5 w-3.5" /></button>
              )}
              {profile === d.key && <span className="absolute inset-x-0 bottom-0 bg-paw-500 py-0.5 text-center text-[10px] font-semibold text-white">Profile</span>}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <PhotoDateFields day={d.day} onDay={day => set(d.key, { day })} dob={dob} estimate={cat.data?.dob_is_estimate} />
              <div className="flex gap-2">
                <Input value={d.caption} onChange={e => set(d.key, { caption: e.target.value })} placeholder="Caption" aria-label="Caption" maxLength={200} className="min-w-0 flex-1 px-2.5" />
                {!setAsProfile && (
                  <button type="button" onClick={() => setProfile(profile === d.key ? null : d.key)} aria-pressed={profile === d.key} aria-label="Use as profile photo"
                    className={cx('flex shrink-0 items-center justify-center rounded-xl border px-3', profile === d.key ? 'border-paw-500 bg-paw-50 text-paw-600' : 'border-stone-200 text-stone-400')}>
                    <Star className="h-5 w-5" weight={profile === d.key ? 'fill' : 'regular'} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Sheet>
  )
}

function Preview({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])
  return url ? <img src={url} alt="" className="h-full w-full object-cover" /> : null
}
