import { useState } from 'react'
import { Link } from 'react-router-dom'
import { subDays } from 'date-fns'
import { Warning, Eye, Info, CareTile, CareGlyph, Check, G, IconTile } from '../../components/icons'
import { useHousehold } from '../../household/HouseholdProvider'
import { Button, Card, Chip, EmptyState, ProgressBar, SectionTitle, Spinner, cx } from '../../components/ui'
import { useCatSummaries, useSignedUrl } from '../cats/api'
import { useOnThisDay, usePatterns } from '../timeline/api'
import { useQuests } from '../gamification/api'
import { LevelCard } from '../gamification/LevelCard'
import { WeeklyGoals } from '../gamification/WeeklyGoals'
import { catAge, courseDay, dateLabel, dueLabel, isTodayIso, kg } from '../../lib/format'
import { useSeedDemo } from '../household/api'
import { useToast } from '../../components/ui/Toast'
import { friendlyError } from '../../lib/errors'
import { useXpEnabled } from '../../lib/prefs'
import type { CatSummary, DailyCheckin } from '../../lib/types'
import { QuickLogSheet, type Kind } from '../logs/QuickLogSheet'
import { useWeightStatus } from '../weight/api'
import { statusView } from '../weight/status'
import { HomeTip } from '../tips/TipsCard'
import { useGiveDose, useMedsToday, type MedToday } from '../health/api'
import { checkinFlags, localDay, useCheckins, useSaveCheckin, USUAL } from '../checkins/api'
import { CheckinSheet } from '../checkins/CheckinSheet'
import { attention, byAttention } from './attention'

