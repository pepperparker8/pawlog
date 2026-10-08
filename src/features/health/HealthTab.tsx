import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CaretRight, Check, Clipboard, IconTile, Plus, Trash } from '../../components/icons'
import { useHousehold } from '../../household/HouseholdProvider'
import { Button, Card, Chip, ErrorNote, Field, Input, SectionTitle, Select, Sheet, Spinner, Textarea } from '../../components/ui'
import { useToast } from '../../components/ui/Toast'
import { friendlyError } from '../../lib/errors'
import { courseDay, dateLabel, dueLabel, todayInput } from '../../lib/format'
import { useCatHealth, useDeleteHealthRow, useGiveDose, useMedsToday, useSaveHealthRow, type MedToday } from './api'

export const PARASITE_KINDS: Array<[string, string]> = [['flea_tick', 'Flea and tick'], ['deworming', 'Deworming'], ['heartworm', 'Heartworm'], ['other', 'Other']]
export const parasiteLabel = (k: string) => PARASITE_KINDS.find(([v]) => v === k)?.[1] ?? k

type Table = 'cat_medications' | 'cat_conditions' | 'vet_visits' | 'vaccination_records' | 'parasite_treatments'
type FieldDef = { key: string; label: string; type?: 'text' | 'date' | 'number' | 'textarea' | 'select' | 'checkbox'; options?: Array<[string, string]>; required?: boolean; default?: string }
const FORMS: Record<Table, { title: string; fields: FieldDef[] }> = {
  cat_medications: { title: 'Medication', fields: [
    { key: 'name', label: 'Name', required: true }, { key: 'dose', label: 'Dose' }, { key: 'frequency', label: 'Frequency' },
    { key: 'times_per_day', label: 'Times per day', type: 'number' }, { key: 'start_on', label: 'Start', type: 'date', default: 'today' },
    { key: 'end_on', label: 'End', type: 'date' }, { key: 'reason', label: 'Reason', type: 'textarea' }, { key: 'active', label: 'Active', type: 'checkbox', default: 'true' } ] },
  cat_conditions: { title: 'Condition', fields: [
    { key: 'name', label: 'Condition', required: true }, { key: 'noted_on', label: 'Noted on', type: 'date', default: 'today' },
    { key: 'status', label: 'Status', type: 'select', options: [['active', 'Active'], ['monitoring', 'Monitoring'], ['resolved', 'Resolved']], default: 'active' }, { key: 'notes', label: 'Notes', type: 'textarea' } ] },
  vet_visits: { title: 'Vet visit', fields: [
    { key: 'visited_on', label: 'Date', type: 'date', required: true, default: 'today' }, { key: 'clinic', label: 'Clinic' }, { key: 'vet_name', label: 'Vet' },
    { key: 'reason', label: 'Reason' }, { key: 'findings', label: 'Findings', type: 'textarea' }, { key: 'cost', label: 'Cost', type: 'number' },
    { key: 'follow_up_on', label: 'Follow-up', type: 'date' }, { key: 'note', label: 'Note', type: 'textarea' } ] },
  vaccination_records: { title: 'Vaccination', fields: [
    { key: 'vaccine_name', label: 'Vaccine', required: true }, { key: 'given_on', label: 'Given on', type: 'date', required: true, default: 'today' },
    { key: 'next_due_on', label: 'Next due', type: 'date' }, { key: 'clinic', label: 'Clinic' }, { key: 'batch_no', label: 'Batch no.' }, { key: 'note', label: 'Note', type: 'textarea' } ] },
  parasite_treatments: { title: 'Parasite treatment', fields: [
    { key: 'kind', label: 'Kind', type: 'select', options: PARASITE_KINDS, default: 'flea_tick' },
    { key: 'product', label: 'Product' }, { key: 'given_on', label: 'Given on', type: 'date', required: true, default: 'today' }, { key: 'next_due_on', label: 'Next due', type: 'date' }, { key: 'note', label: 'Note', type: 'textarea' } ] },
}

