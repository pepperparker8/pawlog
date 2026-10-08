import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { untypedDb } from '../../lib/supabase'
import { keys } from '../../lib/queryClient'
import { useCat, useCatSummaries } from '../cats/api'
import { usePatterns } from '../timeline/api'
import { findBreed, useBreeds, useWeightStatus } from '../weight/api'
import { ageInMonths, lifeStageOf } from '../weight/status'
import type { CatSummary } from '../../lib/types'
import { catTriggers, pickTips, type CareTip, type CatProfile } from './engine'

export interface Article {
  slug: string; category: string; icon: string | null; title: string; summary: string; read_minutes: number
  body_md: string; urgent: boolean; sources: { name: string; url: string }[]; sort_order: number; reviewed: string
}

const HOUR = 60 * 60_000

export function useTips() {
  return useQuery({
    queryKey: keys.tips(),
    staleTime: HOUR,
    queryFn: async () => {
      const { data, error } = await untypedDb.from('care_tips').select('code, kind, topic, icon, title, body, audience, trigger, source, source_url, reviewed')
      if (error) throw error
      return data as CareTip[]
    },
  })
}

export function useArticles() {
  return useQuery({
    queryKey: keys.articles(),
    staleTime: HOUR,
    queryFn: async () => {
      const { data, error } = await untypedDb.from('knowledge_articles')
        .select('slug, category, icon, title, summary, read_minutes, body_md, urgent, sources, sort_order, reviewed')
        .order('sort_order').order('title')
      if (error) throw error
      return data as Article[]
    },
  })
}

export function useArticle(slug: string) {
  const all = useArticles()
  return { ...all, data: all.data?.find(a => a.slug === slug) ?? null }
}

const DISMISS_KEY = 'pawlog.tips.dismissed'
const DISMISS_DAYS = 30

function readDismissed(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(DISMISS_KEY) ?? '{}') as Record<string, string> } catch { return {} }
}

/** Dismissed tips stay hidden for a month on this device. */
export function useDismissedTips() {
  const [map, setMap] = useState(readDismissed)
  const active = useMemo(() => {
    const cutoff = Date.now() - DISMISS_DAYS * 86_400_000
    return new Set(Object.entries(map).filter(([, at]) => new Date(at).getTime() > cutoff).map(([code]) => code))
  }, [map])
  const dismiss = useCallback((code: string) => {
    setMap(prev => {
      const next = { ...prev, [code]: new Date().toISOString() }
      try { localStorage.setItem(DISMISS_KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
      return next
    })
  }, [])
  return { dismissed: active, dismiss }
}

function profileOf(s: Pick<CatSummary, 'cat_id' | 'date_of_birth' | 'sex'>, coat: CatProfile['coat'], breedCode: string | null, neutered: boolean | null): CatProfile {
  return { catId: s.cat_id, lifeStage: lifeStageOf(ageInMonths(s.date_of_birth)), coat, sex: s.sex, neutered, breedCode }
}

/** Hints, breed insight and a rotating fact for one cat, from its own logs. */
export function useCatTips(hid: string, catId: string, factOffset = 0) {
  const cat = useCat(catId)
  const summaries = useCatSummaries(hid)
  const patterns = usePatterns(hid)
  const tips = useTips()
  const { result: weight, breed } = useWeightStatus(catId)
  const { dismissed, dismiss } = useDismissedTips()
  const s = summaries.data?.find(x => x.cat_id === catId)
  const picked = useMemo(() => {
    if (!s || !tips.data) return null
    const profile = profileOf(s, breed?.coat ?? null, breed?.code ?? null, cat.data?.neutered ?? null)
    const triggers = catTriggers({ summary: s, createdAt: cat.data?.created_at, weight, patterns: patterns.data })
    return pickTips(tips.data, profile, triggers, { dismissed, factOffset })
  }, [s, tips.data, breed, cat.data, weight, patterns.data, dismissed, factOffset])
  return { picked, breed, dismiss, isLoading: tips.isLoading || summaries.isLoading }
}

/** One tip for the household home screen, from the first cat that has something to say. */
export function useHomeTip(hid: string) {
  const summaries = useCatSummaries(hid)
  const patterns = usePatterns(hid)
  const tips = useTips()
  const breeds = useBreeds()
  const { dismissed, dismiss } = useDismissedTips()
  const tip = useMemo(() => {
    if (!summaries.data?.length || !tips.data) return null
    let fallback: { tip: CareTip; cat: CatSummary } | null = null
    for (const s of summaries.data) {
      const b = findBreed(breeds.data, null, s.breed)
      const r = pickTips(tips.data, profileOf(s, b?.coat ?? null, b?.code ?? null, null), catTriggers({ summary: s, patterns: patterns.data }), { dismissed, maxHints: 1 })
      if (r.hints[0]) return { tip: r.hints[0], cat: s }
      const t = r.breedInsight ?? r.fact ?? r.tip
      if (!fallback && t) fallback = { tip: t, cat: s }
    }
    return fallback
  }, [summaries.data, tips.data, breeds.data, patterns.data, dismissed])
  return { tip, dismiss }
}
