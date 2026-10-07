import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import type { Household, HouseholdRole } from '../lib/types'

interface Membership { household: Household; role: HouseholdRole }
interface HouseholdCtx {
  memberships: Membership[]
  current: Household | null
  role: HouseholdRole | null
  canEdit: boolean
  isOwner: boolean
  loading: boolean
  switchTo: (id: string) => void
  refresh: () => Promise<unknown>
}

const Ctx = createContext<HouseholdCtx | null>(null)
const LS = 'pawlog.household'

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [currentId, setCurrentId] = useState<string | null>(() => localStorage.getItem(LS))

  const q = useQuery({
    queryKey: ['memberships', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Membership[]> => {
      const { data, error } = await supabase
        .from('household_members')
        .select('role, households(*)')
        .eq('user_id', user!.id)
        .order('joined_at')
      if (error) throw error
      return (data as unknown as Array<{ role: HouseholdRole; households: Household }>)
        .filter(r => r.households).map(r => ({ household: r.households, role: r.role }))
    },
  })

  const memberships = q.data ?? []
  useEffect(() => {
    if (!memberships.length) return
    if (!currentId || !memberships.some(m => m.household.id === currentId)) {
      setCurrentId(memberships[0].household.id)
    }
  }, [memberships, currentId])

  const value = useMemo<HouseholdCtx>(() => {
    const m = memberships.find(x => x.household.id === currentId) ?? null
    return {
      memberships,
      current: m?.household ?? null,
      role: m?.role ?? null,
      canEdit: m?.role === 'owner' || m?.role === 'caregiver',
      isOwner: m?.role === 'owner',
      loading: q.isLoading,
      switchTo: id => { localStorage.setItem(LS, id); setCurrentId(id) },
      refresh: () => q.refetch(),
    }
  }, [memberships, currentId, q])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useHousehold() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useHousehold outside HouseholdProvider')
  return c
}

/** Current household id; throws when used before a household is loaded. */
export function useHouseholdId(): string {
  const { current } = useHousehold()
  if (!current) throw new Error('no household')
  return current.id
}
