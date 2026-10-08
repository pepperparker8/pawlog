// Contextual weight status, computed on read. Never stored, never a diagnosis.
// Priority: recent vet body condition > vet target > owner target > recent owner body condition > breed reference.

export type WeightStatus = 'GROWING' | 'HEALTHY_MAINTENANCE' | 'UNDERWEIGHT' | 'OVERWEIGHT' | 'UNKNOWN'
export type Confidence = 'high' | 'medium' | 'low' | 'none'
export type Basis = 'vet_bcs' | 'vet_target' | 'owner_target' | 'owner_bcs' | 'breed_reference' | 'age' | 'none'
export type LifeStage = 'kitten' | 'adult' | 'senior' | 'unknown'

export interface WeightPoint { logged_at: string; weight_kg: number | string; body_condition_score?: number | null; body_condition_source?: 'vet' | 'owner' | null }
export interface BreedRef { sex: 'any' | 'female' | 'male'; min_kg: number | string; max_kg: number | string; source: string; source_url: string }
export interface Target { source: 'vet' | 'owner'; min_kg: number | string | null; max_kg: number | string | null; target_kg: number | string | null; set_on: string }

export interface StatusInput {
  dateOfBirth: string | null
  sex: 'female' | 'male' | 'unknown'
  weights: WeightPoint[]
  breedName?: string | null
  breedRefs?: BreedRef[]
  maturityMonths?: number | null
  targets?: Target[]
  now?: Date
}

export interface Band { min: number; max: number; ideal: number | null; label: string; source: string; sourceUrl?: string }

export interface WeightStatusResult {
  status: WeightStatus
  confidence: Confidence
  basis: Basis
  lifeStage: LifeStage
  ageMonths: number | null
  latestKg: number | null
  latestAt: string | null
  referenceRange: Band | null
  targetRange: Band | null
  reason: string
  source: string
  attention: string | null
  trend: Trend | null
}

export interface Trend { fromKg: number; toKg: number; deltaKg: number; pct: number; days: number }

const DAY = 86_400_000
const BCS_RECENT_DAYS = 180
const KITTEN_DEFAULT_MONTHS = 12
const SENIOR_MONTHS = 120
const TARGET_POINT_TOLERANCE = 0.05

const n = (v: number | string | null | undefined) => (v == null || v === '' ? null : Number(v))
const fmt = (v: number) => `${v.toFixed(v < 10 ? 2 : 1).replace(/0$/, '')} kg`

export function ageInMonths(dob: string | null, now = new Date()): number | null {
  if (!dob) return null
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return null
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()) - (now.getDate() < d.getDate() ? 1 : 0)
}

export function lifeStageOf(ageMonths: number | null, maturityMonths?: number | null): LifeStage {
  if (ageMonths == null) return 'unknown'
  if (ageMonths < (maturityMonths ?? KITTEN_DEFAULT_MONTHS)) return 'kitten'
  if (ageMonths > SENIOR_MONTHS) return 'senior'
  return 'adult'
}

function sorted(weights: WeightPoint[]) {
  return [...weights].sort((a, b) => a.logged_at.localeCompare(b.logged_at))
}

/** Change from the closest weigh-in at least `minDays` before the latest one. */
export function trendOver(weights: WeightPoint[], minDays: number): Trend | null {
  const w = sorted(weights)
  if (w.length < 2) return null
  const last = w[w.length - 1]
  const lastT = new Date(last.logged_at).getTime()
  let base: WeightPoint | null = null
  for (let i = w.length - 2; i >= 0; i--) {
    if (lastT - new Date(w[i].logged_at).getTime() >= minDays * DAY) { base = w[i]; break }
  }
  base ??= w[0]
  const fromKg = Number(base.weight_kg), toKg = Number(last.weight_kg)
  const days = Math.round((lastT - new Date(base.logged_at).getTime()) / DAY)
  if (days <= 0) return null
  return { fromKg, toKg, deltaKg: toKg - fromKg, pct: (toKg - fromKg) / fromKg, days }
}

/** Min and max over the last `days` days, counted back from the latest weigh-in. */
export function stability(weights: WeightPoint[], days: number) {
  const w = sorted(weights)
  if (!w.length) return null
  const lastT = new Date(w[w.length - 1].logged_at).getTime()
  const win = w.filter(p => lastT - new Date(p.logged_at).getTime() <= days * DAY)
  const firstT = new Date(win[0].logged_at).getTime()
  const kgs = win.map(p => Number(p.weight_kg))
  const min = Math.min(...kgs), max = Math.max(...kgs)
  return { min, max, count: win.length, spanDays: Math.round((lastT - firstT) / DAY), spreadPct: (max - min) / min }
}

