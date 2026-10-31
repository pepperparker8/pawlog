import { describe, expect, it } from 'vitest'
import { bands, countDays, offDays, symptomKind } from './classify'

describe('symptomKind', () => {
  it('maps common wording to kinds', () => {
    expect(symptomKind('Loose stool')).toBe('diarrhea')
    expect(symptomKind('Diarrhoea')).toBe('diarrhea')
    expect(symptomKind('Vomited hairball')).toBe('vomiting')
    expect(symptomKind('Not eating')).toBe('appetite')
    expect(symptomKind('Lethargic')).toBe('energy')
    expect(symptomKind('Straining in litter box')).toBe('urine')
    expect(symptomKind('Fever')).toBe('sick')
  })
})

describe('offDays', () => {
  it('spreads a symptom across its start and end dates', () => {
    const days = offDays({ symptoms: [{ logged_at: '2026-10-05T08:00:00Z', symptom: 'Diarrhoea', started_on: '2026-10-03', ended_on: '2026-10-05' }] })
    expect(days.map(d => d.day)).toEqual(['2026-10-03', '2026-10-04', '2026-10-05'])
    expect(days[0].kinds).toEqual(['diarrhea'])
  })

  it('ignores a start date after the end date', () => {
    const days = offDays({ symptoms: [{ logged_at: '2026-10-05T08:00:00Z', symptom: 'Fever', started_on: '2026-10-09', ended_on: '2026-10-05' }] })
    expect(days.map(d => d.day)).toEqual(['2026-10-05'])
  })

  it('marks severe litter findings and check-ins', () => {
    const days = offDays({
      litter: [{ logged_at: '2026-10-10T08:00:00Z', stool: 'blood', urine: null }],
      checkins: [{ day: '2026-10-11', eating: 'none', litter: 'usual', vomiting: true, energy: 'low' }],
    })
    expect(days[0].items[0]).toMatchObject({ kind: 'diarrhea', severe: true })
    expect(days[1].kinds).toEqual(['vomiting', 'appetite', 'energy'])
    expect(days[1].items.find(i => i.kind === 'appetite')?.severe).toBe(true)
  })

  it('does not repeat the same item on one day', () => {
    const days = offDays({ litter: [
      { logged_at: '2026-10-10T08:00:00Z', stool: 'diarrhea', urine: null },
      { logged_at: '2026-10-10T18:00:00Z', stool: 'diarrhea', urine: null },
    ] })
    expect(days[0].items).toHaveLength(1)
  })
})

describe('bands and countDays', () => {
  const days = offDays({ checkins: [
    { day: '2026-10-01', eating: 'usual', litter: 'usual', vomiting: true, energy: 'usual' },
    { day: '2026-10-02', eating: 'usual', litter: 'usual', vomiting: true, energy: 'usual' },
    { day: '2026-10-05', eating: 'usual', litter: 'usual', vomiting: true, energy: 'low' },
  ] })

  it('joins consecutive days into one band', () => {
    expect(bands(days, ['vomiting'])).toEqual([
      { kind: 'vomiting', start: '2026-10-01', end: '2026-10-02' },
      { kind: 'vomiting', start: '2026-10-05', end: '2026-10-05' },
    ])
    expect(bands(days, ['energy'])).toHaveLength(1)
  })

  it('counts days in a trailing window', () => {
    const now = new Date('2026-10-05T12:00:00')
    expect(countDays(days, 'vomiting', 7, now)).toBe(3)
    expect(countDays(days, 'vomiting', 2, now)).toBe(1)
  })
})
