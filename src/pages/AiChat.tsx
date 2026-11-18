import { useEffect, useRef, useState } from 'react'
import { Send, Sparkles, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { askAi, type AiMessage } from '@/services/ai'

const KEY = 'iconnecto.aiChat'
const NOTES: Record<string, string> = {
  not_configured: 'iConnecto AI এখনো চালু হয়নি। কিছুদিনের মধ্যে আসছে।',
  limit: 'আজকের জন্য আপনার AI ব্যবহারের সীমা শেষ। কাল আবার চেষ্টা করুন।',
  busy: 'AI এখন ব্যস্ত। একটু পরে আবার চেষ্টা করুন।',
  network: 'ইন্টারনেট সংযোগে সমস্যা। আবার চেষ্টা করুন।',
  error: 'কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।',
}

function load(): AiMessage[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]') as AiMessage[]
    return Array.isArray(v) ? v.filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string').slice(-40) : []
  } catch { return [] }
}

/** iConnecto AI: a simple chat assistant. History stays on this device only. */
export default function AiChatPage() {
  const [msgs, setMsgs] = useState<AiMessage[]>(load)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(msgs.slice(-40))) } catch { /* ignore */ }
    end.current?.scrollIntoView({ block: 'end' })
  }, [msgs, busy])

  const send = async () => {
    const t = text.trim()
    if (!t || busy) return
    const next: AiMessage[] = [...msgs, { role: 'user', text: t.slice(0, 2000) }]
    setMsgs(next)
    setText('')
    setNote('')
    setBusy(true)
    const r = await askAi(next)
    setBusy(false)
    if (r.ok) setMsgs([...next, { role: 'assistant', text: r.reply }])
    else setNote(NOTES[r.reason] ?? NOTES.error)
  }

  return (
    <>
      <PageHeader
        title="iConnecto AI"
        back
        actions={msgs.length ? <button type="button" className="icon-btn" aria-label="Clear chat" onClick={() => { setMsgs([]); setNote('') }}><Trash2 size={20} /></button> : undefined}
      />
      <div className="ai">
        <div className="ai__list">
          {!msgs.length ? (
            <div className="ai__hello">
              <Sparkles size={30} aria-hidden />
              <strong>আমি iConnecto AI</strong>
              <span>যেকোনো প্রশ্ন করুন, লেখায় সাহায্য নিন, বা নতুন কিছু শিখুন। বাংলা, Banglish বা English, যেটায় খুশি।</span>
            </div>
          ) : null}
          {msgs.map((m, i) => <div key={i} className={`ai__msg ai__msg--${m.role}`}>{m.text}</div>)}
          {busy ? <div className="ai__msg ai__msg--assistant ai__typing" aria-label="AI is typing"><i /><i /><i /></div> : null}
          {note ? <p className="ai__note" role="status">{note}</p> : null}
          <div ref={end} />
        </div>
        <form className="ai__bar" onSubmit={(e) => { e.preventDefault(); void send() }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send() } }}
            placeholder="কিছু জিজ্ঞেস করুন…"
            rows={1}
            maxLength={2000}
            aria-label="Message to iConnecto AI"
          />
          <button type="submit" className="icon-btn ai__send" disabled={busy || !text.trim()} aria-label="Send"><Send size={20} /></button>
        </form>
        <p className="small muted ai__foot">AI ভুল করতে পারে। গুরুত্বপূর্ণ বিষয় নিজে যাচাই করুন। চ্যাট শুধু এই ফোনে থাকে।</p>
      </div>
    </>
  )
}