export function HomePage() {
  const { current, canEdit } = useHousehold()
  const hid = current!.id
  const cats = useCatSummaries(hid)
  const checkins = useCheckins(hid, STRIP_DAYS)
  const meds = useMedsToday(hid)
  const patterns = usePatterns(hid)
  const xp = useXpEnabled()
  const quests = useQuests(hid)
  const otd = useOnThisDay(hid)
  const seed = useSeedDemo()
  const saveCheckin = useSaveCheckin(hid)
  const give = useGiveDose(hid)
  const toast = useToast()
  const [log, setLog] = useState<{ catId: string; kind?: Kind } | null>(null)
  const [checkinCat, setCheckinCat] = useState<string | null>(null)

  if (cats.isLoading) return <Spinner />
  if (!cats.data?.length) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-black">{current!.name}</h1>
        <EmptyState icon={G.cat} title="No cats yet"
          action={canEdit && (
            <div className="flex flex-col gap-2">
              <Link to="/cats/new"><Button className="w-full">Add a cat</Button></Link>
              <Button variant="secondary" loading={seed.isPending}
                onClick={() => seed.mutateAsync().then(() => toast.show('Demo household ready')).catch(e => toast.show(friendlyError(e), 'bad'))}>
                Load demo household
              </Button>
            </div>
          )} />
      </div>
    )
  }

  const active = cats.data.filter(c => !c.archived_at)
  const today = localDay()
  const todays = checkins.data?.filter(c => c.day === today) ?? []
  const unchecked = active.filter(c => !todays.some(k => k.cat_id === c.cat_id))
  const act = patterns.data?.filter(p => p.severity !== 'info') ?? []
  const info = patterns.data?.filter(p => p.severity === 'info') ?? []
  const questsDone = quests.data?.filter(q => q.completed).length ?? 0

  const allUsual = (catIds: string[]) => saveCheckin.mutateAsync({ catIds, day: today, draft: USUAL })
    .then(() => toast.show(catIds.length > 1 ? `All usual for ${catIds.length} cats` : 'All usual'))
    .catch(e => toast.show(friendlyError(e), 'bad'))
  const giveDose = (m: MedToday) => give.mutateAsync(m)
    .then(() => toast.show(`${m.name} dose recorded`))
    .catch(e => toast.show(friendlyError(e), 'bad'))
  const cardProps = (c: CatSummary) => ({
    cat: c, canEdit, busy: saveCheckin.isPending || give.isPending,
    week: checkins.data?.filter(k => k.cat_id === c.cat_id) ?? [],
    meds: meds.data?.filter(m => m.cat_id === c.cat_id) ?? [],
    onCheckin: () => setCheckinCat(c.cat_id), onAllUsual: () => allUsual([c.cat_id]),
    onGive: giveDose, onLog: (kind?: Kind) => setLog({ catId: c.cat_id, kind }),
  })

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-black">{current!.name}</h1>
          {checkins.data && <p className="text-sm text-stone-500">{active.length - unchecked.length}/{active.length} checked in today</p>}
        </div>
        {canEdit && checkins.data && unchecked.length > 1 && (
          <Button variant="secondary" className="shrink-0 px-3 py-2 text-xs" loading={saveCheckin.isPending} onClick={() => allUsual(unchecked.map(c => c.cat_id))}>
            All usual for {unchecked.length}
          </Button>
        )}
      </header>

      {active.length <= HERO_MAX ? (
        <section className="space-y-3">
          {active.map(c => <CatHero key={c.cat_id} {...cardProps(c)} />)}
        </section>
      ) : (
        <section>
          <SectionTitle action={<Link to="/cats" className="text-xs text-paw-600">All cats</Link>}>Your cats</SectionTitle>
          <Card className="divide-y divide-stone-100 p-0">
            {byAttention(active).map(c => <CatRow key={c.cat_id} {...cardProps(c)} />)}
          </Card>
        </section>
      )}

      {(act.length > 0 || info.length > 0) && (
        <section>
          <SectionTitle>Needs attention</SectionTitle>
          <div className="space-y-2">
            {act.map(p => (
              <Link key={p.cat_id + p.code} to={`/cats/${p.cat_id}`}>
                <Card className={`flex gap-3 ${p.severity === 'act' ? 'ring-red-100' : 'ring-amber-100'}`}>
                  {p.severity === 'act' ? <Warning className="h-5 w-5 shrink-0 text-red-500" /> : <Eye className="h-5 w-5 shrink-0 text-amber-500" />}
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{p.cat_name}: {p.title}</div>
                    <div className="text-xs text-stone-600">{p.detail}</div>
                  </div>
                </Card>
              </Link>
            ))}
            {info.length > 0 && (
              <Card className="flex gap-3 ring-stone-100">
                <Info className="h-5 w-5 shrink-0 text-stone-400" />
                <div className="text-xs text-stone-600">{info.map(p => `${p.cat_name}: ${p.detail.toLowerCase()}`).join(' · ')}</div>
              </Card>
            )}
          </div>
        </section>
      )}

      <HomeTip hid={hid} />

      {xp && <LevelCard compact />}

      {xp && quests.data && quests.data.length > 0 && (
        <section>
          <SectionTitle action={<span className="text-xs text-stone-500">{questsDone}/{quests.data.length} done</span>}>Today's quests</SectionTitle>
          <Card className="divide-y divide-stone-100 p-0">
            {quests.data.map(q => (
              <div key={q.quest_code} className="flex items-center gap-3 px-4 py-2.5">
                <span aria-hidden className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${q.completed ? 'bg-emerald-100 text-emerald-700' : 'ring-1 ring-inset ring-stone-300'}`}>{q.completed && <Check size={14} weight="bold" />}</span>
                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-medium ${q.completed ? 'text-stone-400 line-through' : ''}`}>{q.title}</div>
                  <ProgressBar value={q.done} max={q.target} className="mt-1 h-1.5" />
                </div>
                <span className="text-xs font-bold text-paw-600">+{q.xp_reward}</span>
              </div>
            ))}
          </Card>
        </section>
      )}

      {xp && <WeeklyGoals hid={hid} />}

      {otd.data && otd.data.length > 0 && (
        <section>
          <SectionTitle>On this day</SectionTitle>
          <Card className="space-y-2">
            {otd.data.slice(0, 4).map(e => (
              <div key={e.id} className="flex items-start gap-2 text-sm">
                <CareTile kind={e.kind} size="sm" />
                <div className="min-w-0"><span className="font-medium">{e.title}</span> <span className="text-stone-500">· {dateLabel(e.occurred_at)}</span>
                  {e.detail && <div className="truncate text-xs text-stone-500">{e.detail}</div>}</div>
              </div>
            ))}
          </Card>
        </section>
      )}

      {log && <QuickLogSheet key={log.catId + (log.kind ?? '')} open onClose={() => setLog(null)} presetCat={log.catId} presetKind={log.kind} />}
      {checkinCat && <CheckinSheet key={checkinCat} hid={hid} cats={active} catId={checkinCat} today={todays} onClose={() => setCheckinCat(null)} />}
    </div>
  )
}

// Most households have one or two cats: give each a full card. Larger households get a compact list.
const HERO_MAX = 2
const STRIP_DAYS = 7
const HERO_ACTIONS: Array<{ kind?: Kind; label: string }> = [
  { kind: 'weight', label: 'Weigh' }, { kind: 'symptom', label: 'Observe' }, { kind: 'journal', label: 'Note' }, { label: 'More' },
]

interface CardProps {
  cat: CatSummary; canEdit: boolean; busy: boolean; week: DailyCheckin[]; meds: MedToday[]
  onCheckin: () => void; onAllUsual: () => void; onGive: (m: MedToday) => void; onLog: (k?: Kind) => void
}

