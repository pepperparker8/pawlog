import { useSyncExternalStore } from 'react'

// Device-local display preferences. Storage can be unavailable (private mode, blocked site data), so every access is guarded.
const XP_KEY = 'pawlog.xp'
const listeners = new Set<() => void>()
let fallback: boolean | null = null

export function readXpEnabled() {
  try { return localStorage.getItem(XP_KEY) === '1' } catch { return fallback ?? false }
}

export function setXpEnabled(on: boolean) {
  fallback = on
  try { localStorage.setItem(XP_KEY, on ? '1' : '0') } catch { /* the in-memory value lasts for this session */ }
  listeners.forEach(l => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  const onStorage = (e: StorageEvent) => { if (e.key === XP_KEY) l() }
  window.addEventListener('storage', onStorage)
  return () => { listeners.delete(l); window.removeEventListener('storage', onStorage) }
}

/** Levels, quests and XP are off unless turned on in More. */
export function useXpEnabled() {
  return useSyncExternalStore(subscribe, readXpEnabled, () => false)
}
