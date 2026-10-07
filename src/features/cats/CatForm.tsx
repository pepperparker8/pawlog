import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useHousehold } from '../../household/HouseholdProvider'
import { Button, ErrorNote, Field, Input, Select, Spinner, Textarea } from '../../components/ui'
import { PageHeader } from '../../components/layout/PageHeader'
import { useToast } from '../../components/ui/Toast'
import { friendlyError } from '../../lib/errors'
import { useArchiveCat, useCat, useSaveCat, type CatInput } from './api'
import { uploadPhoto } from '../photos/api'
import { invalidateHousehold } from '../../lib/queryClient'
import { Camera } from 'lucide-react'
import type { Cat } from '../../lib/types'

const EMPTY: CatInput = { name: '', nickname: '', breed: '', color: '', sex: 'unknown', date_of_birth: '', dob_is_estimate: false, adopted_on: '',
  microchip_id: '', neutered: null, blood_type: '', allergies: '', known_conditions: '', emergency_notes: '', vet_name: '', clinic_name: '', clinic_phone: '' }

export function CatForm() {
  const { id } = useParams()
  const nav = useNavigate()
  const { current, canEdit } = useHousehold()
  const existing = useCat(id)
  const save = useSaveCat(current!.id)
  const archive = useArchiveCat(current!.id)
  const toast = useToast()
  const [f, setF] = useState<CatInput>(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  useEffect(() => {
    if (!photo) { setPreview(null); return }
    const url = URL.createObjectURL(photo); setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])
  useEffect(() => { if (existing.data) setF(fromCat(existing.data)) }, [existing.data])
  const set = <K extends keyof CatInput>(k: K, v: CatInput[K]) => setF(s => ({ ...s, [k]: v }))

  if (!canEdit) return <p className="p-6 text-center text-sm text-stone-500">Viewers can't edit cats.</p>
  if (id && existing.isLoading) return <Spinner />

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(null)
    if (!f.name.trim()) { setError('A name is required.'); return }
    try {
      const cat = await save.mutateAsync({ ...f, id, name: f.name.trim() })
      if (photo) {
        setUploading(true)
        try { await uploadPhoto({ hid: current!.id, catId: cat.id, file: photo, setAsProfile: true }); invalidateHousehold(current!.id) }
        catch (err) { toast.show(`Photo not saved: ${friendlyError(err)}`, 'bad') }
        finally { setUploading(false) }
      }
      toast.show(id ? 'Saved' : `Welcome, ${cat.name}!`)
      nav(`/cats/${cat.id}`, { replace: true })
    } catch (err) { setError(friendlyError(err)) }
  }

  async function doArchive() {
    const isArchived = !!existing.data?.archived_at
    if (!confirm(isArchived ? 'Restore this cat?' : 'Archive this cat? Logs are kept and the cat can be restored later.')) return
    try { await archive.mutateAsync({ id: id!, archive: !isArchived }); toast.show(isArchived ? 'Restored' : 'Archived'); nav('/cats') } catch (err) { toast.show(friendlyError(err), 'bad') }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <PageHeader title={id ? `Edit ${existing.data?.name ?? ''}` : 'New cat'} back />
      {!id && (
        <label className="mx-auto flex w-fit cursor-pointer flex-col items-center gap-1.5 text-xs font-medium text-paw-700">
          {preview
            ? <img src={preview} alt="" className="h-24 w-24 rounded-full object-cover ring-4 ring-paw-100" />
            : <span className="grid h-24 w-24 place-items-center rounded-full border-2 border-dashed border-paw-300 bg-paw-50"><Camera className="h-7 w-7 text-paw-500" /></span>}
          {preview ? 'Change photo' : 'Add photo'}
          <input type="file" accept="image/*" className="sr-only" onChange={e => setPhoto(e.target.files?.[0] ?? null)} />
        </label>
      )}
      <section className="grid grid-cols-2 gap-3">
        <Field label="Name" className="col-span-2"><Input required value={f.name} onChange={e => set('name', e.target.value)} /></Field>
        <Field label="Nickname"><Input value={f.nickname ?? ''} onChange={e => set('nickname', e.target.value)} /></Field>
        <Field label="Sex"><Select value={f.sex} onChange={e => set('sex', e.target.value as Cat['sex'])}><option value="unknown">Unknown</option><option value="female">Female</option><option value="male">Male</option></Select></Field>
        <Field label="Breed"><Input value={f.breed ?? ''} onChange={e => set('breed', e.target.value)} placeholder="Domestic shorthair" /></Field>
        <Field label="Color"><Input value={f.color ?? ''} onChange={e => set('color', e.target.value)} placeholder="Orange tabby" /></Field>
        <Field label="Date of birth"><Input type="date" value={f.date_of_birth ?? ''} onChange={e => set('date_of_birth', e.target.value)} /></Field>
        <label className="flex items-end gap-2 pb-3 text-sm"><input type="checkbox" checked={!!f.dob_is_estimate} onChange={e => set('dob_is_estimate', e.target.checked)} /> Estimated</label>
        <Field label="Adopted on"><Input type="date" value={f.adopted_on ?? ''} onChange={e => set('adopted_on', e.target.value)} /></Field>
        <Field label="Neutered"><Select value={f.neutered == null ? '' : String(f.neutered)} onChange={e => set('neutered', e.target.value === '' ? null : e.target.value === 'true')}><option value="">Unknown</option><option value="true">Yes</option><option value="false">No</option></Select></Field>
      </section>
      <details className="rounded-2xl bg-white p-4 ring-1 ring-stone-100" open={!!id}>
        <summary className="cursor-pointer text-sm font-semibold">Passport & medical</summary>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Microchip ID"><Input value={f.microchip_id ?? ''} onChange={e => set('microchip_id', e.target.value)} /></Field>
          <Field label="Blood type"><Input value={f.blood_type ?? ''} onChange={e => set('blood_type', e.target.value)} placeholder="A / B / AB" /></Field>
          <Field label="Allergies" className="col-span-2"><Input value={f.allergies ?? ''} onChange={e => set('allergies', e.target.value)} /></Field>
          <Field label="Known conditions" className="col-span-2"><Textarea value={f.known_conditions ?? ''} onChange={e => set('known_conditions', e.target.value)} /></Field>
          <Field label="Emergency notes" className="col-span-2"><Textarea value={f.emergency_notes ?? ''} onChange={e => set('emergency_notes', e.target.value)} placeholder="Reacts badly to… / hides under the bed when scared" /></Field>
          <Field label="Vet"><Input value={f.vet_name ?? ''} onChange={e => set('vet_name', e.target.value)} /></Field>
          <Field label="Clinic"><Input value={f.clinic_name ?? ''} onChange={e => set('clinic_name', e.target.value)} /></Field>
          <Field label="Clinic phone" className="col-span-2"><Input type="tel" value={f.clinic_phone ?? ''} onChange={e => set('clinic_phone', e.target.value)} /></Field>
        </div>
      </details>
      <ErrorNote message={error} />
      <Button type="submit" loading={save.isPending || uploading} className="w-full">{id ? 'Save changes' : 'Add cat'}</Button>
      {id && <Button type="button" variant="ghost" className="w-full text-stone-500" loading={archive.isPending} onClick={doArchive}>{existing.data?.archived_at ? 'Restore cat' : 'Archive cat'}</Button>}
    </form>
  )
}

function fromCat(c: Cat): CatInput {
  const { id: _id, household_id: _h, created_at: _c, ...rest } = c
  return { ...EMPTY, ...Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, v ?? (k === 'neutered' ? null : '')])) } as CatInput
}
