import { useEffect, useState } from 'react'
import { useMe } from '@/app/AuthProvider'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { EmptyState, Spinner } from '@/components/ui/Feedback'
import { PageHeader } from '@/components/ui/PageHeader'
import { useToast } from '@/components/ui/Toast'
import { errorMessage } from '@/lib/supabase'
import { addCloseFriend, listCloseFriendIds, removeCloseFriend } from '@/services/closeFriends'
import { listFriends } from '@/services/friends'
import type { ProfileLite } from '@/types/db'

/** Pick which friends are on my Close Friends list. Only they can see stories I share with "Close Friends". */
export default function CloseFriendsPage() {
  const me = useMe()
  const toast = useToast()
  const [friends, setFriends] = useState<ProfileLite[] | null>(null)
  const [ids, setIds] = useState<Set<string>>(new Set())
  const [cursor, setCursor] = useState<string | null>(null)

  useEffect(() => {
    let off = false
    void (async () => {
      try {
        const [page, set] = await Promise.all([listFriends(me.id, null), listCloseFriendIds(me.id)])
        if (off) return
        setFriends(page.items); setCursor(page.nextCursor); setIds(set)
      } catch (e) { if (!off) { setFriends([]); toast.error(errorMessage(e)) } }
    })()
    return () => { off = true }
  }, [me.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const more = async () => {
    const page = await listFriends(me.id, cursor)
    setFriends((f) => [...(f ?? []), ...page.items]); setCursor(page.nextCursor)
  }
  const toggle = async (f: ProfileLite) => {
    const on = ids.has(f.id)
    try {
      if (on) await removeCloseFriend(me.id, f.id); else await addCloseFriend(f.id)
      setIds((s) => { const n = new Set(s); if (on) n.delete(f.id); else n.add(f.id); return n })
    } catch (e) { toast.error(errorMessage(e)) }
  }

  return (
    <>
      <PageHeader title="Close Friends" back="/settings" />
      <div className="stack">
        <p className="small muted">Only the friends you pick here can see stories you share with Close Friends. They are not told they were added. {ids.size} selected.</p>
        {friends === null ? <Spinner label="Loading" /> : null}
        {friends && !friends.length ? <EmptyState title="No friends yet" body="Add friends first, then pick your close ones here." /> : null}
        {(friends ?? []).map((f) => (
          <div key={f.id} className="glass row" style={{ padding: 10, borderRadius: 14, gap: 10 }}>
            <Avatar src={f.avatar_url} name={f.display_name || f.username} />
            <span className="grow"><strong>{f.display_name || f.username}</strong><span className="small muted" style={{ display: 'block' }}>@{f.username}</span></span>
            <Button variant={ids.has(f.id) ? 'primary' : 'glass'} size="sm" onClick={() => void toggle(f)} aria-pressed={ids.has(f.id)}>{ids.has(f.id) ? 'Added' : 'Add'}</Button>
          </div>
        ))}
        {cursor ? <Button variant="glass" onClick={() => void more()}>Load more</Button> : null}
      </div>
    </>
  )
}
