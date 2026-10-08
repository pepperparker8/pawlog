import { useState, type FormEvent } from 'react'
import { Target as TargetIcon } from '../../components/icons'
import { useHousehold } from '../../household/HouseholdProvider'
import { Button, Card, Chip, ErrorNote, Field, Input, Select, Sheet, Textarea, cx } from '../../components/ui'
import { useToast } from '../../components/ui/Toast'
import { friendlyError } from '../../lib/errors'
import { dateLabel, todayInput } from '../../lib/format'
import { statusView, type Band, type WeightStatusResult } from './status'
import { useRemoveTarget, useSaveTarget, useWeightStatus, type WeightTarget } from './api'

const CONFIDENCE: Record<WeightStatusResult['confidence'], string> = { high: 'High confidence', medium: 'Medium confidence', low: 'Low confidence', none: '' }

const range = (b: Band) => Number.isFinite(b.max) && b.min > 0 ? `${b.min.toFixed(2)}–${b.max.toFixed(2)} kg` : Number.isFinite(b.max) ? `up to ${b.max.toFixed(2)} kg` : `from ${b.min.toFixed(2)} kg`

export function WeightStatusCard({ catId, compact }: { catId: string; compact?: boolean }) {
  const { canEdit } = useHousehold()
  const { result, breed, targets } = useWeightStatus(catId)
  const [editing, setEditing] = useState(false)
  if (!result) return null
  const v = statusView(result)
  return (
    <Card className="space-y-2">
      <div className="flex items-start gap-3">
        <span className={cx('grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl', v.tone === 'ok' ? 'bg-emerald-50' : v.tone === 'warn' ? 'bg-amber-50' : 'bg-stone-100')} aria-hidden>{v.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold">{v.label}</span>
            {result.source && <Chip tone="neutral">{result.source}</Chip>}
          </div>
          <p className="mt-0.5 text-sm text-stone-600">{result.reason}</p>
          {CONFIDENCE[result.confidence] && <p className="mt-0.5 text-[11px] text-stone-400">{CONFIDENCE[result.confidence]}</p>}
        </div>
      </div>
      {result.attention && <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">{result.attention}</p>}
      {!compact && (
        <div className="space-y-1 border-t border-stone-100 pt-2 text-xs text-stone-500">
          {result.targetRange
            ? <div className="flex justify-between gap-2"><span>{result.targetRange.label}</span><span className="font-medium text-stone-700">{range(result.targetRange)}</span></div>
            : <div>No vet or owner target yet.</div>}
          {result.referenceRange
            ? <div className="flex justify-between gap-2"><span>{result.referenceRange.label}</span><span className="font-medium text-stone-700">{range(result.referenceRange)}</span></div>
            : <div>{breed ? `${breed.name}: breed-specific reference unavailable.` : 'Breed-specific reference unavailable.'}</div>}
          {result.referenceRange && (
            <div className="text-[11px]">Source: {result.referenceRange.sourceUrl
              ? <a className="underline" href={result.referenceRange.sourceUrl} target="_blank" rel="noreferrer">{result.referenceRange.source}</a>
              : result.referenceRange.source}</div>
          )}
          {canEdit && <Button variant="secondary" className="mt-1 w-full" onClick={() => setEditing(true)}><TargetIcon className="h-4 w-4" /> {targets.length ? 'Edit target' : 'Set a target range'}</Button>}
        </div>
      )}
      {editing && <TargetSheet catId={catId} targets={targets} onClose={() => setEditing(false)} />}
    </Card>
  )
}

function TargetSheet({ catId, targets, onClose }: { catId: string; targets: WeightTarget[]; onClose: () => void }) {
  const { current } = useHousehold()
  const save = useSaveTarget(current!.id)
  const remove = useRemoveTarget(current!.id)
  const toast = useToast()
  const [source, setSource] = useState<'vet' | 'owner'>(targets.find(t => t.source === 'vet') ? 'vet' : targets.length ? 'owner' : 'vet')
  const existing = targets.find(t => t.source === source)
  const [f, setF] = useState({ min: '', max: '', ideal: '', set_on: todayInput(), note: '' })
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  if ((existing?.id ?? source) !== loadedFor) {
    setLoadedFor(existing?.id ?? source)
    setF(existing
      ? { min: existing.min_kg?.toString() ?? '', max: existing.max_kg?.toString() ?? '', ideal: existing.target_kg?.toString() ?? '', set_on: existing.set_on, note: existing.note ?? '' }
      : { min: '', max: '', ideal: '', set_on: todayInput(), note: '' })
  }
  const num = (s: string) => (s.trim() === '' ? null : Number(s.replace(',', '.')))

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(null)
    const min = num(f.min), max = num(f.max), ideal = num(f.ideal)
    if (min == null && max == null && ideal == null) { setError('Enter a range or an ideal weight.'); return }
    if (min != null && max != null && max < min) { setError('Maximum must be at least the minimum.'); return }
    try {
      await save.mutateAsync({ catId, source, min_kg: min, max_kg: max, target_kg: ideal, set_on: f.set_on, note: f.note.trim() || null })
      toast.show('🎯 Target saved'); onClose()
    } catch (err) { setError(friendlyError(err)) }
  }

  return (
    <Sheet open onClose={onClose} title="Weight target" footer={
      <div className="flex gap-2">
        {existing && <Button type="button" variant="ghost" loading={remove.isPending} onClick={async () => { await remove.mutateAsync({ id: existing.id, catId }); toast.show('Target removed'); onClose() }}>Remove</Button>}
        <Button type="submit" form="target-form" className="flex-1" loading={save.isPending}>Save target</Button>
      </div>
    }>
      <form id="target-form" onSubmit={submit} className="grid grid-cols-2 gap-3">
        <Field label="Set by" className="col-span-2">
          <Select value={source} onChange={e => setSource(e.target.value as 'vet' | 'owner')}>
            <option value="vet">Veterinarian</option>
            <option value="owner">Me (owner goal)</option>
          </Select>
        </Field>
        <Field label="Minimum (kg)"><Input inputMode="decimal" value={f.min} onChange={e => setF({ ...f, min: e.target.value })} /></Field>
        <Field label="Maximum (kg)"><Input inputMode="decimal" value={f.max} onChange={e => setF({ ...f, max: e.target.value })} /></Field>
        <Field label="Ideal (kg, optional)"><Input inputMode="decimal" value={f.ideal} onChange={e => setF({ ...f, ideal: e.target.value })} /></Field>
        <Field label="Set on"><Input type="date" value={f.set_on} onChange={e => setF({ ...f, set_on: e.target.value })} /></Field>
        <Field label="Note" className="col-span-2"><Textarea value={f.note} onChange={e => setF({ ...f, note: e.target.value })} /></Field>
        {existing && <p className="col-span-2 text-xs text-stone-500">Current: {source} target · {dateLabel(existing.set_on)}</p>}
        <div className="col-span-2"><ErrorNote message={error} /></div>
      </form>
    </Sheet>
  )
}
