import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, FileText, Pencil, Plus, RotateRight, Trash } from '../../components/icons'
import { Button, Chip, ErrorNote, Field, Input, Select, Sheet } from '../../components/ui'
import { useToast } from '../../components/ui/Toast'
import { useHousehold } from '../../household/HouseholdProvider'
import { friendlyError } from '../../lib/errors'
import { todayInput } from '../../lib/format'
import type { LabDraft, LabRow } from '../../lib/types'
import { useCatHealth } from '../health/api'
import { keyFor } from './analytes'
import { readLab, useSaveLab } from './api'
import { CropBox } from './CropBox'
import { cropToJpeg, loadSource, rotate, type LabSource, type Rect } from './image'
import { parseBound, parseValue, rangeStatus } from './status'
import { StatusChip } from './StatusChip'

type Step = { kind: 'pick' } | { kind: 'crop'; src: LabSource; page: number; canvas: HTMLCanvasElement } | { kind: 'draft' }
const FULL: Rect = { x: 0.04, y: 0.04, w: 0.92, h: 0.92 }
const DATE = /^\d{4}-\d{2}-\d{2}$/

/** One editable row. Strings while typing; the original read is kept so untouched fields keep their key and printed range. */
interface RowState { id: string; analyte: string; value: string; unit: string; low: string; high: string; base: LabRow | null }
const blankRow = (): RowState => ({ id: crypto.randomUUID(), analyte: '', value: '', unit: '', low: '', high: '', base: null })
const str = (v: number | string | null | undefined) => (v == null ? '' : String(v))
const fromRow = (r: LabRow): RowState => ({
  id: crypto.randomUUID(), analyte: r.analyte, value: r.value != null ? String(r.value) : r.value_text ?? '', unit: str(r.unit), low: str(r.ref_low), high: str(r.ref_high), base: r,
})

function toRow(s: RowState): LabRow {
  const b = s.base
  const v = parseValue(s.value)
  const low = parseBound(s.low), high = parseBound(s.high)
  const sameRange = !!b && b.ref_low === low && b.ref_high === high
  return {
    panel: b?.panel ?? null, analyte: s.analyte.trim(),
    analyte_key: b && b.analyte === s.analyte.trim() ? b.analyte_key : keyFor(s.analyte),
    ...v, unit: s.unit.trim() || null, ref_low: low, ref_high: high,
    ref_text: sameRange ? b!.ref_text : null, printed_flag: sameRange ? b!.printed_flag : null, about: b?.about ?? null,
  }
}

