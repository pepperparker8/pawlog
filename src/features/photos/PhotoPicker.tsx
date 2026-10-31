import { useRef, useState, type ReactNode } from 'react'
import { PhotoAddSheet } from './PhotoAddSheet'

/** Wraps any trigger with a hidden file input. On phones `capture` is left off so the user can pick camera or library. */
export function PhotoPicker({ hid, catId, setAsProfile, multiple, className, label, children }: {
  hid: string; catId: string; setAsProfile?: boolean; multiple?: boolean
  className?: string; label: string; children: ReactNode
}) {
  const input = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[] | null>(null)

  function onPick(list: FileList | null) {
    if (list?.length) setFiles(Array.from(list))
    if (input.current) input.current.value = ''
  }

  return (
    <>
      <input ref={input} type="file" accept="image/*" multiple={multiple} className="hidden" onChange={e => onPick(e.target.files)} />
      <button type="button" aria-label={label} className={className} onClick={() => input.current?.click()}>{children}</button>
      {files && <PhotoAddSheet hid={hid} catId={catId} files={files} setAsProfile={setAsProfile} onClose={() => setFiles(null)} />}
    </>
  )
}
