import { useState, type FormEvent } from 'react'
import { Check, Plus, CalendarCheck } from '../../components/icons'
import { useAuth } from '../../auth/AuthProvider'
import { useHousehold } from '../../household/HouseholdProvider'
import { Button, Card, Chip, EmptyState, ErrorNote, Field, Input, Select, Sheet, Spinner, cx } from '../../components/ui'
import { PageHeader } from '../../components/layout/PageHeader'
import { useToast } from '../../components/ui/Toast'
import { friendlyError } from '../../lib/errors'
import { dueLabel, todayInput } from '../../lib/format'
import { useCatSummaries } from '../cats/api'
import { useMembers } from '../household/api'
import { useCareTasks, useCompleteCareTask, useSaveCareTask } from './api'
import type { CareTask } from '../../lib/types'

const KINDS: { value: CareTask['kind']; label: string }[] = [
  { value: 'flea_tick', label: 'Flea & tick' }, { value: 'deworming', label: 'Deworming' }, { value: 'grooming', label: 'Grooming' },
  { value: 'nail_trim', label: 'Nail trim' }, { value: 'vaccination', label: 'Vaccination' }, { value: 'vet_visit', label: 'Vet visit' },
  { value: 'dental', label: 'Dental' }, { value: 'medication', label: 'Medication' }, { value: 'custom', label: 'Custom' },
]

export const TASK_PRESETS: { name: string; kind: CareTask['kind']; frequency_days: number }[] = [
  { name: 'Nail trim', kind: 'nail_trim', frequency_days: 21 },
  { name: 'Litter box full clean', kind: 'custom', frequency_days: 7 },
  { name: 'Parasite prevention', kind: 'flea_tick', frequency_days: 30 },
  { name: 'Water fountain clean', kind: 'custom', frequency_days: 7 },
  { name: 'Brushing', kind: 'grooming', frequency_days: 7 },
  { name: 'Annual check-up', kind: 'vet_visit', frequency_days: 365 },
]