function bandFromTarget(t: Target): Band | null {
  const min = n(t.min_kg), max = n(t.max_kg), ideal = n(t.target_kg)
  const who = t.source === 'vet' ? 'Vet target' : 'Owner target'
  if (min != null && max != null) return { min, max, ideal, label: who, source: who }
  if (ideal != null) return { min: ideal * (1 - TARGET_POINT_TOLERANCE), max: ideal * (1 + TARGET_POINT_TOLERANCE), ideal, label: who, source: who }
  if (min != null) return { min, max: Infinity, ideal, label: who, source: who }
  if (max != null) return { min: 0, max, ideal, label: who, source: who }
  return null
}

export function breedBand(refs: BreedRef[] | undefined, sex: StatusInput['sex'], breedName?: string | null): Band | null {
  if (!refs?.length) return null
  const pick = (sex !== 'unknown' && refs.find(r => r.sex === sex)) || refs.find(r => r.sex === 'any')
    || (sex === 'unknown' && refs.length > 1
      ? { sex: 'any' as const, min_kg: Math.min(...refs.map(r => Number(r.min_kg))), max_kg: Math.max(...refs.map(r => Number(r.max_kg))), source: refs[0].source, source_url: refs[0].source_url }
      : refs[0])
  const label = `Typical adult range${breedName ? `, ${breedName}` : ''}${pick.sex !== 'any' ? ` (${pick.sex})` : ''}`
  return { min: Number(pick.min_kg), max: Number(pick.max_kg), ideal: null, label, source: pick.source, sourceUrl: pick.source_url }
}

function classify(kg: number, band: Band): WeightStatus {
  if (kg < band.min) return 'UNDERWEIGHT'
  if (kg > band.max) return 'OVERWEIGHT'
  return 'HEALTHY_MAINTENANCE'
}

function fromBcs(score: number): WeightStatus {
  if (score <= 3) return 'UNDERWEIGHT'
  if (score >= 6) return 'OVERWEIGHT'
  return 'HEALTHY_MAINTENANCE'
}

