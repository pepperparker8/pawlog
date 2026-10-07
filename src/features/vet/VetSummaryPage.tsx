import { useMemo, useState } from 'react'
import { Printer } from 'lucide-react'
import { subDays } from 'date-fns'
import { useHousehold } from '../../household/HouseholdProvider'
import { Button, Card, SectionTitle, Select, Spinner } from '../../components/ui'
import { PageHeader } from '../../components/layout/PageHeader'
import { useCat, useCatSummaries } from '../cats/api'
import { useCatHealth, useWeights } from '../health/api'
import { useTimeline } from '../timeline/api'
import { catAge, dateLabel, kg, timeLabel } from '../../lib/format'

const WINDOWS = [{ label: '2 weeks', days: 14 }, { label: '30 days', days: 30 }, { label: '90 days', days: 90 }]

export function VetSummaryPage() {
  const { current } = useHousehold()
  const hid = current!.id
  const cats = useCatSummaries(hid, true)
  const [catId, setCatId] = useState('')
  const [win, setWin] = useState(1)
  const id = catId || cats.data?.[0]?.cat_id || ''
  return (
    <div className="space-y-4">
      <PageHeader title="Vet summary" back="/more" action={<Button variant="secondary" className="print:hidden" onClick={() => window.print()}><Printer className="h-4 w-4" /></Button>} />
      <div className="flex gap-2 print:hidden">
        <Select value={id} onChange={e => setCatId(e.target.value)}>{cats.data?.map(c => <option key={c.cat_id} value={c.cat_id}>{c.name}</option>)}</Select>
        <Select value={win} onChange={e => setWin(Number(e.target.value))} className="w-36">{WINDOWS.map((w, i) => <option key={w.label} value={i}>{w.label}</option>)}</Select>
      </div>
      {id ? <Summary catId={id} days={WINDOWS[win].days} hid={hid} /> : <Spinner />}
    </div>
  )
}

function Summary({ catId, days, hid }: { catId: string; days: number; hid: string }) {
  const cat = useCat(catId)
  const h = useCatHealth(catId)
  const w = useWeights(catId)
  const from = useMemo(() => subDays(new Date(), days).toISOString(), [days])
  const tl = useTimeline(hid, { catId, kinds: ['symptom', 'medication', 'vet_visit', 'litter', 'behavior'], from })
  if (!cat.data || !h.data || !w.data) return <Spinner />
  const c = cat.data
  const events = tl.data?.pages.flat() ?? []
  const symptoms = events.filter(e => e.kind === 'symptom')
  const meds = events.filter(e => e.kind === 'medication')
  const litter = events.filter(e => e.kind === 'litter' && ((e.data as { stool?: string }).stool && (e.data as { stool?: string }).stool !== 'normal' || (e.data as { urine?: string }).urine && (e.data as { urine?: string }).urine !== 'normal'))
  const recentW = w.data.filter(x => x.logged_at >= from)
  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>{c.name}</SectionTitle>
        <p className="text-sm">{[c.sex, c.breed, catAge(c.date_of_birth, c.dob_is_estimate), c.neutered == null ? null : c.neutered ? 'neutered' : 'intact'].filter(Boolean).join(' · ')}</p>
        {c.known_conditions && <p className="mt-1 text-sm"><b>Known:</b> {c.known_conditions}</p>}
        {c.allergies && <p className="text-sm"><b>Allergies:</b> {c.allergies}</p>}
        <p className="mt-2 text-xs text-stone-500">Window: last {days} days · prepared {dateLabel(new Date().toISOString())}</p>
      </Card>
      <Card>
        <SectionTitle>Weight</SectionTitle>
        {recentW.length ? <p className="text-sm">{recentW.map(x => `${dateLabel(x.logged_at)}: ${kg(x.weight_kg)}`).join(' · ')}</p> : <p className="text-sm text-stone-500">No weigh-ins in window{w.data.length ? `; last ${kg(w.data[w.data.length - 1].weight_kg)} on ${dateLabel(w.data[w.data.length - 1].logged_at)}` : ''}.</p>}
      </Card>
      <Card>
        <SectionTitle>Symptoms ({symptoms.length})</SectionTitle>
        {symptoms.length ? <ul className="space-y-1 text-sm">{symptoms.map(e => <li key={e.id}>{dateLabel(e.occurred_at)} {timeLabel(e.occurred_at)} · {e.title}{(e.data as { severity?: string }).severity && ` (${(e.data as { severity?: string }).severity})`}{e.detail && ` · ${e.detail}`}</li>)}</ul> : <p className="text-sm text-stone-500">None logged.</p>}
      </Card>
      <Card>
        <SectionTitle>Medications given ({meds.length})</SectionTitle>
        {h.data.medications.filter(m => m.active).map(m => <p key={m.id} className="text-sm"><b>{m.name}</b> {m.dose} {m.frequency}</p>)}
        {meds.length ? <p className="mt-1 text-xs text-stone-500">{meds.filter(e => !(e.data as { skipped?: boolean }).skipped).length} doses logged, {meds.filter(e => (e.data as { skipped?: boolean }).skipped).length} skipped.</p> : <p className="text-sm text-stone-500">No doses logged.</p>}
      </Card>
      <Card>
        <SectionTitle>Litter observations ({litter.length})</SectionTitle>
        {litter.length ? <ul className="space-y-1 text-sm">{litter.map(e => <li key={e.id}>{dateLabel(e.occurred_at)} · {e.detail ?? e.title}</li>)}</ul> : <p className="text-sm text-stone-500">Nothing unusual logged.</p>}
      </Card>
      <Card>
        <SectionTitle>Vaccinations & prevention</SectionTitle>
        {h.data.vaccinations.slice(0, 5).map(v => <p key={v.id} className="text-sm">{v.vaccine_name} · {dateLabel(v.given_on)}{v.next_due_on && ` · next ${dateLabel(v.next_due_on)}`}</p>)}
        {h.data.parasites.slice(0, 3).map(p => <p key={p.id} className="text-sm">{p.kind} {p.product ?? ''} · {dateLabel(p.given_on)}{p.next_due_on && ` · next ${dateLabel(p.next_due_on)}`}</p>)}
        {!h.data.vaccinations.length && !h.data.parasites.length && <p className="text-sm text-stone-500">No records.</p>}
      </Card>
      <p className="text-[11px] text-stone-400">Owner-logged observations only. Not a diagnosis.</p>
    </div>
  )
}
