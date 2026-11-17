import { supabase } from '@/lib/supabase'
import { PROFILE_LITE } from '@/lib/api'
import type { Page, PostView, ProfileLite } from '@/types/db'
import { fetchUserPosts } from './posts'

function missing(err: { message?: string; code?: string } | null): boolean {
  return !!err && (err.code === 'PGRST205' || err.code === '42P01' || /could not find the table|does not exist|schema cache/i.test(err.message ?? ''))
}

/** null = the database has not been updated yet. */
export async function listFavorites(userId: string): Promise<ProfileLite[] | null> {
  const res = await supabase.from('favorite_accounts').select(`target:profiles!target_id(${PROFILE_LITE})`).eq('user_id', userId).order('created_at', { ascending: false }).limit(50)
  if (missing(res.error)) return null
  if (res.error) throw new Error(res.error.message)
  return ((res.data ?? []) as unknown as { target: ProfileLite | null }[]).map((r) => r.target).filter((t): t is ProfileLite => !!t)
}
export async function addFavorite(targetId: string): Promise<void> {
  const { error } = await supabase.from('favorite_accounts').insert({ target_id: targetId })
  if (error && error.code !== '23505') throw new Error(missing(error) ? 'This will be available after the next database update.' : error.message)
}
export async function removeFavorite(userId: string, targetId: string): Promise<void> {
  const { error } = await supabase.from('favorite_accounts').delete().eq('user_id', userId).eq('target_id', targetId)
  if (error) throw new Error(error.message)
}

/** Latest posts of the favorite accounts (up to 20 accounts), newest first. */
export async function fetchFavoritePosts(userId: string): Promise<Page<PostView>> {
  const favs = (await listFavorites(userId)) ?? []
  const pages = await Promise.all(favs.slice(0, 20).map((f) => fetchUserPosts(userId, f.id, null).catch(() => ({ items: [] as PostView[], nextCursor: null }))))
  const items = pages.flatMap((p) => p.items).sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 40)
  return { items, nextCursor: null }
}