export function HealthTab({ catId }: { catId: string }) {
  const { current, canEdit } = useHousehold()
  const h = useCatHealth(catId)
  const meds = useMedsToday(current!.id)
  const [editing, setEditing] = useState<{ table: Table; row?: Record<string, unknown> } | null>(null)
  if (h.error) return <ErrorNote message={friendlyError(h.error)} />
  if (h.isLoading || !h.data) return <Spinner />
  const d = h.data
  const add = (table: Table) => canEdit && <button onClick={() => setEditing({ table })} className="flex items-center gap-1 rounded-full bg-paw-100 px-3 py-1.5 text-xs font-semibold text-paw-700"><Plus className="h-3.5 w-3.5" />Add</button>
  const due = (iso: string | null) => { const x = dueLabel(iso); return <Chip tone={x.tone === 'overdue' ? 'bad' : x.tone === 'soon' ? 'warn' : 'neutral'}>{x.text}</Chip> }
  return (
    <div className="space-y-5">
      <Link to={`/more/vet-summary?cat=${catId}`} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-stone-200/70 active:bg-stone-50">
        <IconTile icon={Clipboard} tone="sky" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">Prepare a vet summary</div>
          <div className="text-xs text-stone-500">Symptoms, appetite, weight and medications in one page</div>
        </div>
        <CaretRight className="h-4 w-4 text-stone-400" />
      </Link>
      <p className="text-xs text-stone-500">Records for your vet conversations. PawLog does not diagnose.</p>
      <section>
        <SectionTitle action={add('cat_medications')}>Medications</SectionTitle>
        <Card className="divide-y divide-stone-100 p-0">
          {d.medications.length ? d.medications.map(m => {
            const live = meds.data?.find(x => x.id === m.id)
            const cd = live ? courseDay(m.start_on, m.end_on) : null
            return (
              <RowItem key={m.id} onClick={() => canEdit && setEditing({ table: 'cat_medications', row: m as unknown as Record<string, unknown> })}
                title={m.name} sub={[m.dose, m.frequency, cd ? (cd.of ? `Day ${cd.day} of ${cd.of}` : `Day ${cd.day}`) : m.start_on && `from ${dateLabel(m.start_on)}`].filter(Boolean).join(' · ')}
                right={live && canEdit ? <GiveDose med={live} hid={current!.id} /> : <Chip tone={m.active ? 'brand' : 'neutral'}>{m.active ? 'active' : 'ended'}</Chip>} />
            )
          }) : <Empty text="No medications" />}
        </Card>
      </section>
      <section>
        <SectionTitle action={add('cat_conditions')}>Conditions</SectionTitle>
        <Card className="divide-y divide-stone-100 p-0">
          {d.conditions.length ? d.conditions.map(c => (
            <RowItem key={c.id} onClick={() => canEdit && setEditing({ table: 'cat_conditions', row: c as unknown as Record<string, unknown> })} title={c.name} sub={[c.noted_on && dateLabel(c.noted_on), c.notes].filter(Boolean).join(' · ')} right={<Chip tone={c.status === 'resolved' ? 'ok' : c.status === 'monitoring' ? 'warn' : 'bad'}>{c.status}</Chip>} />
          )) : <Empty text="No conditions noted" />}
        </Card>
      </section>
      <section>
        <SectionTitle action={add('vaccination_records')}>Vaccinations</SectionTitle>
        <Card className="divide-y divide-stone-100 p-0">
          {d.vaccinations.length ? d.vaccinations.map(v => (
            <RowItem key={v.id} onClick={() => canEdit && setEditing({ table: 'vaccination_records', row: v as unknown as Record<string, unknown> })} title={v.vaccine_name} sub={`${dateLabel(v.given_on)}${v.clinic ? ` · ${v.clinic}` : ''}`} right={due(v.next_due_on)} />
          )) : <Empty text="No vaccinations recorded" />}
        </Card>
      </section>
      <section>
        <SectionTitle action={add('parasite_treatments')}>Parasite prevention</SectionTitle>
        <Card className="divide-y divide-stone-100 p-0">
          {d.parasites.length ? d.parasites.map(p => (
            <RowItem key={p.id} onClick={() => canEdit && setEditing({ table: 'parasite_treatments', row: p as unknown as Record<string, unknown> })} title={`${parasiteLabel(p.kind)}${p.product ? ` · ${p.product}` : ''}`} sub={dateLabel(p.given_on)} right={due(p.next_due_on)} />
          )) : <Empty text="No treatments recorded" />}
        </Card>
      </section>
      <section>
        <SectionTitle action={add('vet_visits')}>Vet visits</SectionTitle>
        <Card className="divide-y divide-stone-100 p-0">
          {d.visits.length ? d.visits.map(v => (
            <RowItem key={v.id} onClick={() => canEdit && setEditing({ table: 'vet_visits', row: v as unknown as Record<string, unknown> })} title={v.reason ?? 'Visit'} sub={[dateLabel(v.visited_on), v.clinic, v.findings].filter(Boolean).join(' · ')} right={v.follow_up_on ? due(v.follow_up_on) : null} />
          )) : <Empty text="No vet visits yet" />}
        </Card>
      </section>
      {editing && <HealthSheet table={editing.table} row={editing.row} catId={catId} hid={current!.id} onClose={() => setEditing(null)} />}
    </div>
  )
}

