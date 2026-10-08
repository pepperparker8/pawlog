import type { ReactNode } from 'react'

/** Flat scene per Learn topic, drawn on a 320 x 160 canvas with the ground at y 138. */

const C = {
  fur: '#f6893a', furLight: '#fbb47a', stripe: '#d9621c', cream: '#fff6ea', ink: '#3f3a36', nose: '#e0785a',
  sage: '#9fbf98', sageDark: '#7fa678', sageLight: '#e4efe0', sky: '#8fc3e6', skyLight: '#e3f0f8', blush: '#fff0e3',
  clay: '#ecdcc8', clayDark: '#dcc5ac', line: '#ead9c6', shadow: '#f3ede6', skin: '#f2c6a2',
}

const BLOB = [
  'M92 58C104 22 168 14 214 30C258 46 262 98 236 122C208 146 128 146 100 128C74 112 82 82 92 58Z',
  'M86 88C80 50 116 24 160 26C206 28 246 46 248 84C250 120 212 140 164 140C118 140 92 124 86 88Z',
  'M104 44C132 18 196 20 228 46C256 70 248 116 214 132C176 148 118 142 96 118C76 96 82 64 104 44Z',
]

function Head({ eyes = 'open', tilt = 0 }: { eyes?: 'open' | 'closed'; tilt?: number }) {
  return (
    <g transform={`rotate(${tilt})`}>
      <path d="M-17 -6L-15 -25L-3 -14Z" fill={C.fur} />
      <path d="M17 -6L15 -25L3 -14Z" fill={C.fur} />
      <path d="M-14 -9L-13.5 -20L-7 -14Z" fill={C.furLight} />
      <path d="M14 -9L13.5 -20L7 -14Z" fill={C.furLight} />
      <ellipse rx="20" ry="17" fill={C.fur} />
      <path d="M-4 -16l1 6M0 -17v7M4 -16l-1 6" stroke={C.stripe} strokeWidth="2.2" strokeLinecap="round" />
      <ellipse cy="6" rx="10" ry="6.5" fill={C.cream} />
      {eyes === 'open'
        ? <><circle cx="-7" cy="-1" r="2.2" fill={C.ink} /><circle cx="7" cy="-1" r="2.2" fill={C.ink} /></>
        : <path d="M-10 -1q3 2.5 6 0M4 -1q3 2.5 6 0" stroke={C.ink} strokeWidth="1.8" strokeLinecap="round" fill="none" />}
      <path d="M-2 3h4l-2 2.4Z" fill={C.nose} />
      <path d="M-11 6h-8M-11 9l-7 2M11 6h8M11 9l7 2" stroke={C.ink} strokeOpacity=".3" strokeWidth="1" strokeLinecap="round" />
    </g>
  )
}

function SitCat({ x, y = 138, s = 1, eyes, tilt, tail = 'curl' }: { x: number; y?: number; s?: number; eyes?: 'open' | 'closed'; tilt?: number; tail?: 'curl' | 'question' }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={tail === 'curl' ? 'M20 -3C46 -2 50 -30 38 -40' : 'M20 -3C40 -4 40 -30 30 -46C24 -56 36 -64 44 -58'} stroke={C.fur} strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M-24 0C-28 -34 -16 -56 0 -56C16 -56 28 -34 24 0Z" fill={C.fur} />
      <path d="M-25 -14q7 1 10 -3M-24 -27q7 1 9 -3M25 -14q-7 1 -10 -3M24 -27q-7 1 -9 -3" stroke={C.stripe} strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M-10 0C-12 -20 -7 -42 0 -44C7 -42 12 -20 10 0Z" fill={C.cream} />
      <ellipse cx="-8" cy="-1" rx="7" ry="4" fill={C.cream} />
      <ellipse cx="8" cy="-1" rx="7" ry="4" fill={C.cream} />
      <g transform="translate(0 -66)"><Head eyes={eyes} tilt={tilt} /></g>
    </g>
  )
}

function LieCat({ x, y = 138, s = 1, eyes = 'closed' }: { x: number; y?: number; s?: number; eyes?: 'open' | 'closed' }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M36 -8C54 -6 52 4 24 2" stroke={C.fur} strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M-34 0C-40 -26 -10 -36 14 -34C38 -32 46 -14 40 0Z" fill={C.fur} />
      <path d="M-4 -35q2 7 -1 11M8 -35q2 7 -1 11M20 -33q2 7 -1 10" stroke={C.stripe} strokeWidth="3" strokeLinecap="round" fill="none" />
      <ellipse cx="-42" cy="-3" rx="9" ry="4" fill={C.cream} />
      <ellipse cx="-29" cy="-2" rx="8" ry="3.5" fill={C.cream} />
      <g transform="translate(-34 -30)"><Head eyes={eyes} tilt={-8} /></g>
    </g>
  )
}

