import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Bookmark, ChevronDown, ChevronRight, Check, Crown, Repeat, Compass, Film, Flag, HelpCircle, LogOut, MessageCircle, Pencil, Settings, ShoppingBag, SquarePlus, Users } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { useAsync } from '@/hooks/common'
import { listMyPages } from '@/services/pages'
import { useAuth, useMe } from '@/app/AuthProvider'
import { useBadges } from '@/app/BadgesProvider'
import { Avatar } from '@/components/ui/Avatar'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { PageHeader } from '@/components/ui/PageHeader'
import { useT } from '@/lib/i18n'
import { useActingPage } from '@/hooks/useActingPage'
import { setActingAs } from '@/lib/actingAs'
import { sectionSlug } from '@/pages/settings/settingsMenu'

function Tile({ to, icon, label, hint, c1, c2, badge = 0 }: { to: string; icon: ReactNode; label: string; hint: string; c1: string; c2: string; badge?: number }) {
  return (
    <Link to={to} className="mtile">
      <span className="mtile__icon" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>{icon}</span>
      <span className="mtile__text"><strong>{label}</strong><span>{hint}</span></span>
      {badge > 0 ? <span className="mtile__badge" aria-label={`${badge} unread`}>{badge > 99 ? '99+' : badge}</span> : null}
      <ChevronRight size={18} className="mtile__chev" aria-hidden />
    </Link>
  )
}

function Expand({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <GlassPanel className="settings-list" as="section" aria-label={title}>
      <button type="button" className="list-row" aria-expanded={open} onClick={() => setOpen(!open)} style={{ width: '100%', textAlign: 'left' }}>
        {icon}
        <strong className="grow">{title}</strong>
        <ChevronDown size={18} className="chev" aria-hidden style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.18s' }} />
      </button>
      {open ? children : null}
    </GlassPanel>
  )
}

const SubLink = ({ to, title }: { to: string; title: string }) => (
  <Link to={to} className="list-row" style={{ paddingLeft: 56 }}>
    <span className="grow">{title}</span>
  </Link>
)

