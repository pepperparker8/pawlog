import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Camera, CaretRight, CircleNotch, Pencil, Search, CareTile, CareGlyph, IconTile, Check } from '../../components/icons'
import { useHousehold } from '../../household/HouseholdProvider'
import { Avatar, Button, Card, Chip, EmptyState, SectionTitle, Spinner, cx } from '../../components/ui'
import { useToast } from '../../components/ui/Toast'
import { useCat, useCatSummaries, useSignedUrl } from './api'
import { TimelinePage } from '../timeline/TimelinePage'
import { useTimeline } from '../timeline/api'
import { HealthTab } from '../health/HealthTab'
import { useGiveDose, useMedsToday } from '../health/api'
import { PhotoGrid } from '../photos/PhotoGrid'
import { PhotoPicker } from '../photos/PhotoPicker'
import { PassportTab } from './PassportTab'
import { WeightStatusCard } from '../weight/WeightStatusCard'
import { TipsCard } from '../tips/TipsCard'
import { WeeklyGoals } from '../gamification/WeeklyGoals'
import { QuickLogSheet, type Kind } from '../logs/QuickLogSheet'
import { ago, catAge, courseDay, dueLabel, isTodayIso, kg, timeLabel } from '../../lib/format'
import { friendlyError } from '../../lib/errors'
import type { CatSummary } from '../../lib/types'

const GrowthChart = lazy(() => import('../growth/GrowthChart').then(m => ({ default: m.GrowthChart })))

const TABS = [['', 'Overview'], ['health', 'Health'], ['growth', 'Growth'], ['photos', 'Photos'], ['timeline', 'Timeline'], ['passport', 'Passport']] as const
const ACTIONS: Array<{ kind: Kind; label: string }> = [
  { kind: 'feeding', label: 'Feed' }, { kind: 'weight', label: 'Weigh' }, { kind: 'litter', label: 'Litter' },
  { kind: 'medication', label: 'Meds' }, { kind: 'symptom', label: 'Observe' },
]

