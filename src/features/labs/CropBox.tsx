import { useEffect, useRef, type PointerEvent } from 'react'
import type { Rect } from './image'

type Grip = 'move' | 'nw' | 'ne' | 'sw' | 'se'
const MIN = 0.08
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Drag the box or its corners over the page. `rect` is in fractions of the page so it survives rotation and resizing. */
export function CropBox({ canvas, rect, onChange }: { canvas: HTMLCanvasElement; rect: Rect; onChange: (r: Rect) => void }) {
  const host = useRef<HTMLDivElement>(null)
  const drag = useRef<{ grip: Grip; x: number; y: number; start: Rect } | null>(null)

  useEffect(() => {
    host.current?.prepend(canvas)
    return () => canvas.remove()
  }, [canvas])

  function down(grip: Grip) {
    return (e: PointerEvent) => {
      e.stopPropagation()
      ;(e.target as Element).setPointerCapture(e.pointerId)
      drag.current = { grip, x: e.clientX, y: e.clientY, start: rect }
    }
  }
  function move(e: PointerEvent) {
    const d = drag.current
    if (!d || !host.current) return
    const box = host.current.getBoundingClientRect()
    const dx = (e.clientX - d.x) / box.width, dy = (e.clientY - d.y) / box.height
    const s = d.start
    let { x, y, w, h } = s
    if (d.grip === 'move') {
      x = clamp(s.x + dx, 0, 1 - s.w); y = clamp(s.y + dy, 0, 1 - s.h)
    } else {
      const right = s.x + s.w, bottom = s.y + s.h
      if (d.grip.includes('w')) { x = clamp(s.x + dx, 0, right - MIN); w = right - x }
      if (d.grip.includes('e')) w = clamp(s.w + dx, MIN, 1 - s.x)
      if (d.grip.includes('n')) { y = clamp(s.y + dy, 0, bottom - MIN); h = bottom - y }
      if (d.grip.includes('s')) h = clamp(s.h + dy, MIN, 1 - s.y)
    }
    onChange({ x, y, w, h })
  }
  const up = () => { drag.current = null }

  const pct = (v: number) => `${v * 100}%`
  const corner = (g: Exclude<Grip, 'move'>) => (
    <div onPointerDown={down(g)} className="absolute flex h-9 w-9 items-center justify-center"
      style={{ [g.includes('n') ? 'top' : 'bottom']: -18, [g.includes('w') ? 'left' : 'right']: -18, cursor: `${g}-resize` }}>
      <span className="h-4 w-4 rounded-full border-2 border-white bg-paw-500 shadow" />
    </div>
  )
  return (
    <div className="flex justify-center">
      <div ref={host} className="relative touch-none select-none overflow-hidden rounded-xl bg-stone-100 [&>canvas]:block [&>canvas]:h-auto [&>canvas]:max-h-[52dvh] [&>canvas]:w-auto [&>canvas]:max-w-full" onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <div onPointerDown={down('move')} className="absolute cursor-move border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
          style={{ left: pct(rect.x), top: pct(rect.y), width: pct(rect.w), height: pct(rect.h) }}>
          {corner('nw')}{corner('ne')}{corner('sw')}{corner('se')}
        </div>
      </div>
    </div>
  )
}
