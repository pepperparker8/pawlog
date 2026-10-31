import { checkinRedFlag, questionRedFlag } from './redflags'

describe('questionRedFlag', () => {
  it('matches English and Indonesian emergency wording', () => {
    expect(questionRedFlag('She is breathing with an open mouth')?.code).toBe('breathing')
    expect(questionRedFlag('Dia sesak napas dari tadi')?.code).toBe('breathing')
    expect(questionRedFlag('He keeps straining to pee and nothing comes out')?.code).toBe('urinary_block')
    expect(questionRedFlag('gak bisa pipis sejak pagi')?.code).toBe('urinary_block')
    expect(questionRedFlag('tadi kejang 2 menit')?.code).toBe('seizure')
    expect(questionRedFlag('she licked a lily')?.code).toBe('toxin')
  })

  it('leaves ordinary questions alone', () => {
    expect(questionRedFlag('Is 4.2 kg a good weight for him?')).toBeNull()
    expect(questionRedFlag('Kenapa dia suka tidur di kardus?')).toBeNull()
    expect(questionRedFlag('Which wet food has less phosphorus?')).toBeNull()
  })
})

describe('checkinRedFlag', () => {
  it('flags two consecutive days not eating', () => {
    expect(checkinRedFlag([{ day: '2026-10-30', eating: 'none' }, { day: '2026-10-31', eating: 'none' }])?.code).toBe('not_eating')
  })

  it('needs the latest day and the day before', () => {
    expect(checkinRedFlag([{ day: '2026-10-31', eating: 'none' }])).toBeNull()
    expect(checkinRedFlag([{ day: '2026-10-29', eating: 'none' }, { day: '2026-10-31', eating: 'none' }])).toBeNull()
    expect(checkinRedFlag([{ day: '2026-10-30', eating: 'none' }, { day: '2026-10-31', eating: 'less' }])).toBeNull()
  })
})
