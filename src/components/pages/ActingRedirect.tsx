import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMe } from '@/app/AuthProvider'
import { useActingPage } from '@/hooks/useActingPage'

/** In Page mode your own profile and notifications are replaced by the Page's. Switch back to reach the personal ones. */
export function ActingRedirect() {
  const page = useActingPage()
  const me = useMe()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    if (!page) return
    if (pathname === '/' || pathname === '/discover' || pathname === '/reels' || pathname === '/communities') navigate(`/page/${page.slug}`, { replace: true })
    else if (pathname === `/u/${me.username}`) navigate(`/page/${page.slug}`, { replace: true })
    else if (pathname === '/messages') navigate(`/page/${page.slug}/inbox`, { replace: true })
    else if (pathname === '/settings') navigate(`/page/${page.slug}/settings`, { replace: true })
    else if (pathname === '/notifications') navigate(`/page/${page.slug}/notifications`, { replace: true })
  }, [page, pathname, me.username, navigate])
  return null
}
