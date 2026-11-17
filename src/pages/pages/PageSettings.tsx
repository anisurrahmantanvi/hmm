import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMe } from '@/app/AuthProvider'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/Feedback'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { PageHeader } from '@/components/ui/PageHeader'
import { useToast } from '@/components/ui/Toast'
import { useAsync } from '@/hooks/common'
import { errorMessage } from '@/lib/supabase'
import { getPageBySlug, listTeam, myPageRole, removePageRole, setPageRole, type PageRole, type PageRow } from '@/services/pages'
import { DEFAULT_PAGE_SETTINGS, getPageSettings, savePageSettings, type PageSettings } from '@/services/pageExtras'

const WHO: { v: PageSettings['who_can_message']; label: string }[] = [
  { v: 'everyone', label: 'Everyone' }, { v: 'followers', label: 'Followers' }, { v: 'nobody', label: 'Nobody' },
]

/** Settings of one Page: messages, comments, contact, policies and team. */
export default function PageSettingsPage() {
  const me = useMe()
  const toast = useToast()
  const navigate = useNavigate()
  const { slug = '' } = useParams()
  const base = useAsync(async () => {
    const page = await getPageBySlug(slug)
    if (!page) return null
    const role = await myPageRole(page.id, me.id)
    return role ? { page, role } : { page, role: null as PageRole | null }
  }, [slug, me.id])
  const page: PageRow | undefined = base.data?.page
  const role = base.data?.role ?? null
  const admin = role === 'owner' || role === 'admin'

  const [st, setSt] = useState<PageSettings>(DEFAULT_PAGE_SETTINGS)
  const [installed, setInstalled] = useState(true)
  const [email, setEmail] = useState('')
  const [url, setUrl] = useState('')
  const [policy, setPolicy] = useState('')
  const team = useAsync(() => (page ? listTeam(page.id) : Promise.resolve([])), [page?.id])
  const [uname, setUname] = useState('')
  const [newRole, setNewRole] = useState<'admin' | 'editor'>('editor')

  useEffect(() => {
    if (!page) return
    let off = false
    void getPageSettings(page.id).then((r) => {
      if (off) return
      setSt(r.settings); setInstalled(r.installed)
      setEmail(r.settings.contact_email ?? ''); setUrl(r.settings.privacy_policy_url ?? ''); setPolicy(r.settings.policy_text ?? '')
    }).catch(() => undefined)
    return () => { off = true }
  }, [page?.id])

  const change = async (patch: Partial<PageSettings>) => {
    if (!page) return
    const before = st
    setSt({ ...st, ...patch })
    try { await savePageSettings(page.id, patch) } catch (e) { setSt(before); toast.error(errorMessage(e)) }
  }
  const saveText = async () => {
    if (!page) return
    try {
      await savePageSettings(page.id, { contact_email: email.trim() || null, privacy_policy_url: url.trim() || null, policy_text: policy.trim() || null })
      toast.show('Saved')
    } catch (e) { toast.error(errorMessage(e)) }
  }
  const addMember = async () => {
    if (!page || !uname.trim()) return
    try { await setPageRole(page.id, uname.trim(), newRole); setUname(''); team.reload(); toast.show('Team updated') } catch (e) { toast.error(errorMessage(e)) }
  }
  const removeMember = async (userId: string) => {
    if (!page) return
    try { await removePageRole(page.id, userId); team.reload() } catch (e) { toast.error(errorMessage(e)) }
  }

  if (base.loading) return <><PageHeader title="Page settings" back /><div className="stack"><ListSkeleton rows={4} /></div></>
  if (base.error) return <><PageHeader title="Page settings" back /><div className="stack"><ErrorState message={base.error} onRetry={base.reload} /></div></>
  if (!page || !role) return <><PageHeader title="Page settings" back /><div className="stack"><EmptyState title="Not available" body="Only people who work on this Page can open its settings." /></div></>

  return (
    <>
      <PageHeader title="Page settings" back />
      <div className="stack">
        <GlassPanel className="settings-list">
          <Link to={`/page/${page.slug}`} className="list-row"><Avatar src={page.avatar_url} name={page.name} size="md" /><span className="grow"><strong>{page.name}</strong><span className="small muted" style={{ display: 'block' }}>Your role: {role}</span></span></Link>
          {admin ? <Link to={`/page/${page.slug}/edit`} className="list-row"><strong className="grow">Page info, photos and insights</strong></Link> : null}
          <Link to={`/page/${page.slug}/inbox`} className="list-row"><strong className="grow">Page inbox (messages)</strong></Link>
          <Link to={`/page/${page.slug}/notifications`} className="list-row"><strong className="grow">Page notifications</strong></Link>
          <Link to={`/page/${page.slug}/policy`} className="list-row"><strong className="grow">View public policy page</strong></Link>
        </GlassPanel>

        {!installed ? <p className="small muted" role="status">These settings will be available after the next database update.</p> : null}

        {admin ? (
          <>
            <GlassPanel padded className="col">
              <strong>Who can message this Page</strong>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {WHO.map((w) => <button key={w.v} type="button" className="chip" aria-pressed={st.who_can_message === w.v} disabled={!installed} onClick={() => void change({ who_can_message: w.v })}>{w.label}</button>)}
              </div>
            </GlassPanel>
            <GlassPanel className="settings-list">
              <div className="list-row">
                <span className="grow"><strong style={{ display: 'block' }}>Allow comments on Page posts</strong><span className="small muted">When off, only the Page team can comment.</span></span>
                <span className="switch"><input type="checkbox" role="switch" aria-label="Allow comments on Page posts" checked={st.allow_comments} disabled={!installed} onChange={(e) => void change({ allow_comments: e.target.checked })} /><span className="switch__track" aria-hidden /></span>
              </div>
            </GlassPanel>
            <GlassPanel padded className="col">
              <strong>Contact and policy</strong>
              <span className="small muted">Shown on the public policy page of this Page.</span>
              <input className="input" style={{ marginTop: 10 }} type="email" value={email} maxLength={120} placeholder="Contact email" aria-label="Contact email" disabled={!installed} onChange={(e) => setEmail(e.target.value)} />
              <input className="input" style={{ marginTop: 8 }} type="url" value={url} maxLength={300} placeholder="Privacy policy link (https://…)" aria-label="Privacy policy link" disabled={!installed} onChange={(e) => setUrl(e.target.value)} />
              <textarea className="input" style={{ marginTop: 8, minHeight: 120 }} value={policy} maxLength={6000} placeholder="Policy text: how this Page handles messages, orders, refunds or personal data" aria-label="Policy text" disabled={!installed} onChange={(e) => setPolicy(e.target.value)} />
              <div style={{ marginTop: 10 }}><Button variant="primary" disabled={!installed} onClick={() => void saveText()}>Save</Button></div>
            </GlassPanel>
          </>
        ) : null}

        <GlassPanel padded className="col">
          <strong>Team</strong>
          {team.loading ? <ListSkeleton rows={2} /> : (team.data ?? []).map((m) => (
            <div key={m.profile.id} className="list-row" style={{ paddingInline: 0 }}>
              <Avatar src={m.profile.avatar_url} name={m.profile.display_name || m.profile.username} size="md" />
              <span className="grow truncate"><strong>{m.profile.display_name || m.profile.username}</strong><span className="small muted" style={{ display: 'block' }}>{m.role}</span></span>
              {admin && m.role !== 'owner' && m.profile.id !== me.id ? <button type="button" className="btn btn--sm" onClick={() => void removeMember(m.profile.id)}>Remove</button> : null}
            </div>
          ))}
          {admin ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <input className="input" style={{ flex: 1, minWidth: 140 }} value={uname} placeholder="Username to add" aria-label="Username to add" onChange={(e) => setUname(e.target.value)} />
              <select className="input" value={newRole} aria-label="Role" onChange={(e) => setNewRole(e.target.value as 'admin' | 'editor')}>
                <option value="editor">Editor</option>
                {role === 'owner' ? <option value="admin">Admin</option> : null}
              </select>
              <Button variant="primary" onClick={() => void addMember()}>Add</Button>
            </div>
          ) : null}
          <span className="small muted">Editors can post and answer messages. Admins can also change settings. Only the owner can add admins.</span>
        </GlassPanel>

        <Button variant="glass" block onClick={() => navigate(`/page/${page.slug}`)}>Back to the Page</Button>
      </div>
    </>
  )
}
