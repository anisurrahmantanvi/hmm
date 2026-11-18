// iConnecto AI: a chat assistant powered by Google Gemini (free tier).
//
// Deployed WITH JWT verification: only signed-in iConnecto users can call it.
// Secrets (Supabase > Edge Functions > Secrets), never in the app or in git:
//   GEMINI_API_KEY   created in Google AI Studio (https://aistudio.google.com/apikey)
//   GEMINI_MODEL     optional, default gemini-2.5-flash
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase to every function.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const DAILY_LIMIT = 40
const MAX_MESSAGES = 12
const MAX_CHARS = 2000

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

const SYSTEM = `You are "iConnecto AI", the friendly assistant inside the iConnecto social app.
Reply in the same language the user writes (Bangla, Banglish or English). Be short, clear and kind.
Help with everyday questions, writing, learning and ideas. For medical, legal or money questions give general information and suggest a professional.
Never help with anything that harms people, sexual content involving minors, or creating weapons or malware. Do not ask for passwords or personal secrets.
You cannot see the user's account, posts or messages, and you cannot take actions in the app.`

interface Msg { role: 'user' | 'assistant'; text: string }

async function gemini(model: string, key: string, msgs: Msg[]): Promise<Response> {
  return await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: msgs.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.text }] })),
      generationConfig: { maxOutputTokens: 800, temperature: 0.7 },
    }),
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json(405, { error: 'method' })

  const url = Deno.env.get('SUPABASE_URL')!
  const authed = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } })
  const { data: u } = await authed.auth.getUser()
  if (!u.user) return json(401, { error: 'auth' })

  const key = Deno.env.get('GEMINI_API_KEY')
  if (!key) return json(503, { error: 'not_configured' })

  let msgs: Msg[]
  try {
    const body = await req.json() as { messages?: unknown }
    if (!Array.isArray(body.messages)) throw new Error('bad')
    msgs = body.messages.slice(-MAX_MESSAGES).map((m) => {
      const r = m as { role?: unknown; text?: unknown }
      if ((r.role !== 'user' && r.role !== 'assistant') || typeof r.text !== 'string') throw new Error('bad')
      return { role: r.role, text: r.text.slice(0, MAX_CHARS) } as Msg
    })
    if (!msgs.length || msgs[msgs.length - 1].role !== 'user' || !msgs[msgs.length - 1].text.trim()) throw new Error('bad')
  } catch {
    return json(400, { error: 'bad_request' })
  }

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: ok, error: qerr } = await admin.rpc('ai_take_quota', { p_user: u.user.id, p_limit: DAILY_LIMIT })
  if (qerr) return json(500, { error: 'quota' })
  if (ok !== true) return json(429, { error: 'limit', limit: DAILY_LIMIT })

  // Try the configured model, then a "latest" alias, then whatever Flash model this key can use.
  const wanted = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash'
  let res = await gemini(wanted, key, msgs)
  if (!res.ok && res.status !== 429) {
    console.error('gemini', wanted, res.status, (await res.text()).slice(0, 300))
    res = await gemini('gemini-flash-latest', key, msgs)
    if (!res.ok && res.status !== 429) {
      console.error('gemini gemini-flash-latest', res.status, (await res.text()).slice(0, 300))
      const list = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=100', { headers: { 'x-goog-api-key': key } })
      if (list.ok) {
        const models = ((await list.json()) as { models?: { name: string; supportedGenerationMethods?: string[] }[] }).models ?? []
        const pick = models.find((m) => /flash/i.test(m.name) && !/lite|image|tts|live|thinking/i.test(m.name) && m.supportedGenerationMethods?.includes('generateContent'))
        if (pick) {
          console.error('gemini fallback model', pick.name)
          res = await gemini(pick.name.replace(/^models\//, ''), key, msgs)
        }
      } else {
        console.error('gemini list', list.status, (await list.text()).slice(0, 300))
      }
    }
  }
  if (!res.ok) {
    console.error('gemini final', res.status, (await res.text()).slice(0, 300))
    return json(res.status === 429 ? 429 : 502, { error: res.status === 429 ? 'busy' : 'upstream', status: res.status })
  }

  const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]; promptFeedback?: { blockReason?: string } }
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim()
  if (!text) return json(200, { reply: data.promptFeedback?.blockReason ? 'দুঃখিত, এই প্রশ্নের উত্তর আমি দিতে পারব না।' : 'দুঃখিত, উত্তর তৈরি করতে পারলাম না। আবার চেষ্টা করুন।' })
  return json(200, { reply: text })
})
