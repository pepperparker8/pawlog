import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { format, parseISO, subDays } from 'date-fns'
import { useWeights, useWeightWeekly, useMilestones } from '../health/api'
import { Card, Chip, EmptyState, Spinner, cx } from '../../components/ui'
import { kg, dateLabel } from '../../lib/format'

const RANGES = [{ label: '1M', days: 30 }, { label: '3M', days: 90 }, { label: '1Y', days: 365 }, { label: 'All', days: 0 }]

export function GrowthChart({ catId }: { catId: string }) {
  const w = useWeights(catId)
  const weekly = useWeightWeekly(catId)
  const ms = useMilestones(catId)
  const [range, setRange] = useState(1)
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

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Latest" value={kg(last.weight_kg)} sub={dateLabel(last.logged_at)} />
        <Stat label="Since last" value={`${delta >= 0 ? '+' : ''}${delta.toFixed(2)} kg`} sub={prev ? dateLabel(prev.logged_at) : '—'} tone={Math.abs(delta) > 0.3 ? 'warn' : 'ok'} />
        <Stat label="Since first" value={`${(Number(last.weight_kg) - Number(first.weight_kg)).toFixed(2)} kg`} sub={dateLabel(first.logged_at)} />
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
              <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
              <Tooltip formatter={v => [`${Number(v).toFixed(2)} kg`, 'Weight']} />
              <Area type="monotone" dataKey="kg" stroke="#f97316" fill="url(#g)" strokeWidth={2} dot={points.length < 40} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-1 text-[11px] text-stone-400">{points.length} points{RANGES[range].days > 180 || RANGES[range].days === 0 ? ' (weekly average)' : ''}</p>
      </Card>
      {ms.data && ms.data.length > 0 && (
        <div className="flex flex-wrap gap-1">{ms.data.map(m => <Chip key={m.id} tone="brand">🏆 {m.label}</Chip>)}</div>
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