function nextDue(c: CatSummary) {
  const items = [
    { label: 'Vaccine', iso: c.next_vaccine_due }, { label: 'Parasite care', iso: c.next_parasite_due }, { label: 'Care task', iso: c.next_task_due },
  ].filter(x => x.iso).sort((a, b) => a.iso!.localeCompare(b.iso!))
  return items[0] ? { label: items[0].label, d: dueLabel(items[0].iso) } : null
}

/** Oldest to newest; each day is the check-in or null. */
function weekDays(week: DailyCheckin[]) {
  return Array.from({ length: STRIP_DAYS }, (_, i) => {
    const day = localDay(subDays(new Date(), STRIP_DAYS - 1 - i))
    return { day, c: week.find(k => k.day === day) ?? null }
  })
}

function WeekStrip({ week }: { week: DailyCheckin[] }) {
  return (
    <span className="flex gap-1" aria-label="Last 7 days">
      {weekDays(week).map(({ day, c }) => {
        const flags = c ? checkinFlags(c) : []
        return <span key={day} title={c ? (flags.join(', ') || 'All usual') : 'No check-in'}
          className={cx('h-2 w-2 rounded-full', !c ? 'bg-stone-200' : flags.length ? 'bg-amber-400' : 'bg-emerald-500')} />
      })}
    </span>
  )
}

function CheckinState({ week, canEdit, busy, onCheckin, onAllUsual }: Pick<CardProps, 'week' | 'canEdit' | 'busy' | 'onCheckin' | 'onAllUsual'>) {
  const today = week.find(k => k.day === localDay())
  if (today) {
    const flags = checkinFlags(today)
    return (
      <button onClick={canEdit ? onCheckin : undefined} disabled={!canEdit} className="flex w-full flex-wrap items-center gap-1.5 text-left">
        {flags.length ? flags.map(f => <Chip key={f} tone="warn">{f}</Chip>) : <Chip tone="ok"><Check size={14} weight="bold" />All usual</Chip>}
        {today.note && <span className="min-w-0 flex-1 truncate text-xs text-stone-500">{today.note}</span>}
      </button>
    )
  }
  if (!canEdit) return <span className="text-sm text-stone-500">No check-in today</span>
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button variant="secondary" disabled={busy} onClick={onAllUsual}><Check size={16} weight="bold" />All usual</Button>
      <Button onClick={onCheckin}>Check in</Button>
    </div>
  )
}

function DoseRows({ meds, canEdit, busy, onGive }: Pick<CardProps, 'meds' | 'canEdit' | 'busy' | 'onGive'>) {
  if (!meds.length) return null
  return (
    <div className="divide-y divide-stone-100 rounded-xl bg-stone-50">
      {meds.map(m => {
        const target = m.times_per_day ?? 1
        const done = m.given_today >= target
        const cd = courseDay(m.start_on, m.end_on)
        return (
          <div key={m.id} className="flex min-h-12 items-center gap-2.5 px-3 py-1.5">
            <CareGlyph kind="medication" size={18} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{m.name}</div>
              <div className="truncate text-xs text-stone-500">{[m.dose, cd && (cd.of ? `day ${cd.day} of ${cd.of}` : `day ${cd.day}`), `${m.given_today}/${target} today`].filter(Boolean).join(' · ')}</div>
            </div>
            {done ? <Chip tone="ok">Done</Chip>
              : canEdit && <button disabled={busy} onClick={() => onGive(m)} className="rounded-full bg-paw-500 px-3.5 py-1.5 text-xs font-semibold text-white active:scale-95 disabled:opacity-50">Give</button>}
          </div>
        )
      })}
    </div>
  )
}

