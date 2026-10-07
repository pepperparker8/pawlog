import { useEffect, useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useHousehold } from '../../household/HouseholdProvider'
import { useCatSummaries, useSignedUrl } from '../cats/api'
import { Avatar, Button, ErrorNote, Field, Input, Select, Sheet, Textarea, cx } from '../../components/ui'
import { useToast } from '../../components/ui/Toast'
import { fetchAward, useSubmitLog, type LogTable } from './api'
import { useFoods } from '../care/api'
import { useMedsToday, type MedToday } from '../health/api'
import { friendlyError } from '../../lib/errors'
import { nowLocalInput } from '../../lib/format'
import { useNavigate } from 'react-router-dom'
import type { CatSummary } from '../../lib/types'

export type Kind = 'feeding' | 'water' | 'litter' | 'weight' | 'symptom' | 'medication' | 'grooming' | 'activity' | 'behavior' | 'journal'
export const KINDS: Array<{ kind: Kind; table: LogTable; emoji: string; label: string; multi: boolean; done: string }> = [
  { kind: 'feeding', table: 'feeding_logs', emoji: '🍽️', label: 'Feed', multi: true, done: '🍽️ Meal logged' },
  { kind: 'weight', table: 'weight_logs', emoji: '⚖️', label: 'Weight', multi: false, done: '⚖️ Weight recorded' },
  { kind: 'litter', table: 'litter_logs', emoji: '🧹', label: 'Litter', multi: true, done: '🧹 Litter logged' },
  { kind: 'medication', table: 'medication_logs', emoji: '💊', label: 'Meds', multi: false, done: '💊 Dose recorded' },
  { kind: 'symptom', table: 'symptom_logs', emoji: '🩺', label: 'Symptom', multi: false, done: '🩺 Observation saved' },
  { kind: 'water', table: 'water_logs', emoji: '💧', label: 'Water', multi: true, done: '💧 Fresh water logged' },
  { kind: 'grooming', table: 'grooming_logs', emoji: '🧼', label: 'Groom', multi: true, done: '🧼 Grooming logged' },
  { kind: 'activity', table: 'activity_logs', emoji: '🧶', label: 'Play', multi: true, done: '🧶 Play time logged' },
  { kind: 'behavior', table: 'behavior_logs', emoji: '🐈', label: 'Behavior', multi: false, done: '🐈 Behavior noted' },
  { kind: 'journal', table: 'journal_entries', emoji: '📓', label: 'Journal', multi: false, done: '📓 Journal saved' },
]

