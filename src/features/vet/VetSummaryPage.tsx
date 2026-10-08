import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { subDays } from 'date-fns'
import { Printer } from '../../components/icons'
import { useHousehold } from '../../household/HouseholdProvider'
import { Button, Card, ErrorNote, SectionTitle, Select, Spinner, Textarea } from '../../components/ui'
import { useToast } from '../../components/ui/Toast'
import { PageHeader } from '../../components/layout/PageHeader'
import { supabase } from '../../lib/supabase'
import { keys } from '../../lib/queryClient'
import { friendlyError } from '../../lib/errors'
import { useCat, useCatSummaries } from '../cats/api'
import { useCatHealth, useWeights } from '../health/api'
import { usePatterns } from '../timeline/api'
import { catAge, dateLabel, kg, timeLabel } from '../../lib/format'
import type { TimelineEvent, TimelineKind } from '../../lib/types'

const WINDOWS = [{ label: '2 weeks', days: 14 }, { label: '30 days', days: 30 }, { label: '90 days', days: 90 }]
const KINDS: TimelineKind[] = ['symptom', 'medication', 'vet_visit', 'litter', 'behavior', 'feeding']
const MAX_ROWS = 2000
const LOW_APPETITE = 2
const NOTES_KEY = 'pawlog.vetnotes.'

/** Every event in the window, not just the first timeline page, so counts are complete. */
function useWindowEvents(hid: string, catId: string, from: string) {
  return useQuery({
    queryKey: keys.timeline(hid, { catId, from, full: true }),
    queryFn: async () => {
      const { data, error } = await supabase.from('timeline_events').select('*')
        .eq('household_id', hid).eq('cat_id', catId).in('kind', KINDS).gte('occurred_at', from)
        .order('occurred_at', { ascending: true }).limit(MAX_ROWS)
      if (error) throw error
      return data as TimelineEvent[]
    },
  })
}

export function VetSummaryPage() {
  const { current } = useHousehold()
  const hid = current!.id
  const cats = useCatSummaries(hid, true)
  const [params, setParams] = useSearchParams()
  const [win, setWin] = useState(1)
  const toast = useToast()
  const id = params.get('cat') || cats.data?.[0]?.cat_id || ''
  return (
    <div className="space-y-4">
      <PageHeader title="Vet summary" back action={
        <Button variant="secondary" className="print:hidden" aria-label="Print summary" onClick={() => { toast.show('🩺 Ready for the vet'); window.setTimeout(() => window.print(), 300) }}>
          <Printer className="h-4 w-4" />
        </Button>} />
      <div className="flex gap-2 print:hidden">
        <Select aria-label="Cat" value={id} onChange={e => setParams({ cat: e.target.value }, { replace: true })}>{cats.data?.map(c => <option key={c.cat_id} value={c.cat_id}>{c.name}</option>)}</Select>
        <Select aria-label="Period" value={win} onChange={e => setWin(Number(e.target.value))} className="w-36">{WINDOWS.map((w, i) => <option key={w.label} value={i}>{w.label}</option>)}</Select>
      </div>
      {cats.error ? <ErrorNote message={friendlyError(cats.error)} /> : id ? <Summary key={id} catId={id} days={WINDOWS[win].days} hid={hid} /> : <Spinner />}
    </div>
  )
}

const dataOf = <T,>(e: TimelineEvent) => e.data as T

