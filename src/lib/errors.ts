// Map Postgres / PostgREST / Auth errors to copy a cat parent understands.
export function friendlyError(err: unknown): string {
  const e = err as { code?: string; message?: string; status?: number } | null
  const msg = e?.message ?? ''
  if (!e) return 'Something went wrong.'
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) return "You're offline. We saved it and will sync when you're back."
  if (e.code === '42501' || msg.includes('row-level security')) return "You don't have permission to do that in this household."
  if (e.code === '23505') return 'That was already saved.'
  if (e.code === '23514') return 'That value is out of range. Please check it.'
  if (e.code === '23503') return 'That item no longer exists.'
  if (msg.includes('Invalid login credentials')) return 'Wrong email or password.'
  if (msg.includes('Email not confirmed')) return 'Please confirm your email first. Check your inbox.'
  if (msg.includes('User already registered')) return 'That email already has an account. Try signing in.'
  if (msg.includes('Password should be')) return 'Password needs at least 6 characters.'
  if (msg.includes('rate limit')) return 'Too many tries. Please wait a moment.'
  if (msg.includes('invite not found')) return 'That invite link is invalid or expired.'
  if (msg.includes('cat does not belong')) return 'That cat belongs to a different household.'
  return msg || 'Something went wrong.'
}