export function QuickLogSheet({ open, onClose, presetCat, presetKind }: { open: boolean; onClose: () => void; presetCat?: string; presetKind?: Kind }) {
  const { current, canEdit } = useHousehold()
  const hid = current?.id ?? ''
  const cats = useCatSummaries(hid)
  const foods = useFoods(hid)
  const meds = useMedsToday(hid)
  const submit = useSubmitLog()
  const toast = useToast()
  const nav = useNavigate()
  const [kind, setKind] = useState<Kind>(presetKind ?? 'feeding')
  const [selected, setSelected] = useState<string[]>(presetCat ? [presetCat] : [])
  const [f, setF] = useState<Record<string, string>>({})
  const [more, setMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const meta = KINDS.find(k => k.kind === kind)!
  const activeCats = useMemo(() => cats.data ?? [], [cats.data])

  useEffect(() => {
    if (!open) return
    setF({ logged_at: nowLocalInput() }); setError(null); setMore(false); setKind(presetKind ?? 'feeding')
    setSelected(presetCat ? [presetCat] : [])
  }, [open, presetCat, presetKind])

  // One cat in the household: select it so logging is a single tap.
  useEffect(() => { if (open && !selected.length && activeCats.length === 1) setSelected([activeCats[0].cat_id]) }, [open, selected.length, activeCats])
  useEffect(() => { if (!meta.multi && selected.length > 1) setSelected(selected.slice(0, 1)) }, [meta.multi, selected])

  const set = (k: string, v: string) => setF(s => ({ ...s, [k]: v }))
  const catMeds = (meds.data ?? []).filter(m => selected.includes(m.cat_id))

  function toggle(id: string) {
    if (meta.multi) setSelected(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]))
    else setSelected([id])
  }

  async function save() {
    setError(null)
    if (!selected.length) { setError('Pick a cat first.'); return }
    const fields = buildFields(kind, f)
    if ('error' in fields) { setError(fields.error); return }
    try {
      const r = await submit.mutateAsync({ table: meta.table, householdId: hid, catIds: selected, fields: fields.row })
      if (r.queued) toast.show('Saved offline. It will sync when you are back online.')
      else {
        const award = await fetchAward(r.ids)
        const who = selected.length > 1 ? ` for ${selected.length} cats` : ''
        toast.show(`${meta.done}${who}${award.xp > 0 ? ` · +${award.xp} XP` : award.repeat ? ' · XP already earned for this today' : ''}`, award.xp > 0 ? 'xp' : 'ok')
      }
      onClose()
    } catch (e) { setError(friendlyError(e)) }
  }

  if (!current) return null
  const footer = canEdit && activeCats.length > 0 ? (
    <Button className="w-full py-3 text-base" loading={submit.isPending} onClick={save}>
      Save {meta.label.toLowerCase()}{selected.length > 1 ? ` for ${selected.length} cats` : ''}
    </Button>
  ) : undefined
  return (
    <Sheet open={open} onClose={onClose} title="Log care" footer={footer}>
      {!canEdit ? <p className="pb-4 text-sm text-stone-600">Viewers can't log. Ask the household owner for caregiver access.</p> : (
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-1.5">
            {KINDS.map(k => (
              <button key={k.kind} onClick={() => setKind(k.kind)} aria-pressed={kind === k.kind}
                className={cx('flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-semibold transition', kind === k.kind ? 'bg-paw-500 text-white shadow-sm' : 'bg-stone-100 text-stone-700 active:bg-stone-200')}>
                <span className="text-xl leading-6">{k.emoji}</span>{k.label}
              </button>
            ))}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-stone-500">
              <span>{meta.multi ? 'Which cats?' : 'Which cat?'}</span>
              {meta.multi && activeCats.length > 1 && (
                <button className="rounded-full px-2 py-1 normal-case text-paw-600" onClick={() => setSelected(selected.length === activeCats.length ? [] : activeCats.map(c => c.cat_id))}>
                  {selected.length === activeCats.length ? 'Clear' : 'All cats'}
                </button>
              )}
            </div>
            {activeCats.length === 0 ? (
              <Button variant="secondary" onClick={() => { onClose(); nav('/cats/new') }}>Add your first cat</Button>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {activeCats.map(c => <CatPick key={c.cat_id} cat={c} on={selected.includes(c.cat_id)} onClick={() => toggle(c.cat_id)} compact={activeCats.length > 5} />)}
              </div>
            )}
          </div>

          <KindFields kind={kind} f={f} set={set} foods={foods.data ?? []} meds={catMeds} />

          <button type="button" onClick={() => setMore(m => !m)} className="flex w-full items-center justify-between rounded-xl py-1 text-sm font-medium text-stone-500">
            <span>{kind === 'journal' ? 'Date and time' : 'Time and note'}</span><ChevronDown className={cx('h-4 w-4 transition', more && 'rotate-180')} />
          </button>
          {more && (
            <div className="space-y-3">
              <Field label="When"><Input type="datetime-local" value={f.logged_at ?? ''} onChange={e => set('logged_at', e.target.value)} /></Field>
              {kind !== 'journal' && <Field label="Note"><Textarea value={f.note ?? ''} onChange={e => set('note', e.target.value)} /></Field>}
            </div>
          )}
          <ErrorNote message={error} />
        </div>
      )}
    </Sheet>
  )
}

function CatPick({ cat, on, onClick, compact }: { cat: CatSummary; on: boolean; onClick: () => void; compact: boolean }) {
  const url = useSignedUrl(cat.profile_thumbnail_path)
  return (
    <button onClick={onClick} aria-pressed={on}
      className={cx('flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-medium transition', on ? 'bg-paw-100 text-paw-700 ring-2 ring-paw-500' : 'bg-stone-100 text-stone-700')}>
      <Avatar name={cat.name} src={url.data} size={compact ? 28 : 34} /><span className="max-w-24 truncate">{cat.name}</span>
    </button>
  )
}

