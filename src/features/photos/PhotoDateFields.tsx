import { Field, Input, Select, cx } from '../../components/ui'
import { todayInput } from '../../lib/format'
import { AGE_CHOICES, choiceFor, dateForAge } from './age'

/** Date taken and age at that date. Picking an age sets the date from the birth date. */
export function PhotoDateFields({ day, onDay, dob, estimate, className }: {
  day: string; onDay: (day: string) => void; dob: string | null; estimate?: boolean; className?: string
}) {
  const today = todayInput()
  const choice = dob && day ? choiceFor(dob, day) : null
  const choices = dob ? AGE_CHOICES.filter(c => dateForAge(dob, c.months) <= today) : []
  return (
    <div className={cx('grid gap-2', dob ? 'grid-cols-[3fr_2fr]' : 'grid-cols-1', className)}>
      <Field label="Taken">
        <Input type="date" value={day} max={today} required onChange={e => e.target.value && onDay(e.target.value)} className="min-w-0 px-2.5" />
      </Field>
      {dob && (
        <Field label={estimate ? 'Age (est.)' : 'Age'}>
          <Select value={choice ?? ''} onChange={e => e.target.value !== '' && onDay(dateForAge(dob, Number(e.target.value)))} className="min-w-0 px-2.5">
            {choice == null && <option value="">Before birth</option>}
            {choices.map(c => <option key={c.months} value={c.months}>{c.label}</option>)}
          </Select>
        </Field>
      )}
    </div>
  )
}
