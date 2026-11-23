import { supabase } from '@/lib/supabase'

export interface AdminStats { users: number; new_users_7d: number; posts: number; comments: number; reels: number; pages: number; communities: number; open_reports: number }
export interface AdminReport { id: string; created_at: string; reason: string; details: string | null; target_type: string; target_id: string; status: string; reporter: string | null; target_label: string | null }
export interface AdminUser { id: string; username: string; display_name: string | null; created_at: string; posts_count: number; followers_count: number }

/** True only for accounts listed in app_admins. Never throws (false before the database update). */
export async function isAppAdmin(): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_app_admin')
    return !error && data === true
  } catch { return false }
}

async function call<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw error
  return data as T
}

export const adminStats = () => call<AdminStats>('admin_stats')
export const adminReports = (status: 'open' | 'resolved' | 'dismissed' | 'all') => call<AdminReport[]>('admin_reports', { p_status: status })
export const adminSetReport = (id: string, status: 'open' | 'resolved' | 'dismissed') => call<void>('admin_set_report', { p_id: id, p_status: status })
export const adminUsers = (q: string) => call<AdminUser[]>('admin_users', { p_q: q })
export const adminDeleteContent = (type: 'post' | 'comment', id: string, note?: string) => call<void>('admin_delete_content', { p_type: type, p_id: id, p_note: note ?? null })

export interface AdminLogin { ip: string | null; user_agent: string | null; created_at: string }
/** Sign-in records of one person (last 50). Every call is written to the admin log. */
export const adminUserLogins = (userId: string) => call<AdminLogin[]>('admin_user_logins', { p_user: userId })
