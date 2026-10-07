import { useState } from 'react'
import { useHousehold } from '../../household/HouseholdProvider'
import { Select } from '../../components/ui'
import { PageHeader } from '../../components/layout/PageHeader'
import { useCatSummaries } from '../cats/api'
import { PhotoGrid } from './PhotoGrid'

export function PhotosPage() {
  const { current } = useHousehold()
  const cats = useCatSummaries(current!.id, true)
  const [cat, setCat] = useState('')
  return (
    <div>
      <PageHeader title="Photo memories" back="/more" />
      <Select value={cat} onChange={e => setCat(e.target.value)} className="mb-3"><option value="">All cats (pick one to upload)</option>{cats.data?.map(c => <option key={c.cat_id} value={c.cat_id}>{c.name}</option>)}</Select>
      <PhotoGrid catId={cat || undefined} />
    </div>
  )
}