function Plant({ x, y = 138, s = 1 }: { x: number; y?: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 -24C-4 -40 -18 -48 -22 -44C-20 -34 -10 -28 0 -24Z" fill={C.sage} />
      <path d="M0 -24C4 -42 16 -52 22 -48C20 -36 10 -28 0 -24Z" fill={C.sage} />
      <path d="M0 -24C-2 -44 2 -60 6 -62C10 -50 6 -34 0 -24Z" fill={C.sageDark} />
      <path d="M-12 0L-14 -20H14L12 0Z" fill={C.clay} />
      <rect x="-15" y="-24" width="30" height="5" rx="2" fill={C.clayDark} />
    </g>
  )
}

function Bowl({ x, y = 138, fill }: { x: number; y?: number; fill: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {fill}
      <path d="M-22 -14H22C20 -3 14 0 0 0C-14 0 -20 -3 -22 -14Z" fill={C.sky} />
      <path d="M-22 -14H22" stroke="#bfe0f3" strokeWidth="3" strokeLinecap="round" />
    </g>
  )
}

const kibble = <g fill="#c07a44"><circle cx="-9" cy="-16" r="3.4" /><circle cx="-1" cy="-18" r="3.4" /><circle cx="7" cy="-16" r="3.4" /><circle cx="2" cy="-14" r="3" /></g>
const water = <ellipse cy="-14" rx="19" ry="3.5" fill="#cfe8f7" />

