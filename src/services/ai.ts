import { supabase } from '@/lib/supabase'

export interface AiMessage { role: 'user' | 'assistant'; text: string }

export type AiResult = { ok: true; reply: string } | { ok: false; reason: 'not_configured' | 'limit' | 'busy' | 'network' | 'error' }

/** Asks Hmm AI (Edge Function ai-chat). The AI key lives only on the server. */
export async function askAi(messages: AiMessage[]): Promise<AiResult> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-chat', { body: { messages } })
    if (error) {
      const status = (error as { context?: { status?: number } }).context?.status
      if (status === 503) return { ok: false, reason: 'not_configured' }
      if (status === 404) return { ok: false, reason: 'not_configured' }
      if (status === 429) {
        let kind = ''
        try { kind = ((await (error as { context: Response }).context.json()) as { error?: string }).error ?? '' } catch { /* ignore */ }
        return { ok: false, reason: kind === 'busy' ? 'busy' : 'limit' }
      }
      return { ok: false, reason: 'error' }
    }
    const reply = (data as { reply?: string } | null)?.reply
    return reply ? { ok: true, reply } : { ok: false, reason: 'error' }
  } catch {
    return { ok: false, reason: 'network' }
  }
}
