import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Send } from 'lucide-react'
import { useMe } from '@/app/AuthProvider'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/Feedback'
import { PageHeader } from '@/components/ui/PageHeader'
import { useToast } from '@/components/ui/Toast'
import { clockTime } from '@/lib/format'
import { errorMessage } from '@/lib/supabase'
import { getPageBySlug, myPageRole, type PageRow } from '@/services/pages'
import { getMyThread, getPageSettings, getThread, listPageMessages, markPageThreadRead, sendPageMessage, type PageMessage, type PageThread } from '@/services/pageExtras'

/**
 * One conversation with a Page.
 * - /page/:slug/chat: a visitor talking to the Page.
 * - /page/:slug/inbox/:threadId: a Page team member answering a visitor.
 */
export default function PageChatPage() {
  const me = useMe()
  const toast = useToast()
  const { slug = '', threadId = '' } = useParams()
  const [page, setPage] = useState<PageRow | null>(null)
  const [thread, setThread] = useState<PageThread | null>(null)
  const [isTeam, setIsTeam] = useState(false)
  const [blocked, setBlocked] = useState<string | null>(null)
  const [msgs, setMsgs] = useState<PageMessage[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [err, setErr] = useState('')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const end = useRef<HTMLDivElement>(null)

  const refresh = useCallback(async (tid: string) => {
    try { setMsgs(await listPageMessages(tid)); void markPageThreadRead(tid) } catch { /* keep what we have */ }
  }, [])

  useEffect(() => {
    let off = false
    void (async () => {
      try {
        const p = await getPageBySlug(slug)
        if (!p) { setErr('This Page does not exist.'); setState('error'); return }
        const role = await myPageRole(p.id, me.id)
        const t = threadId ? await getThread(threadId) : await getMyThread(p.id, me.id)
        if (off) return
        setPage(p); setIsTeam(!!role); setThread(t)
        if (!role) {
          const { settings, installed } = await getPageSettings(p.id)
          if (!installed) setBlocked('Page messages will be available after the next database update.')
          else if (settings.who_can_message === 'nobody') setBlocked('This Page is not accepting messages.')
        }
        if (t) await refresh(t.id)
        setState('ready')
      } catch (e) { if (!off) { setErr(errorMessage(e)); setState('error') } }
    })()
    return () => { off = true }
  }, [slug, threadId, me.id, refresh])

  useEffect(() => {
    if (!thread) return
    const id = window.setInterval(() => void refresh(thread.id), 5000)
    return () => window.clearInterval(id)
  }, [thread, refresh])
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [msgs.length])

  const send = async () => {
    const body = text.trim()
    if (!body || !page || sending) return
    setSending(true)
    try {
      const tid = await sendPageMessage({ pageId: page.id, body, threadId: thread?.id })
      setText('')
      if (!thread) setThread({ id: tid, page_id: page.id, last_message: body, last_at: new Date().toISOString(), page_unread: 0, user_unread: 0 })
      await refresh(tid)
    } catch (e) { toast.error(errorMessage(e)) } finally { setSending(false) }
  }

  const title = isTeam ? (thread?.user?.display_name || thread?.user?.username || 'Message') : (page?.name ?? 'Page')
  return (
    <>
      <PageHeader title={title} back />
      <div className="stack">
        {state === 'loading' ? <ListSkeleton rows={3} /> : state === 'error' ? <ErrorState message={err} /> : (
          <>
            {!msgs.length ? <EmptyState title={isTeam ? 'No messages' : `Message ${page?.name ?? 'this Page'}`} body={isTeam ? '' : 'Ask a question or say hello. The Page team will reply here.'} /> : (
              <div className="col" style={{ gap: 8 }}>
                {msgs.map((m) => {
                  const mine = isTeam ? m.from_page : !m.from_page
                  return (
                    <div key={m.id} className={`bubble-row ${mine ? 'bubble-row--me' : ''}`}>
                      {!mine ? <Avatar src={m.from_page ? page?.avatar_url ?? null : thread?.user?.avatar_url ?? null} name={m.from_page ? page?.name ?? 'Page' : thread?.user?.username ?? '?'} size="sm" /> : null}
                      <div className={`bubble ${mine ? 'bubble--me' : 'bubble--them'}`}>
                        <div>{m.body}</div>
                        <div className="bubble__time">{clockTime(m.created_at)}</div>
                      </div>
                    </div>
                  )
                })}
                <div ref={end} />
              </div>
            )}
            {blocked ? <p className="small muted" role="status">{blocked}</p> : (
              <form className="composer--comment" onSubmit={(e) => { e.preventDefault(); void send() }}>
                <div className="comment-input__field">
                  <input className="comment-input__input" style={{ flex: 1, background: 'transparent', border: 0, outline: 0, color: 'inherit', minHeight: 36 }} value={text} maxLength={2000} placeholder={isTeam ? 'Reply as the Page…' : 'Write a message…'} aria-label="Message" onChange={(e) => setText(e.target.value)} />
                  <button type="submit" className={`comment-send ${text.trim() ? 'is-on' : ''}`} disabled={!text.trim() || sending} aria-label="Send"><Send size={18} /></button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </>
  )
}