const SCENES: Record<string, { blob: [number, string]; art: ReactNode }> = {
  food: { blob: [1, C.blush], art: <><Plant x={92} /><SitCat x={158} tilt={6} /><Bowl x={214} fill={kibble} /></> },
  play: {
    blob: [0, C.sageLight],
    art: <>
      <Plant x={88} s={0.9} />
      <path d="M300 10L228 40" stroke={C.ink} strokeOpacity=".7" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M228 40C222 50 220 56 214 62" stroke={C.ink} strokeOpacity=".5" strokeWidth="1.2" fill="none" />
      <path d="M214 62C200 60 194 70 196 80C206 78 214 72 214 62Z" fill={C.furLight} />
      <path d="M214 62C220 72 218 82 210 88C206 80 208 70 214 62Z" fill={C.sage} />
      <SitCat x={150} tilt={-14} />
      <circle cx="226" cy="127" r="11" fill={C.sage} />
      <path d="M217 121c6 2 12 8 14 15M220 133c3-6 9-10 16-10M223 117c-1 6 1 13 6 19" stroke={C.sageDark} strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </>,
  },
  training: {
    blob: [2, C.skyLight],
    art: <>
      <path d="M296 28L198 62" stroke={C.clayDark} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="194" cy="64" r="6.5" fill={C.fur} />
      <SitCat x={142} tilt={-6} />
      <g transform="translate(232 138)">
        <rect x="-15" y="-32" width="30" height="32" rx="7" fill="#fff" stroke={C.sky} strokeWidth="2" />
        <rect x="-17" y="-39" width="34" height="8" rx="3.5" fill={C.sky} />
        <g fill="#c07a44"><circle cx="-6" cy="-8" r="3.2" /><circle cx="3" cy="-6" r="3.2" /><circle cx="7" cy="-13" r="3.2" /><circle cx="-3" cy="-15" r="3.2" /></g>
      </g>
      <g fill="#c07a44"><circle cx="186" cy="135" r="2.8" /><circle cx="194" cy="136.5" r="2.4" /></g>
    </>,
  },
  'first-aid': {
    blob: [1, '#fdeceb'],
    art: <>
      <rect x="82" y="128" width="132" height="12" rx="6" fill={C.sageLight} />
      <path d="M96 128v12M110 128v12M186 128v12M200 128v12" stroke="#fff" strokeWidth="2" />
      <LieCat x={150} y={130} />
      <g transform="translate(240 138)">
        <path d="M-8 -32v-6h16v6" stroke={C.clayDark} strokeWidth="3" fill="none" strokeLinejoin="round" />
        <rect x="-25" y="-33" width="50" height="33" rx="7" fill="#fff" stroke={C.line} strokeWidth="2" />
        <rect x="-3.5" y="-26" width="7" height="19" rx="1.5" fill={C.fur} />
        <rect x="-9.5" y="-20" width="19" height="7" rx="1.5" fill={C.fur} />
      </g>
      <circle cx="280" cy="130" r="8" fill={C.cream} stroke={C.line} strokeWidth="2" />
      <circle cx="280" cy="130" r="2.8" fill={C.line} />
    </>,
  },
  vet: {
    blob: [2, C.skyLight],
    art: <>
      <Plant x={78} s={0.85} />
      <SitCat x={130} />
      <g transform="translate(226 138)">
        <path d="M-14 -46C-14 -59 14 -59 14 -46" stroke="#76aed4" strokeWidth="4" fill="none" strokeLinecap="round" />
        <rect x="-34" y="-46" width="68" height="46" rx="10" fill={C.sky} />
        <rect x="-24" y="-37" width="36" height="29" rx="5" fill={C.skyLight} />
        <path d="M-15 -37v29M-6 -37v29M3 -37v29" stroke={C.sky} strokeWidth="2.5" />
        <circle cx="22" cy="-22" r="3" fill="#76aed4" />
      </g>
      <path d="M176 137C172 126 182 120 188 128C192 134 200 136 206 132" stroke="#78716c" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <circle cx="209" cy="131" r="4.5" fill="#e7e5e4" stroke="#78716c" strokeWidth="1.6" />
    </>,
  },
  massage: {
    blob: [0, C.blush],
    art: <>
      <ellipse cx="164" cy="132" rx="76" ry="10" fill="#fde3d0" />
      <LieCat x={170} y={130} />
      <path d="M108 78q4 -4 8 0M100 90q4 -4 8 0M118 66q4 -4 8 0" stroke={C.sage} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <g transform="translate(196 84) rotate(-26)">
        <rect x="30" y="-10" width="80" height="22" rx="10" fill={C.sky} />
        <path d="M-8 -8C4 -14 26 -12 34 -7L34 11C22 15 2 14 -8 8C-14 4 -14 -4 -8 -8Z" fill={C.skin} />
        <path d="M-6 -2h16M-6 4h16" stroke="#e0a982" strokeWidth="1.4" strokeLinecap="round" />
      </g>
    </>,
  },
  mind: {
    blob: [1, C.skyLight],
    art: <>
      <g transform="translate(222 0)">
        <rect x="-36" y="30" width="72" height="80" rx="8" fill={C.skyLight} stroke={C.line} strokeWidth="4" />
        <path d="M0 32v76M-34 70h68" stroke={C.line} strokeWidth="3" />
        <path d="M-24 52c0-5 7-7 10-3c2-4 10-3 10 2c4 0 4 6 0 6h-17c-4 0-5-5-3-5Z" fill="#fff" />
        <rect x="-42" y="110" width="84" height="6" rx="3" fill={C.clayDark} />
      </g>
      <Plant x={246} y={110} s={0.55} />
      <SitCat x={148} tilt={-12} tail="question" />
      <Plant x={86} s={0.8} />
    </>,
  },
  grooming: {
    blob: [2, C.blush],
    art: <>
      <Plant x={86} s={0.85} />
      <SitCat x={146} eyes="closed" tilt={4} />
      <g transform="translate(222 104) rotate(-24)">
        <rect x="2" y="-4" width="44" height="8" rx="4" fill={C.clayDark} />
        <rect x="-28" y="-10" width="32" height="20" rx="8" fill={C.sage} />
        <path d="M-22 10v4M-15 10v4M-8 10v4M-1 10v4" stroke={C.sageDark} strokeWidth="2" strokeLinecap="round" />
      </g>
      <path d="M196 96c3-4 8-4 9 0c-3 2-6 2-9 0Z" fill={C.furLight} />
      <g transform="translate(250 138)">
        <rect x="-18" y="-6" width="36" height="6" rx="2" fill={C.sky} />
        <path d="M-14 -6v-7M-9 -6v-7M-4 -6v-7M1 -6v-7M6 -6v-7M11 -6v-7M16 -6v-7" stroke={C.sky} strokeWidth="2" strokeLinecap="round" />
      </g>
    </>,
  },
  health: {
    blob: [0, C.sageLight],
    art: <>
      <g transform="translate(84 138)">
        <rect x="-15" y="-42" width="30" height="42" rx="3" fill="#fff" stroke={C.line} strokeWidth="2" />
        <rect x="-15" y="-42" width="6" height="42" rx="2" fill={C.sage} />
        <path d="M-4 -32h13M-4 -25h13M-4 -18h9" stroke={C.line} strokeWidth="2" strokeLinecap="round" />
      </g>
      <rect x="108" y="129" width="90" height="10" rx="5" fill="#e7e5e4" />
      <rect x="112" y="125" width="82" height="6" rx="3" fill={C.skyLight} />
      <SitCat x={153} y={126} />
      <Bowl x={234} fill={water} />
    </>,
  },
}

/** Decorative scene for an article topic; `crop` zooms to the centre and fills a fixed box. */
export function TopicArt({ topic, crop, className }: { topic: string; crop?: boolean; className?: string }) {
  const sc = SCENES[topic] ?? SCENES.health
  return (
    <svg aria-hidden viewBox={crop ? '64 24 192 120' : '0 0 320 160'} preserveAspectRatio={crop ? 'xMidYMid slice' : 'xMidYMid meet'} className={className}>
      <rect width="320" height="160" fill="#fff" />
      <path d={BLOB[sc.blob[0]]} fill={sc.blob[1]} />
      <ellipse cx="160" cy="139" rx="104" ry="4.5" fill={C.shadow} />
      {sc.art}
    </svg>
  )
}

export const ART_TOPICS = Object.keys(SCENES)