function Summary({ catId, days, hid }: { catId: string; days: number; hid: string }) {
  const cat = useCat(catId)
  const h = useCatHealth(catId)
  const w = useWeights(catId)
  const patterns = usePatterns(hid)
  const from = useMemo(() => subDays(new Date(), days).toISOString(), [days])
  const ev = useWindowEvents(hid, catId, from)
  const [notes, setNotes] = useState(() => { try { return localStorage.getItem(NOTES_KEY + catId) ?? '' } catch { return '' } })
  useEffect(() => { try { localStorage.setItem(NOTES_KEY + catId, notes) } catch { /* private mode */ } }, [catId, notes])

  const err = cat.error ?? h.error ?? w.error ?? ev.error
  if (err) return <ErrorNote message={friendlyError(err)} />
  if (!cat.data || !h.data || !w.data || !ev.data) return <Spinner />
  const c = cat.data
  const events = ev.data
  const symptoms = events.filter(e => e.kind === 'symptom')
  const meds = events.filter(e => e.kind === 'medication')
  const skipped = meds.filter(e => dataOf<{ skipped?: boolean }>(e).skipped).length
  const litter = events.filter(e => {
    if (e.kind !== 'litter') return false
    const d = dataOf<{ stool?: string | null; urine?: string | null }>(e)
    return (!!d.stool && d.stool !== 'normal') || (!!d.urine && d.urine !== 'normal')
  })
  const visits = events.filter(e => e.kind === 'vet_visit')
  const appetite = events.filter(e => e.kind === 'feeding').map(e => dataOf<{ appetite?: number | null }>(e).appetite).filter((a): a is number => a != null)
  const lowAppetite = appetite.filter(a => a <= LOW_APPETITE).length
  const avgAppetite = appetite.length ? appetite.reduce((s, a) => s + a, 0) / appetite.length : null

  const byType = new Map<string, TimelineEvent[]>()
  for (const s of symptoms) { const k = s.title.trim().toLowerCase(); byType.set(k, [...(byType.get(k) ?? []), s]) }
  const types = [...byType.values()].sort((a, b) => b.length - a.length)

  const recentW = w.data.filter(x => x.logged_at >= from)
  const firstW = recentW[0]
  const lastW = recentW[recentW.length - 1]
  const delta = firstW && lastW && recentW.length > 1 ? lastW.weight_kg - firstW.weight_kg : null
  const catPatterns = (patterns.data ?? []).filter(p => p.cat_id === catId)

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>{c.name}</SectionTitle>
        <p className="text-sm">{[c.sex, c.breed, catAge(c.date_of_birth, c.dob_is_estimate), c.neutered == null ? null : c.neutered ? 'neutered' : 'intact'].filter(Boolean).join(' · ')}</p>
        {c.known_conditions && <p className="mt-1 text-sm"><b>Known:</b> {c.known_conditions}</p>}
        {c.allergies && <p className="text-sm"><b>Allergies:</b> {c.allergies}</p>}
        <p className="mt-2 text-xs text-stone-500">Last {days} days · prepared {dateLabel(new Date().toISOString())}</p>
      </Card>

      {catPatterns.length > 0 && (
        <Card>
          <SectionTitle>Patterns recorded</SectionTitle>
          <ul className="space-y-2 text-sm">
            {catPatterns.map(p => <li key={p.code}><b>{p.title}</b><span className="block text-stone-600">{p.detail}</span></li>)}
          </ul>
          <p className="mt-2 text-xs text-stone-500">Repeated entries in your logs, worth mentioning at the visit.</p>
        </Card>
      )}

      <Card>
        <SectionTitle>Weight</SectionTitle>
        {recentW.length ? (
          <>
            {delta != null && <p className="text-sm font-medium">{kg(firstW.weight_kg)} to {kg(lastW.weight_kg)} ({delta >= 0 ? '+' : '−'}{kg(Math.abs(delta))}) over {recentW.length} weigh-ins</p>}
            <p className="mt-1 text-xs text-stone-500">{recentW.map(x => `${dateLabel(x.logged_at)}: ${kg(x.weight_kg)}`).join(' · ')}</p>
          </>
        ) : <p className="text-sm text-stone-500">No weigh-ins in this period{w.data.length ? `; last ${kg(w.data[w.data.length - 1].weight_kg)} on ${dateLabel(w.data[w.data.length - 1].logged_at)}` : ''}.</p>}
      </Card>

      <Card>
        <SectionTitle>Appetite</SectionTitle>
        {avgAppetite != null
          ? <p className="text-sm">Average {avgAppetite.toFixed(1)} of 5 across {appetite.length} meals{lowAppetite ? `; ${lowAppetite} meals rated ${LOW_APPETITE} or lower` : ''}.</p>
          : <p className="text-sm text-stone-500">No appetite ratings logged.</p>}
      </Card>

      <Card>
        <SectionTitle>Symptoms ({symptoms.length})</SectionTitle>
        {types.length ? (
          <>
            <ul className="mb-2 flex flex-wrap gap-1.5">
              {types.map(list => <li key={list[0].id} className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">{list[0].title} ×{list.length}</li>)}
            </ul>
            <ul className="space-y-1 text-sm">
              {symptoms.map(e => {
                const sev = dataOf<{ severity?: string }>(e).severity
                return <li key={e.id}>{dateLabel(e.occurred_at)} {timeLabel(e.occurred_at)} · {e.title}{sev && ` (${sev})`}{e.detail && ` · ${e.detail}`}</li>
              })}
            </ul>
          </>
        ) : <p className="text-sm text-stone-500">None logged.</p>}
      </Card>

      <Card>
        <SectionTitle>Medications ({meds.length})</SectionTitle>
        {h.data.medications.filter(m => m.active).map(m => <p key={m.id} className="text-sm"><b>{m.name}</b> {m.dose} {m.frequency}</p>)}
        {meds.length ? <p className="mt-1 text-xs text-stone-500">{meds.length - skipped} doses logged, {skipped} skipped.</p> : <p className="text-sm text-stone-500">No doses logged.</p>}
      </Card>

      <Card>
        <SectionTitle>Litter observations ({litter.length})</SectionTitle>
        {litter.length ? <ul className="space-y-1 text-sm">{litter.map(e => <li key={e.id}>{dateLabel(e.occurred_at)} · {e.detail ?? e.title}</li>)}</ul> : <p className="text-sm text-stone-500">Nothing unusual logged.</p>}
      </Card>

      {visits.length > 0 && (
        <Card>
          <SectionTitle>Vet visits</SectionTitle>
          <ul className="space-y-1 text-sm">{visits.map(e => <li key={e.id}>{dateLabel(e.occurred_at)} · {e.title}{e.detail && ` · ${e.detail}`}</li>)}</ul>
        </Card>
      )}

      <Card>
        <SectionTitle>Vaccinations and prevention</SectionTitle>
        {h.data.vaccinations.slice(0, 5).map(v => <p key={v.id} className="text-sm">{v.vaccine_name} · {dateLabel(v.given_on)}{v.next_due_on && ` · next ${dateLabel(v.next_due_on)}`}</p>)}
        {h.data.parasites.slice(0, 3).map(p => <p key={p.id} className="text-sm">{p.kind} {p.product ?? ''} · {dateLabel(p.given_on)}{p.next_due_on && ` · next ${dateLabel(p.next_due_on)}`}</p>)}
        {!h.data.vaccinations.length && !h.data.parasites.length && <p className="text-sm text-stone-500">No records.</p>}
      </Card>

      <Card>
        <SectionTitle>Questions for the vet</SectionTitle>
        <Textarea aria-label="Questions for the vet" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything you want to ask" className="print:hidden" />
        <p className="hidden whitespace-pre-wrap text-sm print:block">{notes || 'None.'}</p>
      </Card>

      {events.length >= MAX_ROWS && <p className="text-xs text-amber-700">Showing the first {MAX_ROWS} entries. Choose a shorter period for a complete list.</p>}
      <p className="text-[11px] text-stone-500">Owner-logged observations only. Not a diagnosis.</p>
    </div>
  )
}
