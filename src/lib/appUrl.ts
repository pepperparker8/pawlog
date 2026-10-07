// Absolute URL inside the app, respecting the deploy base (e.g. /pawlog/ on GitHub Pages).
export function appUrl(path = ''): string {
  return new URL(import.meta.env.BASE_URL + path.replace(/^\//, ''), window.location.origin).toString()
}

const RETURN_KEY = 'pawlog-return-to'

// Remember where a signed-out visitor was heading (e.g. an invite link) so sign-in can resume there.
export function rememberReturnPath(path: string) {
  try { if (path && path !== '/' && path !== '/login') localStorage.setItem(RETURN_KEY, path) } catch { /* storage unavailable */ }
}

export function takeReturnPath(): string {
  try {
    const p = localStorage.getItem(RETURN_KEY)
    localStorage.removeItem(RETURN_KEY)
    return p ?? '/'
  } catch { return '/' }
}
