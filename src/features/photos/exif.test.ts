import { describe, expect, it } from 'vitest'
import { exifDate } from './exif'

/** A minimal JPEG: SOI, an APP1 EXIF segment with IFD0 -> Exif IFD -> DateTimeOriginal, then SOS. */
function jpeg(date: string | null, le = true, inIfd0 = false): ArrayBuffer {
  const tiff: number[] = []
  const u16 = (n: number) => (le ? [n & 0xff, n >> 8] : [n >> 8, n & 0xff])
  const u32 = (n: number) => (le ? [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, n >>> 24] : [n >>> 24, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff])
  const str = date ? [...date].map(c => c.charCodeAt(0)).concat(0) : []
  tiff.push(...(le ? [0x49, 0x49] : [0x4d, 0x4d]), ...u16(42), ...u32(8))
  if (inIfd0) {
    tiff.push(...u16(1), ...u16(0x0132), ...u16(2), ...u32(str.length), ...u32(26), ...u32(0), ...str)
  } else {
    // IFD0 at 8 with one entry pointing to the Exif IFD at 26; Exif IFD holds the date at 44.
    tiff.push(...u16(1), ...u16(0x8769), ...u16(4), ...u32(1), ...u32(26), ...u32(0))
    tiff.push(...u16(date ? 1 : 0))
    if (date) tiff.push(...u16(0x9003), ...u16(2), ...u32(str.length), ...u32(44))
    tiff.push(...u32(0), ...str)
  }
  const body = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff]
  const size = body.length + 2
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe1, size >> 8, size & 0xff, ...body, 0xff, 0xda, 0, 2]).buffer
}

describe('exifDate', () => {
  it('reads DateTimeOriginal in either byte order', () => {
    expect(exifDate(jpeg('2025:10:10 14:05:09'))).toBe('2025-10-10T14:05:09')
    expect(exifDate(jpeg('2026:01:12 08:00:00', false))).toBe('2026-01-12T08:00:00')
  })

  it('falls back to the IFD0 date', () => {
    expect(exifDate(jpeg('2025:07:01 10:00:00', true, true))).toBe('2025-07-01T10:00:00')
  })

  it('returns null without a usable date', () => {
    expect(exifDate(jpeg(null))).toBeNull()
    expect(exifDate(jpeg('0000:00:00 00:00:00'))).toBeNull()
    expect(exifDate(new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer)).toBeNull()
    expect(exifDate(new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0, 40]).buffer)).toBeNull()
  })
})
