import {
  ArrowLeftIcon, BellIcon, BookOpenIcon, BowlFoodIcon, BroomIcon, CalendarCheckIcon, CameraIcon, CaretDownIcon, CaretRightIcon, CatIcon,
  CheckIcon, CircleNotchIcon, ClipboardTextIcon, ClockCounterClockwiseIcon, CopyIcon, DotsThreeIcon, DropIcon, EyeIcon, FileTextIcon,
  FirstAidIcon, FirstAidKitIcon, GraduationCapIcon, HandHeartIcon, HeartIcon, HeartbeatIcon, HouseIcon, ImagesIcon, InfoIcon, LinkIcon,
  MagnifyingGlassIcon, NotePencilIcon, PencilSimpleIcon, PillIcon, PlantIcon, PlusIcon, PrinterIcon, ScalesIcon, ShieldCheckIcon,
  SignOutIcon, SmileyIcon, SparkleIcon, StarIcon, StethoscopeIcon, SyringeIcon, TargetIcon, TrashIcon, TrophyIcon, UsersIcon,
  WarningIcon, XIcon, YarnIcon, BrainIcon, LightbulbIcon, BugIcon, CakeIcon, ChartLineUpIcon, CrownIcon, FireIcon, LeafIcon, MedalIcon, PawPrintIcon, type Icon,
} from '@phosphor-icons/react'

const cx = (...c: Array<string | false | undefined>) => c.filter(Boolean).join(' ')

export type { Icon }
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
const TONE: Record<Tone, string> = {
  paw: 'bg-paw-50 text-paw-600', sky: 'bg-sky-50 text-sky-600', emerald: 'bg-emerald-50 text-emerald-600',
  violet: 'bg-violet-50 text-violet-600', rose: 'bg-rose-50 text-rose-600', amber: 'bg-amber-50 text-amber-600', stone: 'bg-stone-100 text-stone-600',
}

/** One icon and tint per care meaning, shared by quick log, timeline, profile and search. */
export const CARE = {
  feeding: { icon: BowlFoodIcon, tone: 'paw' },
  water: { icon: DropIcon, tone: 'sky' },
  litter: { icon: BroomIcon, tone: 'stone' },
  weight: { icon: ScalesIcon, tone: 'amber' },
  symptom: { icon: StethoscopeIcon, tone: 'sky' },
  medication: { icon: PillIcon, tone: 'rose' },
  grooming: { icon: SparkleIcon, tone: 'violet' },
  activity: { icon: YarnIcon, tone: 'violet' },
  behavior: { icon: SmileyIcon, tone: 'amber' },
  journal: { icon: NotePencilIcon, tone: 'stone' },
  photo: { icon: CameraIcon, tone: 'rose' },
  vet_visit: { icon: FirstAidKitIcon, tone: 'sky' },
  vaccination: { icon: SyringeIcon, tone: 'emerald' },
  parasite: { icon: ShieldCheckIcon, tone: 'emerald' },
  care_task: { icon: CalendarCheckIcon, tone: 'emerald' },
  milestone: { icon: TrophyIcon, tone: 'paw' },
  growth: { icon: PlantIcon, tone: 'emerald' },
  cat: { icon: CatIcon, tone: 'paw' },
} satisfies Record<string, { icon: Icon; tone: Tone }>
export type CareKey = keyof typeof CARE

export const TOPIC: Record<string, { icon: Icon; tone: Tone }> = {
  food: CARE.feeding, play: CARE.activity, training: { icon: GraduationCapIcon, tone: 'amber' }, 'first-aid': { icon: FirstAidIcon, tone: 'rose' },
  vet: CARE.symptom, massage: { icon: HandHeartIcon, tone: 'violet' }, mind: { icon: BrainIcon, tone: 'violet' }, grooming: CARE.grooming,
  health: { icon: HeartbeatIcon, tone: 'rose' },
}

/** Badge icon codes stored in the badges table. */
export const BADGE: Record<string, { icon: Icon; tone: Tone }> = {
  paw: { icon: PawPrintIcon, tone: 'paw' }, scale: CARE.weight, chart: { icon: ChartLineUpIcon, tone: 'emerald' }, bowl: CARE.feeding,
  sparkle: CARE.grooming, brush: CARE.grooming, camera: CARE.photo, pill: CARE.medication, stetho: CARE.symptom, shield: CARE.parasite,
  flame: { icon: FireIcon, tone: 'rose' }, crown: { icon: CrownIcon, tone: 'amber' }, star: { icon: StarIcon, tone: 'amber' }, cats: CARE.cat,
  home: { icon: HouseIcon, tone: 'sky' }, cake: { icon: CakeIcon, tone: 'rose' }, yarn: CARE.activity, bug: { icon: BugIcon, tone: 'emerald' },
  leaf: { icon: LeafIcon, tone: 'emerald' }, target: { icon: TargetIcon, tone: 'sky' },
}

/** Notification kinds written by notify_household. */
export const NOTICE: Record<string, { icon: Icon; tone: Tone }> = {
  level_up: CARE.milestone, badge: { icon: MedalIcon, tone: 'amber' }, reminder: CARE.care_task, symptom: CARE.symptom,
  medication: CARE.medication, vet_visit: CARE.vet_visit, vaccination: CARE.vaccination, care_task: CARE.care_task, member: { icon: UsersIcon, tone: 'stone' },
}

const SIZE = { sm: ['h-8 w-8 rounded-lg', 18], md: ['h-10 w-10 rounded-xl', 22], lg: ['h-12 w-12 rounded-2xl', 26], xl: ['h-16 w-16 rounded-3xl', 34] } as const

/** Tinted square holding a duotone glyph. */
export function IconTile({ icon: I, tone = 'paw', size = 'md', className }: { icon: Icon; tone?: Tone; size?: keyof typeof SIZE; className?: string }) {
  const [box, px] = SIZE[size]
  return <span aria-hidden className={cx('inline-flex shrink-0 items-center justify-center', box, TONE[tone], className)}><I size={px} weight="duotone" /></span>
}

export function CareTile({ kind, size, className }: { kind: string; size?: keyof typeof SIZE; className?: string }) {
  const m = CARE[kind as CareKey] ?? CARE.cat
  return <IconTile icon={m.icon} tone={m.tone} size={size} className={className} />
}

/** Inline duotone glyph in the care meaning's colour, for chips and compact rows. */
export function CareGlyph({ kind, size = 16, className }: { kind: string; size?: number; className?: string }) {
  const m = CARE[kind as CareKey] ?? CARE.cat
  return <m.icon aria-hidden size={size} weight="duotone" className={cx(TONE[m.tone].split(' ')[1], className)} />
}
