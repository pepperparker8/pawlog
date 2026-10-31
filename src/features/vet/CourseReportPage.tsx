import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Line, LineChart, CartesianGrid, ReferenceArea, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { addDays, format, parseISO } from 'date-fns'
import { Printer } from '../../components/icons'
import { useHousehold } from '../../household/HouseholdProvider'
import { Button, Card, ErrorNote, SectionTitle, Select, Spinner, Textarea, cx } from '../../components/ui'
import { useToast } from '../../components/ui/Toast'
import { PageHeader } from '../../components/layout/PageHeader'
import { friendlyError } from '../../lib/errors'
import { catAge, dateLabel, kg, signedKg, todayInput } from '../../lib/format'
import type { TreatmentCourse } from '../../lib/types'
import { useCat, useCatSummaries } from '../cats/api'
import { useCatHealth, useWeights } from '../health/api'
import { useLabs } from '../labs/api'
import { formatRange, formatValue } from '../labs/status'
import { StatusChip } from '../labs/StatusChip'
import { useTrendData } from '../trends/api'
import { OFF_META, bands, offDays } from '../trends/classify'
import { courseQuestions, courseWindow, labSummary, missedIn, offDaysIn, weightSummary, type CourseWindow, type WeightSummary } from './courseReport'

const NOTES_KEY = 'pawlog.coursenotes.'
const STATUS: Record<TreatmentCourse['status'], string> = { active: 'Active', completed: 'Completed', stopped: 'Stopped' }

export function CourseReportPage() {
  const { current } = useHousehold()
  const cats = useCatSummaries(current!.id, true)
  const [params, setParams] = useSearchParams()
  const toast = useToast()
  const catId = params.get('cat') || cats.data?.[0]?.cat_id || ''
  return (
    <div className="space-y-4">
      <PageHeader title="Course review" back action={
        <Button variant="secondary" className="print:hidden" aria-label="Print report" onClick={() => { toast.show('Ready to print'); window.setTimeout(() => window.print(), 300) }}>
          <Printer className="h-4 w-4" />
        </Button>} />
      <Select aria-label="Cat" className="print:hidden" value={catId} onChange={e => setParams({ cat: e.target.value }, { replace: true })}>
        {cats.data?.map(c => <option key={c.cat_id} value={c.cat_id}>{c.name}</option>)}
      </Select>
      {cats.error ? <ErrorNote message={friendlyError(cats.error)} /> : catId ? <CatCourses key={catId} catId={catId} courseId={params.get('course')} onCourse={id => setParams({ cat: catId, course: id }, { replace: true })} /> : <Spinner />}
    </div>
  )
}

function CatCourses({ catId, courseId, onCourse }: { catId: string; courseId: string | null; onCourse: (id: string) => void }) {
  const h = useCatHealth(catId)
  if (h.error) return <ErrorNote message={friendlyError(h.error)} />
  if (!h.data) return <Spinner />
  const courses = h.data.courses
  if (!courses.length) return <Card><p className="text-sm text-stone-500">No treatment courses recorded.</p></Card>
  const course = courses.find(c => c.id === courseId) ?? courses.find(c => c.status === 'active') ?? courses[0]
  return (
    <>
      {courses.length > 1 && (
        <Select aria-label="Course" className="print:hidden" value={course.id} onChange={e => onCourse(e.target.value)}>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name} · {dateLabel(c.started_on)}</option>)}
        </Select>
      )}
      <Report key={course.id} catId={catId} course={course} />
    </>
  )
}

