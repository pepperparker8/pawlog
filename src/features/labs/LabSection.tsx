import { useState } from 'react'
import { ArrowLeft, CaretRight, Copy, Eye, Plus, Trash } from '../../components/icons'
import { Button, Card, Chip, ErrorNote, SectionTitle, Sheet } from '../../components/ui'
import { useToast } from '../../components/ui/Toast'
import { useHousehold } from '../../household/HouseholdProvider'
import { friendlyError } from '../../lib/errors'
import { dateLabel } from '../../lib/format'
import type { LabReport, LabResult } from '../../lib/types'
import { useCatHealth } from '../health/api'
import { analyteAbout, analyteName, vetQuestions } from './analytes'
import { useDeleteLab, useLabImage, useLabs } from './api'
import { LabAddSheet } from './LabAddSheet'
import { analyteHistory, formatRange, formatValue, isOutside, outsideCount, previousResult, rangeStatus, trend, unitKey } from './status'
import { StatusChip } from './StatusChip'

export function LabSection({ catId }: { catId: string }) {
  const { canEdit } = useHousehold()
  const labs = useLabs(catId)
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const reports = labs.data ?? []
  const report = reports.find(r => r.id === open)
  return (
    <section>
      <SectionTitle action={canEdit && <button onClick={() => setAdding(true)} className="flex items-center gap-1 rounded-full bg-paw-100 px-3 py-1.5 text-xs font-semibold text-paw-700"><Plus className="h-3.5 w-3.5" />Add</button>}>Lab results</SectionTitle>
      <Card className="divide-y divide-stone-100 p-0">
        {labs.error ? <div className="p-3"><ErrorNote message={friendlyError(labs.error)} /></div>
          : reports.length ? reports.map(r => {
            const out = outsideCount(r.lab_results)
            return (
              <div key={r.id} onClick={() => setOpen(r.id)} className="flex min-h-14 cursor-pointer items-center gap-3 px-4 py-2.5 active:bg-stone-50">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{dateLabel(r.sampled_on)}</div>
                  <div className="truncate text-xs text-stone-500">{[r.lab_name, `${r.lab_results.length} ${r.lab_results.length === 1 ? 'test' : 'tests'}`].filter(Boolean).join(' · ')}</div>
                </div>
                {out > 0 && <Chip tone="warn">{out} outside range</Chip>}
                <CaretRight className="h-4 w-4 text-stone-400" />
              </div>
            )
          }) : <p className="px-4 py-4 text-center text-sm text-stone-400">{labs.isLoading ? 'Loading' : 'No lab results yet'}</p>}
      </Card>
      {adding && <LabAddSheet catId={catId} onClose={() => setAdding(false)} />}
      {report && <LabReportSheet report={report} reports={reports} catId={catId} onClose={() => setOpen(null)} />}
    </section>
  )
}

