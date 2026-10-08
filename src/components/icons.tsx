import {
  ArrowLeftIcon, BellIcon, BookOpenIcon, BowlFoodIcon, CalendarCheckIcon, CameraIcon, CaretDownIcon, CaretRightIcon, CatIcon,
  CheckIcon, CircleNotchIcon, ClipboardTextIcon, ClockCounterClockwiseIcon, CopyIcon, DotsThreeIcon, EyeIcon, FileTextIcon,
  HeartIcon, HouseIcon, ImagesIcon, InfoIcon, LinkIcon,
  MagnifyingGlassIcon, PencilSimpleIcon, PlantIcon, PlusIcon, PrinterIcon, ScalesIcon,
  SignOutIcon, SparkleIcon, StarIcon, TargetIcon, TrashIcon, TrophyIcon, UsersIcon,
  WarningIcon, XIcon, LightbulbIcon, MedalIcon, PawPrintIcon, type Icon,
} from '@phosphor-icons/react'

import { G, type Glyph } from './glyphs'

const cx = (...c: Array<string | false | undefined>) => c.filter(Boolean).join(' ')

export type { Icon, Glyph }
export { G }
export {
  ArrowLeftIcon as ArrowLeft, BellIcon as Bell, BookOpenIcon as BookOpen, BowlFoodIcon as Bowl, CalendarCheckIcon as CalendarCheck,
  CameraIcon as Camera, CaretDownIcon as CaretDown, CaretRightIcon as CaretRight, CatIcon as Cat, CheckIcon as Check,
  CircleNotchIcon as CircleNotch, ClipboardTextIcon as Clipboard, ClockCounterClockwiseIcon as History, CopyIcon as Copy,
  DotsThreeIcon as Dots, EyeIcon as Eye, FileTextIcon as FileText, HeartIcon as Heart, HouseIcon as House, ImagesIcon as Images,
  InfoIcon as Info, LinkIcon as LinkGlyph, MagnifyingGlassIcon as Search, PencilSimpleIcon as Pencil, PlusIcon as Plus,
  PrinterIcon as Printer, ScalesIcon as Scales, PlantIcon as Sprout, SignOutIcon as SignOut, SparkleIcon as Sparkle, StarIcon as Star, TargetIcon as Target, TrashIcon as Trash,
  TrophyIcon as Trophy, UsersIcon as Users, LightbulbIcon as Lightbulb, MedalIcon as Medal, PawPrintIcon as PawPrint, WarningIcon as Warning, XIcon as X,
}

export type Tone = 'paw' | 'sky' | 'emerald' | 'violet' | 'rose' | 'amber' | 'stone'
/** Tile fill, ring, stroke colour and the `tone-*` class that feeds the glyph's soft and accent tints. */
const TONE: Record<Tone, [string, string]> = {
  paw: ['bg-paw-50 ring-paw-100', 'text-paw-600 tone-paw'], sky: ['bg-sky-50 ring-sky-100', 'text-sky-700 tone-sky'],
  emerald: ['bg-emerald-50 ring-emerald-100', 'text-emerald-700 tone-emerald'], violet: ['bg-violet-50 ring-violet-100', 'text-violet-600 tone-violet'],
  rose: ['bg-rose-50 ring-rose-100', 'text-rose-600 tone-rose'], amber: ['bg-amber-50 ring-amber-100', 'text-amber-700 tone-amber'],
  stone: ['bg-stone-50 ring-stone-200/70', 'text-stone-600 tone-stone'],
}

