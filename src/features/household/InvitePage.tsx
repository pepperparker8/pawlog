import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useHousehold } from '../../household/HouseholdProvider'
import { Button, EmptyState, Spinner } from '../../components/ui'
import { friendlyError } from '../../lib/errors'
import { useAcceptInvite } from './api'

export function InvitePage() {
  const { token = '' } = useParams()
  const nav = useNavigate()
  const { switchTo, refresh } = useHousehold()
  const accept = useAcceptInvite()
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    accept.mutateAsync(token).then(async h => { await refresh(); switchTo(h.id); nav('/', { replace: true }) }).catch(e => setError(friendlyError(e)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])
  if (error) return <EmptyState emoji="🔗" title="Invite not accepted" body={error} action={<Button variant="secondary" onClick={() => nav('/')}>Go home</Button>} />
  return <Spinner />
}
