import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { format, parseISO, subDays } from 'date-fns'
import { useWeights, useWeightWeekly, useMilestones } from '../health/api'
import { Card, Chip, EmptyState, Spinner, cx } from '../../components/ui'
import { kg, dateLabel, signedKg } from '../../lib/format'
import { useWeightStatus } from '../weight/api'
import { WeightStatusCard } from '../weight/WeightStatusCard'
import { weightInsights } from './insights'

const RANGES = [{ label: '1M', days: 30 }, { label: '3M', days: 90 }, { label: '1Y', days: 365 }, { label: 'All', days: 0 }]

export function GrowthChart({ catId }: { catId: string }) {
  const w = useWeights(catId)
  const weekly = useWeightWeekly(catId)
  const ms = useMilestones(catId)
  const [range, setRange] = useState(1)
  const { result } = useWeightStatus(catId)
  const points = useMemo(() => {
    const all = w.data ?? []
    const days = RANGES[range].days
    const useWeekly = days === 0 || days > 180
    if (useWeekly && weekly.data) {
      return weekly.data.filter(p => !days || parseISO(p.week_start) >= subDays(new Date(), days))
        .map(p => ({ t: p.week_start, kg: Number(p.avg_kg), label: format(parseISO(p.week_start), 'd MMM yy') }))
    }
    return all.filter(p => !days || parseISO(p.logged_at) >= subDays(new Date(), days))
      .map(p => ({ t: p.logged_at, kg: Number(p.weight_kg), label: format(parseISO(p.logged_at), 'd MMM') }))
  }, [w.data, weekly.data, range])

  if (w.isLoading) return <Spinner />
  if (!w.data?.length) return <EmptyState emoji="⚖️" title="No weigh-ins yet" body="Log a weight and the growth curve starts here." />

  const last = w.data[w.data.length - 1]
  const prev = w.data.length > 1 ? w.data[w.data.length - 2] : null
  const delta = prev ? Number(last.weight_kg) - Number(prev.weight_kg) : 0
  const first = w.data[0]
  const finite = (b: { min: number; max: number } | null | undefined) => b && b.min > 0 && Number.isFinite(b.max) ? b : null
  const target = finite(result?.targetRange)
  const ref = result?.lifeStage === 'kitten' ? null : finite(result?.referenceRange)
  const ys = [...points.map(p => p.kg), ...(target ? [target.min, target.max] : []), ...(ref ? [ref.min, ref.max] : [])]
  const pad = ys.length ? (Math.max(...ys) - Math.min(...ys)) * 0.1 || 0.2 : 0
  const domain: [number, number] = ys.length ? [Math.max(0, +(Math.min(...ys) - pad).toFixed(1)), +(Math.max(...ys) + pad).toFixed(1)] : [0, 1]

  return (
    <div className="space-y-3">
      <WeightStatusCard catId={catId} />
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Latest" value={kg(last.weight_kg)} sub={dateLabel(last.logged_at)} />
        <Stat label="Since last" value={signedKg(delta)} sub={prev ? dateLabel(prev.logged_at) : '—'} tone={Math.abs(delta) > 0.3 ? 'warn' : 'ok'} />
        <Stat label="Since first" value={signedKg(Number(last.weight_kg) - Number(first.weight_kg))} sub={dateLabel(first.logged_at)} />
      </div>
      <Card>
        <div className="mb-2 flex gap-1">
          {RANGES.map((r, i) => <button key={r.label} onClick={() => setRange(i)} className={cx('rounded-full px-3 py-1 text-xs font-medium', i === range ? 'bg-paw-500 text-white' : 'bg-stone-100')}>{r.label}</button>)}
        </div>
        <div className="h-56">
          <ResponsiveContainer>
            <AreaChart data={points} margin={{ left: -20, right: 8, top: 8 }}>
              <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f97316" stopOpacity={.35} /><stop offset="100%" stopColor="#f97316" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f0ee" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} minTickGap={24} />
              <YAxis tick={{ fontSize: 10 }} domain={domain} allowDataOverflow />
              {ref && <ReferenceArea y1={ref.min} y2={ref.max} fill="#a8a29e" fillOpacity={0.12} stroke="none" ifOverflow="extendDomain" />}
              {target && <ReferenceArea y1={target.min} y2={target.max} fill="#10b981" fillOpacity={0.14} stroke="#10b981" strokeOpacity={0.4} strokeDasharray="4 3" ifOverflow="extendDomain" />}
              <Tooltip formatter={v => [`${Number(v).toFixed(2)} kg`, 'Weight']} />
              <Area type="monotone" dataKey="kg" stroke="#f97316" fill="url(#g)" strokeWidth={2} dot={points.length < 40} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-400">
          <span>{points.length} points{RANGES[range].days > 180 || RANGES[range].days === 0 ? ' (weekly average)' : ''}</span>
          {target && <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-sm border border-dashed border-emerald-500 bg-emerald-100" />{result?.targetRange?.label}</span>}
          {ref && <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-stone-200" />Typical breed range</span>}
        </div>
      </Card>
      <Card className="space-y-1.5" aria-label="What you recorded">
        <div className="text-xs font-semibold uppercase tracking-wide text-stone-500">What you recorded</div>
        {weightInsights(w.data).map(i => (
          <div key={i.code} className="flex gap-2 text-sm text-stone-700"><span aria-hidden>{i.emoji}</span><span>{i.text}</span></div>
        ))}
      </Card>
      {ms.data && ms.data.length > 0 && (
        <section aria-label="Milestones">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">Milestones</div>
          <div className="flex flex-wrap gap-1">
            {[...ms.data].sort((a, b) => b.reached_at.localeCompare(a.reached_at)).map(m => (
              <Chip key={m.id} tone="brand">{milestoneIcon(m.code)} {m.label} · {dateLabel(m.reached_at)}</Chip>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: 'ok' | 'warn' }) {
  return (
    <Card className="p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">{label}</div>
      <div className={cx('text-base font-bold', tone === 'warn' && 'text-amber-600')}>{value}</div>
      <div className="text-[10px] text-stone-400">{sub}</div>
    </Card>
  )
}

function milestoneIcon(code: string) {
  if (code === 'first_weigh_in') return '🐾'
  if (code.startsWith('weighins_')) return '📒'
  if (code.startsWith('tracked_')) return '📅'
  if (code.startsWith('weight_')) return '🍼'
  if (code.includes('range')) return '🎯'
  return '⭐'
}
