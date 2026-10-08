import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useHousehold } from '../../household/HouseholdProvider'
import { Card, EmptyState, ErrorNote, Input, SectionTitle, Spinner } from '../../components/ui'
import { PageHeader } from '../../components/layout/PageHeader'
import { supabase } from '../../lib/supabase'
import { keys } from '../../lib/queryClient'
import { dateLabel } from '../../lib/format'
import { friendlyError } from '../../lib/errors'
import { useArticles } from '../tips/api'
import { useCatSummaries } from '../cats/api'
import type { SearchHit } from '../../lib/types'
import { CareTile, IconTile, TOPIC, G } from '../../components/icons'

export function useSearch(hid: string, q: string) {
  return useQuery({
    queryKey: keys.search(hid, q), enabled: q.trim().length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_household', { p_household: hid, p_query: q.trim() })
      if (error) throw error
      return data as SearchHit[]
    },
  })
}

export function SearchPage() {
  const { current } = useHousehold()
  const hid = current!.id
  const [text, setText] = useState('')
  const [q, setQ] = useState('')
  useEffect(() => { const t = setTimeout(() => setQ(text), 300); return () => clearTimeout(t) }, [text])
  const r = useSearch(hid, q)
  const articles = useArticles()
  const cats = useCatSummaries(hid, true)
  const catName = (id: string | null) => cats.data?.find(c => c.cat_id === id)?.name
  const guides = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (t.length < 2) return []
    return (articles.data ?? []).filter(a => `${a.title} ${a.summary}`.toLowerCase().includes(t)).slice(0, 3)
  }, [articles.data, q])
  const ready = q.trim().length >= 2
  const nothing = ready && !r.isLoading && !r.error && !r.data?.length && !guides.length
  return (
    <div>
      <PageHeader title="Search" back />
      <Input type="search" aria-label="Search logs, notes and care guides" value={text} onChange={e => setText(e.target.value)} placeholder="vomiting, Luna, eye drops, tuna…" autoFocus />
      <div className="mt-3 space-y-4">
        {!ready ? null
          : r.isLoading ? <Spinner />
          : r.error ? <ErrorNote message={friendlyError(r.error)} />
          : nothing ? <EmptyState icon={G.search} title="No matches" />
          : null}
        {ready && !!r.data?.length && (
          <section>
            <SectionTitle>Your records</SectionTitle>
            <Card className="divide-y divide-stone-100 p-0">
              {r.data.map(h => (
                <Link key={h.kind + h.id} to={h.cat_id ? `/cats/${h.cat_id}/timeline` : '/timeline'} className="flex items-start gap-3 px-4 py-2.5 active:bg-stone-50">
                  <CareTile kind={h.kind} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{h.title}</div>
                    <div className="line-clamp-2 text-xs text-stone-500">{h.snippet}</div>
                    <div className="text-[11px] text-stone-500">{catName(h.cat_id) ?? 'Household'} · {dateLabel(h.occurred_at)}</div>
                  </div>
                </Link>
              ))}
            </Card>
          </section>
        )}
        {guides.length > 0 && (
          <section>
            <SectionTitle>Care guides</SectionTitle>
            <Card className="divide-y divide-stone-100 p-0">
              {guides.map(a => {
                const t = TOPIC[a.category] ?? TOPIC.health
                return (
                  <Link key={a.slug} to={`/learn/${a.slug}`} className="flex items-start gap-3 px-4 py-2.5 active:bg-stone-50">
                    <IconTile icon={t.icon} tone={t.tone} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{a.title}</div>
                      <div className="line-clamp-2 text-xs text-stone-500">{a.summary}</div>
                    </div>
                  </Link>
                )
              })}
            </Card>
          </section>
        )}
      </div>
    </div>
  )
}
