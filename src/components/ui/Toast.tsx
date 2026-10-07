import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

interface Toast { id: number; text: string; tone: 'ok' | 'xp' | 'bad' }
const Ctx = createContext<{ show: (text: string, tone?: Toast['tone']) => void }>({ show: () => {} })

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  const show = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    const id = Date.now() + Math.random()
    setItems(t => [...t, { id, text, tone }])
    window.setTimeout(() => setItems(t => t.filter(x => x.id !== id)), tone === 'bad' ? 5000 : 2800)
  }, [])
  const value = useMemo(() => ({ show }), [show])
  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4">
        {items.map(t => (
          <div key={t.id} className={`animate-pop rounded-full px-4 py-2 text-sm font-semibold shadow-lg ${
            t.tone === 'xp' ? 'bg-paw-500 text-white' : t.tone === 'bad' ? 'bg-red-600 text-white' : 'bg-stone-800 text-white'}`}>
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export const useToast = () => useContext(Ctx)
