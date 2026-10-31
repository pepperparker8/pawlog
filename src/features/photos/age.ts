import { addMonths, differenceInDays, differenceInMonths, format, parseISO } from 'date-fns'

const WEEK = 7
const YOUNG_WEEKS = 8
const YEAR = 12
/** Ages under this many months are counted in months, older ones in years. */
const MONTHS_UNTIL = 24
const MAX_YEARS = 25

const toDate = (iso: string) => parseISO(iso.length === 10 ? `${iso}T12:00:00` : iso)

/** Whole months between birth and the day a photo was taken; null when the photo predates the birth date. */
export function monthsAt(dob: string, at: string): number | null {
  const d = toDate(dob), t = toDate(at)
  if (differenceInDays(t, d) < 0) return null
  return differenceInMonths(t, d)
}

/** Age on a given day: weeks for the first two months, then months, then years and months. */
export function ageAt(dob: string, at: string, estimate = false): string | null {
  const m = monthsAt(dob, at)
  if (m == null) return null
  const p = estimate ? '~' : ''
  const days = differenceInDays(toDate(at), toDate(dob))
  if (days < YOUNG_WEEKS * WEEK && m < 2) return days < WEEK ? `${p}${days} d` : `${p}${Math.floor(days / WEEK)} wk`
  if (m < MONTHS_UNTIL) return `${p}${m} mo`
  const y = Math.floor(m / YEAR), r = m % YEAR
  return r ? `${p}${y} y ${r} mo` : `${p}${y} y`
}

/** Grid sections: one per month in the first year, then one per year. */
export function ageGroup(dob: string, at: string): { key: number; label: string } | null {
  const m = monthsAt(dob, at)
  if (m == null) return null
  if (m < 1) return { key: 0, label: 'First month' }
  if (m < YEAR) return { key: m, label: `${m} month${m === 1 ? '' : 's'}` }
  const y = Math.floor(m / YEAR)
  return { key: y * YEAR, label: `${y} year${y === 1 ? '' : 's'}` }
}

export const dateForAge = (dob: string, months: number) => format(addMonths(toDate(dob), months), 'yyyy-MM-dd')

/** Age choices in months: each month to two years, then each year. */
export const AGE_CHOICES: Array<{ months: number; label: string }> = [
  ...Array.from({ length: MONTHS_UNTIL }, (_, m) => ({ months: m, label: m === 0 ? 'Under 1 mo' : `${m} mo` })),
  ...Array.from({ length: MAX_YEARS - 1 }, (_, i) => ({ months: (i + 2) * YEAR, label: `${i + 2} y` })),
]

/** The choice an existing date falls under, so the age select can show it. */
export function choiceFor(dob: string, at: string): number | null {
  const m = monthsAt(dob, at)
  if (m == null) return null
  return m < MONTHS_UNTIL ? m : Math.floor(m / YEAR) * YEAR
}
