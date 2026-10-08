import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, gcTime: 10 * 60_000, retry: 1, refetchOnWindowFocus: true },
    mutations: { retry: 0 },
  },
})

export const keys = {
  household: (hid: string) => ['household', hid] as const,
  members: (hid: string) => ['members', hid] as const,
  cats: (hid: string) => ['cats', hid] as const,
  catSummaries: (hid: string) => ['cat-summaries', hid] as const,
  cat: (id: string) => ['cat', id] as const,
  timeline: (hid: string, filters: unknown) => ['timeline', hid, filters] as const,
  today: (hid: string) => ['today', hid] as const,
  patterns: (hid: string) => ['patterns', hid] as const,
  quests: (hid: string) => ['quests', hid] as const,
  weeklyQuests: (hid: string) => ['weekly-quests', hid] as const,
  rhythm: (hid: string) => ['rhythm', hid] as const,
  stats: (uid: string) => ['stats', uid] as const,
  householdStats: (hid: string) => ['household-stats', hid] as const,
  badges: () => ['badges'] as const,
  userBadges: (uid: string) => ['user-badges', uid] as const,
  levels: () => ['levels'] as const,
  xpRules: () => ['xp-rules'] as const,
  xpRecent: (hid: string) => ['xp-recent', hid] as const,
  weights: (catId: string) => ['weights', catId] as const,
  weightWeekly: (catId: string) => ['weight-weekly', catId] as const,
  photos: (hid: string, catId?: string) => ['photos', hid, catId ?? 'all'] as const,
  careTasks: (hid: string) => ['care-tasks', hid] as const,
  health: (catId: string) => ['health', catId] as const,
  foods: (hid: string) => ['foods', hid] as const,
  notifications: (uid: string) => ['notifications', uid] as const,
  onThisDay: (hid: string) => ['on-this-day', hid] as const,
  milestones: (catId: string) => ['milestones', catId] as const,
  search: (hid: string, q: string) => ['search', hid, q] as const,
  breeds: () => ['breeds'] as const,
  targets: (catId: string) => ['targets', catId] as const,
  tips: () => ['tips'] as const,
  articles: () => ['articles'] as const,
}

/** Cat-scoped caches are keyed by cat id, so they are refreshed alongside the household. */
const CAT_SCOPED = new Set(['cat', 'health', 'weights', 'weight-weekly', 'milestones', 'targets'])
export function invalidateHousehold(hid: string) {
  void queryClient.invalidateQueries({ predicate: q => CAT_SCOPED.has(String(q.queryKey[0])) || JSON.stringify(q.queryKey).includes(hid) })
}
