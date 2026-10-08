import { useState, type FormEvent } from 'react'
import { Copy, Plus, Trash } from '../../components/icons'
import { useAuth } from '../../auth/AuthProvider'
import { useHousehold } from '../../household/HouseholdProvider'
import { Avatar, Button, Card, Chip, ErrorNote, Field, Input, SectionTitle, Select, Sheet, Spinner } from '../../components/ui'
import { PageHeader } from '../../components/layout/PageHeader'
import { useToast } from '../../components/ui/Toast'
import { friendlyError } from '../../lib/errors'
import { useCreateHousehold, useCreateInvite, useInvites, useMembers, useRemoveMember, useRenameHousehold, useSeedDemo, useUpdateMemberRole } from './api'
import type { HouseholdRole } from '../../lib/types'
import { appUrl } from '../../lib/appUrl'

const ROLE_HELP: Record<HouseholdRole, string> = { owner: 'Full control, manages members', caregiver: 'Logs and edits, no member management', viewer: 'Read-only' }

export function HouseholdPage() {
  const { user } = useAuth()
  const { current, isOwner, memberships, switchTo, refresh } = useHousehold()
  const hid = current!.id
  const members = useMembers(hid)
  const invites = useInvites(hid, isOwner)
  const createInvite = useCreateInvite(hid)
  const updateRole = useUpdateMemberRole(hid)
  const removeMember = useRemoveMember(hid)
  const rename = useRenameHousehold()
  const create = useCreateHousehold()
  const seed = useSeedDemo()
  const toast = useToast()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(false)
  const [name, setName] = useState(current!.name)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<HouseholdRole>('caregiver')
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inviteLink = (token: string) => appUrl(`invite/${token}`)

  async function copy(token: string) {
    try { await navigator.clipboard.writeText(inviteLink(token)); toast.show('Invite link copied') } catch { toast.show(inviteLink(token)) }
  }
  async function invite(e: FormEvent) {
    e.preventDefault(); setError(null)
    try { const r = await createInvite.mutateAsync({ email: email.trim().toLowerCase(), role }); setInviteOpen(false); setEmail(''); await copy(r.token) } catch (err) { setError(friendlyError(err)) }
  }
  async function createHousehold(e: FormEvent) {
    e.preventDefault(); setError(null)
    try { const h = await create.mutateAsync(newName.trim()); setNewOpen(false); setNewName(''); switchTo(h.id); toast.show(`${h.name} created`) } catch (err) { setError(friendlyError(err)) }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Household" back="/more" />
      <Card>
        <SectionTitle>Name</SectionTitle>
        <div className="flex gap-2">
          <Input value={name} onChange={e => setName(e.target.value)} disabled={!isOwner} />
          {isOwner && <Button variant="secondary" loading={rename.isPending} disabled={name.trim() === current!.name || !name.trim()}
            onClick={() => rename.mutateAsync({ id: hid, name: name.trim() }).then(() => toast.show('Renamed')).catch(e => toast.show(friendlyError(e), 'bad'))}>Save</Button>}
        </div>
      </Card>
      <section>
        <SectionTitle action={isOwner && <button onClick={() => setInviteOpen(true)} className="flex items-center gap-1 text-xs font-semibold text-paw-600"><Plus className="h-3 w-3" />Invite</button>}>Members</SectionTitle>
        {members.isLoading ? <Spinner /> : (
          <Card className="divide-y divide-stone-100 p-0">
            {members.data?.map(m => (
              <div key={m.user_id} className="flex items-center gap-3 px-4 py-2.5">
                <Avatar name={m.profiles?.display_name ?? '?'} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{m.profiles?.display_name ?? 'Member'}{m.user_id === user!.id && <span className="text-stone-400"> (you)</span>}</div>
                  <div className="text-xs text-stone-500">{ROLE_HELP[m.role]}</div>
                </div>
                {isOwner && m.user_id !== user!.id ? (
                  <>
                    <Select value={m.role} className="w-auto py-1 text-xs" onChange={e => updateRole.mutateAsync({ userId: m.user_id, role: e.target.value as HouseholdRole }).catch(err => toast.show(friendlyError(err), 'bad'))}>
                      <option value="owner">owner</option><option value="caregiver">caregiver</option><option value="viewer">viewer</option>
                    </Select>
                    <button onClick={() => confirm('Remove this member?') && removeMember.mutateAsync(m.user_id).catch(err => toast.show(friendlyError(err), 'bad'))} className="p-1 text-stone-300 hover:text-red-500" aria-label="Remove"><Trash className="h-4 w-4" /></button>
                  </>
                ) : <Chip tone={m.role === 'owner' ? 'brand' : 'neutral'}>{m.role}</Chip>}
              </div>
            ))}
          </Card>
        )}
      </section>
      {isOwner && invites.data && invites.data.length > 0 && (
        <section>
          <SectionTitle>Pending invites</SectionTitle>
          <Card className="divide-y divide-stone-100 p-0">
            {invites.data.map(i => (
              <div key={i.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <div className="min-w-0 flex-1"><div className="truncate">{i.email}</div><div className="text-xs text-stone-500">{i.role}</div></div>
                <button onClick={() => void copy(i.token)} className="flex items-center gap-1 text-xs text-paw-600"><Copy className="h-3 w-3" />Copy link</button>
              </div>
            ))}
          </Card>
        </section>
      )}
      <section>
        <SectionTitle>Your households</SectionTitle>
        <Card className="divide-y divide-stone-100 p-0">
          {memberships.map(m => (
            <button key={m.household.id} onClick={() => switchTo(m.household.id)} className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm">
              <span className={m.household.id === hid ? 'font-semibold' : ''}>{m.household.name}</span><Chip>{m.role}</Chip>
            </button>
          ))}
        </Card>
        <div className="mt-2 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setNewOpen(true)}>New household</Button>
          <Button variant="ghost" className="flex-1" loading={seed.isPending}
            onClick={() => seed.mutateAsync().then(async id => { await refresh(); switchTo(id); toast.show('Demo household ready') }).catch(e => toast.show(friendlyError(e), 'bad'))}>Load demo</Button>
        </div>
      </section>

      <Sheet open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite someone">
        <form onSubmit={invite} className="space-y-3">
          <Field label="Email"><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} autoFocus /></Field>
          <Field label="Role" hint={ROLE_HELP[role]}><Select value={role} onChange={e => setRole(e.target.value as HouseholdRole)}><option value="caregiver">Caregiver</option><option value="viewer">Viewer</option><option value="owner">Owner</option></Select></Field>
          <ErrorNote message={error} />
          <Button type="submit" className="w-full" loading={createInvite.isPending}>Create invite link</Button>
          <p className="text-xs text-stone-500">Share the link. They must sign in with the same email, then open it.</p>
        </form>
      </Sheet>
      <Sheet open={newOpen} onClose={() => setNewOpen(false)} title="New household">
        <form onSubmit={createHousehold} className="space-y-3">
          <Field label="Name"><Input required value={newName} onChange={e => setNewName(e.target.value)} placeholder="Grandma's cats" autoFocus /></Field>
          <ErrorNote message={error} />
          <Button type="submit" className="w-full" loading={create.isPending}>Create</Button>
        </form>
      </Sheet>
    </div>
  )
}