function GiveDose({ med, hid }: { med: MedToday; hid: string }) {
  const give = useGiveDose(hid)
  const toast = useToast()
  const target = med.times_per_day ?? 1
  const done = med.given_today >= target
  return (
    <button disabled={give.isPending} onClick={e => { e.stopPropagation(); give.mutateAsync(med).then(() => toast.show(`💊 ${med.name} dose recorded`, 'xp')).catch(err => toast.show(friendlyError(err), 'bad')) }}
      className={done ? 'flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700' : 'rounded-full bg-paw-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm active:scale-95'}>
      {done ? <><Check className="h-3.5 w-3.5" />{med.given_today}/{target} today</> : `Give dose${target > 1 ? ` ${med.given_today + 1}/${target}` : ''}`}
    </button>
  )
}

function RowItem({ title, sub, right, onClick }: { title: string; sub?: string; right?: React.ReactNode; onClick?: () => void }) {
  return (
    <div onClick={onClick} className="flex min-h-14 items-center gap-3 px-4 py-2.5 active:bg-stone-50">
      <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{title}</div>{sub && <div className="truncate text-xs text-stone-500">{sub}</div>}</div>{right}
    </div>
  )
}
const Empty = ({ text }: { text: string }) => <p className="px-4 py-4 text-center text-sm text-stone-400">{text}</p>

function HealthSheet({ table, row, catId, hid, onClose }: { table: Table; row?: Record<string, unknown>; catId: string; hid: string; onClose: () => void }) {
  const def = FORMS[table]
  const save = useSaveHealthRow(table, hid, catId)
  const del = useDeleteHealthRow(table, hid, catId)
  const toast = useToast()
  const [f, setF] = useState<Record<string, string>>(() => Object.fromEntries(def.fields.map(x => {
    const v = row?.[x.key]
    const dflt = x.default === 'today' ? todayInput() : x.default ?? ''
    return [x.key, v == null ? dflt : String(v)]
  })))
  const [error, setError] = useState<string | null>(null)
  async function submit(e: FormEvent) {
    e.preventDefault(); setError(null)
    const out: Record<string, unknown> = {}
    for (const x of def.fields) {
      const v = f[x.key]
      if (x.required && !v) { setError(`${x.label} is required.`); return }
      out[x.key] = x.type === 'checkbox' ? v === 'true' : x.type === 'number' ? (v === '' ? null : Number(v)) : v
    }
    try { await save.mutateAsync({ ...out, id: row?.id as string | undefined }); toast.show('Saved'); onClose() } catch (err) { setError(friendlyError(err)) }
  }
  async function remove() {
    if (!confirm('Delete this record?')) return
    try { await del.mutateAsync(row!.id as string); toast.show('Deleted'); onClose() } catch (err) { setError(friendlyError(err)) }
  }
  return (
    <Sheet open onClose={onClose} title={`${row ? 'Edit' : 'Add'} ${def.title.toLowerCase()}`} footer={
      <div className="flex gap-2">
        {row && <Button type="button" variant="danger" onClick={remove} loading={del.isPending} aria-label="Delete"><Trash className="h-4 w-4" /></Button>}
        <Button type="submit" form="health-form" className="flex-1 py-3 text-base" loading={save.isPending}>Save</Button>
      </div>}>
      <form id="health-form" onSubmit={submit} className="grid grid-cols-2 gap-3 pb-1">
        {def.fields.map(x => {
          const wide = x.type === 'textarea' || x.required
          const common = { value: f[x.key] ?? '', onChange: (e: { target: { value: string } }) => setF(s => ({ ...s, [x.key]: e.target.value })) }
          if (x.type === 'checkbox') return <label key={x.key} className="col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={f[x.key] === 'true'} onChange={e => setF(s => ({ ...s, [x.key]: String(e.target.checked) }))} />{x.label}</label>
          return (
            <Field key={x.key} label={x.label} className={wide ? 'col-span-2' : ''}>
              {x.type === 'textarea' ? <Textarea {...common} /> : x.type === 'select' ? <Select {...common}>{x.options!.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
                : <Input type={x.type ?? 'text'} step={x.type === 'number' ? 'any' : undefined} {...common} />}
            </Field>)
        })}
        <div className="col-span-2"><ErrorNote message={error} /></div>
      </form>
    </Sheet>
  )
}
