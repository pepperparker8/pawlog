import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, G } from '../../components/icons'
import { useHousehold } from '../../household/HouseholdProvider'
import { Button, EmptyState, Spinner, cx } from '../../components/ui'
import { PageHeader } from '../../components/layout/PageHeader'
import { useCatSummaries } from './api'
import { CatTile } from '../dashboard/HomePage'

export function CatsPage() {
  const { current, canEdit } = useHousehold()
  const [showArchived, setShowArchived] = useState(false)
  const cats = useCatSummaries(current!.id, true)
  if (cats.isLoading) return <Spinner />
  const active = cats.data?.filter(c => !c.archived_at) ?? []
  const archived = cats.data?.filter(c => c.archived_at) ?? []
  return (
    <div>
      <PageHeader title="Cats" subtitle={`${active.length} in ${current!.name}`}
        action={canEdit && <Link to="/cats/new"><Button className="px-3"><Plus className="h-4 w-4" />Add</Button></Link>} />
      {active.length === 0 ? (
        <EmptyState icon={G.cat} title="No cats yet" action={canEdit && <Link to="/cats/new"><Button>Add a cat</Button></Link>} />
      ) : (
        <div className="grid grid-cols-2 gap-3">{active.map(c => <CatTile key={c.cat_id} cat={c} />)}</div>
      )}
      {archived.length > 0 && (
        <div className="mt-6">
          <button onClick={() => setShowArchived(s => !s)} className="text-sm text-stone-500 underline">{showArchived ? 'Hide' : 'Show'} archived ({archived.length})</button>
          <div className={cx('mt-3 grid grid-cols-2 gap-3 opacity-70', !showArchived && 'hidden')}>{archived.map(c => <CatTile key={c.cat_id} cat={c} />)}</div>
        </div>
      )}
    </div>
  )
}
