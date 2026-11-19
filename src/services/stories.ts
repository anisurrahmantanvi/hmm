import { supabase } from '@/lib/supabase'
import { PROFILE_LITE } from '@/lib/api'
import type { ProfileLite } from '@/types/db'

export interface Story {
  id: string
  user_id: string
  image_url: string | null
  body: string | null
  bg: string
  created_at: string
  expires_at: string
  viewed: boolean
}
export interface StoryGroup {
  author: ProfileLite
  stories: Story[]
  allSeen: boolean
}

function missing(err: { message?: string; code?: string } | null): boolean {
  return !!err && (err.code === 'PGRST205' || err.code === '42P01' || /could not find the table|does not exist|schema cache/i.test(err.message ?? ''))
}

/** Active stories of me and my friends, grouped by author (mine first, then unseen before seen). Empty when the database is not updated. */
export async function fetchStoryGroups(meId: string): Promise<StoryGroup[]> {
  const res = await supabase
    .from('stories')
    .select(`id, user_id, image_url, body, bg, created_at, expires_at, author:profiles!user_id(${PROFILE_LITE}), views:story_views(viewer_id)`)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(300)
  if (missing(res.error)) return []
  if (res.error) throw new Error(res.error.message)
  const rows = (res.data ?? []) as unknown as (Omit<Story, 'viewed'> & { author: ProfileLite | null; views: { viewer_id: string }[] })[]
  const map = new Map<string, StoryGroup>()
  for (const r of rows) {
    if (!r.author) continue
    const g = map.get(r.user_id) ?? { author: r.author, stories: [], allSeen: true }
    const viewed = r.user_id === meId || r.views.some((v) => v.viewer_id === meId)
    g.stories.push({ id: r.id, user_id: r.user_id, image_url: r.image_url, body: r.body, bg: r.bg, created_at: r.created_at, expires_at: r.expires_at, viewed })
    if (!viewed) g.allSeen = false
    map.set(r.user_id, g)
  }
  return [...map.values()].sort((a, b) => {
    if (a.author.id === meId) return -1
    if (b.author.id === meId) return 1
    return Number(a.allSeen) - Number(b.allSeen)
  })
}

export async function createStory(input: { imageUrl?: string | null; body?: string | null; bg?: string }): Promise<void> {
  const { error } = await supabase.from('stories').insert({ image_url: input.imageUrl ?? null, body: input.body?.trim() || null, bg: input.bg ?? '#0b0b0c' })
  if (error) throw new Error(missing(error) ? 'Stories will be available after the next database update.' : error.message)
}
export async function deleteStory(id: string): Promise<void> {
  const { error } = await supabase.from('stories').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
export async function markStoryViewed(id: string): Promise<void> {
  await supabase.from('story_views').insert({ story_id: id }) // duplicate/own views fail silently; that is fine
}
export async function listStoryViewers(id: string): Promise<ProfileLite[]> {
  const { data } = await supabase.from('story_views').select(`viewer:profiles!viewer_id(${PROFILE_LITE})`).eq('story_id', id).order('created_at', { ascending: false }).limit(100)
  return ((data ?? []) as unknown as { viewer: ProfileLite | null }[]).map((r) => r.viewer).filter((v): v is ProfileLite => !!v)
}
