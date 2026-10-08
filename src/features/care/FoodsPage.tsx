import { useState, type FormEvent } from 'react'
import { Plus, Trash, G } from '../../components/icons'
import { useHousehold } from '../../household/HouseholdProvider'
import { Button, Card, Chip, EmptyState, ErrorNote, Field, Input, Select, Sheet, Spinner } from '../../components/ui'
import { PageHeader } from '../../components/layout/PageHeader'
import { useToast } from '../../components/ui/Toast'
import { friendlyError } from '../../lib/errors'
import { useDeleteFood, useFoods, useSaveFood } from './api'
import type { FoodProfile } from '../../lib/types'
import { FOOD_TYPES, foodType } from './foodTypes'

export function FoodsPage() {
  const { current, canEdit } = useHousehold()
  const foods = useFoods(current!.id)
  const [editing, setEditing] = useState<Partial<FoodProfile> | null>(null)
  return (
    <div>
      <PageHeader title="Food profiles" back="/more" action={canEdit && <Button className="px-3" onClick={() => setEditing({})}><Plus className="h-4 w-4" />Food</Button>} />
      {foods.isLoading ? <Spinner /> : !foods.data?.length ? (
        <EmptyState icon={G.feeding} title="No foods yet" action={canEdit && <Button onClick={() => setEditing({})}>Add food</Button>} />
      ) : (
        <Card className="divide-y divide-stone-100 p-0">
          {foods.data.map(f => (
            <button key={f.id} onClick={() => canEdit && setEditing(f)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left">
              <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{f.brand ? `${f.brand} ` : ''}{f.product}</div>
                <div className="text-xs text-stone-500">{f.kcal_per_100g ? `${f.kcal_per_100g} kcal/100 g` : ''}{f.serving_size_g ? ` · ${f.serving_size_g} g serving` : ''}</div></div>
              <Chip>{foodType(f.type).label}</Chip>
            </button>
          ))}
        </Card>
      )}
      {editing && <FoodSheet food={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function FoodSheet({ food, onClose }: { food: Partial<FoodProfile>; onClose: () => void }) {
  const { current } = useHousehold()
  const save = useSaveFood(current!.id)
  const del = useDeleteFood(current!.id)
  const toast = useToast()
  const [f, setF] = useState({ brand: food.brand ?? '', product: food.product ?? '', type: food.type ?? 'dry', kcal_per_100g: food.kcal_per_100g?.toString() ?? '', serving_size_g: food.serving_size_g?.toString() ?? '' })
  const [error, setError] = useState<string | null>(null)
  async function submit(e: FormEvent) {
    e.preventDefault(); setError(null)
    if (!f.product.trim()) { setError('Product name is required.'); return }
    try {
      await save.mutateAsync({ id: food.id, brand: f.brand || null, product: f.product.trim(), type: f.type, kcal_per_100g: f.kcal_per_100g ? Number(f.kcal_per_100g) : null, serving_size_g: f.serving_size_g ? Number(f.serving_size_g) : null })
      toast.show('Saved'); onClose()
    } catch (err) { setError(friendlyError(err)) }
  }
  async function remove() {
    if (!food.id || !confirm(`Delete ${f.product || 'this food'}?`)) return
    try { await del.mutateAsync(food.id); toast.show('Deleted'); onClose() } catch (err) { setError(friendlyError(err)) }
  }
  return (
    <Sheet open onClose={onClose} title={food.id ? 'Edit food' : 'New food'}>
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <Field label="Brand"><Input value={f.brand} onChange={e => setF(s => ({ ...s, brand: e.target.value }))} /></Field>
        <Field label="Type"><Select value={f.type} onChange={e => setF(s => ({ ...s, type: e.target.value }))}>{FOOD_TYPES.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}</Select></Field>
        <Field label="Product" className="col-span-2"><Input value={f.product} onChange={e => setF(s => ({ ...s, product: e.target.value }))} autoFocus /></Field>
        <Field label="kcal / 100 g"><Input type="number" inputMode="decimal" value={f.kcal_per_100g} onChange={e => setF(s => ({ ...s, kcal_per_100g: e.target.value }))} /></Field>
        <Field label="Serving (g)"><Input type="number" inputMode="decimal" value={f.serving_size_g} onChange={e => setF(s => ({ ...s, serving_size_g: e.target.value }))} /></Field>
        <ErrorNote message={error} />
        <Button type="submit" className={food.id ? '' : 'col-span-2'} loading={save.isPending}>Save</Button>
        {food.id && <Button type="button" variant="danger" loading={del.isPending} onClick={remove}><Trash className="h-4 w-4" />Delete</Button>}
      </form>
    </Sheet>
  )
}
