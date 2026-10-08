import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Eye, Info, Sparkles } from 'lucide-react'
import { useHousehold } from '../../household/HouseholdProvider'
import { Button, Card, Chip, EmptyState, ProgressBar, SectionTitle, Spinner, cx } from '../../components/ui'
import { useCatSummaries, useSignedUrl } from '../cats/api'
import { useHouseholdToday, useOnThisDay, usePatterns, KIND_META } from '../timeline/api'
import { useQuests } from '../gamification/api'
import { LevelCard } from '../gamification/LevelCard'
import { WeeklyGoals } from '../gamification/WeeklyGoals'
import { catAge, dateLabel, dueLabel, isTodayIso, kg } from '../../lib/format'
import { useSeedDemo } from '../household/api'
import { useToast } from '../../components/ui/Toast'
import { friendlyError } from '../../lib/errors'
import type { CatSummary } from '../../lib/types'
import { QuickLogSheet, type Kind } from '../logs/QuickLogSheet'
import { useWeightStatus } from '../weight/api'
import { statusView } from '../weight/status'
import { HomeTip } from '../tips/TipsCard'

export function HomePage() {
  const { current, canEdit } = useHousehold()
  const hid = current!.id
  const cats = useCatSummaries(hid)
  const today = useHouseholdToday(hid)
  const patterns = usePatterns(hid)
  const quests = useQuests(hid)
  const otd = useOnThisDay(hid)
  const seed = useSeedDemo()
  const toast = useToast()
  const [log, setLog] = useState<{ catId: string; kind: Kind } | null>(null)

  if (cats.isLoading) return <Spinner />
  if (!cats.data?.length) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-black">{current!.name}</h1>
        <EmptyState emoji="🐈" title="No cats yet" body="Add your first cat, or load a demo household to look around."
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

  const act = patterns.data?.filter(p => p.severity !== 'info') ?? []
  const info = patterns.data?.filter(p => p.severity === 'info') ?? []
  const questsDone = quests.data?.filter(q => q.completed).length ?? 0

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-black">{current!.name}</h1>
        {today.data && (
          <p className="text-sm text-stone-500">
            {today.data.cats_fed_today}/{today.data.cats} fed · {today.data.logs_today} logs · +{today.data.xp_today} XP today
          </p>
        )}
      </header>

      {cats.data.length <= HERO_MAX ? (
        <section className="space-y-3">
          {cats.data.map(c => <CatHero key={c.cat_id} cat={c} canLog={canEdit} onLog={kind => setLog({ catId: c.cat_id, kind })} />)}
        </section>
      ) : (
        <section>
          <SectionTitle action={<Link to="/cats" className="text-xs text-paw-600">All cats</Link>}>Your cats</SectionTitle>
          <Card className="divide-y divide-stone-100 p-0">
            {[...cats.data].sort((a, b) => attention(b) - attention(a)).map(c => <CatRow key={c.cat_id} cat={c} />)}
          </Card>
        </section>
      )}

      <LevelCard compact />

      {(act.length > 0 || info.length > 0) && (
        <section>
          <SectionTitle>Needs attention</SectionTitle>
          <div className="space-y-2">
            {act.map(p => (
              <Link key={p.cat_id + p.code} to={`/cats/${p.cat_id}`}>
                <Card className={`flex gap-3 ${p.severity === 'act' ? 'ring-red-100' : 'ring-amber-100'}`}>
                  {p.severity === 'act' ? <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" /> : <Eye className="h-5 w-5 shrink-0 text-amber-500" />}
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
          <p className="mt-1 text-[11px] text-stone-400">Patterns are simple comparisons of your own logs, not a diagnosis. Talk to your vet when something worries you.</p>
        </section>
      )}

      <HomeTip hid={current!.id} />

      {quests.data && quests.data.length > 0 && (
        <section>
          <SectionTitle action={<span className="text-xs text-stone-500">{questsDone}/{quests.data.length} done</span>}>Today's quests</SectionTitle>
          <Card className="divide-y divide-stone-100 p-0">
            {quests.data.map(q => (
              <div key={q.quest_code} className="flex items-center gap-3 px-4 py-2.5">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm ${q.completed ? 'bg-emerald-100' : 'bg-stone-100'}`}>{q.completed ? '✓' : '○'}</div>
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

      <WeeklyGoals hid={hid} />

      {otd.data && otd.data.length > 0 && (
        <section>
          <SectionTitle>On this day</SectionTitle>
          <Card className="space-y-2">
            {otd.data.slice(0, 4).map(e => (
              <div key={e.id} className="flex items-start gap-2 text-sm">
                <span>{KIND_META[e.kind]?.emoji}</span>
                <div className="min-w-0"><span className="font-medium">{e.title}</span> <span className="text-stone-500">· {dateLabel(e.occurred_at)}</span>
                  {e.detail && <div className="truncate text-xs text-stone-500">{e.detail}</div>}</div>
              </div>
            ))}
          </Card>
        </section>
      )}

      <p className="flex items-center justify-center gap-1 pb-2 text-xs text-stone-400"><Sparkles className="h-3 w-3" /> Small daily logs become a lifelong story.</p>
      {log && <QuickLogSheet key={log.catId + log.kind} open onClose={() => setLog(null)} presetCat={log.catId} presetKind={log.kind} />}
    </div>
  )
}

// Most households have one or two cats: give each a full card. Larger households get a compact list.
const HERO_MAX = 2
const HERO_ACTIONS: Array<{ kind: Kind; emoji: string; label: string }> = [
  { kind: 'feeding', emoji: '🍽️', label: 'Feed' }, { kind: 'litter', emoji: '🧹', label: 'Litter' },
  { kind: 'weight', emoji: '⚖️', label: 'Weigh' }, { kind: 'symptom', emoji: '🩺', label: 'Observe' },
]

function nextDue(c: CatSummary) {
  const items = [
    { label: 'Vaccine', iso: c.next_vaccine_due }, { label: 'Parasite care', iso: c.next_parasite_due }, { label: 'Care task', iso: c.next_task_due },
  ].filter(x => x.iso).sort((a, b) => a.iso!.localeCompare(b.iso!))
  return items[0] ? { label: items[0].label, d: dueLabel(items[0].iso) } : null
}

function CatHero({ cat, canLog, onLog }: { cat: CatSummary; canLog: boolean; onLog: (k: Kind) => void }) {
  const url = useSignedUrl(cat.profile_photo_path ?? cat.profile_thumbnail_path)
  const { result } = useWeightStatus(cat.cat_id)
  const v = result && result.status !== 'UNKNOWN' ? statusView(result) : null
  const fed = isTodayIso(cat.last_fed_at), litter = isTodayIso(cat.last_litter_at)
  const due = nextDue(cat)
  return (
    <Card className="overflow-hidden p-0">
      <Link to={`/cats/${cat.cat_id}`} className="relative block aspect-[16/10] bg-gradient-to-br from-paw-100 to-paw-200 active:opacity-90">
        {url.data ? <img src={url.data} alt={cat.name} className="h-full w-full object-cover" />
          : <span className="flex h-full items-center justify-center text-6xl font-black text-paw-400">{cat.name.slice(0, 1).toUpperCase()}</span>}
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-4 pb-3 pt-10 text-white">
          <span className="block text-2xl font-black leading-tight">{cat.name}</span>
          <span className="block text-sm text-white/85">{[catAge(cat.date_of_birth, cat.dob_is_estimate), cat.last_weight_kg != null && kg(cat.last_weight_kg)].filter(Boolean).join(' · ')}</span>
        </span>
        {v && <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-stone-800 shadow-sm">{v.emoji} {v.label}</span>}
      </Link>
      <div className="space-y-3 p-3">
        <div className="flex flex-wrap gap-1.5 text-xs">
          <Chip tone={fed ? 'ok' : 'neutral'}>{fed ? '🍽️ Fed today' : '🍽️ Not fed yet'}</Chip>
          <Chip tone={litter ? 'ok' : 'neutral'}>{litter ? '🧹 Litter done' : '🧹 Not scooped yet'}</Chip>
          {cat.active_medications > 0 && <Chip tone="brand">💊 {cat.active_medications} active</Chip>}
          {cat.symptoms_7d > 0 && <Chip tone="warn">🩺 {cat.symptoms_7d} noted this week</Chip>}
        </div>
        {due && (
          <Link to={`/cats/${cat.cat_id}/health`} className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2 text-sm">
            <span className="text-stone-600">Next: {due.label}</span>
            <Chip tone={due.d.tone === 'overdue' ? 'bad' : due.d.tone === 'soon' ? 'warn' : 'ok'}>{due.d.text}</Chip>
          </Link>
        )}
        {canLog && !cat.archived_at && (
          <div className="grid grid-cols-4 gap-2">
            {HERO_ACTIONS.map(a => (
              <button key={a.kind} onClick={() => onLog(a.kind)} className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl bg-paw-50 text-[11px] font-semibold text-stone-700 active:scale-95">
                <span className="text-lg leading-none" aria-hidden>{a.emoji}</span>{a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

function attention(c: CatSummary) {
  const overdue = [c.next_task_due, c.next_vaccine_due, c.next_parasite_due].some(d => dueLabel(d).tone === 'overdue')
  return (overdue ? 2 : 0) + (c.symptoms_7d > 0 ? 1 : 0)
}

function CatRow({ cat }: { cat: CatSummary }) {
  const url = useSignedUrl(cat.profile_thumbnail_path)
  const fed = isTodayIso(cat.last_fed_at)
  const a = attention(cat)
  return (
    <Link to={`/cats/${cat.cat_id}`} className="flex min-h-16 items-center gap-3 px-3 py-2.5 active:bg-paw-50">
      <span className="relative shrink-0">
        {url.data ? <img src={url.data} alt="" className="h-12 w-12 rounded-full object-cover" loading="lazy" />
          : <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-paw-100 to-paw-200 text-lg font-black text-paw-500">{cat.name.slice(0, 1).toUpperCase()}</span>}
        <span className={cx('absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-white', a >= 2 ? 'bg-red-500' : a === 1 ? 'bg-amber-400' : 'bg-emerald-500')} aria-label={a >= 2 ? 'Due' : a === 1 ? 'Follow-up' : 'On track'} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{cat.name}</span>
        <span className="block truncate text-xs text-stone-500">{[catAge(cat.date_of_birth, cat.dob_is_estimate), cat.last_weight_kg != null && kg(cat.last_weight_kg)].filter(Boolean).join(' · ')}</span>
      </span>
      <span className="flex shrink-0 gap-1 text-xs">
        {a >= 2 && <Chip tone="bad">Due</Chip>}
        {a === 1 && <Chip tone="warn">Watch</Chip>}
        {cat.active_medications > 0 && <Chip tone="brand">💊 {cat.active_medications}</Chip>}
        <Chip tone={fed ? 'ok' : 'neutral'}>{fed ? '🍽️ Fed' : '🍽️ —'}</Chip>
      </span>
    </Link>
  )
}

export function CatTile({ cat }: { cat: CatSummary }) {
  const url = useSignedUrl(cat.profile_thumbnail_path)
  const fed = isTodayIso(cat.last_fed_at)
  const overdue = [cat.next_task_due, cat.next_vaccine_due, cat.next_parasite_due].some(d => dueLabel(d).tone === 'overdue')
  return (
    <Link to={`/cats/${cat.cat_id}`} className="block active:scale-[.98]">
      <Card className="h-full overflow-hidden p-0">
        <div className="relative aspect-[4/3] bg-gradient-to-br from-paw-100 to-paw-200">
          {url.data ? <img src={url.data} alt={cat.name} className="h-full w-full object-cover" loading="lazy" />
            : <span className="flex h-full items-center justify-center text-4xl font-black text-paw-400">{cat.name.slice(0, 1).toUpperCase()}</span>}
          {(overdue || cat.symptoms_7d > 0) && <span className="absolute right-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-red-600 shadow-sm">{overdue ? 'Due' : 'Watch'}</span>}
        </div>
        <div className="p-3">
          <div className="truncate font-bold">{cat.name}</div>
          <div className="truncate text-xs text-stone-500">{[catAge(cat.date_of_birth, cat.dob_is_estimate), cat.last_weight_kg != null && kg(cat.last_weight_kg)].filter(Boolean).join(' · ')}</div>
          <div className="mt-2 flex gap-1 text-xs">
            <Chip tone={fed ? 'ok' : 'neutral'}>{fed ? '🍽️ Fed' : '🍽️ Not yet'}</Chip>
            {cat.active_medications > 0 && <Chip tone="brand">💊 {cat.active_medications}</Chip>}
          </div>
        </div>
      </Card>
    </Link>
  )
}