export function CarePage() {
  const { current, canEdit } = useHousehold()
  const hid = current!.id
  const tasks = useCareTasks(hid)
  const cats = useCatSummaries(hid)
  const complete = useCompleteCareTask(hid)
  const toast = useToast()
  const [editing, setEditing] = useState<Partial<CareTask> | null>(null)
  const name = (id: string | null) => cats.data?.find(c => c.cat_id === id)?.name ?? 'Household'

  async function done(t: CareTask) {
    try { await complete.mutateAsync(t); toast.show(`✓ ${t.name} done${t.frequency_days ? `, next in ${t.frequency_days} days` : ''}`, 'ok') } catch (e) { toast.show(friendlyError(e), 'bad') }
  }

  const groups = [
    { label: 'Overdue', f: (t: CareTask) => dueLabel(t.next_due_on).tone === 'overdue' },
    { label: 'Soon', f: (t: CareTask) => dueLabel(t.next_due_on).tone === 'soon' },
    { label: 'Later', f: (t: CareTask) => ['ok', 'none'].includes(dueLabel(t.next_due_on).tone) },
  ]

  return (
    <div>
      <PageHeader title="Care schedule" back="/more" action={canEdit && <Button className="px-3" onClick={() => setEditing({})}><Plus className="h-4 w-4" />Task</Button>} />
      {tasks.isLoading ? <Spinner /> : !tasks.data?.length ? (
        <EmptyState icon={CalendarCheck} title="No recurring tasks yet" body="Nail trims, litter box cleans, parasite prevention. Set the rhythm once and PawLog reminds you when each is due." action={canEdit && <Button onClick={() => setEditing({})}>Add a task</Button>} />
      ) : groups.map(g => {
        const items = tasks.data!.filter(g.f)
        if (!items.length) return null
        return (
          <section key={g.label} className="mb-5">
            <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-stone-500">{g.label}</h3>
            <Card className="divide-y divide-stone-100 p-0">
              {items.map(t => {
                const d = dueLabel(t.next_due_on)
                return (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                    <button disabled={!canEdit || complete.isPending} onClick={() => void done(t)} aria-label="Done"
                      className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2', d.tone === 'overdue' ? 'border-red-400 text-red-500' : 'border-paw-400 text-paw-600', !canEdit && 'opacity-40')}><Check className="h-4 w-4" /></button>
                    <button className="min-w-0 flex-1 text-left" onClick={() => canEdit && setEditing(t)}>
                      <div className="truncate text-sm font-medium">{t.name}</div>
                      <div className="text-xs text-stone-500">{name(t.cat_id)}{t.frequency_days ? ` · every ${t.frequency_days} d` : ' · one-off'}</div>
                    </button>
                    <Chip tone={d.tone === 'overdue' ? 'bad' : d.tone === 'soon' ? 'warn' : 'neutral'}>{d.text}</Chip>
                  </div>)
              })}
            </Card>
          </section>)
      })}
      {editing && <TaskSheet task={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function TaskSheet({ task, onClose }: { task: Partial<CareTask>; onClose: () => void }) {
  const { current } = useHousehold()
  const { user } = useAuth()
  const hid = current!.id
  const cats = useCatSummaries(hid)
  const members = useMembers(hid)
  const save = useSaveCareTask(hid)
  const toast = useToast()
  const [f, setF] = useState({ name: task.name ?? '', kind: task.kind ?? 'custom', cat_id: task.cat_id ?? '', frequency_days: task.frequency_days?.toString() ?? '30',
    next_due_on: task.next_due_on ?? todayInput(), assigned_to: task.assigned_to ?? user!.id, reminder_enabled: task.reminder_enabled ?? true, active: task.active ?? true })
  const [error, setError] = useState<string | null>(null)
  const set = (k: keyof typeof f, v: string | boolean) => setF(s => ({ ...s, [k]: v }))
  async function submit(e: FormEvent) {
    e.preventDefault(); setError(null)
    if (!f.name.trim()) { setError('Give the task a name.'); return }
    try {
      await save.mutateAsync({ id: task.id, name: f.name.trim(), kind: f.kind, cat_id: f.cat_id || null, frequency_days: f.frequency_days ? Number(f.frequency_days) : null,
        next_due_on: f.next_due_on || null, assigned_to: f.assigned_to || null, reminder_enabled: f.reminder_enabled, active: f.active })
      toast.show('Saved'); onClose()
    } catch (err) { setError(friendlyError(err)) }
  }
  return (
    <Sheet open onClose={onClose} title={task.id ? 'Edit task' : 'New task'}>
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        {!task.id && (
          <div className="col-span-2">
            <div className="mb-1.5 text-xs font-medium text-stone-500">Quick start</div>
            <div className="flex flex-wrap gap-1.5">
              {TASK_PRESETS.map(p => (
                <button key={p.name} type="button" onClick={() => setF(s => ({ ...s, name: p.name, kind: p.kind, frequency_days: String(p.frequency_days) }))}
                  className={cx('rounded-full border px-3 py-1 text-xs font-medium transition-colors', f.name === p.name ? 'border-paw-500 bg-paw-50 text-paw-700' : 'border-stone-200 text-stone-600 hover:border-paw-300')}>
                  {p.name} · {p.frequency_days} d
                </button>))}
            </div>
          </div>)}
        <Field label="Task" className="col-span-2"><Input value={f.name} onChange={e => set('name', e.target.value)} placeholder="Nail trim" /></Field>
        <Field label="Kind"><Select value={f.kind} onChange={e => set('kind', e.target.value)}>{KINDS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}</Select></Field>
        <Field label="Cat"><Select value={f.cat_id} onChange={e => set('cat_id', e.target.value)}><option value="">Whole household</option>{cats.data?.map(c => <option key={c.cat_id} value={c.cat_id}>{c.name}</option>)}</Select></Field>
        <Field label="Every (days)" hint="Blank = one-off"><Input type="number" inputMode="numeric" min={1} value={f.frequency_days} onChange={e => set('frequency_days', e.target.value)} /></Field>
        <Field label="Next due"><Input type="date" value={f.next_due_on} onChange={e => set('next_due_on', e.target.value)} /></Field>
        <Field label="Assigned to" className="col-span-2"><Select value={f.assigned_to} onChange={e => set('assigned_to', e.target.value)}><option value="">Anyone</option>{members.data?.map(m => <option key={m.user_id} value={m.user_id}>{m.profiles?.display_name ?? m.user_id.slice(0, 8)}</option>)}</Select></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.reminder_enabled} onChange={e => set('reminder_enabled', e.target.checked)} />Remind me</label>
        {task.id && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={e => set('active', e.target.checked)} />Active</label>}
        <ErrorNote message={error} />
        <Button type="submit" className="col-span-2" loading={save.isPending}>Save</Button>
      </form>
    </Sheet>
  )
}
