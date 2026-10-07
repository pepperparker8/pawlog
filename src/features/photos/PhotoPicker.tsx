import { useRef, type ReactNode } from 'react'
import { useToast } from '../../components/ui/Toast'
import { friendlyError } from '../../lib/errors'
import { useUploadPhoto } from './api'

/** Wraps any trigger with a hidden file input. On phones `capture` is left off so the user can pick camera or library. */
export function PhotoPicker({ hid, catId, setAsProfile, multiple, onDone, className, label, children }: {
  hid: string; catId: string; setAsProfile?: boolean; multiple?: boolean; onDone?: (n: number) => void
  className?: string; label: string; children: (busy: boolean) => ReactNode
}) {
  const input = useRef<HTMLInputElement>(null)
  const upload = useUploadPhoto()
  const toast = useToast()

  async function onPick(files: FileList | null) {
    if (!files?.length) return
    let n = 0
    const list = Array.from(files)
    for (const [i, f] of list.entries()) {
      try {
        await upload.mutateAsync({ hid, catId, file: f, setAsProfile: setAsProfile && i === 0, takenAt: new Date(f.lastModified || Date.now()).toISOString() })
        n++
      } catch (e) { toast.show(friendlyError(e) || 'That photo could not be read. Try a JPG or PNG.', 'bad') }
    }
    if (n) toast.show(setAsProfile ? '📸 New profile photo' : `📸 ${n > 1 ? `${n} memories` : 'Memory'} saved`, 'xp')
    onDone?.(n)
    if (input.current) input.current.value = ''
  }

  return (
    <>
      <input ref={input} type="file" accept="image/*" multiple={multiple} className="hidden" onChange={e => void onPick(e.target.files)} />
      <button type="button" aria-label={label} className={className} disabled={upload.isPending} onClick={() => input.current?.click()}>
        {children(upload.isPending)}
      </button>
    </>
  )
}
