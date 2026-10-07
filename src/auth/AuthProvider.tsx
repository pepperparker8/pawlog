import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { queryClient } from '../lib/queryClient'
import { appUrl } from '../lib/appUrl'

interface AuthCtx {
  session: Session | null
  user: User | null
  loading: boolean
  sendCode: (email: string) => Promise<void>
  verifyCode: (email: string, token: string) => Promise<void>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (!s) queryClient.clear()
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthCtx>(() => ({
    session, user: session?.user ?? null, loading,
    // Passwordless: one email carries both a sign-in link and a code. New emails get an account.
    async sendCode(email) {
      const { error } = await supabase.auth.signInWithOtp({
        email, options: { emailRedirectTo: appUrl(), shouldCreateUser: true },
      })
      if (error) throw error
    },
    async verifyCode(email, token) {
      const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
      if (error) throw error
    },
    async signOut() { await supabase.auth.signOut() },
  }), [session, loading])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth outside AuthProvider')
  return c
}