export function getWeightStatus(input: StatusInput): WeightStatusResult {
  const now = input.now ?? new Date()
  const w = sorted(input.weights)
  const last = w[w.length - 1]
  const latestKg = last ? Number(last.weight_kg) : null
  const ageMonths = ageInMonths(input.dateOfBirth, now)
  // Life stage follows AAHA/AAFP (kitten under 12 months). Slow-maturing breeds keep filling out after that,
  // so a young adult below its breed's maturity age is treated as still growing unless a vet or owner says otherwise.
  const lifeStage = lifeStageOf(ageMonths)
  const maturing = lifeStage === 'adult' && ageMonths != null && input.maturityMonths != null && ageMonths < input.maturityMonths
  const referenceRange = breedBand(input.breedRefs, input.sex, input.breedName)
  const vetT = input.targets?.find(t => t.source === 'vet')
  const ownerT = input.targets?.find(t => t.source === 'owner')
  const targetBand = (vetT && bandFromTarget(vetT)) || (ownerT && bandFromTarget(ownerT)) || null
  const trend = trendOver(w, 14)

  const recentBcs = (src: 'vet' | 'owner') => [...w].reverse().find(p =>
    p.body_condition_score != null && p.body_condition_source === src && now.getTime() - new Date(p.logged_at).getTime() <= BCS_RECENT_DAYS * DAY)

  const base = { lifeStage, ageMonths, latestKg, latestAt: last?.logged_at ?? null, referenceRange, targetRange: targetBand, trend }

  let attention: string | null = null
  if (lifeStage === 'kitten' && trend && trend.deltaKg < 0) {
    attention = `Weight is ${fmt(-trend.deltaKg)} lower than ${trend.days} days ago. Kittens usually gain steadily, so this may be worth discussing with your veterinarian.`
  } else if (lifeStage !== 'kitten' && trend && trend.days <= 60 && trend.pct <= -0.05) {
    attention = `Weight is ${Math.round(-trend.pct * 100)}% lower than ${trend.days} days ago. Unplanned weight loss may be worth discussing with your veterinarian.`
  }

  if (latestKg == null) {
    return { ...base, status: 'UNKNOWN', confidence: 'none', basis: 'none', reason: 'No weigh-ins yet.', source: '', attention: null }
  }

  const vetBcs = recentBcs('vet')
  if (vetBcs) {
    const s = fromBcs(vetBcs.body_condition_score!)
    return { ...base, status: lifeStage === 'kitten' && s === 'HEALTHY_MAINTENANCE' ? 'GROWING' : s, confidence: 'high', basis: 'vet_bcs',
      reason: `Body condition ${vetBcs.body_condition_score}/9 from a vet assessment.`, source: 'Vet assessment', attention }
  }
  if (vetT && targetBand) {
    const s = classify(latestKg, targetBand)
    return { ...base, status: lifeStage === 'kitten' && s !== 'OVERWEIGHT' ? 'GROWING' : s, confidence: 'high', basis: 'vet_target',
      reason: rangeReason(latestKg, targetBand), source: 'Vet target', attention }
  }
  if (ownerT && targetBand) {
    const s = classify(latestKg, targetBand)
    return { ...base, status: lifeStage === 'kitten' && s !== 'OVERWEIGHT' ? 'GROWING' : s, confidence: 'medium', basis: 'owner_target',
      reason: rangeReason(latestKg, targetBand), source: 'Owner target', attention }
  }
  const ownerBcs = recentBcs('owner')
  if (ownerBcs) {
    const s = fromBcs(ownerBcs.body_condition_score!)
    return { ...base, status: lifeStage === 'kitten' && s === 'HEALTHY_MAINTENANCE' ? 'GROWING' : s, confidence: 'medium', basis: 'owner_bcs',
      reason: `Body condition ${ownerBcs.body_condition_score}/9 from your own observation.`, source: 'Owner observation', attention }
  }
  if (lifeStage === 'kitten') {
    const until = Math.max(input.maturityMonths ?? KITTEN_DEFAULT_MONTHS, KITTEN_DEFAULT_MONTHS)
    const reason = trend && trend.deltaKg > 0
      ? `Up ${fmt(trend.deltaKg)} over ${trend.days} days. Kittens are still growing until about ${until} months.`
      : `Still growing until about ${until} months. Regular weigh-ins show the growth curve.`
    return { ...base, status: 'GROWING', confidence: trend ? 'medium' : 'low', basis: 'age', reason, source: 'Age', attention }
  }
  if (maturing && !(referenceRange && latestKg > referenceRange.max)) {
    const who = input.breedName ?? 'This breed'
    const reason = `Young adult. ${who} often keeps filling out until about ${input.maturityMonths} months.${referenceRange ? ` ${rangeReason(latestKg, referenceRange)}` : ''}`
    return { ...base, status: 'GROWING', confidence: 'low', basis: 'age', reason, source: 'Age and breed', attention }
  }
  if (referenceRange && lifeStage !== 'unknown') {
    return { ...base, status: classify(latestKg, referenceRange), confidence: 'low', basis: 'breed_reference',
      reason: `${rangeReason(latestKg, referenceRange)} Breed ranges are broad; a vet check of body condition gives a better picture.`,
      source: referenceRange.source, attention }
  }
  const st = stability(w, 30)
  const reason = !referenceRange
    ? `Breed-specific reference unavailable. ${st && st.count > 1 ? `Weight ${fmt(st.min)} to ${fmt(st.max)} over the last ${st.spanDays} days.` : 'Add a vet or owner target to give weight some context.'}`
    : 'Add a date of birth to compare with the breed reference.'
  return { ...base, status: 'UNKNOWN', confidence: 'none', basis: 'none', reason, source: '', attention }
}

function rangeReason(kg: number, b: Band) {
  const r = Number.isFinite(b.max) && b.min > 0 ? `${fmt(b.min)} to ${fmt(b.max)}` : Number.isFinite(b.max) ? `up to ${fmt(b.max)}` : `from ${fmt(b.min)}`
  const where = kg < b.min ? 'below' : kg > b.max ? 'above' : 'inside'
  return `${fmt(kg)} is ${where} the ${b.label.charAt(0).toLowerCase()}${b.label.slice(1)} of ${r}.`
}

export interface StatusView { label: string; emoji: string; tone: 'ok' | 'warn' | 'neutral' }

export function statusView(r: Pick<WeightStatusResult, 'status' | 'basis' | 'trend'>): StatusView {
  const vs = r.basis === 'vet_bcs' || r.basis === 'owner_bcs' ? 'ideal body condition' : r.basis === 'breed_reference' ? 'breed range' : 'target'
  switch (r.status) {
    case 'GROWING': return { label: r.trend && r.trend.deltaKg > 0 ? 'Growing nicely' : 'Growing', emoji: '🌱', tone: 'ok' }
    case 'HEALTHY_MAINTENANCE': return { label: r.basis === 'breed_reference' ? 'Within breed range' : 'Steady is good', emoji: '⚖️', tone: 'ok' }
    case 'UNDERWEIGHT': return { label: `Below ${vs}`, emoji: '🌾', tone: 'warn' }
    case 'OVERWEIGHT': return { label: `Above ${vs}`, emoji: '🧭', tone: 'warn' }
    default: return { label: 'Needs context', emoji: '❔', tone: 'neutral' }
  }
}
