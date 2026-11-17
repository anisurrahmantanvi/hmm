import { supabase } from '@/lib/supabase'

export interface ProfileStyle {
  theme: string
  accent: string | null
  background_url: string | null
  layout: 'classic' | 'about_last'
  show_about: boolean
  show_reels: boolean
  music_url: string | null
  music_title: string | null
}
export const DEFAULT_STYLE: ProfileStyle = { theme: 'default', accent: null, background_url: null, layout: 'classic', show_about: true, show_reels: true, music_url: null, music_title: null }
const COLS = 'theme, accent, background_url, layout, show_about, show_reels, music_url, music_title'

function missing(err: { message?: string; code?: string } | null): boolean {
  return !!err && (err.code === 'PGRST205' || err.code === '42P01' || /could not find the table|does not exist|schema cache/i.test(err.message ?? ''))
}

/** Never throws: before the database update every profile just looks normal. `installed` tells the editor whether saving can work. */
export async function getProfileStyle(userId: string): Promise<{ style: ProfileStyle; installed: boolean }> {
  try {
    const { data, error } = await supabase.from('profile_style').select(COLS).eq('user_id', userId).maybeSingle()
    if (missing(error)) return { style: DEFAULT_STYLE, installed: false }
    if (error || !data) return { style: DEFAULT_STYLE, installed: true }
    return { style: { ...DEFAULT_STYLE, ...(data as Partial<ProfileStyle>) }, installed: true }
  } catch {
    return { style: DEFAULT_STYLE, installed: true }
  }
}

export async function saveProfileStyle(userId: string, patch: Partial<ProfileStyle>): Promise<void> {
  const { error } = await supabase.from('profile_style').upsert({ user_id: userId, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) throw new Error(missing(error) ? 'Profile customization will be available after the next database update.' : error.message)
}
