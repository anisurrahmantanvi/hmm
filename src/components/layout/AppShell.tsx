import { Suspense, useEffect } from 'react'
import { WellbeingWatcher } from '@/components/layout/WellbeingWatcher'
import { ActingRedirect } from '@/components/pages/ActingRedirect'
import { useActingPage } from '@/hooks/useActingPage'
import { ActingBanner } from '@/components/pages/ActingBanner'
import { unlockAudioOnFirstTouch } from '@/lib/ringtone'
import { Outlet, useLocation, useMatch } from 'react-router-dom'
import { Bell, Bookmark, Clapperboard, Compass, Home, MessageCircle, Settings, User, Users, WifiOff } from 'lucide-react'
import { ArcNav } from '@/components/layout/ArcNav'
import { useAuth } from '@/app/AuthProvider'
import { useBadges } from '@/app/BadgesProvider'
import { useOnline } from '@/hooks/common'
import { useHeartbeat } from '@/hooks/presence'
import { usePush } from '@/hooks/usePush'
import { useBackButton } from '@/hooks/useBackButton'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { useT } from '@/lib/i18n'
import { registerDevice } from '@/services/security'
import { IncomingCallListener } from '@/components/calls/IncomingCall'
import { CallProvider } from '@/app/CallProvider'
import { Spinner } from '@/components/ui/Feedback'

/** Signed-in layout: Thumb Arc navigation (one round button that opens the app as arcs). */
export function AppShell() {
  const { t } = useT()
  const { profile } = useAuth()
  const badges = useBadges()
  const online = useOnline()
  useHeartbeat(!!profile)
  usePush(!!profile)
  useBackButton()
  usePullToRefresh()
  useEffect(() => unlockAudioOnFirstTouch(), [])
  useEffect(() => { if (profile) void registerDevice() }, [profile?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Hide the bottom bar only while the on-screen keyboard is really open (not just because a field still has focus).
  // The Android app reports this itself (data-kbd on <html>); in a normal browser the visual viewport shrinks instead.
  useEffect(() => {
    const root = document.documentElement
    const vv = window.visualViewport
    const NON_TEXT = new Set(['checkbox', 'radio', 'button', 'submit', 'reset', 'file', 'range', 'color', 'image'])
    const isTextField = (el: Element | null) => {
      if (!(el instanceof HTMLElement)) return false
      if (el instanceof HTMLTextAreaElement) return true
      if (el instanceof HTMLInputElement) return !NON_TEXT.has(el.type)
      return el.isContentEditable
    }
    const update = () => {
      if ('kbd' in root.dataset) return // the Android app decides; see CSS for html[data-kbd='1']
      const shrunk = vv ? window.innerHeight - vv.height > 120 : true
      root.classList.toggle('kbd-open', shrunk && isTextField(document.activeElement))
    }
    vv?.addEventListener('resize', update)
    document.addEventListener('focusin', update)
    document.addEventListener('focusout', update)
    return () => {
      vv?.removeEventListener('resize', update)
      document.removeEventListener('focusin', update)
      document.removeEventListener('focusout', update)
      root.classList.remove('kbd-open')
    }
  }, [])
  // Conversations and calls need the full screen on a phone, so the tab bar is hidden there.
  // Both hooks must run on every render (`||` would skip the second one and break React's hook order).
  const inChat = useMatch('/messages/:chatId')
  const inCall = useMatch('/call/:callId')
  const immersive = !!inChat || !!inCall
  const { pathname } = useLocation()
  const bleed = !inChat // every normal screen runs edge to edge; chats and calls have their own full-screen layout
  const username = profile?.username ?? ''
  const actingPage = useActingPage()
  const profilePath = actingPage ? `/page/${actingPage.slug}` : `/u/${username}`
  const msgPath = actingPage ? `/page/${actingPage.slug}/inbox` : '/messages'
  const settingsPath = actingPage ? `/page/${actingPage.slug}/settings` : '/settings'
  const notifPath = actingPage ? `/page/${actingPage.slug}/notifications` : '/notifications'

  return (
    <CallProvider>
    <div className={`shell ${immersive ? 'shell--immersive' : ''} ${inChat ? 'shell--chat' : ''}`}>
      <a href="#main" className="skip-link">Skip to content</a>

      <main className={`shell__main ${bleed ? 'shell__main--bleed' : ''}`} id="main" tabIndex={-1}>
        <ActingBanner />
        <ActingRedirect />
        <WellbeingWatcher />
        {/* Lazy pages suspend here, so the navigation stays on screen while a screen's code loads. */}
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </main>

      {!immersive ? (
        <ArcNav
          createTo="/create"
          outer={[
            { to: '/', icon: Home, label: t('nav.home'), end: true },
            { to: '/reels', icon: Clapperboard, label: 'Reels' },
            { to: '/discover', icon: Compass, label: t('nav.discover') },
            { to: msgPath, icon: MessageCircle, label: t('nav.messages'), badge: badges.unreadMessages },
            { to: notifPath, icon: Bell, label: t('nav.notifications'), badge: badges.unreadNotifications },
            { to: profilePath, icon: User, label: t('nav.profile') },
          ]}
          inner={[
            { to: '/communities', icon: Users, label: t('nav.communities') },
            { to: '/saved', icon: Bookmark, label: t('nav.saved') },
            { to: settingsPath, icon: Settings, label: t('nav.settings') },
          ]}
        />
      ) : null}

      {!online ? (
        <div className="glass banner banner--offline" role="status">
          <WifiOff size={18} aria-hidden /> You're offline. Changes can't be saved until you reconnect.
        </div>
      ) : null}

      <IncomingCallListener />
    </div>
    </CallProvider>
  )
}
