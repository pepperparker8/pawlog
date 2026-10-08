import type { ReactNode } from 'react'

/**
 * PawLog's own two-tone glyphs on a 24 grid. Strokes use the current text colour,
 * `g-s` shapes take the tile's soft tint and `g-a` shapes its accent (see index.css).
 */
export type GlyphProps = { size?: number; className?: string; weight?: string }
export type Glyph = (p: GlyphProps) => ReactNode

const mk = (body: ReactNode): Glyph => function G({ size = 24, className }: GlyphProps) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}
      strokeLinecap="round" strokeLinejoin="round" className={className}>{body}</svg>
  )
}

const CAT_HEAD = 'M5 10V4.6l3.7 2.5a8.2 8.2 0 0 1 6.6 0L19 4.6V10a7 7 0 0 1 .5 2.6c0 4-3.4 7-7.5 7s-7.5-3-7.5-7A7 7 0 0 1 5 10z'
const toes = (pts: Array<[number, number]>, r = 0.85) => pts.map(([x, y]) => <circle key={`${x}-${y}`} className="g-a" stroke="none" cx={x} cy={y} r={r} />)

export const G = {
  feeding: mk(<>
    <path className="g-s" d="M3 12.5h18c0 3.9-3.8 6.5-9 6.5s-9-2.6-9-6.5z" />
    <path d="M9.5 19.2 9 20.5h6l-.5-1.3" />
    <path className="g-a" d="M9 9.6c1.3-1.7 3.8-1.7 5 0-1.2 1.7-3.7 1.7-5 0zM14 9.6l1.7-1.2v2.4z" strokeWidth={1.3} />
    <circle className="g-a" stroke="none" cx={6.6} cy={11} r={1} /><circle className="g-a" stroke="none" cx={17.6} cy={11} r={1} />
  </>),
  water: mk(<>
    <path className="g-s" d="M12 3.2c2.1 2.7 3.2 4.4 3.2 5.8a3.2 3.2 0 0 1-6.4 0c0-1.4 1.1-3.1 3.2-5.8z" />
    <path d="M4 14h16c0 3.4-3.3 5.8-8 5.8S4 17.4 4 14z" />
    <path className="g-as" d="M7.3 16.3c1.5.8 3.1.8 4.7 0s3.2-.8 4.7 0" />
    <circle className="g-a" stroke="none" cx={18} cy={6} r={1} />
  </>),
  litter: mk(<>
    <path className="g-s" d="M3.5 12.5h17l-1.6 6.3a1.5 1.5 0 0 1-1.5 1.2H6.6a1.5 1.5 0 0 1-1.5-1.2z" />
    <path d="M15.6 9.2 19.8 4" />
    <path className="g-a" d="m11.4 9.3 3-1.9 2.4 2.9-2.4 1.9z" strokeWidth={1.3} />
    <circle fill="currentColor" stroke="none" cx={6.8} cy={11.1} r={0.75} /><circle fill="currentColor" stroke="none" cx={9} cy={11.6} r={0.6} />
  </>),
  weight: mk(<>
    <path className="g-a" d="m7.4 6.6 1.1-3.1 2.3 3.1M13.2 6.6l2.3-3.1 1.1 3.1" strokeWidth={1.3} />
    <rect className="g-s" x={4} y={6.6} width={16} height={13.9} rx={3.2} />
    <path className="g-w" d="M8.3 14.6a3.7 3.7 0 0 1 7.4 0z" />
    <path d="m12 14.4 1.6-2" />
  </>),
  symptom: mk(<>
    <circle className="g-s" stroke="none" cx={18} cy={10.4} r={4.2} />
    <path d="M5.5 3.5v4a4.5 4.5 0 0 0 9 0v-4M10 12v3a4 4 0 0 0 8 0v-1.6" />
    <circle fill="currentColor" stroke="none" cx={5.5} cy={3.5} r={1} /><circle fill="currentColor" stroke="none" cx={14.5} cy={3.5} r={1} />
    <ellipse className="g-a" cx={18} cy={11.3} rx={2.2} ry={1.8} strokeWidth={1.3} />
    {toes([[16.1, 8.6], [18, 7.7], [19.9, 8.6]])}
  </>),
  medication: mk(<>
    <g transform="rotate(-45 11 11)">
      <rect className="g-s" x={3.5} y={7.5} width={15} height={7} rx={3.5} />
      <path className="g-a" d="M11 7.5H7a3.5 3.5 0 0 0 0 7h4z" />
      <rect x={3.5} y={7.5} width={15} height={7} rx={3.5} />
      <path d="M11 7.5v7" />
    </g>
    <circle className="g-s" cx={18.2} cy={18.2} r={2.6} /><path d="m16.4 20 3.6-3.6" />
  </>),
  grooming: mk(<>
    <g transform="rotate(-35 12 10)">
      <rect className="g-s" x={4} y={5.5} width={10.5} height={5} rx={2} />
      <path d="M6 10.5v3M8.4 10.5v3M10.8 10.5v3M13.2 10.5v3" />
      <rect x={14.5} y={7} width={6} height={2} rx={1} />
    </g>
    <path className="g-as" d="M4 19.6c1-.9 2.1-.9 3.1 0M8.6 20.4c.8-.7 1.7-.7 2.5 0" />
  </>),
  activity: mk(<>
    <path d="M3.5 20.5 11.8 5" />
    <path d="M11.8 5c2.9 0 4.7 1.8 5 4.6" strokeWidth={1.2} strokeDasharray="0.1 2.2" />
    <path className="g-a" d="M16.6 9.6c2.6.2 4 2 3.6 5-2.6-.2-4-2-3.6-5z" strokeWidth={1.3} />
    <path d="m17.4 10.6 2 3.2" strokeWidth={1} />
    <circle className="g-s" cx={13.6} cy={17.8} r={2.7} />
    <path d="M11.3 16.6c1.5-.2 3 .4 4.3 2M12.3 20.2c.2-1.6 1.2-3 3.4-3.9" strokeWidth={1} />
  </>),
  behavior: mk(<>
    <path className="g-s" d={CAT_HEAD} />
    <path d="M8.8 12.8c.4-.6 1.3-.6 1.7 0M13.5 12.8c.4-.6 1.3-.6 1.7 0" />
    <path className="g-a" d="M11.2 14.6h1.6L12 15.5z" strokeWidth={1} />
    <path d="M10.6 16.4c.7.5 1.4.4 1.4-.6 0 1 .7 1.1 1.4.6" strokeWidth={1.2} />
  </>),
  journal: mk(<>
    <path className="g-s" d="M6 3.5h11a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6z" />
    <path d="M8.6 3.5v17M11.2 11h4.8M11.2 14h4.8M11.2 17h3" />
    <path className="g-a" d="M13.6 3.5v4.8l1.3-1 1.3 1V3.5" strokeWidth={1.3} />
  </>),
  photo: mk(<>
    <path className="g-a" d="m6.8 7.2 1-3 2.2 3M14 7.2l2.2-3 1 3" strokeWidth={1.3} />
    <rect className="g-s" x={3.5} y={7.2} width={17} height={12.6} rx={2.4} />
    <circle className="g-w" cx={12} cy={13.4} r={3.4} />
    <circle className="g-a" stroke="none" cx={12} cy={13.4} r={1.4} />
    <circle fill="currentColor" stroke="none" cx={17.4} cy={10} r={0.8} />
  </>),
  vet_visit: mk(<>
    <path d="M9 6.6V5.2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.4" />
    <path className="g-s" d="M4 9.6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18z" />
    <rect className="g-w" x={6.6} y={9.8} width={7.2} height={6.8} rx={1.6} />
    <path d="M9 9.8v6.8M11.4 9.8v6.8" strokeWidth={1.2} />
    <path className="g-as" d="M17 11.4v3.2M15.4 13h3.2" strokeWidth={2} />
  </>),
  vaccination: mk(<>
    <g transform="rotate(-45 12 12)">
      <rect className="g-s" x={6} y={9.4} width={10} height={5.2} rx={1.2} />
      <rect className="g-a" stroke="none" x={10.6} y={10.4} width={4.6} height={3.2} rx={0.6} />
      <rect x={6} y={9.4} width={10} height={5.2} rx={1.2} />
      <path d="M6 12H3.4M3.4 10v4M16 12h4.8M8.6 9.4v1.7M11 9.4v1.7M13.4 9.4v1.7" />
    </g>
  </>),
  parasite: mk(<>
    <path className="g-s" d="M12 3.4 19 6v5.5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z" />
    <ellipse className="g-a" cx={12} cy={13} rx={2} ry={2.6} strokeWidth={1.3} />
    <path d="m9.9 11.6-1.4-.7M14.1 11.6l1.4-.7M9.9 14l-1.4.5M14.1 14l1.4.5M11.2 10.2l-.6-1.1M12.8 10.2l.6-1.1" strokeWidth={1.2} />
  </>),
  care_task: mk(<>
    <rect className="g-s" x={3.5} y={5} width={17} height={15.5} rx={2.6} />
    <path d="M3.5 9.6h17M8 3.4v3.2M16 3.4v3.2" />
    <ellipse className="g-a" stroke="none" cx={12} cy={16.4} rx={2} ry={1.6} />
    {toes([[9.7, 14], [11.2, 12.8], [12.8, 12.8], [14.3, 14]], 0.8)}
  </>),
  milestone: mk(<>
    <path className="g-s" d="m9 14.2-1.6 6.3 2.6-1.2 1.6 1.9.4-4.5M15 14.2l1.6 6.3-2.6-1.2-1.6 1.9-.4-4.5" />
    <circle className="g-s" cx={12} cy={9.5} r={5.6} />
    <path className="g-a" d="M12 6.8l.71 1.72 1.86.15-1.41 1.21.43 1.8L12 10.71l-1.59.97.43-1.8-1.41-1.21 1.86-.15z" strokeWidth={1} />
  </>),
  growth: mk(<>
    <path d="M12 20.5V11.2M7.5 20.5h9" />
    <path className="g-s" d="M12 13.4c-4 .3-6.5-2-6.5-5.5 4 0 6.5 2 6.5 5.5z" />
    <path className="g-a" d="M12 11.2c0-3.6 2.4-6.2 6.5-6.2 0 3.9-2.6 6.2-6.5 6.2z" />
  </>),
  cat: mk(<>
    <path className="g-s" d={CAT_HEAD} />
    <path className="g-a" d="M6.6 6.9V8.6M17.4 6.9V8.6" strokeWidth={1.8} />
    <ellipse fill="currentColor" stroke="none" cx={9.3} cy={12.7} rx={0.85} ry={1.15} />
    <ellipse fill="currentColor" stroke="none" cx={14.7} cy={12.7} rx={0.85} ry={1.15} />
    <path className="g-a" d="M11.2 14.8h1.6l-.8.9z" strokeWidth={1} />
    <path d="M3 13.6h3M3.4 15.8l2.6-.7M21 13.6h-3M20.6 15.8 18 15.1" strokeWidth={1.1} />
  </>),

  training: mk(<>
    <rect className="g-s" x={4} y={8.5} width={10} height={11.5} rx={4} />
    <circle className="g-a" cx={9} cy={13} r={2.1} strokeWidth={1.3} />
    <path d="M14 11.5c3-.9 5.2.3 6 3" />
    <path className="g-as" d="m16.6 4-1 2.2M19.8 6.6l-2.1.9M13.4 3.4l.2 2.3" />
  </>),
  firstAid: mk(<>
    <path d="M9 7V5.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V7" />
    <rect className="g-s" x={3.5} y={7} width={17} height={13} rx={2.6} />
    <path className="g-a" d="M10.6 10.1h2.8v1.7h1.7v2.8h-1.7v1.7h-2.8v-1.7H8.9v-2.8h1.7z" strokeWidth={1.3} />
  </>),
  massage: mk(<>
    <path className="g-a" d="M12 12.2s-4.4-2.6-4.4-5.5A2.3 2.3 0 0 1 12 5.6a2.3 2.3 0 0 1 4.4 1.1c0 2.9-4.4 5.5-4.4 5.5z" strokeWidth={1.3} />
    <path className="g-s" d="M3.4 15h3.1l3.2 1.2h3.6a1.4 1.4 0 0 1 1.3 1.9l3.1-1.6a1.4 1.4 0 0 1 1.6 2.3l-4.3 2.7H8l-2.5-1.4H3.4z" />
    <path d="M10 19h3.3" strokeWidth={1.2} />
  </>),
  mind: mk(<>
    <path className="g-a" d="m8.4 5.8-.5-2.7 2.4 1.3M15.6 5.8l.5-2.7-2.4 1.3" strokeWidth={1.3} />
    <path className="g-s" d="M12 3.6a5.6 5.6 0 0 0-3.3 10.1c.5.4.8 1 .8 1.6v.6h5v-.6c0-.6.3-1.2.8-1.6A5.6 5.6 0 0 0 12 3.6z" />
    <path d="M9.8 18.4h4.4M10.6 20.6h2.8" />
    <path className="g-as" d="m9.9 11.2 1-1 1.1 1 1.1-1 1 1" strokeWidth={1.3} />
  </>),
  health: mk(<>
    <path className="g-s" d="M12 20s-8-4.7-8-10.2a4.3 4.3 0 0 1 8-2.4 4.3 4.3 0 0 1 8 2.4C20 15.3 12 20 12 20z" />
    <path className="g-as" d="M5 12.6h3l1.5-2.6 2.5 4.6 1.6-3 1 1h4.4" strokeWidth={1.7} />
  </>),

  paw: mk(<>
    <path className="g-s" d="M12 11.5c2.6 0 5.5 3.3 5.5 5.9 0 1.9-1.6 2.6-3 2.3-1-.2-1.6-.6-2.5-.6s-1.5.4-2.5.6c-1.4.3-3-.4-3-2.3 0-2.6 2.9-5.9 5.5-5.9z" />
    {toes([[6, 10.2], [9.4, 6.6], [14.6, 6.6], [18, 10.2]], 1.7)}
  </>),
  chart: mk(<>
    <path className="g-s" stroke="none" d="m7 15 3.5-4 3 2.5L19 7v12.5H7z" />
    <path d="M4 4v16h16" />
    <path className="g-as" d="m7 15 3.5-4 3 2.5L19 7" strokeWidth={1.8} />
    <circle className="g-a" stroke="none" cx={19} cy={7} r={1.6} />
  </>),
  flame: mk(<>
    <path className="g-s" d="M12 3.4c.5 3 3.5 4.6 3.5 4.6 2 1.6 3 3.7 3 6a6.5 6.5 0 0 1-13 0c0-2.2.9-3.8 2.3-5 .2 1.6 1 2.6 2.2 3 0-3.2.6-6.3 2-8.6z" />
    <path className="g-a" stroke="none" d="M12 19.8a2.8 2.8 0 0 1-2.8-2.8c0-1.6 1.2-2.7 2.8-4.2 1.6 1.5 2.8 2.6 2.8 4.2a2.8 2.8 0 0 1-2.8 2.8z" />
  </>),
  crown: mk(<>
    <path className="g-s" d="m4 8.6 4 3.5 4-6 4 6 4-3.5-1.6 10H5.6z" />
    <path d="M6 15.6h12" strokeWidth={1.2} />
    <circle className="g-a" stroke="none" cx={4} cy={8.6} r={1.2} /><circle className="g-a" stroke="none" cx={12} cy={6.1} r={1.2} /><circle className="g-a" stroke="none" cx={20} cy={8.6} r={1.2} />
  </>),
  star: mk(<>
    <path className="g-s" d="M12 4l2.25 5.41 5.83.46-4.44 3.81 1.36 5.7L12 16.32l-5 3.06 1.36-5.7-4.44-3.81 5.83-.46z" />
    <path className="g-as" d="M19.5 2.6v3M18 4.1h3" />
  </>),
  home: mk(<>
    <path className="g-s" d="m4 11 8-6.6 8 6.6v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z" />
    <path className="g-a" d="M10 20.5V16a2 2 0 0 1 4 0v4.5" strokeWidth={1.3} />
  </>),
  cake: mk(<>
    <rect className="g-s" x={4.5} y={11} width={15} height={9} rx={2} />
    <path d="M4.5 14.2c1.25 1 2.5 1 3.75 0s2.5-1 3.75 0 2.5 1 3.75 0 2.5-1 3.75 0M12 11V7.8" />
    <path className="g-a" stroke="none" d="M12 3.4c1 1.2 1.4 2 1.4 2.6a1.4 1.4 0 0 1-2.8 0c0-.6.4-1.4 1.4-2.6z" />
  </>),
  bug: mk(<>
    <ellipse className="g-s" cx={12} cy={14} rx={4.2} ry={5.4} />
    <circle className="g-a" cx={12} cy={7.2} r={2.1} strokeWidth={1.3} />
    <path d="M12 9.6v9.6M7.8 12.4 5 11M16.2 12.4 19 11M7.8 15.6 5 16.6M16.2 15.6l2.8 1M10.6 5.4 9.4 3.6M13.4 5.4l1.2-1.8" />
  </>),
  leaf: mk(<>
    <path className="g-s" d="M5 19c0-8 5-13.5 14.5-14 0 9.5-5.5 14.5-14.5 14z" />
    <path className="g-as" d="m5 19 8.5-8.5" strokeWidth={1.7} />
  </>),
  target: mk(<>
    <circle className="g-s" cx={12} cy={12} r={8.4} />
    <circle className="g-w" cx={12} cy={12} r={5} />
    <circle className="g-a" cx={12} cy={12} r={2} strokeWidth={1.3} />
  </>),
  medal: mk(<>
    <path className="g-s" d="M7.4 3.5h3l2.4 6.3h-3zM16.6 3.5h-3l-2.4 6.3h3z" />
    <circle className="g-s" cx={12} cy={15.2} r={5.2} />
    <path className="g-a" d="M12 12.7l.66 1.59 1.72.14-1.31 1.12.4 1.67L12 16.32l-1.47.9.4-1.67-1.31-1.12 1.72-.14z" strokeWidth={1} />
  </>),
  users: mk(<>
    <circle className="g-a" cx={16.6} cy={9.4} r={2.4} strokeWidth={1.3} />
    <path className="g-a" d="M15 14.4a4.6 4.6 0 0 1 6 4.4v.7h-4" strokeWidth={1.3} />
    <circle className="g-s" cx={9} cy={8.6} r={3.2} />
    <path className="g-s" d="M3.4 19.5a5.6 5.6 0 0 1 11.2 0z" />
  </>),

  bell: mk(<>
    <path className="g-s" d="M6 16.6V11a6 6 0 0 1 12 0v5.6l1.5 1.4h-15z" />
    <path className="g-a" d="M10 20a2 2 0 0 0 4 0z" strokeWidth={1.3} />
    <path d="M12 3.4V5" />
  </>),
  search: mk(<>
    <circle className="g-s" cx={10.5} cy={10.5} r={6.5} />
    <path d="m15.4 15.4 5 5" strokeWidth={2} />
    {toes([[8.6, 9.2], [10.5, 8.2], [12.4, 9.2]], 0.75)}
    <ellipse className="g-a" stroke="none" cx={10.5} cy={11.6} rx={1.6} ry={1.25} />
  </>),
  history: mk(<>
    <circle className="g-s" cx={12.5} cy={12} r={8} />
    <path d="M12.5 7.6V12l3 2" />
    <path className="g-as" d="M2.8 9.4 4.6 12l2.6-1.8" strokeWidth={1.6} />
  </>),
  book: mk(<>
    <path className="g-s" d="M3.5 5.5c2.9-.9 5.9-.6 8.5 1v13c-2.6-1.6-5.6-1.9-8.5-1z" />
    <path className="g-a" d="M20.5 5.5c-2.9-.9-5.9-.6-8.5 1v13c2.6-1.6 5.6-1.9 8.5-1z" strokeWidth={1.4} />
  </>),
  link: mk(<>
    <rect className="g-s" x={2.8} y={8.6} width={10} height={6.8} rx={3.4} />
    <rect className="g-a" x={11.2} y={8.6} width={10} height={6.8} rx={3.4} strokeWidth={1.4} />
  </>),
  check: mk(<>
    <circle className="g-s" cx={12} cy={12} r={8.4} />
    <path d="m8 12.4 2.8 2.8L16.2 9.6" strokeWidth={2} />
  </>),
  clipboard: mk(<>
    <rect className="g-s" x={5} y={5} width={14} height={15.5} rx={2.4} />
    <rect className="g-a" x={8.8} y={3.4} width={6.4} height={3.4} rx={1.2} strokeWidth={1.3} />
    <path d="M8.6 11h6.8M8.6 14h6.8M8.6 17h4" />
  </>),
  info: mk(<>
    <circle className="g-s" cx={12} cy={12} r={8.4} />
    <path d="M12 11v5.2" strokeWidth={2} />
    <circle className="g-a" stroke="none" cx={12} cy={7.9} r={1.3} />
  </>),
} satisfies Record<string, Glyph>
