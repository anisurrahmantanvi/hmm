import { supabase } from '@/lib/supabase'
import { PROFILE_LITE } from '@/lib/api'
import type { ProfileLite } from '@/types/db'

function missing(err: { message?: string; code?: string } | null): boolean {
  return !!err && (err.code === 'PGRST205' || err.code === '42P01' || err.code === '42703' || err.code === 'PGRST202' || /could not find|does not exist|schema cache/i.test(err.message ?? ''))
}

export interface PageSettings {
  who_can_message: 'everyone' | 'followers' | 'nobody'
  allow_comments: boolean
  contact_email: string | null
  privacy_policy_url: string | null
  policy_text: string | null
}
export const DEFAULT_PAGE_SETTINGS: PageSettings = { who_can_message: 'everyone', allow_comments: true, contact_email: null, privacy_policy_url: null, policy_text: null }

/** installed=false means the database update for Page settings and messages has not been applied yet. */
export async function getPageSettings(pageId: string): Promise<{ settings: PageSettings; installed: boolean }> {
  const res = await supabase.from('pages').select('who_can_message, allow_comments, contact_email, privacy_policy_url, policy_text').eq('id', pageId).maybeSingle()
  if (missing(res.error)) return { settings: DEFAULT_PAGE_SETTINGS, installed: false }
  if (res.error) throw new Error(res.error.message)
  return { settings: { ...DEFAULT_PAGE_SETTINGS, ...((res.data ?? {}) as Partial<PageSettings>) }, installed: true }
}
export async function savePageSettings(pageId: string, patch: Partial<PageSettings>): Promise<void> {
  const { error } = await supabase.from('pages').update(patch).eq('id', pageId)
  if (error) throw new Error(missing(error) ? 'This will be available after the next database update.' : error.message)
}

// ---------- Page inbox ----------
export interface PageThread {
  id: string
  page_id: string
  last_message: string
  last_at: string
  page_unread: number
  user_unread: number
  user?: ProfileLite | null
}
export interface PageMessage { id: string; thread_id: string; from_page: boolean; sender_id: string | null; body: string; created_at: string }

/** Threads of a Page, for its team. null = not installed yet. */
export async function listPageThreads(pageId: string): Promise<PageThread[] | null> {
  const res = await supabase.from('page_threads').select(`id, page_id, last_message, last_at, page_unread, user_unread, user:profiles!user_id(${PROFILE_LITE})`)
    .eq('page_id', pageId).order('last_at', { ascending: false }).limit(100)
  if (missing(res.error)) return null
  if (res.error) throw new Error(res.error.message)
  return (res.data ?? []) as unknown as PageThread[]
}
export async function pageInboxUnread(pageId: string): Promise<number> {
  const res = await supabase.from('page_threads').select('page_unread').eq('page_id', pageId).gt('page_unread', 0)
  if (res.error) return 0
  return ((res.data ?? []) as { page_unread: number }[]).reduce((n, r) => n + r.page_unread, 0)
}
/** The visitor's own conversation with a Page, if there is one. */
export async function getMyThread(pageId: string, userId: string): Promise<PageThread | null> {
  const res = await supabase.from('page_threads').select('id, page_id, last_message, last_at, page_unread, user_unread').eq('page_id', pageId).eq('user_id', userId).maybeSingle()
  if (res.error) return null
  return (res.data as PageThread | null) ?? null
}
export async function getThread(threadId: string): Promise<PageThread | null> {
  const res = await supabase.from('page_threads').select(`id, page_id, last_message, last_at, page_unread, user_unread, user:profiles!user_id(${PROFILE_LITE})`).eq('id', threadId).maybeSingle()
  if (res.error) return null
  return (res.data as unknown as PageThread | null) ?? null
}
export async function listPageMessages(threadId: string): Promise<PageMessage[]> {
  const res = await supabase.from('page_messages').select('id, thread_id, from_page, sender_id, body, created_at').eq('thread_id', threadId).order('created_at', { ascending: true }).limit(300)
  if (res.error) throw new Error(res.error.message)
  return (res.data ?? []) as PageMessage[]
}
export async function sendPageMessage(args: { pageId: string; body: string; threadId?: string | null }): Promise<string> {
  const { data, error } = await supabase.rpc('send_page_message', { p_page: args.pageId, p_body: args.body, p_thread: args.threadId ?? null })
  if (error) throw new Error(missing(error) ? 'Page messages will be available after the next database update.' : error.message)
  return data as string
}
export async function markPageThreadRead(threadId: string): Promise<void> {
  await supabase.rpc('mark_page_thread_read', { p_thread: threadId })
}
