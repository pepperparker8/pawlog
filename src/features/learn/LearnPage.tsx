import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ChevronRight, Search } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card, Chip, EmptyState, ErrorNote, Input, Spinner, cx } from '../../components/ui'
import { dateLabel } from '../../lib/format'
import { friendlyError } from '../../lib/errors'
import { useArticle, useArticles, type Article } from '../tips/api'
import { parseInline, parseMarkdown, type Block } from './markdown'

export const CATEGORIES: Array<{ code: string; label: string; emoji: string }> = [
  { code: 'food', label: 'Food', emoji: '🍽️' },
  { code: 'play', label: 'Play', emoji: '🧶' },
  { code: 'training', label: 'Training', emoji: '🎓' },
  { code: 'first-aid', label: 'First aid', emoji: '🚑' },
  { code: 'vet', label: 'Vet visits', emoji: '🩺' },
  { code: 'massage', label: 'Massage', emoji: '💆' },
  { code: 'mind', label: 'Cat mind', emoji: '🧠' },
  { code: 'grooming', label: 'Grooming', emoji: '🪮' },
  { code: 'health', label: 'Health', emoji: '❤️' },
]
const categoryOf = (code: string) => CATEGORIES.find(c => c.code === code)

export function LearnPage() {
  const articles = useArticles()
  const [params, setParams] = useSearchParams()
  const cat = params.get('c') ?? ''
  const [q, setQ] = useState('')
  const present = useMemo(() => new Set(articles.data?.map(a => a.category)), [articles.data])
  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return (articles.data ?? []).filter(a => (!cat || a.category === cat) && (!t || `${a.title} ${a.summary}`.toLowerCase().includes(t)))
  }, [articles.data, cat, q])
  const urgent = list.filter(a => a.urgent)
  const rest = list.filter(a => !a.urgent)

  return (
    <div>
      <PageHeader title="Learn" subtitle="Practical cat care, with sources" back="/more" />
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search articles" className="pl-9" aria-label="Search articles" />
      </div>
      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Topics">
        <TopicChip active={!cat} onClick={() => setParams({}, { replace: true })}>All</TopicChip>
        {CATEGORIES.filter(c => present.has(c.code)).map(c => (
          <TopicChip key={c.code} active={cat === c.code} onClick={() => setParams({ c: c.code }, { replace: true })}>{c.emoji} {c.label}</TopicChip>
        ))}
      </div>

      {articles.isLoading ? <Spinner className="py-10" /> : articles.error ? <ErrorNote message={friendlyError(articles.error)} />
        : list.length === 0 ? <EmptyState emoji="📚" title="No articles found" body={q ? 'Try another word.' : undefined} />
        : (
          <div className="mt-4 space-y-3">
            {urgent.map(a => <ArticleRow key={a.slug} a={a} />)}
            {rest.map(a => <ArticleRow key={a.slug} a={a} />)}
          </div>
        )}
      <p className="mt-6 text-center text-[11px] text-stone-400">General information, not veterinary advice.</p>
    </div>
  )
}

function TopicChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button role="tab" aria-selected={active} onClick={onClick}
      className={cx('shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium', active ? 'bg-paw-500 text-white' : 'bg-white text-stone-600 ring-1 ring-stone-200')}>
      {children}
    </button>
  )
}

function ArticleRow({ a }: { a: Article }) {
  const c = categoryOf(a.category)
  return (
    <Link to={`/learn/${a.slug}`} className="block">
      <Card className={cx('flex items-center gap-3', a.urgent && 'bg-red-50/60 ring-red-100')}>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-50 text-2xl" aria-hidden>{a.icon ?? c?.emoji ?? '📖'}</span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold leading-snug">{a.title}</div>
          <div className="mt-0.5 line-clamp-2 text-sm text-stone-500">{a.summary}</div>
          <div className="mt-1 text-[11px] font-medium text-stone-400">{a.urgent ? 'Urgent · ' : ''}{c?.label ?? a.category} · {a.read_minutes} min read</div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-stone-300" />
      </Card>
    </Link>
  )
}

function Inline({ text }: { text: string }) {
  return <>{parseInline(text).map((s, i) => (s.bold ? <strong key={i} className="font-semibold text-stone-800">{s.text}</strong> : <span key={i}>{s.text}</span>))}</>
}

function MdBlock({ b }: { b: Block }) {
  switch (b.type) {
    case 'h2': return <h2 className="mt-6 text-lg font-bold">{b.text}</h2>
    case 'h3': return <h3 className="mt-4 font-semibold">{b.text}</h3>
    case 'quote': return <div className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-100"><Inline text={b.text} /></div>
    case 'ul': return <ul className="mt-2 list-disc space-y-1.5 pl-5">{b.items.map((t, i) => <li key={i}><Inline text={t} /></li>)}</ul>
    case 'ol': return <ol className="mt-2 list-decimal space-y-1.5 pl-5">{b.items.map((t, i) => <li key={i}><Inline text={t} /></li>)}</ol>
    default: return <p className="mt-3"><Inline text={b.text} /></p>
  }
}

export function ArticlePage() {
  const { slug = '' } = useParams()
  const { data: a, isLoading, error } = useArticle(slug)
  const all = useArticles()
  const blocks = useMemo(() => (a ? parseMarkdown(a.body_md) : []), [a])
  if (isLoading) return <Spinner className="py-10" />
  if (error) return <ErrorNote message={friendlyError(error)} />
  if (!a) return <div><PageHeader title="Learn" back="/learn" /><EmptyState emoji="📚" title="Article not found" /></div>
  const c = categoryOf(a.category)
  const related = (all.data ?? []).filter(x => x.category === a.category && x.slug !== a.slug).slice(0, 2)

  return (
    <article>
      <PageHeader title={c?.label ?? 'Learn'} back={`/learn${c ? `?c=${c.code}` : ''}`} />
      <div className="text-4xl" aria-hidden>{a.icon ?? c?.emoji ?? '📖'}</div>
      <h1 className="mt-2 text-2xl font-black leading-tight">{a.title}</h1>
      <div className="mt-2 flex flex-wrap gap-2">
        {a.urgent && <Chip tone="bad">Urgent</Chip>}
        <Chip>{a.read_minutes} min read</Chip>
      </div>
      <p className="mt-3 text-stone-600">{a.summary}</p>
      <div className="mt-2 text-[15px] leading-relaxed text-stone-700">{blocks.map((b, i) => <MdBlock key={i} b={b} />)}</div>

      <Card className="mt-6">
        <div className="text-xs font-semibold uppercase tracking-wide text-stone-500">Sources</div>
        <ul className="mt-2 space-y-1.5 text-sm">
          {a.sources.map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer" className="text-paw-700 underline decoration-paw-200 underline-offset-2">{s.name}</a></li>)}
        </ul>
        <p className="mt-3 text-[11px] text-stone-400">Reviewed {dateLabel(a.reviewed)}. General information, not veterinary advice. If your cat seems unwell, contact your veterinarian.</p>
      </Card>

      {related.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="text-sm font-semibold text-stone-500">More on {c?.label.toLowerCase() ?? 'this'}</div>
          {related.map(r => <ArticleRow key={r.slug} a={r} />)}
        </div>
      )}
    </article>
  )
}
