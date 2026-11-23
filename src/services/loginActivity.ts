import { supabase } from '@/lib/supabase'

export interface LoginEvent { id: string; ip: string | null; user_agent: string | null; created_at: string }

/** Tell the server this person has signed in (it reads the IP from the request itself). Fire and forget, once per app session. */
export function recordLogin(userId: string): void {
  try {
    const k = `iconnecto.loginLogged.${userId}`
    if (sessionStorage.getItem(k)) return
    sessionStorage.setItem(k, '1')
  } catch { /* storage blocked: still try once */ }
  void supabase.functions.invoke('log-login', { body: {} }).catch(() => undefined)
}

export async function myLoginEvents(): Promise<LoginEvent[]> {
  const { data, error } = await supabase.from('login_events').select('id, ip, user_agent, created_at').order('created_at', { ascending: false }).limit(30)
  if (error) return []
  return (data ?? []) as LoginEvent[]
}

/** A short, readable device name from a user-agent string. */
export function deviceLabel(ua: string | null): string {
  if (!ua) return 'Unknown device'
  const os = /Android/i.test(ua) ? 'Android' : /iPhone|iPad|iOS/i.test(ua) ? 'iOS' : /Windows/i.test(ua) ? 'Windows' : /Mac OS/i.test(ua) ? 'Mac' : /Linux/i.test(ua) ? 'Linux' : 'Device'
  const br = /Edg\//i.test(ua) ? 'Edge' : /Firefox/i.test(ua) ? 'Firefox' : /Chrome|CriOS/i.test(ua) ? 'Chrome' : /Safari/i.test(ua) ? 'Safari' : 'browser'
  return `${os} · ${br}`
}
