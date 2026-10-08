import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { Button, ErrorNote, Field, Input } from '../components/ui'
import { friendlyError } from '../lib/errors'
import { supabaseConfigured } from '../lib/supabase'
import { IconTile, G } from '../components/icons'

// Same flow as the email: tap the link on this device, or type the code it contains.
export function LoginPage() {
  const { sendCode, verifyCode } = useAuth()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send(e?: FormEvent) {
    e?.preventDefault(); setBusy(true); setError(null)
    try { await sendCode(email.trim().toLowerCase()); setStep('code'); setCode('') }
    catch (err) { setError(friendlyError(err)) } finally { setBusy(false) }
  }

  async function verify(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(null)
    try { await verifyCode(email.trim().toLowerCase(), code.trim()) }
    catch (err) { setError(friendlyError(err)) } finally { setBusy(false) }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-sm flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <IconTile icon={G.cat} tone="paw" size="xl" className="mx-auto" />
        <h1 className="mt-2 text-3xl font-black text-paw-600">PawLog</h1>
        <p className="text-sm text-stone-500">Every cat. Every day. One shared log.</p>
      </div>
      {!supabaseConfigured && <ErrorNote message="Supabase is not configured. Copy .env.example to .env and fill in the keys." />}
      {step === 'email' ? (
        <form onSubmit={send} className="space-y-3">
          <Field label="Email"><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" inputMode="email" autoFocus /></Field>
          <ErrorNote message={error} />
          <Button type="submit" loading={busy} className="w-full">Email me a sign-in link</Button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-3">
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            We sent an email to {email}. Tap the link in it on this device, or type the code from the email below.
          </p>
          <Field label="Code">
            <Input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} inputMode="numeric" autoComplete="one-time-code"
              minLength={6} maxLength={10} required autoFocus className="text-center text-2xl tracking-[0.4em]" />
          </Field>
          <ErrorNote message={error} />
          <Button type="submit" loading={busy} className="w-full">Sign in</Button>
          <div className="flex justify-between text-sm text-stone-600">
            <button type="button" onClick={() => { setStep('email'); setError(null) }} className="underline">Different email</button>
            <button type="button" onClick={() => send()} disabled={busy} className="underline">Send again</button>
          </div>
        </form>
      )}
    </div>
  )
}