/** The full-screen Menu opened from the profile's three-line button. */
export default function MenuPage() {
  const me = useMe()
  const { tx } = useT()
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [confirmLogout, setConfirmLogout] = useState(false)
  const acting = useActingPage()
  const badges = useBadges()
  const toast = useToast()
  const [switchOpen, setSwitchOpen] = useState(false)
  const mine = useAsync(() => listMyPages(me.id), [me.id])
  const pick = (slug: string, name: string) => {
    setActingAs(slug)
    setSwitchOpen(false)
    toast.show(slug ? `Page mode: ${name}` : 'Personal profile mode')
  }

  const logOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <PageHeader title={tx('Menu')} back />
      <div className="stack">
        <GlassPanel as="section" aria-label="Your profile">
          <Link to={acting ? `/page/${acting.slug}` : `/u/${me.username}`} className="settings-user">
            <Avatar src={acting ? acting.avatar_url : me.avatar_url} name={acting ? acting.name : me.display_name ?? me.username} size="lg" />
            <span className="grow" style={{ minWidth: 0 }}>
              <strong className="truncate" style={{ display: 'block', fontSize: 18 }}>{acting ? acting.name : me.display_name || me.username}</strong>
              <span className="muted truncate" style={{ display: 'block' }}>{acting ? 'Page mode' : 'Personal profile mode'}</span>
            </span>
          </Link>
          {acting || (mine.data?.length ?? 0) > 0 ? (
          <button type="button" className="mswitch" aria-expanded={switchOpen} onClick={() => setSwitchOpen((v) => !v)}>
            <Repeat size={16} aria-hidden /> Switch <ChevronDown size={14} aria-hidden />
          </button>
          ) : null}
          {switchOpen && (acting || (mine.data?.length ?? 0) > 0) ? (
            <div className="mswitch__list" role="menu">
              <button type="button" role="menuitem" className="mswitch__row" onClick={() => pick('', '')}>
                <Avatar src={me.avatar_url} name={me.display_name ?? me.username} size="sm" />
                <span className="grow"><strong>{me.display_name || me.username}</strong><span className="small muted" style={{ display: 'block' }}>Personal profile</span></span>
                {!acting ? <Check size={18} aria-hidden /> : null}
              </button>
              {(mine.data ?? []).map((r) => (
                <button key={r.page.id} type="button" role="menuitem" className="mswitch__row" onClick={() => pick(r.page.slug, r.page.name)}>
                  <Avatar src={r.page.avatar_url} name={r.page.name} size="sm" />
                  <span className="grow"><strong>{r.page.name}</strong><span className="small muted" style={{ display: 'block' }}>Page</span></span>
                  {acting?.id === r.page.id ? <Check size={18} aria-hidden /> : null}
                </button>
              ))}
            </div>
          ) : null}
        </GlassPanel>

        <div className="mgrid">
          <Tile to={acting ? `/page/${acting.slug}/inbox` : '/messages'} icon={<MessageCircle size={24} />} label={"iConnect"} hint="Chat with friends & groups" c1="#6d5dfc" c2="#8e6bff" badge={acting ? 0 : badges.unreadMessages} />
          <Tile to="/communities" icon={<Users size={24} />} label={tx('Communities')} hint="Join your community" c1="#0a84ff" c2="#3aa0ff" />
          <Tile to="/reels" icon={<Film size={24} />} label={"iClips"} hint="Short videos & reels" c1="#ff5a3d" c2="#ff2e7e" />
          <Tile to="/saved" icon={<Bookmark size={24} />} label={"Collections"} hint="Save your favorites" c1="#ffb020" c2="#ff8a00" />
          <Tile to="/discover" icon={<Compass size={24} />} label={"Discover"} hint="Explore more content" c1="#12b5a6" c2="#1fd1a0" />
          <Tile to={acting ? `/page/${acting.slug}/notifications` : '/notifications'} icon={<Bell size={24} />} label={"Activity"} hint="Check your activity" c1="#ff9f1c" c2="#ff6b3d" badge={acting ? 0 : badges.unreadNotifications} />
          <Tile to="/pages" icon={<Flag size={24} />} label={"Pages"} hint="Manage your pages" c1="#5b5bf0" c2="#8b5cf6" />
          <Tile to="/market" icon={<ShoppingBag size={24} />} label={"Buy & Sell"} hint="Buy, sell & trade" c1="#22c55e" c2="#0fa968" />
          <Tile to={acting ? `/create?page=${acting.slug}` : '/create'} icon={<SquarePlus size={24} />} label={"Create"} hint="Share something new" c1="#0a84ff" c2="#2563eb" />
          <Tile to={acting ? `/page/${acting.slug}/settings` : '/settings/profile'} icon={<Pencil size={24} />} label={acting ? 'Page settings' : tx('Edit profile')} hint={acting ? 'Update your Page' : 'Update your profile'} c1="#8b5cf6" c2="#6d4af0" />
        </div>

        <div className="mpremium" aria-label="iConnecto Premium, coming soon">
          <Crown size={28} aria-hidden />
          <span className="mpremium__text"><strong>iConnecto Premium</strong><span>Unlock more amazing features</span></span>
          <span className="mpremium__soon">Coming soon</span>
        </div>

        <Expand icon={<Settings size={22} aria-hidden />} title={tx('Settings & privacy')}>
          <SubLink to={acting ? `/page/${acting.slug}/settings` : '/settings'} title={tx('Settings & privacy')} />
          <SubLink to="/settings/privacy" title="Privacy and security" />
          <SubLink to="/settings/blocked" title="Blocked accounts" />
          <SubLink to={`/settings/section/${sectionSlug('Preferences')}`} title={tx('Language')} />
          <SubLink to={`/settings/section/${sectionSlug('Themes')}`} title={tx('Themes')} />
          <SubLink to={`/settings/section/${sectionSlug('Notifications')}`} title={tx('Notifications')} />
        </Expand>

        <Expand icon={<HelpCircle size={22} aria-hidden />} title={tx('Help Center')}>
          <SubLink to={`/settings/section/${sectionSlug('Support & Feedback')}`} title={tx('Support & Feedback')} />
          <SubLink to={`/settings/section/${sectionSlug('Help & Legal')}`} title={tx('Help & Legal')} />
        </Expand>

        <GlassPanel className="settings-list" as="nav" aria-label="Account">
          <button type="button" className="list-row" onClick={() => setConfirmLogout(true)} style={{ width: '100%', textAlign: 'left' }}>
            <LogOut size={22} aria-hidden />
            <strong className="grow">{tx('Log out')}</strong>
          </button>
        </GlassPanel>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        title={`${tx('Log out')}?`}
        message="You will be logged out of this account on this phone. Your account and data are not deleted."
        confirmLabel={tx('Log out')}
        onConfirm={logOut}
        onClose={() => setConfirmLogout(false)}
      />
    </>
  )
}