export function CatProfilePage() {
  const { id = '' } = useParams()
  const { current, canEdit, memberships, switchTo } = useHousehold()
  const hid = current!.id
  const cat = useCat(id)
  const catHid = cat.data?.household_id
  const foreign = !!catHid && catHid !== hid && memberships.some(m => m.household.id === catHid)
  // Deep links and notifications can point at a cat in another household the user belongs to.
  useEffect(() => { if (foreign) switchTo(catHid) }, [foreign, catHid, switchTo])
  const summaries = useCatSummaries(hid, true)
  const s = summaries.data?.find(c => c.cat_id === id)
  const url = useSignedUrl(s?.profile_thumbnail_path ?? s?.profile_photo_path)
  const [log, setLog] = useState<{ kind?: Kind } | null>(null)
  const { pathname } = useLocation()
  const tab = pathname.split(`/cats/${id}`)[1]?.split('/')[1] ?? ''
  const nav = useNavigate()

  if (cat.isLoading || foreign) return <Spinner />
  if (!cat.data) return <EmptyState icon={Search} title="Cat not found" body="It may belong to another household." action={<Link to="/cats"><Button variant="secondary">Back to cats</Button></Link>} />
  const c = cat.data
  const live = canEdit && !c.archived_at && !c.deceased_on
  const sexLabel = c.sex === 'male' ? 'Male' : c.sex === 'female' ? 'Female' : null
  const others = (summaries.data ?? []).filter(x => !x.archived_at)

  return (
    <div>
      <header className="-mx-4 -mt-4 bg-gradient-to-b from-stone-50 to-transparent px-4 pb-2 pt-3">
        <div className="flex items-center justify-between">
          <button onClick={() => nav('/cats')} className="-ml-2 rounded-full p-2.5 active:bg-white/60" aria-label="All cats"><ArrowLeft className="h-5 w-5" /></button>
          {others.length > 1 && <CatSwitcher cats={others} activeId={id} tab={tab} />}
          {canEdit ? <Link to={`/cats/${id}/edit`} className="-mr-2 rounded-full p-2.5 active:bg-white/60" aria-label="Edit profile"><Pencil className="h-5 w-5" /></Link> : <span className="w-10" />}
        </div>
        <div className="mt-1 flex items-center gap-4">
          <div className="relative shrink-0">
            {live ? (
              <PhotoPicker hid={hid} catId={id} setAsProfile label={url.data ? 'Change profile photo' : 'Add profile photo'} className="block rounded-full active:scale-95">
                {busy => (
                  <span className="relative block">
                    {url.data ? <Avatar name={c.name} src={url.data} size={84} /> : (
                      <span className="flex h-[84px] w-[84px] flex-col items-center justify-center rounded-full border-2 border-dashed border-paw-300 bg-white text-paw-600">
                        <Camera className="h-6 w-6" /><span className="text-[10px] font-semibold">Add photo</span>
                      </span>
                    )}
                    {url.data && <span className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-paw-500 text-white ring-2 ring-white">{busy ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}</span>}
                    {busy && !url.data && <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70"><CircleNotch className="h-6 w-6 animate-spin text-paw-500" /></span>}
                  </span>
                )}
              </PhotoPicker>
            ) : <Avatar name={c.name} src={url.data} size={84} />}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold leading-tight">{c.name}</h1>
            <p className="truncate text-sm text-stone-600">{[c.breed, catAge(c.date_of_birth, c.dob_is_estimate), sexLabel].filter(Boolean).join(' · ') || 'Add breed and birthday'}</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {c.archived_at && <Chip>Archived</Chip>}
              {c.deceased_on && <Chip>In memory</Chip>}
              {s?.last_weight_kg != null && <Chip>{kg(s.last_weight_kg)}</Chip>}
            </div>
          </div>
        </div>
        {live && (
          <div className="mt-4 grid grid-cols-6 gap-1.5">
            {ACTIONS.map(a => (
              <button key={a.kind} onClick={() => setLog({ kind: a.kind })} className="flex flex-col items-center gap-1 rounded-2xl py-1.5 text-[11px] font-semibold text-stone-700 transition-transform hover:bg-stone-50 active:scale-95">
                <CareTile kind={a.kind} />{a.label}
              </button>
            ))}
            <PhotoPicker hid={hid} catId={id} multiple label="Add photos" className="flex flex-col items-center gap-1 rounded-2xl py-1.5 text-[11px] font-semibold text-stone-700 transition-transform hover:bg-stone-50 active:scale-95">
              {busy => <>{busy ? <span className="flex h-10 w-10 items-center justify-center"><CircleNotch className="h-5 w-5 animate-spin text-paw-500" /></span> : <CareTile kind="photo" />}Photo</>}
            </PhotoPicker>
          </div>
        )}
      </header>

      <TabBar id={id} active={tab} />

      <div className="pt-4">
        <Routes>
          <Route index element={<Overview id={id} hid={hid} s={s} canLog={live} onLog={kind => setLog({ kind })} />} />
          <Route path="health" element={<HealthTab catId={id} />} />
          <Route path="growth" element={<Suspense fallback={<Spinner />}><GrowthChart catId={id} /></Suspense>} />
          <Route path="photos" element={<PhotoGrid catId={id} />} />
          <Route path="timeline" element={<TimelinePage catId={id} embedded />} />
          <Route path="passport" element={<PassportTab cat={c} />} />
          <Route path="*" element={<Overview id={id} hid={hid} s={s} canLog={live} onLog={kind => setLog({ kind })} />} />
        </Routes>
      </div>
      <QuickLogSheet open={!!log} onClose={() => setLog(null)} presetCat={id} presetKind={log?.kind} />
    </div>
  )
}

/** Absolute links: relative ones resolve against the current splat URL in React Router 7 and stack up (/health/growth). */
function TabBar({ id, active }: { id: string; active: string }) {
  const bar = useRef<HTMLDivElement>(null)
  useEffect(() => {
    bar.current?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [active])
  return (
    <nav ref={bar} aria-label="Cat sections" className="scrollbar-none sticky top-0 z-30 -mx-4 flex gap-1 overflow-x-auto border-b border-stone-200 bg-white/95 px-3 py-1.5 backdrop-blur">
      {TABS.map(([path, label]) => (
        <NavLink key={path} to={`/cats/${id}${path ? `/${path}` : ''}`} end replace
          className={({ isActive }) => cx('shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition', isActive ? 'bg-stone-800 text-white' : 'text-stone-600 active:bg-stone-200')}>
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

function CatSwitcher({ cats, activeId, tab }: { cats: CatSummary[]; activeId: string; tab: string }) {
  return (
    <div className="scrollbar-none flex max-w-[70%] gap-1.5 overflow-x-auto px-1 py-1">
      {cats.map(c => <SwitchDot key={c.cat_id} c={c} active={c.cat_id === activeId} to={`/cats/${c.cat_id}${tab ? `/${tab}` : ''}`} />)}
    </div>
  )
}
function SwitchDot({ c, active, to }: { c: CatSummary; active: boolean; to: string }) {
  const u = useSignedUrl(c.profile_thumbnail_path)
  return (
    <Link to={to} replace aria-label={`Open ${c.name}`} aria-current={active ? 'page' : undefined}
      className={cx('shrink-0 rounded-full transition', active ? 'ring-2 ring-paw-500 ring-offset-2 ring-offset-paw-100' : 'opacity-70')}>
      <Avatar name={c.name} src={u.data} size={30} />
    </Link>
  )
}

function Protection({ to, kind, label, ok, d }: { to: string; kind: 'vaccination' | 'parasite'; label: string; ok: string; d: ReturnType<typeof dueLabel> }) {
  const text = d.tone === 'ok' ? ok : d.tone === 'none' ? 'No record' : d.text
  const sub = d.tone === 'ok' ? `next ${d.text}` : d.tone === 'none' ? 'add a record' : d.tone === 'overdue' ? 'overdue' : 'due soon'
  return (
    <Link to={to} replace className={cx('rounded-2xl border p-3 transition active:scale-[0.98]',
      d.tone === 'overdue' ? 'border-red-200 bg-red-50' : d.tone === 'soon' ? 'border-amber-200 bg-amber-50' : 'border-stone-200 bg-white')}>
      <div className="text-[11px] font-medium uppercase tracking-wide text-stone-500">{label}</div>
      <div className="mt-0.5 flex items-center gap-1.5 font-bold"><CareGlyph kind={kind} size={18} />{text}</div>
      <div className="text-xs text-stone-500">{sub}</div>
    </Link>
  )
}

function Overview({ id, hid, s, canLog, onLog }: { id: string; hid: string; s?: CatSummary; canLog: boolean; onLog: (k: Kind) => void }) {
  const meds = useMedsToday(hid)
  const give = useGiveDose(hid)
  const toast = useToast()
  const recent = useTimeline(hid, { catId: id })
  if (!s) return <Spinner />
  const catMeds = (meds.data ?? []).filter(m => m.cat_id === id)
  const fed = isTodayIso(s.last_fed_at), litter = isTodayIso(s.last_litter_at)
  const due = [
    { label: 'Care task', d: dueLabel(s.next_task_due), to: '' },
  ].filter(x => x.d.tone !== 'none')
  const vaccine = dueLabel(s.next_vaccine_due), parasite = dueLabel(s.next_parasite_due)
  const tone = (t: string) => (t === 'overdue' ? 'bad' : t === 'soon' ? 'warn' : 'ok') as 'bad' | 'warn' | 'ok'
  const events = recent.data?.pages[0]?.slice(0, 5) ?? []

  return (
    <div className="space-y-5">
      <section>
        <SectionTitle>Today</SectionTitle>
        <Card className="divide-y divide-stone-100 p-0">
          <TodayRow kind="feeding" label="Fed" done={fed} detail={fed ? ago(s.last_fed_at) : s.last_fed_at ? `Last ${ago(s.last_fed_at)}` : 'Not logged yet'} action={canLog && !fed ? () => onLog('feeding') : undefined} />
          <TodayRow kind="litter" label="Litter" done={litter} detail={litter ? ago(s.last_litter_at) : s.last_litter_at ? `Last ${ago(s.last_litter_at)}` : 'Not logged yet'} action={canLog && !litter ? () => onLog('litter') : undefined} />
          {catMeds.map(m => {
            const target = m.times_per_day ?? 1
            const done = m.given_today >= target
            const cd = courseDay(m.start_on, m.end_on)
            return (
              <TodayRow key={m.id} kind="medication" label={m.name} done={done}
                detail={[m.dose, cd && (cd.of ? `day ${cd.day} of ${cd.of}` : `day ${cd.day}`), `${m.given_today}/${target} today`].filter(Boolean).join(' · ')}
                actionLabel="Give" action={canLog && !done ? () => give.mutateAsync(m).then(() => toast.show(`💊 ${m.name} dose recorded`, 'xp')).catch(e => toast.show(friendlyError(e), 'bad')) : undefined} />
            )
          })}
        </Card>
      </section>

      <section>
        <SectionTitle action={<Link to={`/cats/${id}/growth`} replace className="flex items-center text-xs font-semibold text-paw-600">Growth<CaretRight className="h-3.5 w-3.5" /></Link>}>Health journey</SectionTitle>
        <div className="space-y-3">
          <WeightStatusCard catId={id} compact />
          <div className="grid grid-cols-2 gap-3">
            <Protection to={`/cats/${id}/health`} kind="vaccination" label="Vaccines" ok="Protected" d={vaccine} />
            <Protection to={`/cats/${id}/health`} kind="parasite" label="Parasite care" ok="Covered" d={parasite} />
          </div>
        </div>
      </section>

      <TipsCard hid={hid} catId={id} name={s.name} />

      {due.length > 0 && (
        <section>
          <SectionTitle>Coming up</SectionTitle>
          <Card className="divide-y divide-stone-100 p-0">
            {due.map(x => (
              <Link key={x.label} to={`/cats/${id}${x.to ? `/${x.to}` : ''}`} replace className="flex min-h-12 items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-stone-700">{x.label}</span><Chip tone={tone(x.d.tone)}>{x.d.text}</Chip>
              </Link>
            ))}
          </Card>
        </section>
      )}

      <WeeklyGoals hid={hid} catId={id} />

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Weight" value={kg(s.last_weight_kg)} sub={s.last_weight_at ? `weighed ${ago(s.last_weight_at)}` : 'no weigh-in yet'} to={`/cats/${id}/growth`} />
        <Stat label="Symptoms, 7 days" value={s.symptoms_7d ? String(s.symptoms_7d) : 'None'} sub={s.last_symptom_at ? `last ${ago(s.last_symptom_at)}` : 'nothing recorded'} to={`/cats/${id}/timeline`} />
        <Stat label="Grooming" value={s.last_grooming_at ? ago(s.last_grooming_at) : 'Not yet'} sub="last session" />
        <Stat label="Photos" value={String(s.photo_count)} sub="memories" to={`/cats/${id}/photos`} />
      </div>

      <section>
        <SectionTitle action={<Link to={`/cats/${id}/timeline`} replace className="flex items-center text-xs font-semibold text-paw-600">All<CaretRight className="h-3.5 w-3.5" /></Link>}>Recent</SectionTitle>
        <Card className="divide-y divide-stone-100 p-0">
          {recent.isLoading ? <Spinner className="py-6" /> : events.length === 0 ? <p className="px-4 py-5 text-center text-sm text-stone-400">Nothing logged yet. Tap a quick action above to start.</p> : events.map(e => (
            <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
              <CareTile kind={e.kind} size="sm" />
              <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{e.title}</div>{e.detail && <div className="truncate text-xs text-stone-500">{e.detail}</div>}</div>
              <span className="shrink-0 text-xs text-stone-400">{isTodayIso(e.occurred_at) ? timeLabel(e.occurred_at) : ago(e.occurred_at)}</span>
            </div>
          ))}
        </Card>
      </section>
    </div>
  )
}

function TodayRow({ kind, label, done, detail, action, actionLabel = 'Log' }: { kind: string; label: string; done: boolean; detail: string; action?: () => void; actionLabel?: string }) {
  return (
    <div className="flex min-h-14 items-center gap-3 px-4 py-2">
      {done ? <IconTile icon={Check} tone="emerald" size="sm" className="h-9 w-9" /> : <CareTile kind={kind} size="sm" className="h-9 w-9" />}
      <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{label}</div><div className="truncate text-xs text-stone-500">{detail}</div></div>
      {action ? <button onClick={action} className="rounded-full bg-paw-500 px-3.5 py-1.5 text-xs font-semibold text-white active:scale-95">{actionLabel}</button>
        : done ? <Chip tone="ok">Done</Chip> : null}
    </div>
  )
}

function Stat({ label, value, sub, to }: { label: string; value: string; sub: string; to?: string }) {
  const body = (
    <Card className="h-full p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">{label}</div>
      <div className="truncate text-lg font-bold">{value}</div>
      <div className="truncate text-xs text-stone-400">{sub}</div>
    </Card>)
  return to ? <Link to={to} replace className="block active:scale-[.98]">{body}</Link> : body
}
