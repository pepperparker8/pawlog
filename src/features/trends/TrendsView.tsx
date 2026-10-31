import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  addDays, addMonths, differenceInCalendarDays, eachDayOfInterval, eachMonthOfInterval, eachWeekOfInterval, endOfDay, endOfMonth, endOfWeek, format, isSameMonth,
  parseISO, startOfDay, startOfMonth, startOfWeek, subDays,
} from 'date-fns'
import { Button, Card, Chip, ErrorNote, SectionTitle, Spinner, cx } from '../../components/ui'
import { CalendarCheck, CaretRight, Clipboard, Scales, Sparkle, Sprout, Star, Target, type Icon } from '../../components/icons'
import { useHousehold } from '../../household/HouseholdProvider'
import { friendlyError } from '../../lib/errors'
import { dateLabel, kg, signedKg } from '../../lib/format'
import type { LabReport, TreatmentCourse, VetVisit } from '../../lib/types'
import { useCatHealth, useMilestones, useWeights } from '../health/api'
import { useLabs } from '../labs/api'
import { useWeightStatus } from '../weight/api'
import { WeightStatusCard } from '../weight/WeightStatusCard'
import { weightInsights } from '../growth/insights'
import { OFF_KINDS, OFF_META, bands, offDays, type OffDay, type OffKind } from './classify'
import { trendInsights, type InsightTone } from './insights'
import { useTrendData, type MissedDose } from './api'

const RANGES = [{ label: '1M', days: 30 }, { label: '3M', days: 90 }, { label: '6M', days: 180 }, { label: '1Y', days: 365 }, { label: 'All', days: 0 }]
const DOTS_UNTIL = 40
const WEEK = 7
const ASK_DAYS = 30
const MARK = { visit: '#57534e', lab: '#0284c7', course: '#f97316' }
const TONE_DOT: Record<InsightTone, string> = { act: 'bg-red-500', watch: 'bg-amber-500', info: 'bg-stone-300' }

interface Mark { day: string; kind: keyof typeof MARK; label: string }
const ms = (day: string) => parseISO(day).getTime()

function marksFor(visits: VetVisit[], labs: LabReport[], courses: TreatmentCourse[]): Mark[] {
  return [
    ...visits.map(v => ({ day: v.visited_on, kind: 'visit' as const, label: v.reason ? `Vet: ${v.reason}` : 'Vet visit' })),
    ...labs.map(l => ({ day: l.sampled_on, kind: 'lab' as const, label: l.lab_name ? `Lab: ${l.lab_name}` : 'Lab results' })),
    ...courses.flatMap(c => [
      { day: c.started_on, kind: 'course' as const, label: `${c.name} started` },
      ...(c.review_on ? [{ day: c.review_on, kind: 'course' as const, label: `${c.name} review` }] : []),
    ]),
  ]
}

