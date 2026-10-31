import { useQuery } from '@tanstack/react-query'
import { untypedDb } from '../../lib/supabase'
import { keys } from '../../lib/queryClient'
import type { TreatmentCourse } from '../../lib/types'
import type { CheckinRow, LitterRow, SymptomRow } from './classify'

export interface MissedDose { logged_at: string; medication_name: string }
export interface TrendData { symptoms: SymptomRow[]; litter: LitterRow[]; checkins: CheckinRow[]; missed: MissedDose[]; courses: TreatmentCourse[] }

/** Only the rows that mark a day as off. Quiet days need no rows. */
export function useTrendData(catId: string) {
  return useQuery({
    queryKey: keys.trends(catId),
    queryFn: async (): Promise<TrendData> => {
      const [sym, lit, chk, miss, crs] = await Promise.all([
        untypedDb.from('symptom_logs').select('logged_at, symptom, severity, started_on, ended_on, note').eq('cat_id', catId).order('logged_at').limit(1000),
        untypedDb.from('litter_logs').select('logged_at, stool, urine').eq('cat_id', catId)
          .or('stool.in.(diarrhea,blood),urine.in.(blood,none,frequent)').order('logged_at').limit(1000),
        untypedDb.from('daily_checkins').select('day, eating, litter, vomiting, energy, note').eq('cat_id', catId)
          .or('eating.neq.usual,litter.eq.changed,vomiting.is.true,energy.eq.low').order('day').limit(1000),
        untypedDb.from('medication_logs').select('logged_at, medication_name').eq('cat_id', catId).eq('skipped', true).order('logged_at').limit(500),
        untypedDb.from('treatment_courses').select('*').eq('cat_id', catId).order('started_on', { ascending: false }),
      ])
      for (const r of [sym, lit, chk, miss, crs]) if (r.error) throw r.error
      return {
        symptoms: sym.data as SymptomRow[], litter: lit.data as LitterRow[], checkins: chk.data as CheckinRow[],
        missed: miss.data as MissedDose[], courses: crs.data as TreatmentCourse[],
      }
    },
  })
}
