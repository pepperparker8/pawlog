import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export interface ToastAction { label: string; run: () => void }
interface Toast { id: number; text: string; tone: 'ok' | 'xp' | 'bad' | 'milestone'; action?: ToastAction }
const Ctx = createContext<{ show: (text: string, tone?: Toast['tone'], action?: ToastAction) => void }>({ show: () => {} })

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  const dismiss = useCallback((id: number) => setItems(t => t.filter(x => x.id !== id)), [])
  const show = useCallback((text: string, tone: Toast['tone'] = 'ok', action?: ToastAction) => {
    const id = Date.now() + Math.random()
    setItems(t => [...t, { id, text, tone, action }])
    window.setTimeout(() => dismiss(id), action ? 6000 : tone === 'bad' ? 5000 : tone === 'milestone' ? 4000 : 2800)
  }, [dismiss])
  const value = useMemo(() => ({ show }), [show])
  return (
    <Ctx.Provider value={value}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none safe-top fixed inset-x-0 z-[60] flex flex-col items-center gap-2 px-4">
        {items.map(t => (
          <div key={t.id} className={`flex max-w-sm items-center gap-3 rounded-2xl px-4 py-2 text-center text-sm font-semibold shadow-lg ${t.action ? 'pointer-events-auto' : ''} ${
            t.tone === 'milestone' ? 'animate-celebrate bg-white px-5 py-3 text-base text-stone-900 ring-1 ring-paw-200'
            : t.tone === 'xp' ? 'animate-pop bg-paw-500 text-white' : t.tone === 'bad' ? 'animate-pop bg-red-600 text-white' : 'animate-pop bg-stone-800 text-white'}`}>
            <span>{t.text}</span>
            {t.action && (
              <button type="button" onClick={() => { dismiss(t.id); t.action!.run() }}
                className="-my-1 -mr-2 rounded-xl bg-white/20 px-3 py-1.5 text-sm font-bold">{t.action.label}</button>
            )}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export const useToast = () => useContext(Ctx)
