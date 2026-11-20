import { supabase } from '@/lib/supabase'
import { PROFILE_LITE } from '@/lib/api'
import type { ProfileLite } from '@/types/db'

export async function listRestricted(me: string): Promise<ProfileLite[]> {
  const { data, error } = await supabase.from('restricted_accounts').select(`created_at, p:profiles!restricted_id(${PROFILE_LITE})`).eq('user_id', me).order('created_at', { ascending: false }).limit(200)
  if (error) throw new Error(error.message)
  return ((data ?? []) as unknown as { p: ProfileLite | null }[]).map((r) => r.p).filter((p): p is ProfileLite => !!p)
}
export async function isRestricted(me: string, other: string): Promise<boolean> {
  const { count } = await supabase.from('restricted_accounts').select('restricted_id', { count: 'exact', head: true }).eq('user_id', me).eq('restricted_id', other)
  return (count ?? 0) > 0
}
export async function restrictUser(other: string): Promise<void> {
  const { error } = await supabase.from('restricted_accounts').insert({ restricted_id: other })
  if (error && error.code !== '23505') throw new Error(error.message)
}
export async function unrestrictUser(me: string, other: string): Promise<void> {
  const { error } = await supabase.from('restricted_accounts').delete().eq('user_id', me).eq('restricted_id', other)
  if (error) throw new Error(error.message)
}

export const DISAPPEAR_OPTIONS: { secs: number | null; label: string }[] = [
  { secs: null, label: 'Off' }, { secs: 86400, label: '24 hours' }, { secs: 604800, label: '7 days' }, { secs: 7776000, label: '90 days' },
]
export async function getChatDisappear(chatId: string): Promise<number | null> {
  const { data } = await supabase.rpc('get_chat_disappear', { p_chat: chatId })
  return typeof data === 'number' ? data : null
}
export async function setChatDisappear(chatId: string, secs: number | null): Promise<void> {
  const { error } = await supabase.rpc('set_chat_disappear', { p_chat: chatId, p_secs: secs })
  if (error) throw new Error(error.message)
}
