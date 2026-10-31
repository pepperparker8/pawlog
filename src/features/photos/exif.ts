/** Bytes read from the start of a file; EXIF sits in the first segment of a JPEG. */
export const EXIF_HEAD = 128 * 1024

const SOI = 0xffd8
const APP1 = 0xffe1
const SOS = 0xffda
/** "Exif" in ASCII. */
const EXIF = 0x45786966
const EXIF_IFD = 0x8769
const DATE_ORIGINAL = 0x9003
const DATE_TIME = 0x0132
const ASCII = 2
const ENTRY = 12

/**
 * The capture time stored in a JPEG's EXIF block, as a local ISO string without zone.
 * Null when the file has no EXIF date, which is common for photos sent through chat apps.
 */
export function exifDate(buf: ArrayBuffer): string | null {
  const v = new DataView(buf)
  if (v.byteLength < 4 || v.getUint16(0) !== SOI) return null
  let p = 2
  while (p + 4 <= v.byteLength) {
    const marker = v.getUint16(p)
    const size = v.getUint16(p + 2)
    if (marker === SOS || (marker & 0xff00) !== 0xff00) return null
    if (marker === APP1 && p + 8 <= v.byteLength && v.getUint32(p + 4) === EXIF) return readTiff(v, p + 10, p + 2 + size)
    p += 2 + size
  }
  return null
}

function readTiff(v: DataView, t: number, end: number): string | null {
  if (t + 8 > end || end > v.byteLength) return null
  const le = v.getUint16(t) === 0x4949
  const u16 = (o: number) => v.getUint16(t + o, le)
  const u32 = (o: number) => v.getUint32(t + o, le)
  const tags = (ifd: number) => {
    const out = new Map<number, number>()
    if (t + ifd + 2 > end) return out
    const n = u16(ifd)
    for (let i = 0; i < n; i++) {
      const e = ifd + 2 + i * ENTRY
      if (t + e + ENTRY > end) break
      out.set(u16(e), e)
    }
    return out
  }
  const text = (e: number) => {
    if (u16(e + 2) !== ASCII) return null
    const len = u32(e + 4)
    const at = t + (len > 4 ? u32(e + 8) : e + 8)
    if (at + len > end) return null
    let s = ''
    for (let i = 0; i < len; i++) { const c = v.getUint8(at + i); if (!c) break; s += String.fromCharCode(c) }
    return s
  }
  const ifd0 = tags(u32(4))
  const sub = ifd0.has(EXIF_IFD) ? tags(u32(ifd0.get(EXIF_IFD)! + 8)) : new Map<number, number>()
  const e = sub.get(DATE_ORIGINAL) ?? ifd0.get(DATE_TIME)
  const m = e != null ? /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/.exec(text(e) ?? '') : null
  if (!m || m[1] === '0000') return null
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`
}

export async function fileTakenAt(file: File): Promise<string | null> {
  try { return exifDate(await file.slice(0, EXIF_HEAD).arrayBuffer()) } catch { return null }
}