export function LabAddSheet({ catId, onClose }: { catId: string; onClose: () => void }) {
  const { current } = useHousehold()
  const ai = !!current?.ai_enabled
  const toast = useToast()
  const visits = useCatHealth(catId).data?.visits ?? []
  const save = useSaveLab()
  const [step, setStep] = useState<Step>({ kind: 'pick' })
  const [rect, setRect] = useState<Rect>(FULL)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [image, setImage] = useState<Blob | null>(null)
  const [draft, setDraft] = useState<(LabDraft & { readId: string }) | null>(null)
  // One id per image: it keys the read (so a retry reuses the draft) and later the saved report.
  const eventId = useRef(crypto.randomUUID())

  const [sampledOn, setSampledOn] = useState(todayInput())
  const [labName, setLabName] = useState('')
  const [visit, setVisit] = useState('')
  const [clinic, setClinic] = useState('')
  const [reason, setReason] = useState('Lab tests')
  const [rows, setRows] = useState<RowState[]>([blankRow()])
  const [showImage, setShowImage] = useState(false)
  const imageUrl = useMemo(() => (image ? URL.createObjectURL(image) : null), [image])
  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl) }, [imageUrl])

  async function pick(file: File | undefined) {
    if (!file) return
    setError(null); setBusy('Opening')
    try {
      const src = await loadSource(file)
      setStep({ kind: 'crop', src, page: 1, canvas: await src.render(1) }); setRect(FULL)
    } catch { setError('This file could not be opened. Try a JPEG, PNG or PDF.') }
    setBusy(null)
  }

  async function goPage(n: number) {
    if (step.kind !== 'crop') return
    setBusy('Opening')
    try { setStep({ ...step, page: n, canvas: await step.src.render(n) }); setRect(FULL) } catch (e) { setError(friendlyError(e)) }
    setBusy(null)
  }

  async function confirmCrop() {
    if (step.kind !== 'crop') return
    setError(null)
    const c = step.canvas
    const blob = await cropToJpeg(c, { x: rect.x * c.width, y: rect.y * c.height, w: rect.w * c.width, h: rect.h * c.height })
    setImage(blob)
    eventId.current = crypto.randomUUID()
    if (!ai) { setStep({ kind: 'draft' }); return }
    setBusy('Reading')
    try {
      const read = await readLab(catId, eventId.current, blob)
      const d = read.draft
      setDraft({ ...d, readId: read.id })
      if (d.sampled_on && DATE.test(d.sampled_on)) setSampledOn(d.sampled_on)
      if (d.lab_name) { setLabName(d.lab_name); setClinic(d.lab_name) }
      setRows(d.rows.length ? d.rows.map(fromRow) : [blankRow()])
      setStep({ kind: 'draft' })
    } catch (e) { setError(friendlyError(e)) }
    setBusy(null)
  }

  async function submit() {
    setError(null)
    const filled = rows.filter(r => r.analyte.trim() || r.value.trim())
    if (!filled.length) { setError('Add at least one result.'); return }
    if (filled.some(r => !r.analyte.trim() || !r.value.trim())) { setError('Each result needs a test name and a value.'); return }
    if (!DATE.test(sampledOn)) { setError('Sample date is required.'); return }
    try {
      await save.mutateAsync({
        eventId: eventId.current, hid: current!.id, catId, image, readId: draft?.readId ?? null, sampledOn, labName: labName.trim(),
        visitId: visit && visit !== 'new' ? visit : null, newVisit: visit === 'new' ? { clinic: clinic.trim(), reason: reason.trim() } : null,
        rows: filled.map(toRow),
      })
      toast.show('Lab results saved', 'ok'); onClose()
    } catch (e) { setError(friendlyError(e)) }
  }

  const patch = (id: string, p: Partial<RowState>) => setRows(rs => rs.map(r => (r.id === id ? { ...r, ...p } : r)))
  const fileInput = (label: string, icon: React.ReactNode, accept: string, capture?: boolean) => (
    <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-stone-200 active:bg-stone-50">
      {icon}<span className="text-sm font-semibold">{label}</span>
      <input type="file" accept={accept} capture={capture ? 'environment' : undefined} className="hidden" onChange={e => { void pick(e.target.files?.[0]); e.target.value = '' }} />
    </label>
  )

  if (step.kind === 'pick') return (
    <Sheet open onClose={onClose} title="Add lab results">
      <div className="space-y-2 pb-2">
        {fileInput('Take photo', <Camera className="h-5 w-5 text-paw-600" />, 'image/*', true)}
        {fileInput('Choose photo or PDF', <FileText className="h-5 w-5 text-paw-600" />, 'image/jpeg,image/png,image/webp,image/heic,application/pdf')}
        <button onClick={() => setStep({ kind: 'draft' })} className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left ring-1 ring-stone-200 active:bg-stone-50">
          <Pencil className="h-5 w-5 text-paw-600" /><span className="text-sm font-semibold">Enter by hand</span>
        </button>
        {busy && <p className="text-center text-sm text-stone-500">{busy}...</p>}
        <ErrorNote message={error} />
      </div>
    </Sheet>
  )

  if (step.kind === 'crop') return (
    <Sheet open onClose={onClose} title="Crop to the results" footer={
      <div className="flex gap-2">
        <Button variant="secondary" aria-label="Rotate" onClick={() => { setStep({ ...step, canvas: rotate(step.canvas) }); setRect(FULL) }}><RotateRight className="h-4 w-4" /></Button>
        <Button className="flex-1 py-3 text-base" loading={!!busy} onClick={() => void confirmCrop()}>{busy === 'Reading' ? 'Reading' : ai ? 'Read results' : 'Use photo'}</Button>
      </div>}>
      <div className="space-y-3 pb-1">
        <p className="text-sm text-stone-500">Leave out names, phone numbers and addresses.</p>
        <CropBox canvas={step.canvas} rect={rect} onChange={setRect} />
        {step.src.pages > 1 && (
          <div className="flex items-center justify-center gap-3 text-sm">
            <Button variant="ghost" disabled={step.page <= 1 || !!busy} onClick={() => void goPage(step.page - 1)}>Previous</Button>
            <span className="text-stone-500">Page {step.page} of {step.src.pages}</span>
            <Button variant="ghost" disabled={step.page >= step.src.pages || !!busy} onClick={() => void goPage(step.page + 1)}>Next</Button>
          </div>
        )}
        <ErrorNote message={error} />
      </div>
    </Sheet>
  )

  return (
    <Sheet open onClose={onClose} title="Check results" footer={
      <Button className="w-full py-3 text-base" loading={save.isPending} onClick={() => void submit()}>Save</Button>}>
      <div className="space-y-4 pb-1">
        {draft && !draft.is_lab_report && <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">This does not look like a lab report.</p>}
        {draft?.species === 'not_cat' && <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">The report names another species.</p>}
        {imageUrl && (
          <button type="button" onClick={() => setShowImage(s => !s)} className="block w-full overflow-hidden rounded-xl ring-1 ring-stone-200">
            <img src={imageUrl} alt="Lab paper" className={showImage ? 'w-full' : 'h-24 w-full object-cover object-top'} />
          </button>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sample date" hint={draft?.date_text ? `Printed: ${draft.date_text}` : undefined}>
            <Input type="date" value={sampledOn} max={todayInput()} onChange={e => setSampledOn(e.target.value)} />
          </Field>
          <Field label="Lab"><Input value={labName} onChange={e => setLabName(e.target.value)} /></Field>
          <Field label="Vet visit" className="col-span-2">
            <Select value={visit} onChange={e => setVisit(e.target.value)}>
              <option value="">None</option>
              {visits.map(v => <option key={v.id} value={v.id}>{v.visited_on}{v.reason ? ` · ${v.reason}` : ''}{v.clinic ? ` · ${v.clinic}` : ''}</option>)}
              <option value="new">New visit on the sample date</option>
            </Select>
          </Field>
          {visit === 'new' && <>
            <Field label="Clinic"><Input value={clinic} onChange={e => setClinic(e.target.value)} /></Field>
            <Field label="Reason"><Input value={reason} onChange={e => setReason(e.target.value)} /></Field>
          </>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wide text-stone-500">Results · {rows.length}</h3>
            <button type="button" onClick={() => setRows(rs => [...rs, blankRow()])} className="flex items-center gap-1 rounded-full bg-paw-100 px-3 py-1.5 text-xs font-semibold text-paw-700"><Plus className="h-3.5 w-3.5" />Row</button>
          </div>
          {rows.map(r => {
            const preview = toRow(r)
            const status = r.value.trim() ? rangeStatus(preview) : 'none'
            return (
              <div key={r.id} className="space-y-2 rounded-2xl bg-white p-3 ring-1 ring-stone-200">
                <div className="flex items-center gap-2">
                  <Input aria-label="Test" placeholder="Test" value={r.analyte} onChange={e => patch(r.id, { analyte: e.target.value })} className="py-2 text-sm font-medium" />
                  {status !== 'none' && <StatusChip status={status} />}
                  <button type="button" aria-label="Remove row" onClick={() => setRows(rs => rs.length > 1 ? rs.filter(x => x.id !== r.id) : [blankRow()])} className="rounded-full p-2 text-stone-400 hover:bg-stone-100"><Trash className="h-4 w-4" /></button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <Input aria-label="Value" placeholder="Value" inputMode="decimal" value={r.value} onChange={e => patch(r.id, { value: e.target.value })} className="px-2 py-2 text-sm" />
                  <Input aria-label="Unit" placeholder="Unit" value={r.unit} onChange={e => patch(r.id, { unit: e.target.value })} className="px-2 py-2 text-sm" />
                  <Input aria-label="Range low" placeholder="Low" inputMode="decimal" value={r.low} onChange={e => patch(r.id, { low: e.target.value })} className="px-2 py-2 text-sm" />
                  <Input aria-label="Range high" placeholder="High" inputMode="decimal" value={r.high} onChange={e => patch(r.id, { high: e.target.value })} className="px-2 py-2 text-sm" />
                </div>
                {r.base?.printed_flag && <Chip>Printed flag {r.base.printed_flag}</Chip>}
              </div>
            )
          })}
        </div>
        <ErrorNote message={error} />
      </div>
    </Sheet>
  )
}
