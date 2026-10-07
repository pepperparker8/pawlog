import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useHousehold } from '../../household/HouseholdProvider'
import { Card, EmptyState, Input, Spinner } from '../../components/ui'
import { PageHeader } from '../../components/layout/PageHeader'
import { supabase } from '../../lib/supabase'
import { keys } from '../../lib/queryClient'
import { dateLabel } from '../../lib/format'
import { KIND_META } from '../timeline/api'
import { useCatSummaries } from '../cats/api'
import type { SearchHit, TimelineKind } from '../../lib/types'

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
  const cats = useCatSummaries(hid, true)
  const catName = (id: string | null) => cats.data?.find(c => c.cat_id === id)?.name
  return (
    <div>
      <PageHeader title="Search" back="/more" />
      <Input value={text} onChange={e => setText(e.target.value)} placeholder="vomiting, Luna, eye drops, tuna…" autoFocus />
      <div className="mt-3">
        {q.trim().length < 2 ? <p className="text-center text-sm text-stone-400">Type at least two characters.</p>
          : r.isLoading ? <Spinner /> : !r.data?.length ? <EmptyState emoji="🔍" title="No matches" body="Try a symptom, a food, a cat's name or a note." />
          : (
            <Card className="divide-y divide-stone-100 p-0">
              {r.data.map(h => (
                <Link key={h.kind + h.id} to={h.cat_id ? `/cats/${h.cat_id}/timeline` : '/timeline'} className="flex items-start gap-3 px-4 py-2.5">
                  <span>{KIND_META[h.kind as TimelineKind]?.emoji ?? '•'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{h.title}</div>
                    <div className="line-clamp-2 text-xs text-stone-500">{h.snippet}</div>
                    <div className="text-[11px] text-stone-400">{catName(h.cat_id) ?? 'Household'} · {dateLabel(h.occurred_at)}</div>
                  </div>
                </Link>
              ))}
            </Card>
          )}
      </div>
    </div>
  )
}
