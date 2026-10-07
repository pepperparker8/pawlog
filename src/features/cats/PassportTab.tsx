import { Printer } from 'lucide-react'
import { Button, Card, SectionTitle } from '../../components/ui'
import { useCatHealth } from '../health/api'
import { catAge, dateLabel } from '../../lib/format'
import type { Cat } from '../../lib/types'

export function PassportTab({ cat }: { cat: Cat }) {
  const h = useCatHealth(cat.id)
  const rows: Array<[string, string | null | undefined]> = [
    ['Name', cat.name], ['Nickname', cat.nickname], ['Sex', cat.sex + (cat.neutered == null ? '' : cat.neutered ? ', neutered' : ', intact')],
    ['Breed', cat.breed], ['Color', cat.color], ['Born', cat.date_of_birth ? `${dateLabel(cat.date_of_birth)}${cat.dob_is_estimate ? ' (est.)' : ''} · ${catAge(cat.date_of_birth)}` : null],
    ['Adopted', cat.adopted_on ? dateLabel(cat.adopted_on) : null], ['Microchip', cat.microchip_id], ['Blood type', cat.blood_type],
    ['Allergies', cat.allergies], ['Known conditions', cat.known_conditions], ['Emergency notes', cat.emergency_notes],
    ['Vet', [cat.vet_name, cat.clinic_name, cat.clinic_phone].filter(Boolean).join(' · ')],
  ]
  return (
    <div className="space-y-4 print:space-y-2">
      <div className="flex justify-end print:hidden"><Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" />Print / save PDF</Button></div>
      <Card>
        <SectionTitle>Digital passport</SectionTitle>
        <dl className="divide-y divide-stone-100">
          {rows.filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="grid grid-cols-3 gap-2 py-1.5 text-sm"><dt className="text-stone-500">{k}</dt><dd className="col-span-2 whitespace-pre-wrap">{v}</dd></div>
          ))}
        </dl>
      </Card>
      <Card>
        <SectionTitle>Vaccinations</SectionTitle>
        {h.data?.vaccinations.length ? (
          <table className="w-full text-sm"><thead className="text-left text-xs text-stone-500"><tr><th>Vaccine</th><th>Given</th><th>Next due</th><th>Batch</th></tr></thead>
            <tbody>{h.data.vaccinations.map(v => <tr key={v.id} className="border-t border-stone-100"><td className="py-1">{v.vaccine_name}</td><td>{dateLabel(v.given_on)}</td><td>{dateLabel(v.next_due_on)}</td><td className="text-xs text-stone-500">{v.batch_no}</td></tr>)}</tbody></table>
        ) : <p className="text-sm text-stone-500">No vaccination records.</p>}
      </Card>
      <Card>
        <SectionTitle>Parasite prevention</SectionTitle>
        {h.data?.parasites.length ? (
          <table className="w-full text-sm"><thead className="text-left text-xs text-stone-500"><tr><th>Kind</th><th>Product</th><th>Given</th><th>Next</th></tr></thead>
            <tbody>{h.data.parasites.map(v => <tr key={v.id} className="border-t border-stone-100"><td className="py-1">{v.kind}</td><td>{v.product}</td><td>{dateLabel(v.given_on)}</td><td>{dateLabel(v.next_due_on)}</td></tr>)}</tbody></table>
        ) : <p className="text-sm text-stone-500">No treatments recorded.</p>}
      </Card>
      <Card>
        <SectionTitle>Medications</SectionTitle>
        {h.data?.medications.length ? h.data.medications.map(m => (
          <div key={m.id} className="border-t border-stone-100 py-1.5 text-sm first:border-0"><b>{m.name}</b> {m.dose} {m.frequency && `· ${m.frequency}`} {!m.active && <span className="text-xs text-stone-400">(ended)</span>}{m.reason && <div className="text-xs text-stone-500">{m.reason}</div>}</div>
        )) : <p className="text-sm text-stone-500">No medications.</p>}
      </Card>
      <p className="text-[11px] text-stone-400 print:block">Generated from PawLog on {dateLabel(new Date().toISOString())}. Owner-maintained records, not a veterinary document.</p>
    </div>
  )
}
