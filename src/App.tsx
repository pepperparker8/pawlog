import { useEffect, useState, type FormEvent } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { HouseholdProvider, useHousehold } from './household/HouseholdProvider'
import { ToastProvider, useToast } from './components/ui/Toast'
import { AppShell } from './components/layout/AppShell'
import { Button, EmptyState, ErrorNote, Field, Input, Spinner } from './components/ui'
import { LoginPage } from './pages/LoginPage'
import { MorePage } from './pages/MorePage'
import { HomePage } from './features/dashboard/HomePage'
import { CatsPage } from './features/cats/CatsPage'
import { CatForm } from './features/cats/CatForm'
import { CatProfilePage } from './features/cats/CatProfilePage'
import { TimelinePage } from './features/timeline/TimelinePage'
import { CarePage } from './features/care/CarePage'
import { FoodsPage } from './features/care/FoodsPage'
import { PhotosPage } from './features/photos/PhotosPage'
import { HouseholdPage } from './features/household/HouseholdPage'
import { InvitePage } from './features/household/InvitePage'
import { AchievementsPage } from './features/gamification/AchievementsPage'
import { NotificationsPage } from './features/notifications/NotificationsPage'
import { SearchPage } from './features/search/SearchPage'
import { VetSummaryPage } from './features/vet/VetSummaryPage'
import { ArticlePage, LearnPage } from './features/learn/LearnPage'
import { useRealtime } from './features/notifications/api'
import { startQueueSync } from './lib/offlineQueue'
import { useCreateHousehold } from './features/household/api'
import { friendlyError } from './lib/errors'
import { rememberReturnPath, takeReturnPath } from './lib/appUrl'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Routes>
              <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
              <Route element={<Protected />}>
                <Route path="/invite/:token" element={<InvitePage />} />
                <Route element={<WithHousehold />}>
                  <Route element={<AppShell />}>
                    <Route index element={<HomePage />} />
                    <Route path="cats" element={<CatsPage />} />
                    <Route path="cats/new" element={<CatForm />} />
                    <Route path="cats/:id/edit" element={<CatForm />} />
                    <Route path="cats/:id/*" element={<CatProfilePage />} />
                    <Route path="timeline" element={<TimelinePage />} />
                    <Route path="more" element={<MorePage />} />
                    <Route path="more/achievements" element={<AchievementsPage />} />
                    <Route path="more/care" element={<CarePage />} />
                    <Route path="more/foods" element={<FoodsPage />} />
                    <Route path="more/photos" element={<PhotosPage />} />
                    <Route path="more/household" element={<HouseholdPage />} />
                    <Route path="more/notifications" element={<NotificationsPage />} />
                    <Route path="more/search" element={<SearchPage />} />
                    <Route path="more/vet-summary" element={<VetSummaryPage />} />
                    <Route path="learn" element={<LearnPage />} />
                    <Route path="learn/:slug" element={<ArticlePage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner className="py-32" />
  return user ? <Navigate to={takeReturnPath()} replace /> : <>{children}</>
}

function Protected() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Spinner className="py-32" />
  if (!user) { rememberReturnPath(location.pathname); return <Navigate to="/login" replace /> }
  return <HouseholdProvider><Outlet /></HouseholdProvider>
}

function WithHousehold() {
  const { user } = useAuth()
  const { current, loading } = useHousehold()
  const toast = useToast()
  useRealtime(current?.id ?? null, user?.id ?? null)
  useEffect(() => startQueueSync(n => toast.show(`Synced ${n} offline log${n > 1 ? 's' : ''}`, 'ok')), [toast])
  if (loading) return <Spinner className="py-32" />
  if (!current) return <CreateFirstHousehold />
  return <Outlet />
}

function CreateFirstHousehold() {
  const create = useCreateHousehold()
  const { refresh, switchTo } = useHousehold()
  const [name, setName] = useState('My Cat Family')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(null)
    try { const h = await create.mutateAsync(name.trim() || 'My Cat Family'); await refresh(); switchTo(h.id) } catch (err) { setError(friendlyError(err)) } finally { setBusy(false) }
  }
  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <EmptyState emoji="🏠" title="Name your household" body="A household is the shared space for your cats and the people who care for them." />
      <form onSubmit={submit} className="space-y-3">
        <Field label="Household name"><Input value={name} onChange={e => setName(e.target.value)} autoFocus /></Field>
        <ErrorNote message={error} />
        <Button type="submit" className="w-full" loading={busy}>Continue</Button>
      </form>
    </div>
  )
}