function CatHero(p: CardProps) {
  const { cat } = p
  const url = useSignedUrl(cat.profile_photo_path ?? cat.profile_thumbnail_path)
  const { result } = useWeightStatus(cat.cat_id)
  const v = result && result.status !== 'UNKNOWN' ? statusView(result) : null
  const due = nextDue(cat)
  return (
    <Card className="overflow-hidden p-0">
      <Link to={`/cats/${cat.cat_id}`} className="relative block aspect-[16/10] bg-gradient-to-br from-stone-50 to-stone-100 active:opacity-90">
        {url.data ? <img src={url.data} alt={cat.name} className="h-full w-full object-cover" />
          : <span className="flex h-full items-center justify-center text-6xl font-black text-paw-400">{cat.name.slice(0, 1).toUpperCase()}</span>}
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-4 pb-3 pt-10 text-white">
          <span className="block text-2xl font-black leading-tight">{cat.name}</span>
          <span className="block text-sm text-white/85">{[catAge(cat.date_of_birth, cat.dob_is_estimate), cat.last_weight_kg != null && kg(cat.last_weight_kg)].filter(Boolean).join(' · ')}</span>
        </span>
        {v && <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-stone-800 shadow-sm">{v.emoji} {v.label}</span>}
      </Link>
      <div className="space-y-3 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Today</span>
          <WeekStrip week={p.week} />
        </div>
        <CheckinState {...p} />
        <DoseRows {...p} />
        {due && (
          <Link to={`/cats/${cat.cat_id}/health`} className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2 text-sm">
            <span className="text-stone-600">Next: {due.label}</span>
            <Chip tone={due.d.tone === 'overdue' ? 'bad' : due.d.tone === 'soon' ? 'warn' : 'ok'}>{due.d.text}</Chip>
          </Link>
        )}
        {p.canEdit && (
          <div className="grid grid-cols-4 gap-2">
            {HERO_ACTIONS.map(a => (
              <button key={a.label} onClick={() => p.onLog(a.kind)} className="flex flex-col items-center justify-center gap-1 rounded-2xl py-1.5 text-[11px] font-semibold text-stone-700 transition-transform hover:bg-stone-50 active:scale-95">
                {a.kind ? <CareTile kind={a.kind} /> : <IconTile icon={G.paw} tone="stone" />}{a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

function CatRow(p: CardProps) {
  const { cat } = p
  const url = useSignedUrl(cat.profile_thumbnail_path)
  const a = attention(cat)
  const today = p.week.find(k => k.day === localDay())
  const flags = today ? checkinFlags(today) : []
  const meds = p.meds.filter(m => m.given_today < (m.times_per_day ?? 1)).length
  return (
    <div className="flex min-h-16 items-center gap-3 px-3 py-2.5">
      <Link to={`/cats/${cat.cat_id}`} className="flex min-w-0 flex-1 items-center gap-3 active:opacity-80">
        <span className="relative shrink-0">
          {url.data ? <img src={url.data} alt="" className="h-12 w-12 rounded-full object-cover" loading="lazy" />
            : <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-stone-50 to-stone-100 text-lg font-black text-paw-500">{cat.name.slice(0, 1).toUpperCase()}</span>}
          <span className={cx('absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-white', a >= 2 ? 'bg-red-500' : a === 1 ? 'bg-amber-400' : 'bg-emerald-500')} aria-label={a >= 2 ? 'Due' : a === 1 ? 'Follow-up' : 'On track'} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{cat.name}</span>
          <span className="mt-1 block"><WeekStrip week={p.week} /></span>
        </span>
      </Link>
      <span className="flex shrink-0 items-center gap-1 text-xs">
        {meds > 0 && <Chip tone="brand"><CareGlyph kind="medication" size={14} />{meds}</Chip>}
        {today ? <button onClick={p.canEdit ? p.onCheckin : undefined}><Chip tone={flags.length ? 'warn' : 'ok'}>{flags.length ? flags[0] + (flags.length > 1 ? ` +${flags.length - 1}` : '') : <><Check size={14} weight="bold" />Usual</>}</Chip></button>
          : p.canEdit ? <button onClick={p.onCheckin} className="rounded-full bg-paw-500 px-3 py-1.5 font-semibold text-white active:scale-95">Check in</button>
          : <Chip>Not yet</Chip>}
      </span>
    </div>
  )
}

export function CatTile({ cat }: { cat: CatSummary }) {
  const url = useSignedUrl(cat.profile_thumbnail_path)
  const fed = isTodayIso(cat.last_fed_at)
  const overdue = [cat.next_task_due, cat.next_vaccine_due, cat.next_parasite_due].some(d => dueLabel(d).tone === 'overdue')
  return (
    <Link to={`/cats/${cat.cat_id}`} className="block active:scale-[.98]">
      <Card className="h-full overflow-hidden p-0">
        <div className="relative aspect-[4/3] bg-gradient-to-br from-stone-50 to-stone-100">
          {url.data ? <img src={url.data} alt={cat.name} className="h-full w-full object-cover" loading="lazy" />
            : <span className="flex h-full items-center justify-center text-4xl font-black text-paw-400">{cat.name.slice(0, 1).toUpperCase()}</span>}
          {(overdue || cat.symptoms_7d > 0) && <span className="absolute right-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-red-600 shadow-sm">{overdue ? 'Due' : 'Watch'}</span>}
        </div>
        <div className="p-3">
          <div className="truncate font-bold">{cat.name}</div>
          <div className="truncate text-xs text-stone-500">{[catAge(cat.date_of_birth, cat.dob_is_estimate), cat.last_weight_kg != null && kg(cat.last_weight_kg)].filter(Boolean).join(' · ')}</div>
          <div className="mt-2 flex gap-1 text-xs">
            <Chip tone={fed ? 'ok' : 'neutral'}>{fed ? <><Check size={14} weight="bold" />Fed</> : <><CareGlyph kind="feeding" size={14} />Not yet</>}</Chip>
            {cat.active_medications > 0 && <Chip tone="brand"><CareGlyph kind="medication" size={14} />{cat.active_medications}</Chip>}
          </div>
        </div>
      </Card>
    </Link>
  )
}