/** One glyph and tint per care meaning, shared by quick log, timeline, profile and search. */
export const CARE = {
  feeding: { icon: G.feeding, tone: 'paw' },
  water: { icon: G.water, tone: 'sky' },
  litter: { icon: G.litter, tone: 'stone' },
  weight: { icon: G.weight, tone: 'amber' },
  symptom: { icon: G.symptom, tone: 'sky' },
  medication: { icon: G.medication, tone: 'rose' },
  grooming: { icon: G.grooming, tone: 'violet' },
  activity: { icon: G.activity, tone: 'violet' },
  behavior: { icon: G.behavior, tone: 'amber' },
  journal: { icon: G.journal, tone: 'stone' },
  photo: { icon: G.photo, tone: 'rose' },
  vet_visit: { icon: G.vet_visit, tone: 'sky' },
  vaccination: { icon: G.vaccination, tone: 'emerald' },
  parasite: { icon: G.parasite, tone: 'emerald' },
  care_task: { icon: G.care_task, tone: 'emerald' },
  milestone: { icon: G.milestone, tone: 'paw' },
  growth: { icon: G.growth, tone: 'emerald' },
  cat: { icon: G.cat, tone: 'paw' },
} satisfies Record<string, { icon: Glyph; tone: Tone }>
export type CareKey = keyof typeof CARE

export const TOPIC: Record<string, { icon: Glyph; tone: Tone }> = {
  food: CARE.feeding, play: CARE.activity, training: { icon: G.training, tone: 'amber' }, 'first-aid': { icon: G.firstAid, tone: 'rose' },
  vet: CARE.symptom, massage: { icon: G.massage, tone: 'violet' }, mind: { icon: G.mind, tone: 'violet' }, grooming: CARE.grooming,
  health: { icon: G.health, tone: 'rose' },
}

/** Badge icon codes stored in the badges table. */
export const BADGE: Record<string, { icon: Glyph; tone: Tone }> = {
  paw: { icon: G.paw, tone: 'paw' }, scale: CARE.weight, chart: { icon: G.chart, tone: 'emerald' }, bowl: CARE.feeding,
  sparkle: CARE.grooming, brush: CARE.grooming, camera: CARE.photo, pill: CARE.medication, stetho: CARE.symptom, shield: CARE.parasite,
  flame: { icon: G.flame, tone: 'rose' }, crown: { icon: G.crown, tone: 'amber' }, star: { icon: G.star, tone: 'amber' }, cats: CARE.cat,
  home: { icon: G.home, tone: 'sky' }, cake: { icon: G.cake, tone: 'rose' }, yarn: CARE.activity, bug: { icon: G.bug, tone: 'emerald' },
  leaf: { icon: G.leaf, tone: 'emerald' }, target: { icon: G.target, tone: 'sky' },
}

/** Notification kinds written by notify_household. */
export const NOTICE: Record<string, { icon: Glyph; tone: Tone }> = {
  level_up: CARE.milestone, badge: { icon: G.medal, tone: 'amber' }, reminder: CARE.care_task, symptom: CARE.symptom,
  medication: CARE.medication, vet_visit: CARE.vet_visit, vaccination: CARE.vaccination, care_task: CARE.care_task, member: { icon: G.users, tone: 'stone' },
}

const SIZE = { sm: ['h-8 w-8 rounded-lg', 20], md: ['h-10 w-10 rounded-xl', 24], lg: ['h-12 w-12 rounded-2xl', 30], xl: ['h-16 w-16 rounded-3xl', 40] } as const

/** Tinted square holding a two-tone glyph. */
export function IconTile({ icon: I, tone = 'paw', size = 'md', className }: { icon: Glyph | Icon; tone?: Tone; size?: keyof typeof SIZE; className?: string }) {
  const [box, px] = SIZE[size]
  return <span aria-hidden className={cx('inline-flex shrink-0 items-center justify-center ring-1 ring-inset', box, TONE[tone][0], TONE[tone][1], className)}><I size={px} weight="duotone" /></span>
}

export function CareTile({ kind, size, className }: { kind: string; size?: keyof typeof SIZE; className?: string }) {
  const m = CARE[kind as CareKey] ?? CARE.cat
  return <IconTile icon={m.icon} tone={m.tone} size={size} className={className} />
}

/** Inline glyph in the care meaning's colour, for chips and compact rows. */
export function CareGlyph({ kind, size = 16, className }: { kind: string; size?: number; className?: string }) {
  const m = CARE[kind as CareKey] ?? CARE.cat
  return <m.icon size={size} className={cx('inline-block shrink-0', TONE[m.tone][1], className)} />
}
