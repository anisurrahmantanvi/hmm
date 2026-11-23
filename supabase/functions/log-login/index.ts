// log-login: records the IP address and browser/device of a sign-in, for security and abuse prevention.
// Deployed WITH JWT verification: only a signed-in person can call it, and it only ever writes a row for THAT person.
// The client cannot send an IP; it is read here from the request headers. Rows are kept 90 days (database trigger).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json(405, { error: 'method' })

  const url = Deno.env.get('SUPABASE_URL')!
  const authed = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } })
  const { data: u } = await authed.auth.getUser()
  if (!u.user) return json(401, { error: 'auth' })

  const fwd = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for') ?? ''
  const ip = fwd.split(',')[0].trim().slice(0, 64) || null
  const ua = (req.headers.get('user-agent') ?? '').slice(0, 300) || null

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  // One row per person+address per 6 hours, so reopening the app does not fill the table.
  const since = new Date(Date.now() - 6 * 3600 * 1000).toISOString()
  let q = admin.from('login_events').select('id', { head: true, count: 'exact' }).eq('user_id', u.user.id).gte('created_at', since)
  q = ip ? q.eq('ip', ip) : q.is('ip', null)
  const { count } = await q
  if ((count ?? 0) > 0) return json(200, { ok: true, skipped: true })

  const { error } = await admin.from('login_events').insert({ user_id: u.user.id, ip, user_agent: ua })
  if (error) return json(500, { error: 'store' })
  return json(200, { ok: true })
})
