import { useMutation, useQuery } from '@tanstack/react-query'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { subDays } from 'date-fns'
import { supabase } from '../../lib/supabase'
import { keys, queryClient } from '../../lib/queryClient'
import type { AskMessage, AskUrgency } from '../../lib/types'

export const URGENCY: Record<AskUrgency, { label: string; tone: 'ok' | 'neutral' | 'warn' | 'bad' }> = {
  none: { label: 'No urgent concern', tone: 'ok' },
  monitor: { label: 'Monitor at home', tone: 'neutral' },
  book: { label: 'Book a vet visit', tone: 'warn' },
  today: { label: 'See a vet today', tone: 'bad' },
  emergency: { label: 'Emergency', tone: 'bad' },
}

/** The `ask` function keeps 30 days; older rows are purged on the next question. */
const RETENTION_DAYS = 30

export function useAskMessages(catId: string) {
  return useQuery({
    queryKey: keys.ask(catId),
    queryFn: async () => {
      const { data, error } = await supabase.from('ask_messages')
        .select('id, household_id, cat_id, role, content, urgency, answer, red_flag, created_by, created_at')
        .eq('cat_id', catId).gte('created_at', subDays(new Date(), RETENTION_DAYS).toISOString())
        .order('created_at')
      if (error) throw error
      return data as unknown as AskMessage[]
    },
  })
}

/** The caller keeps `eventId` until the question is answered, so a retry after a dropped connection returns the saved answer. */
export function useAsk(catId: string) {
  return useMutation({
    mutationFn: async ({ question, eventId }: { question: string; eventId: string }) => {
      const { data, error } = await supabase.functions.invoke<{ reply: AskMessage }>('ask', {
        body: { cat_id: catId, question, client_event_id: eventId },
      })
      if (error instanceof FunctionsHttpError) {
        const body = await (error.context as Response).json().catch(() => null) as { error?: string } | null
        throw new Error(body?.error ?? 'No answer this time. Try again in a moment.')
      }
      if (error) throw error
      return data!.reply
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: keys.ask(catId) }),
  })
}

export function useClearAsk(catId: string) {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('ask_messages').delete().eq('cat_id', catId)
      if (error) throw error
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: keys.ask(catId) }),
  })
}

/** Owner only (households update policy). */
export function useSetAiEnabled(hid: string) {
  return useMutation({
    mutationFn: async (on: boolean) => {
      const { error } = await supabase.from('households').update({ ai_enabled: on }).eq('id', hid)
      if (error) throw error
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['memberships'] }),
  })
}
