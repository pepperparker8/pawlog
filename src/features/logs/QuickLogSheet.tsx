import { useEffect, useMemo, useState } from 'react'
import { useHousehold } from '../../household/HouseholdProvider'
import { useCatSummaries, useSignedUrl } from '../cats/api'
import { Avatar, Button, ErrorNote, Field, Input, Select, Sheet, Textarea, cx } from '../../components/ui'
import { useToast } from '../../components/ui/Toast'
import { useSubmitLog, type LogTable } from './api'
import { useFoods } from '../care/api'
import { useXpRules } from '../gamification/api'
import { friendlyError } from '../../lib/errors'
import { nowLocalInput } from '../../lib/format'
import { useNavigate } from 'react-router-dom'
import type { CatSummary } from '../../lib/types'

type Kind = 'feeding' | 'water' | 'litter' | 'weight' | 'symptom' | 'medication' | 'grooming' | 'activity' | 'behavior' | 'journal'
const KINDS: Array<{ kind: Kind; table: LogTable; emoji: string; label: string; multi: boolean }> = [
  { kind: 'feeding', table: 'feeding_logs', emoji: '🍽️', label: 'Feed', multi: true },
  { kind: 'water', table: 'water_logs', emoji: '💧', label: 'Water', multi: true },
  { kind: 'litter', table: 'litter_logs', emoji: '🧹', label: 'Litter', multi: true },
  { kind: 'weight', table: 'weight_logs', emoji: '⚖️', label: 'Weight', multi: false },
  { kind: 'symptom', table: 'symptom_logs', emoji: '🩺', label: 'Symptom', multi: false },
  { kind: 'medication', table: 'medication_logs', emoji: '💊', label: 'Meds', multi: false },
  { kind: 'grooming', table: 'grooming_logs', emoji: '🧼', label: 'Groom', multi: true },
  { kind: 'activity', table: 'activity_logs', emoji: '🧶', label: 'Play', multi: true },
  { kind: 'behavior', table: 'behavior_logs', emoji: '🐈', label: 'Behavior', multi: false },
  { kind: 'journal', table: 'journal_entries', emoji: '📓', label: 'Journal', multi: false },
]

export function QuickLogSheet({ open, onClose, presetCat, presetKind }: { open: boolean; onClose: () => void; presetCat?: string; presetKind?: Kind }) {
  const { current, canEdit } = useHousehold()
  const hid = current?.id ?? ''
  const cats = useCatSummaries(hid)
  const foods = useFoods(hid)
  const rules = useXpRules()
  const submit = useSubmitLog()
  const toast = useToast()
  const nav = useNavigate()
  const [kind, setKind] = useState<Kind>(presetKind ?? 'feeding')
  const [selected, setSelected] = useState<string[]>(presetCat ? [presetCat] : [])
  const [f, setF] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const meta = KINDS.find(k => k.kind === kind)!

  useEffect(() => {
    if (open) { setF({ logged_at: nowLocalInput() }); setError(null); setKind(presetKind ?? 'feeding'); setSelected(presetCat ? [presetCat] : []) }
  }, [open, presetCat, presetKind])

  useEffect(() => { if (!meta.multi && selected.length > 1) setSelected(selected.slice(0, 1)) }, [meta.multi, selected])

  const xp = rules.data?.find(r => r.event_type === meta.table)?.xp ?? 0
  const set = (k: string, v: string) => setF(s => ({ ...s, [k]: v }))
  const activeCats = useMemo(() => cats.data ?? [], [cats.data])

  function toggle(id: string) {
    if (meta.multi) setSelected(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]))
    else setSelected([id])
  }

  async function save() {
    setError(null)
    if (!selected.length) { setError('Pick at least one cat.'); return }
    const fields = buildFields(kind, f)
    if ('error' in fields) { setError(fields.error); return }
    try {
      const r = await submit.mutateAsync({ table: meta.table, householdId: hid, catIds: selected, fields: fields.row })
      if (r.queued) toast.show('Saved offline. Will sync when online.')
      else toast.show(`+${xp * selected.length} XP · ${meta.label} logged for ${selected.length} cat${selected.length > 1 ? 's' : ''}`, 'xp')
      onClose()
    } catch (e) { setError(friendlyError(e)) }
  }

  if (!current) return null
  return (
    <Sheet open={open} onClose={onClose} title="Quick log">
      {!canEdit ? <p className="text-sm text-stone-600">Viewers can't log. Ask the household owner for caregiver access.</p> : (
        <div className="space-y-4">
          <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {KINDS.map(k => (
              <button key={k.kind} onClick={() => setKind(k.kind)}
                className={cx('flex shrink-0 flex-col items-center rounded-2xl px-3 py-2 text-xs font-medium', kind === k.kind ? 'bg-paw-500 text-white' : 'bg-stone-100 text-stone-700')}>
                <span className="text-xl">{k.emoji}</span>{k.label}
              </button>
            ))}
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-stone-500">
              <span>{meta.multi ? 'Cats (tap several)' : 'Cat'}</span>
              {meta.multi && activeCats.length > 1 && (
                <button className="text-paw-600" onClick={() => setSelected(selected.length === activeCats.length ? [] : activeCats.map(c => c.cat_id))}>
                  {selected.length === activeCats.length ? 'Clear' : 'Everyone'}
                </button>
              )}
            </div>
            {activeCats.length === 0 ? (
              <Button variant="secondary" onClick={() => { onClose(); nav('/cats/new') }}>Add your first cat</Button>
            ) : (
              <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {activeCats.map(c => <CatPick key={c.cat_id} cat={c} on={selected.includes(c.cat_id)} onClick={() => toggle(c.cat_id)} />)}
              </div>
            )}
          </div>

          <KindFields kind={kind} f={f} set={set} foods={foods.data ?? []} />

          <Field label="When"><Input type="datetime-local" value={f.logged_at ?? ''} onChange={e => set('logged_at', e.target.value)} /></Field>
          {kind !== 'journal' && <Field label="Note"><Textarea value={f.note ?? ''} onChange={e => set('note', e.target.value)} placeholder="Optional" /></Field>}
          <ErrorNote message={error} />
          <Button className="w-full" loading={submit.isPending} onClick={save}>
            Save{selected.length > 1 ? ` for ${selected.length} cats` : ''} · +{xp * Math.max(1, selected.length)} XP
          </Button>
        </div>
      )}
    </Sheet>
  )
}

