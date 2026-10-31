/** A picked lab paper: one page for a photo, any number for a PDF. Each page renders to a canvas. */
export interface LabSource { pages: number; render: (page: number) => Promise<HTMLCanvasElement> }
export interface Rect { x: number; y: number; w: number; h: number }

const MAX_SIDE = 2400
/** Kept under the model's per-image limit once base64-encoded. */
const MAX_BYTES = 3_500_000

function canvasOf(w: number, h: number) {
  const c = document.createElement('canvas'); c.width = Math.round(w); c.height = Math.round(h)
  return c
}

export async function loadSource(file: File): Promise<LabSource> {
  if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
    const [pdfjs, worker] = await Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')])
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default
    const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
    return {
      pages: doc.numPages,
      render: async n => {
        const page = await doc.getPage(n)
        const base = page.getViewport({ scale: 1 })
        const viewport = page.getViewport({ scale: Math.min(4, MAX_SIDE / Math.max(base.width, base.height)) })
        const canvas = canvasOf(viewport.width, viewport.height)
        await page.render({ canvas, viewport }).promise
        return canvas
      },
    }
  }
  // Drawing through a canvas drops EXIF (location, device) before anything leaves the phone.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = canvasOf(bitmap.width * scale, bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return { pages: 1, render: async () => canvas }
}

export function rotate(src: HTMLCanvasElement): HTMLCanvasElement {
  const c = canvasOf(src.height, src.width)
  const ctx = c.getContext('2d')!
  ctx.translate(c.width, 0); ctx.rotate(Math.PI / 2)
  ctx.drawImage(src, 0, 0)
  return c
}

const toBlob = (c: HTMLCanvasElement, q: number) =>
  new Promise<Blob>((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('Could not prepare the image'))), 'image/jpeg', q))

/** Crops to the kept area and re-encodes as JPEG, stepping quality down until it fits. */
export async function cropToJpeg(src: HTMLCanvasElement, r: Rect): Promise<Blob> {
  const scale = Math.min(1, MAX_SIDE / Math.max(r.w, r.h))
  const c = canvasOf(r.w * scale, r.h * scale)
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height)
  ctx.drawImage(src, r.x, r.y, r.w, r.h, 0, 0, c.width, c.height)
  let blob = await toBlob(c, 0.9)
  for (const q of [0.8, 0.7, 0.6]) {
    if (blob.size <= MAX_BYTES) break
    blob = await toBlob(c, q)
  }
  return blob
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const fr = new FileReader()
    fr.onload = () => res(String(fr.result).replace(/^data:[^,]*,/, ''))
    fr.onerror = () => rej(fr.error)
    fr.readAsDataURL(blob)
  })
}
