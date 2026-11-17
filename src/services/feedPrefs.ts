import { supabase } from '@/lib/supabase'
import { PROFILE_LITE } from '@/lib/api'
import type { ProfileLite } from '@/types/db'

function missing(err: { message?: string; code?: string } | null): boolean {
  return !!err && (err.code === 'PGRST205' || err.code === '42P01' || /could not find the table|does not exist|schema cache/i.test(err.message ?? ''))
}

export interface FeedFilters { hidden: Set<string>; snoozed: Set<string> }
let cache: { at: number; userId: string; value: FeedFilters } | null = null
export const invalidateFeedFilters = () => { cache = null }

/** Posts the person hid and accounts they snoozed. Empty sets when the tables are not installed yet. */
export async function getFeedFilters(userId: string): Promise<FeedFilters> {
  if (cache && cache.userId === userId && Date.now() - cache.at < 30000) return cache.value
  const value: FeedFilters = { hidden: new Set(), snoozed: new Set() }
  try {
    const h = await supabase.from('hidden_posts').select('post_id').eq('user_id', userId).limit(2000)
    if (!h.error) (h.data ?? []).forEach((r) => value.hidden.add((r as { post_id: string }).post_id))
    const s = await supabase.from('snoozed_accounts').select('target_id').eq('user_id', userId).gt('until', new Date().toISOString())
    if (!s.error) (s.data ?? []).forEach((r) => value.snoozed.add((r as { target_id: string }).target_id))
  } catch { /* ignore: show everything */ }
  cache = { at: Date.now(), userId, value }
  return value
}

export async function hidePost(postId: string): Promise<void> {
  const { error } = await supabase.from('hidden_posts').insert({ post_id: postId })
  if (error && error.code !== '23505') throw new Error(missing(error) ? 'This will be available after the next database update.' : error.message)
  invalidateFeedFilters()
}
export async function unhidePost(userId: string, postId: string): Promise<void> {
  const { error } = await supabase.from('hidden_posts').delete().eq('user_id', userId).eq('post_id', postId)
  if (error) throw new Error(error.message)
  invalidateFeedFilters()
}
export interface HiddenPostRow { post_id: string; created_at: string; post: { id: string; content: string; author: ProfileLite | null } | null }
export async function listHiddenPosts(userId: string): Promise<HiddenPostRow[] | null> {
  const res = await supabase.from('hidden_posts').select(`post_id, created_at, post:posts(id, content, author:profiles!author_id(${PROFILE_LITE}))`)
    .eq('user_id', userId).order('created_at', { ascending: false }).limit(100)
  if (missing(res.error)) return null
  if (res.error) throw new Error(res.error.message)
  return (res.data ?? []) as unknown as HiddenPostRow[]
}

export async function snoozeAccount(targetId: string, days = 30): Promise<void> {
  const until = new Date(Date.now() + days * 86400000).toISOString()
  const { error } = await supabase.from('snoozed_accounts').upsert({ target_id: targetId, until }, { onConflict: 'user_id,target_id' })
  if (error) throw new Error(missing(error) ? 'This will be available after the next database update.' : error.message)
  invalidateFeedFilters()
}
export async function unsnoozeAccount(userId: string, targetId: string): Promise<void> {
  const { error } = await supabase.from('snoozed_accounts').delete().eq('user_id', userId).eq('target_id', targetId)
  if (error) throw new Error(error.message)
  invalidateFeedFilters()
}
export interface SnoozedRow { target_id: string; until: string; target: ProfileLite | null }
export async function listSnoozed(userId: string): Promise<SnoozedRow[] | null> {
  const res = await supabase.from('snoozed_accounts').select(`target_id, until, target:profiles!target_id(${PROFILE_LITE})`)
    .eq('user_id', userId).gt('until', new Date().toISOString()).order('until', { ascending: true })
  if (missing(res.error)) return null
  if (res.error) throw new Error(res.error.message)
  return (res.data ?? []) as unknown as SnoozedRow[]
}
