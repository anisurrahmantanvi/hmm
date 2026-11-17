import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { useActingPage } from '@/hooks/useActingPage'
import { setActingAs } from '@/lib/actingAs'
import { pageUnreadCount } from '@/services/pageNotifications'
import { pageInboxUnread } from '@/services/pageExtras'

/** Shown on every screen while you are acting as a Page. */
export function ActingBanner() {
  const page = useActingPage()
  const [unread, setUnread] = useState(0)
  const [inbox, setInbox] = useState(0)
  useEffect(() => {
    if (!page) return
    let off = false
    const load = () => {
      void pageUnreadCount(page.id).then((n) => { if (!off) setUnread(n) })
      void pageInboxUnread(page.id).then((n) => { if (!off) setInbox(n) })
    }
    load()
    const id = window.setInterval(load, 60000)
    return () => { off = true; window.clearInterval(id) }
  }, [page])
  if (!page) return null
  return (
    <div className="acting-banner" role="status">
      <Avatar src={page.avatar_url} name={page.name} size="sm" />
      <Link to={`/page/${page.slug}`} className="acting-banner__name truncate">Page mode: <strong>{page.name}</strong></Link>
      <Link to={`/page/${page.slug}/inbox`} className="btn btn--sm">Inbox{inbox ? ` (${inbox})` : ''}</Link>
      <Link to={`/page/${page.slug}/notifications`} className="btn btn--sm">Alerts{unread ? ` (${unread})` : ''}</Link>
      <button type="button" className="btn btn--sm" onClick={() => setActingAs('')}>Personal profile</button>
    </div>
  )
}
