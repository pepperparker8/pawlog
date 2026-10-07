import { Link } from 'react-router-dom'
import { AlertTriangle, Eye, Info, Sparkles } from 'lucide-react'
import { useHousehold } from '../../household/HouseholdProvider'
import { Avatar, Button, Card, Chip, EmptyState, ProgressBar, SectionTitle, Spinner } from '../../components/ui'
import { useCatSummaries, useSignedUrl } from '../cats/api'
import { useHouseholdToday, useOnThisDay, usePatterns, KIND_META } from '../timeline/api'
import { useQuests } from '../gamification/api'
import { LevelCard } from '../gamification/LevelCard'
import { ago, catAge, dateLabel, kg } from '../../lib/format'
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

      <section>
        <SectionTitle action={<Link to="/cats" className="text-xs text-paw-600">All cats</Link>}>Your cats</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {cats.data.map(c => <CatTile key={c.cat_id} cat={c} />)}
        </div>
      </section>

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

export function CatTile({ cat }: { cat: CatSummary }) {
  const url = useSignedUrl(cat.profile_thumbnail_path)
  const warn = cat.symptoms_7d > 0 || (cat.next_task_due && cat.next_task_due <= new Date().toISOString().slice(0, 10))
  const fedToday = cat.last_fed_at && cat.last_fed_at.slice(0, 10) === new Date().toISOString().slice(0, 10)
  return (
    <Link to={`/cats/${cat.cat_id}`}>
      <Card className="flex h-full flex-col gap-2">
        <div className="flex items-center gap-2">
          <Avatar name={cat.name} src={url.data} size={44} />
          <div className="min-w-0">
            <div className="truncate font-bold">{cat.name}</div>
            <div className="text-xs text-stone-500">{catAge(cat.date_of_birth, cat.dob_is_estimate)} · Lv {cat.level}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          <Chip tone={fedToday ? 'ok' : 'warn'}>{fedToday ? 'Fed today' : `Fed ${ago(cat.last_fed_at)}`}</Chip>
          <Chip>{kg(cat.last_weight_kg)}</Chip>
          {warn && <Chip tone="bad">Check</Chip>}
        </div>
      </Card>
    </Link>
  )
}