function CatPick({ cat, on, onClick }: { cat: CatSummary; on: boolean; onClick: () => void }) {
  const url = useSignedUrl(cat.profile_thumbnail_path)
  return (
    <button onClick={onClick} className={cx('flex shrink-0 flex-col items-center gap-1 rounded-2xl p-2 text-xs', on ? 'bg-paw-100 ring-2 ring-paw-500' : 'bg-stone-50')}>
      <Avatar name={cat.name} src={url.data} size={40} /><span className="max-w-16 truncate">{cat.name}</span>
    </button>
  )
}

function KindFields({ kind, f, set, foods }: { kind: Kind; f: Record<string, string>; set: (k: string, v: string) => void; foods: Array<{ id: string; product: string; brand: string | null }> }) {
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
        <Field label="Weight (kg)"><Input type="number" inputMode="decimal" step="0.01" min={0.05} max={49} required value={f.weight_kg ?? ''} onChange={e => set('weight_kg', e.target.value)} placeholder="3.50" autoFocus /></Field>
        <Field label="Body condition (1–9)"><Input type="number" inputMode="numeric" min={1} max={9} value={f.body_condition_score ?? ''} onChange={e => set('body_condition_score', e.target.value)} /></Field>
      </div>)
    case 'symptom': return (
      <div className="grid grid-cols-2 gap-3">
        <Field label="Symptom" className="col-span-2"><Input list="symptoms" value={f.symptom ?? ''} onChange={e => set('symptom', e.target.value)} placeholder="Sneezing" autoFocus />
          <datalist id="symptoms">{['Sneezing', 'Vomiting', 'Diarrhea', 'Lethargy', 'Coughing', 'Scratching', 'Limping', 'Not eating', 'Hiding', 'Eye discharge', 'Hair loss'].map(s => <option key={s} value={s} />)}</datalist></Field>
        <Field label="Severity"><Select value={f.severity ?? 'mild'} onChange={e => set('severity', e.target.value)}><option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Severe</option></Select></Field>
        <Field label="Frequency"><Input value={f.frequency ?? ''} onChange={e => set('frequency', e.target.value)} placeholder="3× today" /></Field>
      </div>)
    case 'medication': return (
      <div className="grid grid-cols-2 gap-3">
        <Field label="Medication"><Input value={f.medication_name ?? ''} onChange={e => set('medication_name', e.target.value)} placeholder="Eye drops" autoFocus /></Field>
        <Field label="Dose"><Input value={f.dose ?? ''} onChange={e => set('dose', e.target.value)} placeholder="1 drop" /></Field>
        <label className="col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={f.skipped === 'true'} onChange={e => set('skipped', String(e.target.checked))} /> Skipped this dose</label>
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
        <Field label="Behavior" className="col-span-2"><Input value={f.behavior ?? ''} onChange={e => set('behavior', e.target.value)} placeholder="Hiding under the bed" autoFocus /></Field>
        <Field label="Mood"><Input value={f.mood ?? ''} onChange={e => set('mood', e.target.value)} placeholder="calm, anxious" /></Field>
        <Field label="Intensity (1–5)"><Input type="number" min={1} max={5} value={f.intensity ?? ''} onChange={e => set('intensity', e.target.value)} /></Field>
      </div>)
    case 'journal': return (
      <div className="space-y-3">
        <Field label="Title"><Input value={f.title ?? ''} onChange={e => set('title', e.target.value)} placeholder="Sunny afternoon" /></Field>
        <Field label="Entry"><Textarea value={f.body ?? ''} onChange={e => set('body', e.target.value)} placeholder="What happened today?" autoFocus /></Field>
      </div>)
  }
}

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
      return { row: { logged_at, note, weight_kg: w, body_condition_score: num(f.body_condition_score) } }
    }
    case 'symptom': {
      if (!txt(f.symptom)) return { error: 'What did you notice?' }
      return { row: { logged_at, note, symptom: txt(f.symptom), severity: f.severity ?? 'mild', frequency: txt(f.frequency) } }
    }
    case 'medication': {
      if (!txt(f.medication_name)) return { error: 'Which medication?' }
      return { row: { logged_at, note, medication_name: txt(f.medication_name), dose: txt(f.dose), skipped: f.skipped === 'true' } }
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