export function TrendsView({ catId, catName }: { catId: string; catName: string }) {
  const w = useWeights(catId)
  const t = useTrendData(catId)
  const health = useCatHealth(catId)
  const labs = useLabs(catId)
  const milestones = useMilestones(catId)

  const days = useMemo(() => (t.data ? offDays(t.data) : []), [t.data])
  const marks = useMemo(() => marksFor(health.data?.visits ?? [], labs.data ?? [], t.data?.courses ?? []), [health.data, labs.data, t.data])
  const course = t.data?.courses.find(c => c.status === 'active') ?? null
  const weights = w.data ?? []

  if (w.isLoading || t.isLoading) return <Spinner />
  if (t.error) return <ErrorNote message={friendlyError(t.error)} />

  const now = new Date()
  const missedWeek = (t.data?.missed ?? []).filter(m => differenceInCalendarDays(now, parseISO(m.logged_at)) < WEEK).length
  const insights = trendInsights({ weights, days, course, missed: missedWeek, now })

  return (
    <div className="space-y-3">
      {course && <CourseCard course={course} weights={weights} missed={t.data?.missed ?? []} labs={labs.data ?? []} days={days} />}
      {weights.length > 0 && <WeightStatusCard catId={catId} />}
      {weights.length > 0 && <WeightStats weights={weights} />}
      <WeightChart catId={catId} weights={weights} days={days} marks={marks} />
      <OffCalendar days={days} marks={marks} />
      <Insights catId={catId} catName={catName} items={[...insights, ...weightInsights(weights, now).map(i => ({ code: i.code, tone: 'info' as const, text: i.text }))]} />
      {milestones.data && milestones.data.length > 0 && (
        <section aria-label="Milestones">
          <SectionTitle>Milestones</SectionTitle>
          <div className="flex flex-wrap gap-1">
            {[...milestones.data].sort((a, b) => b.reached_at.localeCompare(a.reached_at)).map(m => (
              <Chip key={m.id} tone="brand"><MilestoneGlyph code={m.code} />{m.label} · {dateLabel(m.reached_at)}</Chip>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

type WeightRow = { logged_at: string; weight_kg: number | string }

function CourseCard({ course, weights, missed, labs, days }: { course: TreatmentCourse; weights: WeightRow[]; missed: MissedDose[]; labs: LabReport[]; days: OffDay[] }) {
  const day = differenceInCalendarDays(new Date(), parseISO(course.started_on)) + 1
  const since = (iso: string) => iso.slice(0, 10) >= course.started_on
  const start = [...weights].reverse().find(r => !since(r.logged_at)) ?? weights.find(r => since(r.logged_at))
  const last = weights[weights.length - 1]
  const change = start && last && start !== last ? Number(last.weight_kg) - Number(start.weight_kg) : null
  const rows: Array<[string, string]> = [
    ['Missed doses', String(missed.filter(m => since(m.logged_at)).length)],
    ['Off days', String(days.filter(d => d.day >= course.started_on).length)],
    ['Weight', change == null ? '—' : signedKg(change)],
    ['Lab reports', String(labs.filter(l => l.sampled_on >= course.started_on).length)],
  ]
  return (
    <Card aria-label="Treatment course">
      <div className="flex items-baseline justify-between gap-2">
        <div className="min-w-0 truncate font-semibold">{course.name}</div>
        <div className="shrink-0 text-sm font-semibold text-paw-700">Day {day}{course.planned_days ? ` of ${course.planned_days}` : ''}</div>
      </div>
      {course.planned_days && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100">
          <div className="h-full rounded-full bg-paw-500" style={{ width: `${Math.min(100, day / course.planned_days * 100)}%` }} />
        </div>
      )}
      <div className="mt-3 grid grid-cols-4 gap-2 text-center">
        {rows.map(([label, value]) => (
          <div key={label}><div className="text-sm font-bold">{value}</div><div className="text-[10px] text-stone-500">{label}</div></div>
        ))}
      </div>
      <div className="mt-2 text-xs text-stone-500">Started {dateLabel(course.started_on)}{course.review_on ? ` · Review ${dateLabel(course.review_on)}` : ''}</div>
    </Card>
  )
}

function WeightStats({ weights }: { weights: WeightRow[] }) {
  const last = weights[weights.length - 1], prev = weights[weights.length - 2], first = weights[0]
  const delta = prev ? Number(last.weight_kg) - Number(prev.weight_kg) : 0
  return (
    <div className="grid grid-cols-3 gap-2">
      <Stat label="Latest" value={kg(Number(last.weight_kg))} sub={dateLabel(last.logged_at)} />
      <Stat label="Since last" value={signedKg(delta)} sub={prev ? dateLabel(prev.logged_at) : '—'} />
      <Stat label="Since first" value={signedKg(Number(last.weight_kg) - Number(first.weight_kg))} sub={dateLabel(first.logged_at)} />
    </div>
  )
}

const MAX_TICKS = 6

/** Week starts for short ranges, month starts otherwise, thinned to at most MAX_TICKS. */
function timeTicks(from: number, to: number, short: boolean) {
  const all = (short ? eachWeekOfInterval({ start: from, end: to }, { weekStartsOn: 1 }) : eachMonthOfInterval({ start: from, end: to }))
    .map(d => d.getTime()).filter(t => t >= from)
  const step = Math.ceil(all.length / MAX_TICKS)
  return all.filter((_, i) => i % step === 0)
}

function WeightChart({ catId, weights, days, marks }: { catId: string; weights: WeightRow[]; days: OffDay[]; marks: Mark[] }) {
  const [range, setRange] = useState(2)
  const [hidden, setHidden] = useState<Set<OffKind>>(new Set())
  const { result } = useWeightStatus(catId)

  const now = new Date()
  const span = RANGES[range].days
  const firstAt = Math.min(
    ...weights.slice(0, 1).map(p => parseISO(p.logged_at).getTime()),
    ...days.slice(0, 1).map(d => ms(d.day)),
    now.getTime(),
  )
  const from = span ? startOfDay(subDays(now, span)).getTime() : startOfDay(firstAt).getTime()
  const to = endOfDay(now).getTime()
  const inRange = (x: number) => x >= from && x <= to

  const points = weights.map(p => ({ t: parseISO(p.logged_at).getTime(), kg: Number(p.weight_kg) })).filter(p => inRange(p.t))
  const shownDays = days.filter(d => inRange(ms(d.day)))
  const present = OFF_KINDS.filter(k => shownDays.some(d => d.kinds.includes(k)))
  const rects = bands(shownDays, present.filter(k => !hidden.has(k)))
  const shownMarks = marks.filter(m => inRange(ms(m.day)))
  const byDay = new Map(days.map(d => [d.day, d]))

  const finite = (b: { min: number; max: number } | null | undefined) => (b && b.min > 0 && Number.isFinite(b.max) ? b : null)
  const target = finite(result?.targetRange)
  const ref = result?.lifeStage === 'kitten' ? null : finite(result?.referenceRange)
  // Fit the axis to the weigh-ins so small changes stay visible; the breed range is clipped to it.
  const ys = [...points.map(p => p.kg), ...(target ? [target.min, target.max] : [])]
  const pad = ys.length ? Math.max((Math.max(...ys) - Math.min(...ys)) * 0.15, 0.15) : 0
  const domain: [number, number] = ys.length ? [Math.max(0, +(Math.min(...ys) - pad).toFixed(1)), +(Math.max(...ys) + pad).toFixed(1)] : [0, 1]
  const short = !!span && span <= 90
  const ticks = timeTicks(from, to, short)
  const tickFormat = (x: number) => format(x, short ? 'd MMM' : 'MMM yy')

  const toggle = (k: OffKind) => setHidden(s => {
    const n = new Set(s)
    if (n.has(k)) n.delete(k)
    else n.add(k)
    return n
  })

  return (
    <Card aria-label="Weight chart">
      <div className="mb-2 flex items-center gap-1">
        <span className="mr-auto text-xs font-semibold uppercase tracking-wide text-stone-500">Weight</span>
        {RANGES.map((r, i) => (
          <button key={r.label} onClick={() => setRange(i)} aria-pressed={i === range}
            className={cx('rounded-full px-2.5 py-1 text-xs font-medium', i === range ? 'bg-paw-500 text-white' : 'bg-stone-100')}>{r.label}</button>
        ))}
      </div>
      <div className="h-60">
        {points.length || shownDays.length ? (
          <ResponsiveContainer>
            <AreaChart data={points} margin={{ left: -20, right: 8, top: 12 }}>
              <defs><linearGradient id="trend-kg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f97316" stopOpacity={0.3} /><stop offset="100%" stopColor="#f97316" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f0ee" />
              <XAxis dataKey="t" type="number" scale="time" domain={[from, to]} ticks={ticks} tickFormatter={tickFormat} tick={{ fontSize: 10 }} interval="preserveStartEnd" allowDataOverflow />
              <YAxis tick={{ fontSize: 10 }} domain={domain} allowDataOverflow />
              {ref && <ReferenceArea y1={ref.min} y2={ref.max} fill="#a8a29e" fillOpacity={0.1} stroke="none" ifOverflow="hidden" />}
              {target && <ReferenceArea y1={target.min} y2={target.max} fill="#10b981" fillOpacity={0.12} stroke="#10b981" strokeOpacity={0.4} strokeDasharray="4 3" ifOverflow="extendDomain" />}
              {rects.map(b => (
                <ReferenceArea key={`${b.kind}-${b.start}`} x1={ms(b.start)} x2={addDays(parseISO(b.end), 1).getTime()} fill={OFF_META[b.kind].color} fillOpacity={0.16} stroke="none" ifOverflow="hidden" />
              ))}
              {shownMarks.map(m => (
                <ReferenceLine key={`${m.kind}-${m.day}-${m.label}`} x={ms(m.day)} stroke={MARK[m.kind]} strokeDasharray="3 3" strokeOpacity={0.7} ifOverflow="hidden" />
              ))}
              <Tooltip content={({ active, payload }) => {
                const p = active ? (payload?.[0]?.payload as { t: number; kg: number } | undefined) : undefined
                if (!p) return null
                const day = format(p.t, 'yyyy-MM-dd')
                return <TipBox day={day} kgValue={p.kg} off={byDay.get(day)} marks={marks.filter(m => m.day === day)} />
              }} />
              <Area type="monotone" dataKey="kg" stroke="#f97316" fill="url(#trend-kg)" strokeWidth={2} dot={points.length < DOTS_UNTIL} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : <p className="flex h-full items-center justify-center text-sm text-stone-400">No weigh-ins in this range</p>}
      </div>
      {present.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Show on chart">
          {present.map(k => (
            <button key={k} onClick={() => toggle(k)} aria-pressed={!hidden.has(k)}
              className={cx('flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium', hidden.has(k) ? 'border-stone-200 text-stone-400' : 'border-stone-300 text-stone-700')}>
              <i className={cx('inline-block h-2.5 w-2.5 rounded-full', OFF_META[k].dot, hidden.has(k) && 'opacity-30')} />{OFF_META[k].label}
            </button>
          ))}
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-400">
        {shownMarks.some(m => m.kind === 'visit') && <Legend color={MARK.visit} label="Vet visit" />}
        {shownMarks.some(m => m.kind === 'lab') && <Legend color={MARK.lab} label="Lab" />}
        {shownMarks.some(m => m.kind === 'course') && <Legend color={MARK.course} label="Course" />}
        {target && <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-sm border border-dashed border-emerald-500 bg-emerald-100" />{result?.targetRange?.label}</span>}
        {ref && <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-stone-200" />Typical breed range</span>}
      </div>
    </Card>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-1"><i className="inline-block h-3 w-0 border-l border-dashed" style={{ borderColor: color }} />{label}</span>
}

function TipBox({ day, kgValue, off, marks }: { day: string; kgValue?: number; off?: OffDay; marks: Mark[] }) {
  return (
    <div className="max-w-56 rounded-xl bg-white px-3 py-2 text-xs shadow-lg ring-1 ring-stone-200">
      <div className="font-semibold">{format(parseISO(day), 'EEE d MMM yyyy')}</div>
      {kgValue != null && <div className="text-stone-700">{kgValue.toFixed(2)} kg</div>}
      {off?.items.map(i => <div key={i.kind + i.label} className="flex items-center gap-1.5"><i className={cx('h-2 w-2 shrink-0 rounded-full', OFF_META[i.kind].dot)} />{i.label}</div>)}
      {marks.map(m => <div key={m.kind + m.label} className="text-stone-500">{m.label}</div>)}
    </div>
  )
}

function OffCalendar({ days, marks }: { days: OffDay[]; marks: Mark[] }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [picked, setPicked] = useState<string | null>(null)
  const byDay = useMemo(() => new Map(days.map(d => [d.day, d])), [days])
  const cells = eachDayOfInterval({ start: startOfWeek(month, { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }) })
  const monthKey = format(month, 'yyyy-MM')
  const count = days.filter(d => d.day.startsWith(monthKey)).length
  const atLatest = monthKey >= format(new Date(), 'yyyy-MM')
  const today = format(new Date(), 'yyyy-MM-dd')
  const sel = picked ? { off: byDay.get(picked), marks: marks.filter(m => m.day === picked) } : null

  return (
    <Card aria-label="Off days">
      <div className="mb-2 flex items-center gap-2">
        <button onClick={() => setMonth(m => addMonths(m, -1))} aria-label="Previous month" className="rounded-full p-1.5 hover:bg-stone-100"><CaretRight className="h-4 w-4 rotate-180" /></button>
        <div className="flex-1 text-center">
          <div className="text-sm font-semibold">{format(month, 'MMMM yyyy')}</div>
          <div className="text-[11px] text-stone-500">{count} off day{count === 1 ? '' : 's'}</div>
        </div>
        <button onClick={() => setMonth(m => addMonths(m, 1))} disabled={atLatest} aria-label="Next month" className="rounded-full p-1.5 hover:bg-stone-100 disabled:opacity-30"><CaretRight className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-stone-400">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d}>{d.slice(0, 2)}</div>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map(c => {
          const key = format(c, 'yyyy-MM-dd')
          const off = byDay.get(key)
          const hasMark = marks.some(m => m.day === key)
          const inMonth = isSameMonth(c, month)
          return (
            <button key={key} onClick={() => setPicked(p => (p === key ? null : key))} disabled={!inMonth || key > today} aria-pressed={picked === key}
              aria-label={`${format(c, 'd MMMM')}${off ? `: ${off.kinds.map(k => OFF_META[k].label).join(', ')}` : ''}`}
              className={cx('flex h-11 flex-col items-center justify-start rounded-lg pt-1 text-xs', !inMonth && 'invisible', key > today && 'text-stone-300',
                off ? 'bg-stone-50' : '', picked === key && 'ring-2 ring-paw-400', key === today && 'font-bold text-paw-700', hasMark && 'underline decoration-dotted underline-offset-2')}>
              {format(c, 'd')}
              {off && (
                <span className="mt-1 flex gap-0.5">
                  {off.kinds.slice(0, 3).map(k => <i key={k} className={cx('h-1.5 w-1.5 rounded-full', OFF_META[k].dot)} />)}
                </span>
              )}
            </button>
          )
        })}
      </div>
      {sel && picked && (
        <div className="mt-3 space-y-1 border-t border-stone-100 pt-2 text-sm">
          <div className="text-xs font-semibold text-stone-500">{format(parseISO(picked), 'EEEE d MMMM')}</div>
          {!sel.off && !sel.marks.length && <div className="text-stone-500">Nothing off recorded</div>}
          {sel.off?.items.map(i => (
            <div key={i.kind + i.label} className="flex items-center gap-2">
              <i className={cx('h-2 w-2 shrink-0 rounded-full', OFF_META[i.kind].dot)} />
              <span className={cx(i.severe && 'font-semibold')}>{i.label}</span>
            </div>
          ))}
          {sel.marks.map(m => <div key={m.kind + m.label} className="text-stone-500">{m.label}</div>)}
        </div>
      )}
    </Card>
  )
}

function Insights({ catId, catName, items }: { catId: string; catName: string; items: Array<{ code: string; tone: InsightTone; text: string; source?: { name: string; url: string } }> }) {
  const { current, canEdit } = useHousehold()
  const navigate = useNavigate()
  if (!items.length) return null
  const ask = () => {
    const draft = `Over the last ${ASK_DAYS} days for ${catName}: ${items.map(i => i.text).join(' ')} What should I raise with the vet?`
    void navigate(`/cats/${catId}/ask`, { state: { draft } })
  }
  return (
    <Card className="space-y-2" aria-label="What was recorded">
      <div className="text-xs font-semibold uppercase tracking-wide text-stone-500">What was recorded</div>
      {items.map(i => (
        <div key={i.code} className="flex gap-2 text-sm text-stone-700">
          <i className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', TONE_DOT[i.tone])} aria-hidden />
          <div className="min-w-0">
            <span>{i.text}</span>
            {i.source && <a href={i.source.url} target="_blank" rel="noreferrer" className="ml-1 text-xs text-sky-700 underline">{i.source.name}</a>}
          </div>
        </div>
      ))}
      {current?.ai_enabled && canEdit && (
        <Button variant="secondary" className="w-full" onClick={ask}><Sparkle className="h-4 w-4" />Ask about this period</Button>
      )}
    </Card>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card className="p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">{label}</div>
      <div className="text-base font-bold">{value}</div>
      <div className="text-[10px] text-stone-400">{sub}</div>
    </Card>
  )
}

function milestoneIcon(code: string): Icon {
  if (code === 'first_weigh_in') return Scales
  if (code.startsWith('weighins_')) return Clipboard
  if (code.startsWith('tracked_')) return CalendarCheck
  if (code.startsWith('weight_')) return Sprout
  if (code.includes('range')) return Target
  return Star
}

function MilestoneGlyph({ code }: { code: string }) {
  const I = milestoneIcon(code)
  return <I size={14} weight="duotone" aria-hidden />
}
