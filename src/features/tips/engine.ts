import type { CatSummary, Pattern } from '../../lib/types'
import type { LifeStage, WeightStatusResult } from '../weight/status'

export type Coat = 'short' | 'semi-long' | 'long' | 'hairless'

export interface Audience {
  life_stage?: LifeStage[]
  coat?: Coat[]
  sex?: 'female' | 'male'
  neutered?: boolean
  breeds?: string[]
}

export interface CareTip {
  code: string
  kind: 'tip' | 'fact' | 'hint'
  topic: string
  icon: string | null
  title: string
  body: string
  audience: Audience
  trigger: string | null
  source: string
  source_url: string
  reviewed: string
}

export interface CatProfile {
  catId: string
  lifeStage: LifeStage
  coat: Coat | null
  sex: 'female' | 'male' | 'unknown'
  neutered: boolean | null
  breedCode: string | null
}

/** Most important first. Hints are shown in this order. */
export const TRIGGER_PRIORITY = [
  'missed_medication', 'symptom_repeat', 'appetite_drop', 'weight_drop', 'litter_change', 'quiet_cat',
  'underweight', 'bcs_low', 'overweight', 'bcs_high', 'weight_gain',
  'vaccine_due', 'parasite_due', 'vet_visit_soon', 'no_weight_30d', 'no_grooming_14d', 'growing', 'new_cat',
] as const

const DAY = 86_400_000
const WEIGH_GAP_DAYS = 30
const GROOM_GAP_DAYS = 14
const NEW_CAT_DAYS = 14
const DUE_SOON_DAYS = 14
const PATTERN_CODES = new Set(['weight_drop', 'weight_gain', 'symptom_repeat', 'appetite_drop', 'litter_change', 'missed_medication', 'quiet_cat'])

const olderThan = (iso: string | null | undefined, days: number, now: Date) => !iso || now.getTime() - new Date(iso).getTime() > days * DAY
const dueSoon = (iso: string | null | undefined, now: Date) => !!iso && new Date(iso).getTime() - now.getTime() <= DUE_SOON_DAYS * DAY

export interface TriggerInput {
  summary: Pick<CatSummary, 'cat_id' | 'last_weight_at' | 'last_grooming_at' | 'next_vaccine_due' | 'next_parasite_due'>
  createdAt?: string | null
  weight?: Pick<WeightStatusResult, 'status' | 'basis'> | null
  patterns?: Pick<Pattern, 'cat_id' | 'code'>[]
  now?: Date
}

/** Facts about this cat's logs that a hint can respond to. Nothing here is a diagnosis. */
export function catTriggers({ summary: s, createdAt, weight, patterns = [], now = new Date() }: TriggerInput): Set<string> {
  const t = new Set<string>()
  if (olderThan(s.last_weight_at, WEIGH_GAP_DAYS, now)) t.add('no_weight_30d')
  if (olderThan(s.last_grooming_at, GROOM_GAP_DAYS, now)) t.add('no_grooming_14d')
  if (dueSoon(s.next_vaccine_due, now)) t.add('vaccine_due')
  if (dueSoon(s.next_parasite_due, now)) t.add('parasite_due')
  if (createdAt && !olderThan(createdAt, NEW_CAT_DAYS, now)) t.add('new_cat')
  for (const p of patterns) if (p.cat_id === s.cat_id && PATTERN_CODES.has(p.code)) t.add(p.code)
  if (weight) {
    const bcs = weight.basis === 'vet_bcs' || weight.basis === 'owner_bcs'
    if (weight.status === 'OVERWEIGHT') t.add(bcs ? 'bcs_high' : 'overweight')
    if (weight.status === 'UNDERWEIGHT') t.add(bcs ? 'bcs_low' : 'underweight')
    if (weight.status === 'GROWING') t.add('growing')
  }
  return t
}

/** Every audience key that is set must match. Unknown cat details never match a specific audience. */
export function audienceMatches(a: Audience | null | undefined, p: CatProfile): boolean {
  if (!a) return true
  if (a.life_stage?.length && !a.life_stage.includes(p.lifeStage)) return false
  if (a.coat?.length && (!p.coat || !a.coat.includes(p.coat))) return false
  if (a.sex && a.sex !== p.sex) return false
  if (a.neutered != null && a.neutered !== p.neutered) return false
  if (a.breeds?.length && (!p.breedCode || !a.breeds.includes(p.breedCode))) return false
  return true
}

export function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}

export const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

function rotate<T>(list: T[], seed: string, offset = 0): T | null {
  return list.length ? list[(hash(seed) + offset) % list.length] : null
}

export interface PickOptions { now?: Date; dismissed?: ReadonlySet<string>; factOffset?: number; maxHints?: number }

export interface PickedTips {
  hints: CareTip[]
  breedInsight: CareTip | null
  fact: CareTip | null
  tip: CareTip | null
  factCount: number
}

export function pickTips(all: CareTip[], profile: CatProfile, triggers: Set<string>, o: PickOptions = {}): PickedTips {
  const now = o.now ?? new Date()
  const dismissed = o.dismissed ?? new Set<string>()
  const pool = all.filter(t => !dismissed.has(t.code) && audienceMatches(t.audience, profile))
  const rank = (c: string | null) => { const i = TRIGGER_PRIORITY.indexOf(c as never); return i < 0 ? TRIGGER_PRIORITY.length : i }

  const seen = new Set<string>()
  const hints = pool.filter(t => t.trigger && triggers.has(t.trigger))
    .sort((a, b) => rank(a.trigger) - rank(b.trigger) || Number(!!b.audience?.breeds?.length) - Number(!!a.audience?.breeds?.length))
    .filter(t => (seen.has(t.trigger!) ? false : (seen.add(t.trigger!), true)))
    .slice(0, o.maxHints ?? 2)

  const shown = new Set(hints.map(h => h.code))
  const seed = dayKey(now) + profile.catId
  const untriggered = pool.filter(t => !t.trigger && !shown.has(t.code))
  const breedInsight = rotate(untriggered.filter(t => t.audience?.breeds?.length), seed + 'breed')
  const facts = untriggered.filter(t => t.kind === 'fact' && t.code !== breedInsight?.code)
  const tips = untriggered.filter(t => t.kind === 'tip' && t.code !== breedInsight?.code)
  return { hints, breedInsight, fact: rotate(facts, seed + 'fact', o.factOffset), tip: rotate(tips, seed + 'tip'), factCount: facts.length }
}
