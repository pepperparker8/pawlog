import { Link } from 'react-router-dom'
import { AlertTriangle, Eye, Info, Sparkles } from 'lucide-react'
import { useHousehold } from '../../household/HouseholdProvider'
import { Button, Card, Chip, EmptyState, ProgressBar, SectionTitle, Spinner, cx } from '../../components/ui'
import { useCatSummaries, useSignedUrl } from '../cats/api'
import { useHouseholdToday, useOnThisDay, usePatterns, KIND_META } from '../timeline/api'
import { useQuests } from '../gamification/api'
import { LevelCard } from '../gamification/LevelCard'
import { catAge, dateLabel, dueLabel, isTodayIso, kg } from '../../lib/format'
import { useSeedDemo } from '../household/api'
import { useToast } from '../../components/ui/Toast'
import { friendlyError } from '../../lib/errors'
import type { CatSummary } from '../../lib/types'

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

      <section>
        <SectionTitle action={<Link to="/cats" className="text-xs text-paw-600">All cats</Link>}>Your cats</SectionTitle>
        <Card className="divide-y divide-stone-100 p-0">
          {[...cats.data].sort((a, b) => attention(b) - attention(a)).map(c => <CatRow key={c.cat_id} cat={c} />)}
        </Card>
      </section>

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
    </div>
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
