import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash, CareTile, Search, G } from '../../components/icons'
import { useHousehold } from '../../household/HouseholdProvider'
import { useCatSummaries } from '../cats/api'
import { Button, Card, EmptyState, Select, Spinner, cx } from '../../components/ui'
import { PageHeader } from '../../components/layout/PageHeader'
import { KIND_META, useTimeline } from './api'
import { dayLabel, timeLabel } from '../../lib/format'
import { deleteLog, KIND_TO_TABLE } from '../logs/api'
import { invalidateHousehold } from '../../lib/queryClient'
import { useToast } from '../../components/ui/Toast'
import { friendlyError } from '../../lib/errors'
import type { TimelineEvent, TimelineKind } from '../../lib/types'

const GROUPS: Array<{ label: string; kinds: TimelineKind[] }> = [
  { label: 'All', kinds: [] },
  { label: 'Health', kinds: ['symptom', 'medication', 'vet_visit', 'vaccination', 'parasite'] },
  { label: 'Daily care', kinds: ['feeding', 'water', 'litter', 'grooming', 'activity', 'care_task'] },
  { label: 'Growth', kinds: ['weight', 'milestone'] },
  { label: 'Memories', kinds: ['photo', 'journal', 'behavior'] },
]

export function TimelinePage({ catId, embedded = false }: { catId?: string; embedded?: boolean }) {
  const { current, canEdit } = useHousehold()
  const hid = current!.id
  const cats = useCatSummaries(hid, true)
  const [cat, setCat] = useState(catId ?? '')
  const [group, setGroup] = useState(0)
  const filters = useMemo(() => ({ catId: cat || undefined, kinds: GROUPS[group].kinds.length ? GROUPS[group].kinds : undefined }), [cat, group])
  const q = useTimeline(hid, filters)
  const toast = useToast()
  const events = useMemo(() => q.data?.pages.flat() ?? [], [q.data])
  const catName = (id: string | null) => cats.data?.find(c => c.cat_id === id)?.name

  const byDay = useMemo(() => {
    const m = new Map<string, TimelineEvent[]>()
    for (const e of events) { const k = e.occurred_at.slice(0, 10); m.set(k, [...(m.get(k) ?? []), e]) }
    return [...m.entries()]
  }, [events])

  async function remove(e: TimelineEvent) {
    if (!confirm(`Delete this ${KIND_META[e.kind].label.toLowerCase()} entry?`)) return
    try { await deleteLog(KIND_TO_TABLE[e.kind], e.id); invalidateHousehold(hid); toast.show('Deleted') } catch (err) { toast.show(friendlyError(err), 'bad') }
  }

  return (
    <div>
      {!embedded && <PageHeader title="Timeline" action={<Link to="/more/search" aria-label="Search" className="rounded-full p-2.5 text-stone-600 hover:bg-stone-100"><Search size={22} /></Link>} />}
      <div className="mb-3 flex gap-2">
        {!catId && (
          <Select value={cat} onChange={e => setCat(e.target.value)} className="w-auto flex-1 py-2 text-sm">
            <option value="">All cats</option>
            {cats.data?.map(c => <option key={c.cat_id} value={c.cat_id}>{c.name}</option>)}
          </Select>
        )}
      </div>
      <div className="scrollbar-none -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
        {GROUPS.map((g, i) => (
          <button key={g.label} onClick={() => setGroup(i)} className={cx('shrink-0 rounded-full px-3 py-1.5 text-xs font-medium', i === group ? 'bg-paw-500 text-white' : 'bg-white ring-1 ring-stone-200')}>{g.label}</button>
        ))}
      </div>
      {q.isLoading ? <Spinner /> : events.length === 0 ? (
        <EmptyState icon={G.history} title="Nothing here yet" />
      ) : (
        <div className="space-y-4">
          {byDay.map(([day, items]) => (
            <section key={day}>
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-stone-500">{dayLabel(items[0].occurred_at)}</h3>
              <Card className="divide-y divide-stone-100 p-0">
                {items.map(e => (
                  <div key={e.kind + e.id} className="flex items-start gap-3 px-3 py-2.5">
                    <CareTile kind={e.kind} size="sm" className="mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="truncate text-sm font-medium">{e.title}</span>
                        {!catId && e.cat_id && <Link to={`/cats/${e.cat_id}`} className="shrink-0 text-xs text-paw-600">{catName(e.cat_id)}</Link>}
                      </div>
                      {e.detail && <div className="line-clamp-2 text-xs text-stone-500">{e.detail}</div>}
                      <Detail e={e} />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-stone-400">{timeLabel(e.occurred_at)}</span>
                      {canEdit && e.kind !== 'milestone' && e.kind !== 'care_task' && (
                        <button onClick={() => void remove(e)} className="rounded p-1 text-stone-300 hover:text-red-500" aria-label="Delete"><Trash className="h-3.5 w-3.5" /></button>
                      )}
                    </div>
                  </div>
                ))}
              </Card>
            </section>
          ))}
          {q.hasNextPage && <Button variant="secondary" className="w-full" loading={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>Load older</Button>}
        </div>
      )}
    </div>
  )
}

function Detail({ e }: { e: TimelineEvent }) {
  const d = e.data as Record<string, unknown>
  const bits: string[] = []
  if (e.kind === 'feeding' && d.amount) bits.push(`${d.amount} ${d.unit ?? ''}`)
  if (e.kind === 'feeding' && d.appetite != null) bits.push(`appetite ${d.appetite}/5`)
  if (e.kind === 'symptom' && d.severity) bits.push(String(d.severity))
  if (e.kind === 'litter' && (d.stool || d.urine)) bits.push([d.stool && `stool ${d.stool}`, d.urine && `urine ${d.urine}`].filter(Boolean).join(', '))
  if ((e.kind === 'grooming' || e.kind === 'activity') && d.duration_min) bits.push(`${d.duration_min} min`)
  if (e.kind === 'vaccination' && d.next_due_on) bits.push(`next ${d.next_due_on}`)
  if (e.kind === 'vet_visit' && d.cost) bits.push(`${d.cost}`)
  if (!bits.length) return null
  return <div className="text-xs text-stone-400">{bits.join(' · ')}</div>
}
