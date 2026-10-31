import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { G } from '../../components/icons'
import { Button, Card, Chip, EmptyState, ErrorNote, Spinner, Textarea, cx } from '../../components/ui'
import { useHousehold } from '../../household/HouseholdProvider'
import { friendlyError } from '../../lib/errors'
import { ago } from '../../lib/format'
import type { AskMessage } from '../../lib/types'
import { URGENCY, useAsk, useAskMessages, useClearAsk } from './api'

export function AskTab({ catId, catName }: { catId: string; catName: string }) {
  const { canEdit } = useHousehold()
  const msgs = useAskMessages(catId)
  const ask = useAsk(catId)
  const clear = useClearAsk(catId)
  const draft = (useLocation().state as { draft?: string } | null)?.draft
  const [question, setQuestion] = useState(draft ?? '')
  const [pending, setPending] = useState<{ question: string; eventId: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const end = useRef<HTMLDivElement>(null)
  const rows = msgs.data ?? []

  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [rows.length, ask.isPending])

  async function submit() {
    const q = question.trim()
    if (q.length < 2 || ask.isPending) return
    // Same question text keeps its event id, so resending after a failure cannot produce a second answer.
    const p = pending?.question === q ? pending : { question: q, eventId: crypto.randomUUID() }
    setPending(p)
    setError(null)
    try {
      await ask.mutateAsync(p)
      setPending(null)
      setQuestion('')
    } catch (e) { setError(friendlyError(e)) }
  }

  async function clearAll() {
    if (!window.confirm(`Clear all questions about ${catName}?`)) return
    try { await clear.mutateAsync() } catch (e) { setError(friendlyError(e)) }
  }

  if (msgs.isLoading) return <Spinner />
  return (
    <div className="space-y-3 pb-4">
      {rows.length === 0 && !ask.isPending && <EmptyState icon={G.book} tone="violet" title={`Ask about ${catName}`} />}
      {rows.map(m => (m.role === 'user' ? <Question key={m.id} text={m.content} at={m.created_at} /> : <Answer key={m.id} m={m} />))}
      {ask.isPending && pending && <Question text={pending.question} />}
      {ask.isPending && <Spinner className="py-4" />}
      <div ref={end} />
      {canEdit && (
        <div className="space-y-2 pt-2">
          <ErrorNote message={error} />
          <Textarea value={question} maxLength={2000} rows={2} placeholder={`Ask about ${catName}`}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void submit() }} />
          <div className="flex items-center gap-2">
            {rows.length > 0 && <Button variant="ghost" onClick={clearAll} loading={clear.isPending}>Clear</Button>}
            <Button className="ml-auto" onClick={submit} loading={ask.isPending} disabled={question.trim().length < 2}>Ask</Button>
          </div>
        </div>
      )}
    </div>
  )
}

function Question({ text, at }: { text: string; at?: string }) {
  return (
    <div className="ml-10 rounded-2xl rounded-br-md bg-stone-100 px-3.5 py-2.5">
      <p className="whitespace-pre-wrap text-sm text-stone-800">{text}</p>
      {at && <p className="mt-1 text-right text-[11px] text-stone-400">{ago(at)}</p>}
    </div>
  )
}

function Answer({ m }: { m: AskMessage }) {
  const u = URGENCY[m.urgency ?? 'monitor']
  const watch = m.answer?.watch ?? []
  const vet = m.answer?.vet_questions ?? []
  return (
    <Card className={cx('mr-6 space-y-3', m.urgency === 'emergency' && 'ring-2 ring-red-300')}>
      <Chip tone={u.tone} className="text-sm font-semibold">{u.label}</Chip>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-800">{m.content}</p>
      {watch.length > 0 && <List title="What to watch" items={watch} />}
      {vet.length > 0 && <List title="Questions for your vet" items={vet} />}
    </Card>
  )
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">{title}</div>
      <ul className="list-disc space-y-0.5 pl-5 text-sm text-stone-700">
        {items.map((x, i) => <li key={i}>{x}</li>)}
      </ul>
    </div>
  )
}
