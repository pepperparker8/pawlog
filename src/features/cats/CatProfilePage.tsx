import { useState } from 'react'
import { Link, NavLink, Route, Routes, useParams } from 'react-router-dom'
import { Pencil, Plus } from 'lucide-react'
import { useHousehold } from '../../household/HouseholdProvider'
import { Avatar, Button, Card, Chip, EmptyState, Spinner, cx } from '../../components/ui'
import { PageHeader } from '../../components/layout/PageHeader'
import { useCat, useCatSummaries, useSignedUrl } from './api'
import { TimelinePage } from '../timeline/TimelinePage'
import { GrowthChart } from '../growth/GrowthChart'
import { HealthTab } from '../health/HealthTab'
import { PhotoGrid } from '../photos/PhotoGrid'
import { PassportTab } from './PassportTab'
import { QuickLogSheet } from '../logs/QuickLogSheet'
import { ago, catAge, dueLabel, kg } from '../../lib/format'

const TABS = [['', 'Overview'], ['timeline', 'Timeline'], ['health', 'Health'], ['growth', 'Growth'], ['photos', 'Photos'], ['passport', 'Passport']] as const

export function CatProfilePage() {
  const { id = '' } = useParams()
  const { current, canEdit } = useHousehold()
  const cat = useCat(id)
  const summaries = useCatSummaries(current!.id, true)
  const s = summaries.data?.find(c => c.cat_id === id)
  const url = useSignedUrl(s?.profile_photo_path)
  const [logOpen, setLogOpen] = useState(false)
  if (cat.isLoading) return <Spinner />
  if (!cat.data) return <EmptyState emoji="🙈" title="Cat not found" body="It may belong to another household." action={<Link to="/cats"><Button variant="secondary">Back to cats</Button></Link>} />
  const c = cat.data
  return (
    <div>
      <PageHeader title={c.name} subtitle={[c.nickname && `"${c.nickname}"`, c.breed, catAge(c.date_of_birth, c.dob_is_estimate)].filter(Boolean).join(' · ')} back="/cats"
        action={canEdit && <Link to={`/cats/${id}/edit`} className="rounded-full p-2 hover:bg-stone-100" aria-label="Edit"><Pencil className="h-5 w-5" /></Link>} />
      <div className="relative -mx-4 mb-4 h-44 overflow-hidden bg-paw-100">
        {url.data ? <img src={url.data} alt={c.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-7xl">🐱</div>}
        <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 bg-gradient-to-t from-black/60 to-transparent p-4 text-white">
          <Avatar name={c.name} src={url.data} size={56} />
          <div className="flex-1">
            <div className="flex flex-wrap gap-1">
              {c.archived_at && <Chip tone="neutral">Archived</Chip>}
              {c.deceased_on && <Chip tone="neutral">In memory</Chip>}
              {s && <Chip tone="brand">Lv {s.level} · {s.total_xp} XP</Chip>}
              {s && s.streak_current > 0 && <Chip tone="ok">🔥 {s.streak_current} d</Chip>}
            </div>
          </div>
          {canEdit && !c.archived_at && <Button className="px-3" onClick={() => setLogOpen(true)}><Plus className="h-4 w-4" />Log</Button>}
        </div>
      </div>
      <div className="scrollbar-none -mx-4 mb-4 flex gap-1 overflow-x-auto border-b border-stone-200 px-4">
        {TABS.map(([path, label]) => (
          <NavLink key={path} to={path} end={path === ''} className={({ isActive }) => cx('shrink-0 border-b-2 px-3 py-2 text-sm font-medium', isActive ? 'border-paw-500 text-paw-700' : 'border-transparent text-stone-500')}>{label}</NavLink>
        ))}
      </div>
      <Routes>
        <Route index element={<Overview id={id} s={s} />} />
        <Route path="timeline" element={<TimelinePage catId={id} embedded />} />
        <Route path="health" element={<HealthTab catId={id} />} />
        <Route path="growth" element={<GrowthChart catId={id} />} />
        <Route path="photos" element={<PhotoGrid catId={id} />} />
        <Route path="passport" element={<PassportTab cat={c} />} />
      </Routes>
      <QuickLogSheet open={logOpen} onClose={() => setLogOpen(false)} presetCat={id} />
    </div>
  )
}

function Overview({ id, s }: { id: string; s?: ReturnType<typeof useCatSummaries>['data'] extends (infer T)[] | undefined ? T : never }) {
  if (!s) return <Spinner />
  const vac = dueLabel(s.next_vaccine_due), para = dueLabel(s.next_parasite_due), task = dueLabel(s.next_task_due)
  const tone = (t: string) => (t === 'overdue' ? 'bad' : t === 'soon' ? 'warn' : t === 'ok' ? 'ok' : 'neutral') as 'bad' | 'warn' | 'ok' | 'neutral'
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Weight" value={kg(s.last_weight_kg)} sub={ago(s.last_weight_at)} to={`/cats/${id}/growth`} />
        <Stat label="Last fed" value={ago(s.last_fed_at)} sub="feeding" />
        <Stat label="Litter" value={ago(s.last_litter_at)} sub="last scoop / observation" />
        <Stat label="Grooming" value={ago(s.last_grooming_at)} sub="last session" />
      </div>
      <Card className="space-y-2">
        <Row label="Symptoms, 7 days" value={s.symptoms_7d ? <Chip tone="warn">{s.symptoms_7d}</Chip> : <Chip tone="ok">none</Chip>} />
        <Row label="Active medications" value={<Chip tone={s.active_medications ? 'brand' : 'neutral'}>{s.active_medications}</Chip>} />
        <Row label="Next vaccine" value={<Chip tone={tone(vac.tone)}>{vac.text}</Chip>} />
        <Row label="Next parasite treatment" value={<Chip tone={tone(para.tone)}>{para.text}</Chip>} />
        <Row label="Next care task" value={<Chip tone={tone(task.tone)}>{task.text}</Chip>} />
        <Row label="Photos" value={<Link to={`/cats/${id}/photos`} className="text-sm text-paw-600">{s.photo_count}</Link>} />
      </Card>
    </div>
  )
}

function Stat({ label, value, sub, to }: { label: string; value: string; sub: string; to?: string }) {
  const body = (
    <Card className="p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">{label}</div>
      <div className="truncate text-base font-bold">{value}</div>
      <div className="truncate text-[10px] text-stone-400">{sub}</div>
    </Card>)
  return to ? <Link to={to}>{body}</Link> : body
}
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex items-center justify-between text-sm"><span className="text-stone-600">{label}</span>{value}</div>
}
