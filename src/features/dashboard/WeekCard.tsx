import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { CaretRight } from '../../components/icons'
import { Card, SectionTitle, cx } from '../../components/ui'
import { dateLabel, signedKg, kg, todayInput } from '../../lib/format'
import type { CatSummary } from '../../lib/types'
import { useWeights } from '../health/api'
import { useTrendData } from '../trends/api'
import { OFF_META, offDays } from '../trends/classify'
import { WEEK_DAYS, weekStart, weekSummary } from './weekly'

const short = (day: string) => format(parseISO(day), 'd MMM')

export function WeekSection({ cats }: { cats: CatSummary[] }) {
  if (!cats.length) return null
  const today = todayInput()
  return (
    <section>
      <SectionTitle action={<span className="text-xs text-stone-500">{short(weekStart(today))} to {short(today)}</span>}>This week</SectionTitle>
      <Card className="divide-y divide-stone-100 p-0">
        {cats.map(c => <WeekRow key={c.cat_id} cat={c} today={today} named={cats.length > 1} />)}
      </Card>
    </section>
  )
}

function WeekRow({ cat, today, named }: { cat: CatSummary; today: string; named: boolean }) {
  const weights = useWeights(cat.cat_id)
  const t = useTrendData(cat.cat_id)
  if (!weights.data || !t.data) return <div className="h-24 animate-pulse px-4 py-3" />
  const s = weekSummary({ weights: weights.data, days: offDays(t.data), missed: t.data.missed, courses: t.data.courses, today })
  return (
    <Link to={`/cats/${cat.cat_id}/trends`} className="block space-y-2.5 px-4 py-3 active:bg-stone-50">
      {named && (
        <div className="flex items-center justify-between">
          <span className="font-semibold">{cat.name}</span>
          <CaretRight className="h-4 w-4 text-stone-400" />
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 text-center">
        <Figure label="Weight"
          value={s.weight ? (s.weight.change != null ? signedKg(s.weight.change) : kg(s.weight.kg)) : 'Not weighed'}
          sub={s.weight ? (s.weight.change != null ? kg(s.weight.kg) : short(s.weight.day)) : s.lastWeighed ? `last ${dateLabel(s.lastWeighed)}` : undefined}
          muted={!s.weight} />
        <Figure label="Off days" value={`${s.offDays} of ${WEEK_DAYS}`} warn={s.offDays > 0} />
        <Figure label="Missed doses" value={String(s.missed)} warn={s.missed > 0} />
      </div>
      {s.byKind.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-600">
          {s.byKind.map(([k, n]) => (
            <span key={k} className="flex items-center gap-1.5"><span className={cx('h-2 w-2 rounded-full', OFF_META[k].dot)} />{OFF_META[k].label} {n}</span>
          ))}
        </div>
      )}
      {s.courses.map(c => (
        <div key={c.id} className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2 text-sm">
          <span className="truncate text-stone-700">{c.name}</span>
          <span className="shrink-0 text-xs font-semibold text-paw-600">Day {c.day}{c.of ? ` of ${c.of}` : ''}</span>
        </div>
      ))}
    </Link>
  )
}

function Figure({ label, value, sub, warn, muted }: { label: string; value: string; sub?: string; warn?: boolean; muted?: boolean }) {
  return (
    <div className="rounded-xl bg-stone-50 px-2 py-2">
      <div className={cx('text-sm font-bold', warn && 'text-amber-700', muted && 'font-medium text-stone-400')}>{value}</div>
      <div className="text-[11px] text-stone-500">{label}</div>
      {sub && <div className="text-[10px] text-stone-400">{sub}</div>}
    </div>
  )
}