function Report({ catId, course }: { catId: string; course: TreatmentCourse }) {
  const cat = useCat(catId)
  const h = useCatHealth(catId)
  const weights = useWeights(catId)
  const t = useTrendData(catId)
  const labs = useLabs(catId)
  const today = todayInput()
  const win = useMemo(() => courseWindow(course, today), [course, today])
  const [notes, setNotes] = useState(() => { try { return localStorage.getItem(NOTES_KEY + course.id) ?? '' } catch { return '' } })
  const [dropped, setDropped] = useState<Set<string>>(new Set())
  useEffect(() => { try { localStorage.setItem(NOTES_KEY + course.id, notes) } catch { /* private mode */ } }, [course.id, notes])

  const err = cat.error ?? h.error ?? weights.error ?? t.error ?? labs.error
  if (err) return <ErrorNote message={friendlyError(err)} />
  if (!cat.data || !h.data || !weights.data || !t.data || !labs.data) return <Spinner />

  const c = cat.data
  const weight = weightSummary(weights.data, win)
  const off = offDaysIn(offDays(t.data), win)
  const missed = missedIn(t.data.missed, win)
  const lab = labSummary(labs.data, win)
  const questions = courseQuestions({ course, window: win, weight, off, missed, labs: lab })
  const condition = h.data.conditions.find(x => x.id === course.condition_id)
  const meds = h.data.medications.filter(m => m.course_id === course.id)
  const visits = h.data.visits.filter(v => v.visited_on >= win.start && v.visited_on <= win.end)
  const toggle = (q: string) => setDropped(s => {
    const n = new Set(s)
    if (n.has(q)) n.delete(q)
    else n.add(q)
    return n
  })

  return (
    <div className="space-y-4 print:space-y-3">
      <Card aria-label="Course">
        <div className="flex items-baseline justify-between gap-2">
          <SectionTitle>{c.name}</SectionTitle>
          <span className="text-xs text-stone-500">Prepared {dateLabel(today)}</span>
        </div>
        <p className="text-sm">{[c.sex, c.breed, catAge(c.date_of_birth, c.dob_is_estimate)].filter(Boolean).join(' · ')}</p>
        <div className="mt-3 flex items-baseline justify-between gap-2">
          <div className="min-w-0 font-semibold">{course.name}</div>
          <div className="shrink-0 text-sm font-semibold text-paw-700">Day {win.day}{win.of ? ` of ${win.of}` : ''}</div>
        </div>
        {win.of && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-paw-500" style={{ width: `${Math.min(100, win.day / win.of * 100)}%` }} />
          </div>
        )}
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {condition && <><dt className="text-stone-500">Condition</dt><dd>{condition.name}</dd></>}
          <dt className="text-stone-500">Started</dt><dd>{dateLabel(course.started_on)}</dd>
          {course.review_on && <><dt className="text-stone-500">Review</dt><dd>{dateLabel(course.review_on)}</dd></>}
          {course.status !== 'active' && <><dt className="text-stone-500">{STATUS[course.status]}</dt><dd>{dateLabel(course.ended_on)}</dd></>}
        </dl>
        {meds.length > 0 && (
          <ul className="mt-3 space-y-0.5 border-t border-stone-100 pt-2 text-sm">
            {meds.map(m => <li key={m.id}><b>{m.name}</b>{[m.dose, m.frequency].filter(Boolean).length ? ` · ${[m.dose, m.frequency].filter(Boolean).join(' ')}` : ''}</li>)}
          </ul>
        )}
        {course.note && <p className="mt-2 text-sm text-stone-600">{course.note}</p>}
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Weight change" value={weight.change == null ? '—' : signedKg(weight.change)} sub={weight.pct == null ? undefined : `${weight.pct >= 0 ? '+' : ''}${weight.pct.toFixed(1)}%`} />
        <Stat label="Off days" value={String(off.days.length)} sub={`of ${win.day}`} />
        <Stat label="Missed doses" value={String(missed.length)} />
      </div>

      <WeightCard weight={weight} win={win} off={off.days} />

      <Card aria-label="Off days">
        <SectionTitle>Off days ({off.days.length})</SectionTitle>
        {off.days.length ? (
          <>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {off.byKind.map(([k, n]) => (
                <span key={k} className="flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">
                  <i className={cx('inline-block h-2 w-2 rounded-full', OFF_META[k].dot)} />{OFF_META[k].label} {n}
                </span>
              ))}
            </div>
            <ul className="space-y-1 text-sm">
              {off.days.map(d => <li key={d.day}><span className="inline-block w-16 text-stone-500">{format(parseISO(d.day), 'd MMM')}</span>{d.items.map(i => i.label).join(', ')}</li>)}
            </ul>
          </>
        ) : <p className="text-sm text-stone-500">None recorded.</p>}
      </Card>

      <Card aria-label="Missed doses">
        <SectionTitle>Missed doses ({missed.length})</SectionTitle>
        {missed.length
          ? <ul className="space-y-1 text-sm">{missed.map(m => <li key={m.logged_at + m.medication_name}><span className="inline-block w-16 text-stone-500">{format(parseISO(m.logged_at), 'd MMM')}</span>{m.medication_name}</li>)}</ul>
          : <p className="text-sm text-stone-500">None recorded.</p>}
      </Card>

      <Card aria-label="Labs">
        <SectionTitle>Labs</SectionTitle>
        {lab.lines.length ? (
          <>
            <p className="mb-2 text-xs text-stone-500">
              {lab.latest ? `${dateLabel(lab.latest.sampled_on)}${lab.baseline ? ` compared with ${dateLabel(lab.baseline.sampled_on)}` : ''}` : `Before the course · ${dateLabel(lab.baseline!.sampled_on)}`}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[11px] uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="py-1 pr-2 font-medium">Test</th>
                    {lab.latest && lab.baseline && <th className="py-1 pr-2 text-right font-medium">Before</th>}
                    <th className="py-1 pr-2 text-right font-medium">{lab.latest ? 'Latest' : 'Result'}</th>
                    <th className="py-1 pr-2 font-medium" />
                    <th className="py-1 font-medium">Range</th>
                  </tr>
                </thead>
                <tbody>
                  {lab.lines.map(l => (
                    <tr key={l.row.analyte} className="border-t border-stone-100">
                      <td className="py-1 pr-2">{l.row.analyte}</td>
                      {lab.latest && lab.baseline && <td className="py-1 pr-2 text-right tabular-nums text-stone-500">{l.before ? l.before.value : '—'}</td>}
                      <td className="whitespace-nowrap py-1 pr-2 text-right font-medium tabular-nums">{formatValue(l.row)}{l.row.unit && <span className="ml-1 text-xs font-normal text-stone-500">{l.row.unit}</span>}</td>
                      <td className="py-1 pr-2"><StatusChip status={l.status} /></td>
                      <td className="whitespace-nowrap py-1 text-xs text-stone-500">{formatRange(l.row)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : <p className="text-sm text-stone-500">No lab reports.</p>}
      </Card>

      {visits.length > 0 && (
        <Card aria-label="Vet visits">
          <SectionTitle>Vet visits</SectionTitle>
          <ul className="space-y-1 text-sm">{visits.map(v => <li key={v.id}>{dateLabel(v.visited_on)} · {[v.clinic, v.reason, v.findings].filter(Boolean).join(' · ')}</li>)}</ul>
        </Card>
      )}

      <Card aria-label="Questions for the vet">
        <SectionTitle>Questions for the vet</SectionTitle>
        <ul className="space-y-2 text-sm">
          {questions.map(q => (
            <li key={q} className={cx(dropped.has(q) && 'print:hidden')}>
              <label className="flex items-start gap-2">
                <input type="checkbox" className="mt-0.5 accent-paw-500 print:hidden" checked={!dropped.has(q)} onChange={() => toggle(q)} />
                <span className={cx(dropped.has(q) && 'text-stone-400 line-through')}>{q}</span>
              </label>
            </li>
          ))}
        </ul>
        <Textarea aria-label="Notes" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Other questions" className="mt-3 print:hidden" />
        {notes && <p className="mt-2 hidden whitespace-pre-wrap text-sm print:block">{notes}</p>}
      </Card>
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="p-3 text-center">
      <div className="text-base font-bold">{value}</div>
      <div className="text-[11px] text-stone-500">{label}</div>
      {sub && <div className="text-[10px] text-stone-400">{sub}</div>}
    </Card>
  )
}

const ms = (day: string) => parseISO(day).getTime()

function WeightCard({ weight, win, off }: { weight: WeightSummary; win: CourseWindow; off: ReturnType<typeof offDays> }) {
  const points = weight.points.map(p => ({ t: ms(p.day), kg: p.kg }))
  const from = Math.min(ms(win.start), ...points.map(p => p.t))
  const to = addDays(parseISO(win.end), 1).getTime()
  const ys = points.map(p => p.kg)
  const pad = ys.length ? Math.max((Math.max(...ys) - Math.min(...ys)) * 0.2, 0.1) : 0
  const domain: [number, number] = ys.length ? [+(Math.min(...ys) - pad).toFixed(1), +(Math.max(...ys) + pad).toFixed(1)] : [0, 1]
  return (
    <Card aria-label="Weight">
      <SectionTitle>Weight</SectionTitle>
      {weight.start && weight.last && weight.change != null
        ? <p className="text-sm font-medium">{kg(weight.start.kg)} on {dateLabel(weight.start.day)} to {kg(weight.last.kg)} on {dateLabel(weight.last.day)}</p>
        : <p className="text-sm text-stone-500">{weight.last ? `One weigh-in: ${kg(weight.last.kg)} on ${dateLabel(weight.last.day)}` : 'No weigh-ins.'}</p>}
      {points.length > 1 && (
        <div className="mt-2 h-40">
          <ResponsiveContainer>
            <LineChart data={points} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f0ee" />
              <XAxis dataKey="t" type="number" scale="time" domain={[from, to]} tickFormatter={x => format(x, 'd MMM')} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} domain={domain} allowDataOverflow />
              {bands(off).map(b => (
                <ReferenceArea key={`${b.kind}-${b.start}`} x1={ms(b.start)} x2={addDays(parseISO(b.end), 1).getTime()} fill={OFF_META[b.kind].color} fillOpacity={0.16} stroke="none" ifOverflow="hidden" />
              ))}
              <ReferenceArea x1={from} x2={ms(win.start)} fill="#e7e5e4" fillOpacity={0.4} stroke="none" ifOverflow="hidden" />
              <Line type="monotone" dataKey="kg" stroke="#f97316" strokeWidth={2} dot isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {weight.points.length > 0 && <p className="mt-1 text-xs text-stone-500">{weight.points.map(p => `${format(parseISO(p.day), 'd MMM')}: ${kg(p.kg)}`).join(' · ')}</p>}
    </Card>
  )
}
