import { Chip } from '../../components/ui'
import type { RangeStatus } from './status'

const LABEL: Record<RangeStatus, string> = { low: 'Low', high: 'High', in: 'In range', none: 'No range' }

export function StatusChip({ status }: { status: RangeStatus }) {
  return <Chip className="whitespace-nowrap" tone={status === 'in' ? 'ok' : status === 'none' ? 'neutral' : 'warn'}>{LABEL[status]}</Chip>
}
