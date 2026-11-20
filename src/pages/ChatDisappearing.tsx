import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Feedback'
import { useToast } from '@/components/ui/Toast'
import { errorMessage } from '@/lib/supabase'
import { DISAPPEAR_OPTIONS, getChatDisappear, setChatDisappear } from '@/services/restrict'

/** Per-chat timer: new messages in this chat disappear after the chosen time. Either person can change it. */
export default function ChatDisappearingPage() {
  const { chatId = '' } = useParams()
  const toast = useToast()
  const [cur, setCur] = useState<number | null | undefined>(undefined)
  useEffect(() => { void getChatDisappear(chatId).then(setCur) }, [chatId])
  const pick = async (secs: number | null) => {
    try { await setChatDisappear(chatId, secs); setCur(secs); toast.show(secs ? 'New messages will disappear' : 'Disappearing messages are off') } catch (e) { toast.error(errorMessage(e)) }
  }
  return (
    <>
      <PageHeader title="Disappearing messages" back={`/messages/${chatId}`} />
      <div className="stack">
        {cur === undefined ? <Spinner label="Loading" /> : (
          <GlassPanel padded>
            <div className="chip-row" role="group" aria-label="Disappear after">
              {DISAPPEAR_OPTIONS.map((o) => <button key={o.label} type="button" className="chip" aria-pressed={cur === o.secs} onClick={() => void pick(o.secs)}>{o.label}</button>)}
            </div>
          </GlassPanel>
        )}
        <p className="small muted">Only messages sent after you turn this on disappear; earlier ones stay. The other person can still take a screenshot or copy a message, and a push notification may show the text before it disappears.</p>
      </div>
    </>
  )
}
