import { differenceInDays, differenceInMonths, differenceInYears, format, formatDistanceToNowStrict, isToday, isYesterday, parseISO } from 'date-fns'

export function catAge(dob: string | null, estimate = false): string {
  if (!dob) return 'Age unknown'
  const d = parseISO(dob)
  const years = differenceInYears(new Date(), d)
  const months = differenceInMonths(new Date(), d) % 12
  const prefix = estimate ? '~' : ''
  if (years === 0) {
    if (months === 0) return `${prefix}${differenceInDays(new Date(), d)} days`
    return `${prefix}${months} mo`
  }
  return months ? `${prefix}${years} y ${months} mo` : `${prefix}${years} y`
}

export function ago(iso: string | null | undefined): string {
  if (!iso) return 'never'
  return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true })
}

export function dayLabel(iso: string): string {
  const d = parseISO(iso)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'EEE, d MMM yyyy')
}

export function timeLabel(iso: string): string {
  return format(parseISO(iso), 'HH:mm')
}

export function dateLabel(iso: string | null | undefined): string {
  return iso ? format(parseISO(iso), 'd MMM yyyy') : '—'
}

export function kg(n: number | null | undefined): string {
  return n == null ? '—' : `${Number(n).toFixed(2)} kg`
}

export function dueLabel(iso: string | null): { text: string; tone: 'ok' | 'soon' | 'overdue' | 'none' } {
  if (!iso) return { text: 'No date', tone: 'none' }
  const days = differenceInDays(parseISO(iso), new Date())
  if (days < 0) return { text: `${-days} d overdue`, tone: 'overdue' }
  if (days === 0) return { text: 'Due today', tone: 'soon' }
  if (days <= 7) return { text: `In ${days} d`, tone: 'soon' }
  return { text: dateLabel(iso), tone: 'ok' }
}

export function nowLocalInput(): string {
  const d = new Date()
  d.setSeconds(0, 0)
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16)
}

export function todayInput(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function initials(name: string): string {
  return name.split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase()
}
