import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, X } from 'lucide-react'
import { Card, SectionTitle, cx } from '../../components/ui'
import { useCatTips, useHomeTip } from './api'
import type { CareTip } from './engine'

export function TipSource({ tip }: { tip: Pick<CareTip, 'source' | 'source_url'> }) {
  return (
    <a href={tip.source_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[11px] font-medium text-stone-400 underline decoration-stone-300 underline-offset-2">
      Source: {tip.source}
    </a>
  )
}

function TipBlock({ tip, label, tone, onDismiss, action }: { tip: CareTip; label: string; tone: 'hint' | 'breed' | 'fact'; onDismiss?: () => void; action?: React.ReactNode }) {
  return (
    <Card className={cx('relative', tone === 'hint' && 'bg-amber-50/60 ring-amber-100', tone === 'breed' && 'bg-paw-50/70 ring-paw-100')}>
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none" aria-hidden>{tip.icon ?? '💡'}</span>
        <div className="min-w-0 flex-1 pr-6">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">{label}</div>
          <div className="mt-0.5 font-semibold leading-snug">{tip.title}</div>
          <p className="mt-1 text-sm leading-relaxed text-stone-600">{tip.body}</p>
          <div className="flex items-center justify-between gap-2"><TipSource tip={tip} />{action}</div>
        </div>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} aria-label="Hide this tip" className="absolute right-2 top-2 rounded-full p-1.5 text-stone-400 active:bg-stone-100">
          <X className="h-4 w-4" />
        </button>
      )}
    </Card>
  )
}

/** Tips tailored to one cat: hints from its logs, a breed insight, and a rotating fact. */
export function TipsCard({ hid, catId, name }: { hid: string; catId: string; name: string }) {
  const [offset, setOffset] = useState(0)
  const { picked, breed, dismiss } = useCatTips(hid, catId, offset)
  if (!picked) return null
  const { hints, breedInsight, fact, factCount } = picked
  if (!hints.length && !breedInsight && !fact) return null
  return (
    <section>
      <SectionTitle action={<Link to="/learn" className="flex items-center text-xs font-semibold text-paw-600">Learn<ChevronRight className="h-3.5 w-3.5" /></Link>}>Tips for {name}</SectionTitle>
      <div className="space-y-3">
        {hints.map(h => <TipBlock key={h.code} tip={h} tone="hint" label="Based on your logs" onDismiss={() => dismiss(h.code)} />)}
        {breedInsight && <TipBlock tip={breedInsight} tone="breed" label={`💡 Breed insight${breed ? ` · ${breed.name}` : ''}`} onDismiss={() => dismiss(breedInsight.code)} />}
        {fact && (
          <TipBlock tip={fact} tone="fact" label="Did you know?"
            action={factCount > 1 ? <button onClick={() => setOffset(o => o + 1)} className="mt-2 shrink-0 rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600 active:scale-95">Next fact</button> : null} />
        )}
      </div>
    </section>
  )
}

/** Tip of the day on the home screen. */
export function HomeTip({ hid }: { hid: string }) {
  const { tip, dismiss } = useHomeTip(hid)
  if (!tip) return null
  const label = tip.tip.trigger ? `For ${tip.cat.name} · based on your logs` : tip.tip.kind === 'fact' ? 'Did you know?' : `Tip for ${tip.cat.name}`
  return (
    <div>
      <TipBlock tip={tip.tip} tone={tip.tip.trigger ? 'hint' : 'fact'} label={label} onDismiss={() => dismiss(tip.tip.code)}
        action={<Link to={`/cats/${tip.cat.cat_id}`} className="mt-2 shrink-0 text-xs font-semibold text-paw-600">Open {tip.cat.name}</Link>} />
    </div>
  )
}
