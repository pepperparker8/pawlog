import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { Button, ErrorNote, Field, Input } from '../components/ui'
import { friendlyError } from '../lib/errors'
import { supabaseConfigured } from '../lib/supabase'

type Mode = 'signin' | 'signup' | 'magic'

export function LoginPage() {
  const { signIn, signUp, signInWithMagicLink } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(null); setInfo(null)
    try {
      if (mode === 'signin') await signIn(email, password)
      else if (mode === 'signup') {
        const r = await signUp(email, password, name || email.split('@')[0])
        if (r.needsConfirm) setInfo('Check your inbox to confirm your email, then sign in.')
      } else { await signInWithMagicLink(email); setInfo('Magic link sent. Open it on this device.') }
    } catch (err) { setError(friendlyError(err)) } finally { setBusy(false) }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-sm flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <div className="text-6xl">🐾</div>
        <h1 className="mt-2 text-3xl font-black text-paw-600">PawLog</h1>
        <p className="text-sm text-stone-500">Every cat. Every day. One shared log.</p>
      </div>
      {!supabaseConfigured && <ErrorNote message="Supabase is not configured. Copy .env.example to .env and fill in the keys." />}
      <form onSubmit={submit} className="space-y-3">
        {mode === 'signup' && (
          <Field label="Your name"><Input value={name} onChange={e => setName(e.target.value)} placeholder="Cat parent" autoComplete="name" /></Field>
        )}
        <Field label="Email"><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" inputMode="email" /></Field>
        {mode !== 'magic' && (
          <Field label="Password"><Input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} /></Field>
        )}
        <ErrorNote message={error} />
        {info && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</p>}
        <Button type="submit" loading={busy} className="w-full">
          {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send magic link'}
        </Button>
      </form>
      <div className="mt-6 flex flex-col gap-2 text-center text-sm text-stone-600">
        {mode !== 'signin' && <button onClick={() => setMode('signin')} className="underline">Have an account? Sign in</button>}
        {mode !== 'signup' && <button onClick={() => setMode('signup')} className="underline">New here? Create an account</button>}
        {mode !== 'magic' && <button onClick={() => setMode('magic')} className="underline">Email me a magic link</button>}
      </div>
    </div>
  )
}