function KindFields({ kind, f, set, foods, meds }: { kind: Kind; f: Record<string, string>; set: (k: string, v: string) => void; foods: Array<{ id: string; product: string; brand: string | null }>; meds: MedToday[] }) {
  switch (kind) {
    case 'feeding': return (
      <div className="grid grid-cols-2 gap-3">
        <Field label="Food" className="col-span-2">
          <Select value={f.food_id ?? ''} onChange={e => set('food_id', e.target.value)}>
            <option value="">Free text below</option>
            {foods.map(x => <option key={x.id} value={x.id}>{x.brand ? `${x.brand} ` : ''}{x.product}</option>)}
          </Select>
        </Field>
        {!f.food_id && <Field label="Food name" className="col-span-2"><Input value={f.food_name ?? ''} onChange={e => set('food_name', e.target.value)} placeholder="Tuna pouch" /></Field>}
        <Field label="Amount"><Input type="number" inputMode="decimal" step="any" value={f.amount ?? ''} onChange={e => set('amount', e.target.value)} /></Field>
        <Field label="Unit"><Select value={f.unit ?? 'g'} onChange={e => set('unit', e.target.value)}>{['g', 'ml', 'pouch', 'can', 'cup', 'piece', 'scoop'].map(u => <option key={u}>{u}</option>)}</Select></Field>
        <Field label="Appetite (0–5)" className="col-span-2"><Input type="range" min={0} max={5} value={f.appetite ?? '4'} onChange={e => set('appetite', e.target.value)} /></Field>
      </div>)
    case 'water': return (
      <Field label="Action"><Select value={f.action ?? 'refreshed'} onChange={e => set('action', e.target.value)}><option value="refreshed">Refreshed bowl</option><option value="checked">Checked</option><option value="fountain_cleaned">Cleaned fountain</option></Select></Field>)
    case 'litter': return (
      <div className="grid grid-cols-3 gap-3">
        <Field label="Action"><Select value={f.action ?? 'scooped'} onChange={e => set('action', e.target.value)}>{['scooped', 'cleaned', 'replaced', 'observed'].map(u => <option key={u}>{u}</option>)}</Select></Field>
        <Field label="Stool"><Select value={f.stool ?? ''} onChange={e => set('stool', e.target.value)}><option value="">—</option>{['normal', 'soft', 'diarrhea', 'hard', 'blood', 'none'].map(u => <option key={u}>{u}</option>)}</Select></Field>
        <Field label="Urine"><Select value={f.urine ?? ''} onChange={e => set('urine', e.target.value)}><option value="">—</option>{['normal', 'frequent', 'none', 'blood', 'large'].map(u => <option key={u}>{u}</option>)}</Select></Field>
      </div>)
    case 'weight': return (
      <div className="grid grid-cols-2 gap-3">
        <Field label="Weight (kg)"><Input type="number" inputMode="decimal" step="0.01" min={0.05} max={49} required value={f.weight_kg ?? ''} onChange={e => set('weight_kg', e.target.value)} placeholder="3.50" /></Field>
        <Field label="Body condition"><Select value={f.body_condition_score ?? ''} onChange={e => set('body_condition_score', e.target.value)}>
          <option value="">Not assessed</option>{BCS.map(([v, l]) => <option key={v} value={v}>{v}/9 · {l}</option>)}</Select></Field>
        {f.body_condition_score && (
          <Field label="Assessed by" className="col-span-2"><Select value={f.body_condition_source ?? 'owner'} onChange={e => set('body_condition_source', e.target.value)}>
            <option value="owner">Owner observation</option><option value="vet">Vet assessment</option></Select></Field>
        )}
      </div>)
    case 'symptom': return (
      <div className="grid grid-cols-2 gap-3">
        <Field label="Symptom" className="col-span-2"><Input list="symptoms" value={f.symptom ?? ''} onChange={e => set('symptom', e.target.value)} placeholder="Sneezing" />
          <datalist id="symptoms">{['Sneezing', 'Vomiting', 'Diarrhea', 'Lethargy', 'Coughing', 'Scratching', 'Limping', 'Not eating', 'Hiding', 'Eye discharge', 'Hair loss'].map(s => <option key={s} value={s} />)}</datalist></Field>
        <Field label="Severity"><Select value={f.severity ?? 'mild'} onChange={e => set('severity', e.target.value)}><option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Severe</option></Select></Field>
        <Field label="Frequency"><Input value={f.frequency ?? ''} onChange={e => set('frequency', e.target.value)} placeholder="3× today" /></Field>
      </div>)
    case 'medication': return (
      <div className="space-y-3">
        {meds.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {meds.map(m => (
              <button key={m.id} type="button" onClick={() => { set('cat_medication_id', m.id); set('medication_name', m.name); set('dose', m.dose ?? '') }}
                className={cx('rounded-full px-3 py-1.5 text-sm font-medium', f.cat_medication_id === m.id ? 'bg-paw-500 text-white' : 'bg-paw-50 text-paw-700 ring-1 ring-paw-200')}>
                💊 {m.name}{m.given_today ? ` · ${m.given_today} today` : ''}
              </button>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Medication"><Input value={f.medication_name ?? ''} onChange={e => { set('medication_name', e.target.value); set('cat_medication_id', '') }} placeholder="Eye drops" /></Field>
          <Field label="Dose"><Input value={f.dose ?? ''} onChange={e => set('dose', e.target.value)} placeholder="1 drop" /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={f.skipped === 'true'} onChange={e => set('skipped', String(e.target.checked))} /> Dose skipped</label>
      </div>)
    case 'grooming': return (
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type"><Select value={f.type ?? 'brush'} onChange={e => set('type', e.target.value)}>{['brush', 'bath', 'nails', 'ears', 'teeth', 'eyes', 'trim', 'other'].map(u => <option key={u}>{u}</option>)}</Select></Field>
        <Field label="Minutes"><Input type="number" inputMode="numeric" value={f.duration_min ?? ''} onChange={e => set('duration_min', e.target.value)} /></Field>
      </div>)
    case 'activity': return (
      <div className="grid grid-cols-2 gap-3">
        <Field label="Activity"><Select value={f.activity ?? 'play'} onChange={e => set('activity', e.target.value)}>{['play', 'walk', 'training', 'enrichment', 'other'].map(u => <option key={u}>{u}</option>)}</Select></Field>
        <Field label="Minutes"><Input type="number" inputMode="numeric" value={f.duration_min ?? '15'} onChange={e => set('duration_min', e.target.value)} /></Field>
      </div>)
    case 'behavior': return (
      <div className="grid grid-cols-2 gap-3">
        <Field label="Behavior" className="col-span-2"><Input value={f.behavior ?? ''} onChange={e => set('behavior', e.target.value)} placeholder="Hiding under the bed" /></Field>
        <Field label="Mood"><Input value={f.mood ?? ''} onChange={e => set('mood', e.target.value)} placeholder="calm, anxious" /></Field>
        <Field label="Intensity (1–5)"><Input type="number" min={1} max={5} value={f.intensity ?? ''} onChange={e => set('intensity', e.target.value)} /></Field>
      </div>)
    case 'journal': return (
      <div className="space-y-3">
        <Field label="Title"><Input value={f.title ?? ''} onChange={e => set('title', e.target.value)} placeholder="Sunny afternoon" /></Field>
        <Field label="Entry"><Textarea value={f.body ?? ''} onChange={e => set('body', e.target.value)} placeholder="What happened today?" /></Field>
      </div>)
  }
}

/** WSAVA 9-point feline body condition scale. */
export const BCS: Array<[number, string]> = [[1, 'Very thin'], [2, 'Very thin'], [3, 'Thin'], [4, 'Ideal'], [5, 'Ideal'], [6, 'Above ideal'], [7, 'Above ideal'], [8, 'Well above ideal'], [9, 'Well above ideal']]

const num = (v?: string) => (v === undefined || v === '' ? null : Number(v))
const txt = (v?: string) => (v === undefined || v.trim() === '' ? null : v.trim())

export function buildFields(kind: Kind, f: Record<string, string>): { row: Record<string, unknown> } | { error: string } {
  const logged_at = f.logged_at ? new Date(f.logged_at).toISOString() : new Date().toISOString()
  const note = txt(f.note)
  switch (kind) {
    case 'feeding': return { row: { logged_at, note, food_id: txt(f.food_id), food_name: txt(f.food_name), amount: num(f.amount), unit: f.amount ? f.unit ?? 'g' : null, appetite: num(f.appetite ?? '4') } }
    case 'water': return { row: { logged_at, note, action: f.action ?? 'refreshed' } }
    case 'litter': return { row: { logged_at, note, action: f.action ?? 'scooped', stool: txt(f.stool), urine: txt(f.urine) } }
    case 'weight': {
      const w = num(f.weight_kg)
      if (w === null || !(w > 0 && w < 50)) return { error: 'Enter a weight between 0 and 50 kg.' }
      const bcs = num(f.body_condition_score)
      return { row: { logged_at, note, weight_kg: w, body_condition_score: bcs, body_condition_source: bcs == null ? null : f.body_condition_source === 'vet' ? 'vet' : 'owner' } }
    }
    case 'symptom': {
      if (!txt(f.symptom)) return { error: 'What did you notice?' }
      return { row: { logged_at, note, symptom: txt(f.symptom), severity: f.severity ?? 'mild', frequency: txt(f.frequency) } }
    }
    case 'medication': {
      if (!txt(f.medication_name)) return { error: 'Which medication?' }
      return { row: { logged_at, note, medication_name: txt(f.medication_name), dose: txt(f.dose), skipped: f.skipped === 'true', cat_medication_id: txt(f.cat_medication_id) } }
    }
    case 'grooming': return { row: { logged_at, note, type: f.type ?? 'brush', duration_min: num(f.duration_min) } }
    case 'activity': return { row: { logged_at, note, activity: f.activity ?? 'play', duration_min: num(f.duration_min) } }
    case 'behavior': {
      if (!txt(f.behavior)) return { error: 'Describe the behavior.' }
      return { row: { logged_at, note, behavior: txt(f.behavior), mood: txt(f.mood), intensity: num(f.intensity) } }
    }
    case 'journal': {
      if (!txt(f.body)) return { error: 'Write a few words.' }
      return { row: { logged_at, title: txt(f.title), body: txt(f.body) } }
    }
  }
}
