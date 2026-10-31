import { useState } from 'react'
import { Button, Chip, ErrorNote, Input, Sheet, Textarea, cx } from '../../components/ui'
import { useToast } from '../../components/ui/Toast'
import { friendlyError } from '../../lib/errors'
import type { CatSummary, CheckinTag, DailyCheckin } from '../../lib/types'
import { CHECKIN_TAGS, USUAL, localDay, useSaveCheckin, type CheckinDraft } from './api'

type Option<T> = { value: T; label: string; flag?: boolean }

const EATING: Option<CheckinDraft['eating']>[] = [
  { value: 'usual', label: 'Usual' }, { value: 'less', label: 'Less', flag: true }, { value: 'none', label: 'Not eating', flag: true },
]
const LITTER: Option<CheckinDraft['litter']>[] = [{ value: 'usual', label: 'Usual' }, { value: 'changed', label: 'Changed', flag: true }]
const VOMITING: Option<boolean>[] = [{ value: false, label: 'No' }, { value: true, label: 'Yes', flag: true }]
const ENERGY: Option<CheckinDraft['energy']>[] = [{ value: 'usual', label: 'Usual' }, { value: 'low', label: 'Low', flag: true }]

function draftOf(c: DailyCheckin | undefined): CheckinDraft {
  return c ? { eating: c.eating, litter: c.litter, vomiting: c.vomiting, energy: c.energy, tags: c.tags, note: c.note } : USUAL
}

/** Records an off day for one or more cats. Any past day can be filled in; a saved day is replaced. */
export function CheckinSheet({ hid, cats, catId, existing, onClose }: {
  hid: string; cats: CatSummary[]; catId: string; existing: DailyCheckin[]; onClose: () => void
}) {
  const save = useSaveCheckin(hid)
  const toast = useToast()
  const [selected, setSelected] = useState<string[]>([catId])
  const [day, setDay] = useState(localDay())
  const [d, setD] = useState<CheckinDraft>(() => draftOf(existing.find(c => c.cat_id === catId && c.day === localDay())))
  const [error, setError] = useState<string | null>(null)
  const set = <K extends keyof CheckinDraft>(k: K, v: CheckinDraft[K]) => setD(x => ({ ...x, [k]: v }))
  const toggleTag = (t: CheckinTag) => set('tags', d.tags.includes(t) ? d.tags.filter(x => x !== t) : [...d.tags, t])
  const pickDay = (v: string) => {
    if (!v) return
    setDay(v)
    setD(draftOf(existing.find(c => c.cat_id === selected[0] && c.day === v)))
  }
  const toggleCat = (id: string) => setSelected(s => (s.includes(id) ? (s.length > 1 ? s.filter(x => x !== id) : s) : [...s, id]))

  async function submit() {
    setError(null)
    try {
      await save.mutateAsync({ catIds: selected, day, draft: d })
      toast.show(selected.length > 1 ? `Saved for ${selected.length} cats` : 'Saved')
      onClose()
    } catch (e) { setError(friendlyError(e)) }
  }

  const footer = (
    <Button className="w-full py-3 text-base" loading={save.isPending} onClick={submit}>
      Save{selected.length > 1 ? ` for ${selected.length} cats` : ''}
    </Button>
  )
  return (
    <Sheet open onClose={onClose} title="Off day" footer={footer}>
      <div className="space-y-4 pb-4">
        {cats.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {cats.map(c => (
              <button key={c.cat_id} onClick={() => toggleCat(c.cat_id)} aria-pressed={selected.includes(c.cat_id)}
                className={cx('rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-inset transition',
                  selected.includes(c.cat_id) ? 'bg-paw-500 text-white ring-paw-500' : 'bg-white text-stone-700 ring-stone-200')}>
                {c.name}
              </button>
            ))}
          </div>
        )}
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">Day</span>
          <Input type="date" value={day} max={localDay()} onChange={e => pickDay(e.target.value)} />
        </label>
        <Segmented label="Eating" options={EATING} value={d.eating} onChange={v => set('eating', v)} />
        <Segmented label="Litter" options={LITTER} value={d.litter} onChange={v => set('litter', v)} />
        <Segmented label="Vomiting" options={VOMITING} value={d.vomiting} onChange={v => set('vomiting', v)} />
        <Segmented label="Energy" options={ENERGY} value={d.energy} onChange={v => set('energy', v)} />
        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">Context</div>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(CHECKIN_TAGS) as CheckinTag[]).map(t => (
              <button key={t} onClick={() => toggleTag(t)} aria-pressed={d.tags.includes(t)}>
                <Chip tone={d.tags.includes(t) ? 'brand' : 'neutral'} className="px-3 py-1 text-sm">{CHECKIN_TAGS[t]}</Chip>
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">Note</span>
          <Textarea value={d.note ?? ''} maxLength={2000} onChange={e => set('note', e.target.value)} />
        </label>
        <ErrorNote message={error} />
      </div>
    </Sheet>
  )
}

function Segmented<T extends string | boolean>({ label, options, value, onChange }: {
  label: string; options: Option<T>[]; value: T; onChange: (v: T) => void
}) {
  return (
    <div role="radiogroup" aria-label={label}>
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</div>
      <div className="flex gap-1 rounded-xl bg-stone-100 p-1">
        {options.map(o => {
          const on = o.value === value
          return (
            <button key={String(o.value)} role="radio" aria-checked={on} onClick={() => onChange(o.value)}
              className={cx('min-h-10 flex-1 rounded-lg px-2 text-sm font-semibold transition',
                on ? (o.flag ? 'bg-white text-amber-700 shadow-sm' : 'bg-white text-stone-900 shadow-sm') : 'text-stone-500')}>
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
