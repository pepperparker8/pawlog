import { describe, expect, it } from 'vitest'
import type { LabReport, LabResult } from '../../lib/types'
import { analyteHistory, formatRange, outsideCount, parseBound, parseValue, previousResult, rangeStatus, sortReports, trend } from './status'

const row = (o: Partial<LabResult>): LabResult => ({
  id: crypto.randomUUID(), report_id: 'r', cat_id: 'c', position: 0, panel: null, analyte: 'Creatinine', analyte_key: 'crea',
  value: 1, value_text: null, unit: 'mg/dL', ref_low: 0.8, ref_high: 2.4, ref_text: null, printed_flag: null, about: null, ...o,
})
const report = (id: string, sampled_on: string, rows: LabResult[], created_at = `${sampled_on}T10:00:00Z`): LabReport => ({
  id, household_id: 'h', cat_id: 'c', vet_visit_id: null, sampled_on, lab_name: null, storage_path: null, note: null, created_at,
  lab_results: rows.map(r => ({ ...r, report_id: id })),
})

describe('parseValue', () => {
  it('reads plain numbers with a decimal comma or point', () => {
    expect(parseValue('2,1')).toEqual({ value: 2.1, value_text: null })
    expect(parseValue(' 13.5 ')).toEqual({ value: 13.5, value_text: null })
  })
  it('keeps non-numeric results as printed', () => {
    expect(parseValue('Negative')).toEqual({ value: null, value_text: 'Negative' })
    expect(parseValue('<0.1')).toEqual({ value: null, value_text: '<0.1' })
    expect(parseValue('')).toEqual({ value: null, value_text: null })
  })
  it('accepts only plain numbers as bounds', () => {
    expect(parseBound('3,9')).toBe(3.9)
    expect(parseBound('n/a')).toBeNull()
  })
})

describe('rangeStatus', () => {
  it('compares against the printed interval, inclusive at both ends', () => {
    expect(rangeStatus(row({ value: 0.7 }))).toBe('low')
    expect(rangeStatus(row({ value: 0.8 }))).toBe('in')
    expect(rangeStatus(row({ value: 2.4 }))).toBe('in')
    expect(rangeStatus(row({ value: 2.5 }))).toBe('high')
  })
  it('handles one-sided intervals', () => {
    expect(rangeStatus(row({ value: 20, ref_low: null, ref_high: 14 }))).toBe('high')
    expect(rangeStatus(row({ value: 8, ref_low: 7, ref_high: null }))).toBe('in')
  })
  it('falls back to the printed flag only without an interval', () => {
    expect(rangeStatus(row({ value: 5, ref_low: null, ref_high: null, printed_flag: 'H' }))).toBe('high')
    expect(rangeStatus(row({ value: null, value_text: 'Positive', ref_low: null, ref_high: null, printed_flag: 'L' }))).toBe('low')
    expect(rangeStatus(row({ value: 1, printed_flag: 'H' }))).toBe('in')
    expect(rangeStatus(row({ value: 5, ref_low: null, ref_high: null }))).toBe('none')
  })
  it('counts rows outside range without scoring them', () => {
    expect(outsideCount([row({ value: 0.5 }), row({ value: 1 }), row({ value: 3 })])).toBe(2)
  })
})

describe('history and trend', () => {
  const reports = [
    report('b', '2026-10-16', [row({ value: 2.0 }), row({ analyte: 'Eosinophil', analyte_key: 'eos', value: 3, unit: '%' })]),
    report('a', '2026-09-01', [row({ value: 1.4 })]),
    report('c', '2026-10-30', [row({ value: 1.6 }), row({ analyte: 'Eosinophil', analyte_key: 'eos', value: 0.4, unit: '10^3/uL' })]),
  ]
  it('sorts newest first', () => {
    expect(sortReports(reports).map(r => r.id)).toEqual(['c', 'b', 'a'])
  })
  it('lists one analyte oldest first', () => {
    expect(analyteHistory(reports, { analyte: 'Creatinine', analyte_key: 'crea' }).map(h => h.row.value)).toEqual([1.4, 2.0, 1.6])
  })
  it('finds the previous result and its direction', () => {
    const cur = reports[2].lab_results[0]
    const prev = previousResult(reports, 'c', cur)
    expect(prev?.row.value).toBe(2.0)
    expect(trend(cur.value, prev!.row.value)).toBe('down')
    expect(previousResult(reports, 'a', reports[1].lab_results[0])).toBeNull()
  })
  it('does not trend across different units', () => {
    expect(previousResult(reports, 'c', reports[2].lab_results[1])).toBeNull()
  })
  it('matches unlisted analytes by name', () => {
    const rs = [report('x', '2026-01-01', [row({ analyte: 'Feline Thing', analyte_key: 'other', value: 1 })]), report('y', '2026-02-01', [row({ analyte: 'feline thing', analyte_key: 'other', value: 1 })])]
    expect(trend(1, previousResult(rs, 'y', rs[1].lab_results[0])!.row.value)).toBe('same')
  })
  it('formats the printed range', () => {
    expect(formatRange(row({}))).toBe('0.8 - 2.4')
    expect(formatRange(row({ ref_low: null, ref_high: 1.6 }))).toBe('< 1.6')
    expect(formatRange(row({ ref_text: '0.8–2.4' }))).toBe('0.8–2.4')
  })
})