function LabReportSheet({ report, reports, catId, onClose }: { report: LabReport; reports: LabReport[]; catId: string; onClose: () => void }) {
  const { canEdit } = useHousehold()
  const toast = useToast()
  const del = useDeleteLab(catId)
  const visit = useCatHealth(catId).data?.visits.find(v => v.id === report.vet_visit_id)
  const [showImage, setShowImage] = useState(false)
  const image = useLabImage(showImage ? report.storage_path : null)
  const [focus, setFocus] = useState<LabResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const rows = report.lab_results.map(r => {
    const status = rangeStatus(r)
    const prev = previousResult(reports, report.id, r)
    return { r, status, prev, dir: trend(r.value, prev?.row.value ?? null), moved: !!prev && rangeStatus(prev.row) !== status }
  })
  const panels = [...new Set(rows.map(x => x.r.panel ?? ''))]
  const questions = rows.flatMap(x => (isOutside(x.status) || x.moved ? vetQuestions(x.r, x.status, x.moved) : []))

  async function remove() {
    if (!confirm('Delete this lab report and its photo?')) return
    try { await del.mutateAsync(report); toast.show('Deleted'); onClose() } catch (e) { setError(friendlyError(e)) }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(questions.map(q => `- ${q}`).join('\n')); toast.show('Copied', 'ok') } catch { toast.show('Could not copy', 'bad') }
  }

  if (focus) return <AnalyteView row={focus} reports={reports} onBack={() => setFocus(null)} onClose={onClose} />

  return (
    <Sheet open onClose={onClose} title={dateLabel(report.sampled_on)} footer={
      <div className="flex gap-2">
        {canEdit && <Button variant="danger" aria-label="Delete" onClick={() => void remove()} loading={del.isPending}><Trash className="h-4 w-4" /></Button>}
        {report.storage_path && <Button variant="secondary" className="flex-1" onClick={() => setShowImage(s => !s)}><Eye className="h-4 w-4" />{showImage ? 'Hide original' : 'View original'}</Button>}
      </div>}>
      <div className="space-y-4 pb-1">
        {(report.lab_name || visit) && <p className="text-sm text-stone-500">{[report.lab_name, visit && `Vet visit ${dateLabel(visit.visited_on)}${visit.reason ? ` · ${visit.reason}` : ''}`].filter(Boolean).join(' · ')}</p>}
        {showImage && (image.data ? <img src={image.data} alt="Lab paper" className="w-full rounded-xl ring-1 ring-stone-200" /> : <p className="text-sm text-stone-400">Loading</p>)}
        {panels.map(p => (
          <div key={p}>
            {p && <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-stone-500">{p}</h3>}
            <div className="divide-y divide-stone-100 rounded-2xl ring-1 ring-stone-200">
              {rows.filter(x => (x.r.panel ?? '') === p).map(({ r, status, prev, dir }) => (
                <button key={r.id} onClick={() => setFocus(r)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left active:bg-stone-50">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{analyteName(r.analyte_key, r.analyte)}</div>
                    <div className="truncate text-xs text-stone-500">
                      {[formatRange(r) && `Range ${formatRange(r)}`, prev && dir && `${dir === 'up' ? '↑' : dir === 'down' ? '↓' : '='} from ${prev.row.value}`].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold tabular-nums ${isOutside(status) ? 'text-amber-700' : ''}`}>{formatValue(r)} <span className="text-xs font-normal text-stone-500">{r.unit}</span></div>
                    {status !== 'in' && status !== 'none' && <StatusChip status={status} />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
        {questions.length > 0 && (
          <div className="rounded-2xl bg-sky-50 p-3">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-sky-900">Questions for your vet</h3>
              <button onClick={() => void copy()} aria-label="Copy questions" className="rounded-full p-1.5 text-sky-700 hover:bg-sky-100"><Copy className="h-4 w-4" /></button>
            </div>
            <ul className="list-disc space-y-1 pl-5 text-sm text-sky-900">{questions.map(q => <li key={q}>{q}</li>)}</ul>
          </div>
        )}
        <ErrorNote message={error} />
      </div>
    </Sheet>
  )
}

function AnalyteView({ row, reports, onBack, onClose }: { row: LabResult; reports: LabReport[]; onBack: () => void; onClose: () => void }) {
  const name = analyteName(row.analyte_key, row.analyte)
  const about = analyteAbout(row)
  const history = analyteHistory(reports, row)
  const comparable = history.filter(h => h.row.value != null && unitKey(h.row.unit) === unitKey(row.unit))
  return (
    <Sheet open onClose={onClose} title={name}>
      <div className="space-y-4 pb-2">
        <button onClick={onBack} className="-ml-1 flex items-center gap-1 text-sm font-medium text-stone-600"><ArrowLeft className="h-4 w-4" />Back</button>
        {about && <p className="text-sm text-stone-600">{about}</p>}
        {comparable.length > 1 && <Sparkline points={comparable.map(h => h.row.value!)} low={row.ref_low} high={row.ref_high} />}
        <div className="divide-y divide-stone-100 rounded-2xl ring-1 ring-stone-200">
          {[...history].reverse().map(h => {
            const s = rangeStatus(h.row)
            return (
              <div key={h.report_id} className="flex items-center gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{dateLabel(h.sampled_on)}</div>
                  {formatRange(h.row) && <div className="text-xs text-stone-500">Range {formatRange(h.row)}</div>}
                </div>
                <span className="text-sm font-semibold tabular-nums">{formatValue(h.row)} <span className="text-xs font-normal text-stone-500">{h.row.unit}</span></span>
                {s !== 'none' && <StatusChip status={s} />}
              </div>
            )
          })}
        </div>
      </div>
    </Sheet>
  )
}

/** Values over time against the latest printed range. Labs differ, so older points may have used another range. */
function Sparkline({ points, low, high }: { points: number[]; low: number | null; high: number | null }) {
  const W = 300, H = 90, P = 8
  const all = [...points, ...(low != null ? [low] : []), ...(high != null ? [high] : [])]
  const min = Math.min(...all), max = Math.max(...all)
  const span = max - min || 1
  const y = (v: number) => H - P - ((v - min) / span) * (H - 2 * P)
  const x = (i: number) => P + (i / (points.length - 1)) * (W - 2 * P)
  const bandTop = y(high ?? max), bandBottom = y(low ?? min)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-24 w-full" role="img" aria-label="Results over time">
      {(low != null || high != null) && <rect x={0} y={bandTop} width={W} height={Math.max(0, bandBottom - bandTop)} className="fill-emerald-50" />}
      <polyline points={points.map((v, i) => `${x(i)},${y(v)}`).join(' ')} fill="none" className="stroke-paw-500" strokeWidth={2} strokeLinejoin="round" />
      {points.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={3.5} className="fill-white stroke-paw-500" strokeWidth={2} />)}
    </svg>
  )
}
