import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

export function PageHeader({ title, subtitle, back, action }: { title: ReactNode; subtitle?: ReactNode; back?: boolean | string; action?: ReactNode }) {
  const nav = useNavigate()
  return (
    <header className="mb-4 flex items-center gap-3">
      {back && (
        <button onClick={() => (typeof back === 'string' ? nav(back) : nav(-1))} className="rounded-full p-2 hover:bg-stone-100" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-bold">{title}</h1>
        {subtitle && <p className="truncate text-sm text-stone-500">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}
