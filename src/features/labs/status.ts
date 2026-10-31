import type { LabReport, LabRow } from '../../lib/types'

/** Where a value sits against the lab's own printed interval. Computed here, never by the model. */
export type RangeStatus = 'low' | 'in' | 'high' | 'none'
export type Trend = 'up' | 'down' | 'same'

const NUMBER = /^[-+]?\d+(?:[.,]\d+)?$/

/** A typed result: plain numbers (decimal comma allowed) become `value`, anything else is kept as printed. */
export function parseValue(input: string): { value: number | null; value_text: string | null } {
  const t = input.trim()
  if (!t) return { value: null, value_text: null }
  if (NUMBER.test(t)) return { value: Number(t.replace(',', '.')), value_text: null }
  return { value: null, value_text: t }
}

export function parseBound(input: string): number | null {
  const t = input.trim()
  return NUMBER.test(t) ? Number(t.replace(',', '.')) : null
}

/** The lab's printed interval decides; a printed H/L flag is used only when no interval was printed. */
export function rangeStatus(r: Pick<LabRow, 'value' | 'ref_low' | 'ref_high' | 'printed_flag'>): RangeStatus {
  if (r.value != null && (r.ref_low != null || r.ref_high != null)) {
    if (r.ref_low != null && r.value < r.ref_low) return 'low'
    if (r.ref_high != null && r.value > r.ref_high) return 'high'
    return 'in'
  }
  const f = r.printed_flag?.trim().toLowerCase() ?? ''
  if (/^(h|hi|high|↑|\+)/.test(f)) return 'high'
  if (/^(l|lo|low|↓|-)/.test(f)) return 'low'
  return 'none'
}

export const isOutside = (s: RangeStatus) => s === 'low' || s === 'high'

export function outsideCount(rows: Array<Pick<LabRow, 'value' | 'ref_low' | 'ref_high' | 'printed_flag'>>): number {
  return rows.filter(r => isOutside(rangeStatus(r))).length
}

/** Units compare loosely (case, spaces, µ/u) so the same lab's results line up; different units never trend. */
export function unitKey(u: string | null): string {
  return (u ?? '').toLowerCase().replace(/\s+/g, '').replace(/[µμ]/g, 'u').replace(/\^/g, '')
}

const nameKey = (r: Pick<LabRow, 'analyte' | 'analyte_key'>) => r.analyte_key === 'other' ? `other:${r.analyte.trim().toLowerCase()}` : r.analyte_key
export const sameAnalyte = (a: Pick<LabRow, 'analyte' | 'analyte_key'>, b: Pick<LabRow, 'analyte' | 'analyte_key'>) => nameKey(a) === nameKey(b)

/** Newest report first; same-day reports by creation time. */
export function sortReports<T extends Pick<LabReport, 'sampled_on' | 'created_at'>>(reports: T[]): T[] {
  return [...reports].sort((a, b) => b.sampled_on.localeCompare(a.sampled_on) || b.created_at.localeCompare(a.created_at))
}

export interface HistoryPoint { report_id: string; sampled_on: string; row: LabRow }

/** Every saved result for one analyte, oldest first. */
export function analyteHistory(reports: LabReport[], target: Pick<LabRow, 'analyte' | 'analyte_key'>): HistoryPoint[] {
  const out: HistoryPoint[] = []
  for (const rep of sortReports(reports).reverse()) {
    const row = rep.lab_results.find(r => sameAnalyte(r, target))
    if (row) out.push({ report_id: rep.id, sampled_on: rep.sampled_on, row })
  }
  return out
}

/** The same analyte in the closest earlier report, if its unit matches. */
export function previousResult(reports: LabReport[], reportId: string, row: LabRow): HistoryPoint | null {
  const hist = analyteHistory(reports, row)
  const i = hist.findIndex(h => h.report_id === reportId)
  const prev = i > 0 ? hist[i - 1] : null
  if (!prev || prev.row.value == null || unitKey(prev.row.unit) !== unitKey(row.unit)) return null
  return prev
}

export function trend(current: number | null, previous: number | null): Trend | null {
  if (current == null || previous == null) return null
  return current > previous ? 'up' : current < previous ? 'down' : 'same'
}

export function formatValue(r: Pick<LabRow, 'value' | 'value_text'>): string {
  return r.value != null ? String(r.value) : r.value_text ?? ''
}

export function formatRange(r: Pick<LabRow, 'ref_low' | 'ref_high' | 'ref_text'>): string {
  if (r.ref_text) return r.ref_text
  if (r.ref_low != null && r.ref_high != null) return `${r.ref_low} - ${r.ref_high}`
  if (r.ref_high != null) return `< ${r.ref_high}`
  if (r.ref_low != null) return `> ${r.ref_low}`
  return ''
}
