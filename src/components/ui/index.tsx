import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { Loader2, X } from 'lucide-react'

function cx(...c: Array<string | false | null | undefined>) { return c.filter(Boolean).join(' ') }

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
export function Button({ variant = 'primary', loading, className, children, ...rest }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none'
  const v = {
    primary: 'bg-paw-500 text-white hover:bg-paw-600 shadow-sm',
    secondary: 'bg-white text-stone-800 border border-stone-200 hover:bg-stone-50',
    ghost: 'text-stone-700 hover:bg-stone-100',
    danger: 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100',
  }[variant]
  return (
    <button className={cx(base, v, className)} disabled={loading || rest.disabled} {...rest}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-stone-500">{hint}</span>}
    </label>
  )
}

const control = 'w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-base text-stone-800 outline-none focus:border-paw-500 focus:ring-2 focus:ring-paw-100'
export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(control, className)} {...rest} />
}
export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(control, 'min-h-20', className)} {...rest} />
}
export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx(control, className)} {...rest}>{children}</select>
}

export function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={cx('rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-100', onClick && 'cursor-pointer active:bg-stone-50', className)}>
      {children}
    </div>
  )
}

export function Chip({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'ok' | 'warn' | 'bad' | 'brand'; className?: string }) {
  const t = {
    neutral: 'bg-stone-100 text-stone-700', ok: 'bg-emerald-50 text-emerald-700', warn: 'bg-amber-50 text-amber-700',
    bad: 'bg-red-50 text-red-700', brand: 'bg-paw-100 text-paw-700',
  }[tone]
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', t, className)}>{children}</span>
}

export function Spinner({ className }: { className?: string }) {
  return <div className={cx('flex justify-center py-10', className)}><Loader2 className="h-6 w-6 animate-spin text-paw-500" /></div>
}

export function ErrorNote({ message }: { message: string | null | undefined }) {
  if (!message) return null
  return <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>
}

export function EmptyState({ emoji = '🐾', title, body, action }: { emoji?: string; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <div className="text-5xl">{emoji}</div>
      <h3 className="text-base font-semibold text-stone-800">{title}</h3>
      {body && <p className="max-w-xs text-sm text-stone-500">{body}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="animate-pop relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-4 pb-8 shadow-xl sm:max-w-lg sm:rounded-3xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-stone-100" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">{children}</h2>
      {action}
    </div>
  )
}

export function Avatar({ name, src, size = 48 }: { name: string; src?: string | null; size?: number }) {
  const s = { width: size, height: size, fontSize: size / 2.6 }
  if (src) return <img src={src} alt={name} style={s} className="shrink-0 rounded-full object-cover ring-2 ring-white" loading="lazy" />
  return (
    <div style={s} className="flex shrink-0 items-center justify-center rounded-full bg-paw-100 font-bold text-paw-700 ring-2 ring-white">
      {name.slice(0, 1).toUpperCase()}
    </div>
  )
}

export function ProgressBar({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className={cx('h-2 w-full overflow-hidden rounded-full bg-stone-100', className)}>
      <div className="h-full rounded-full bg-paw-500 transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

export { cx }
