import { useEffect, useState } from 'react'
import { useMe } from '@/app/AuthProvider'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { EmptyState, Spinner } from '@/components/ui/Feedback'
import { PageHeader } from '@/components/ui/PageHeader'
import { useToast } from '@/components/ui/Toast'
import { errorMessage } from '@/lib/supabase'
import { getProfileByUsername } from '@/services/profiles'
import { listRestricted, restrictUser, unrestrictUser } from '@/services/restrict'
import type { ProfileLite } from '@/types/db'

export default function RestrictedPage() {
  const me = useMe()
  const toast = useToast()
  const [items, setItems] = useState<ProfileLite[] | null>(null)
  const [name, setName] = useState('')
  const load = () => listRestricted(me.id).then(setItems, (e) => { setItems([]); toast.error(errorMessage(e)) })
  useEffect(() => { void load() }, [me.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const add = async () => {
    const u = name.trim().replace(/^@/, '').toLowerCase()
    if (!u) return
    try {
      const p = await getProfileByUsername(u)
      if (!p) return toast.error('No one with that username.')
      if (p.id === me.id) return toast.error('You cannot restrict yourself.')
      await restrictUser(p.id)
      setName(''); toast.show(`Restricted @${p.username}`); void load()
    } catch (e) { toast.error(errorMessage(e)) }
  }
  const remove = async (p: ProfileLite) => {
    try { await unrestrictUser(me.id, p.id); setItems((l) => (l ?? []).filter((x) => x.id !== p.id)); toast.show(`Unrestricted @${p.username}`) } catch (e) { toast.error(errorMessage(e)) }
  }

  return (
    <>
      <PageHeader title="Restricted accounts" back="/settings" />
      <div className="stack">
        <p className="small muted">A restricted person is not told. Their comments on your posts are visible only to them and you, and their messages go to Message requests. They can still see your public profile.</p>
        <div className="row" style={{ gap: 8 }}>
          <input className="input grow" value={name} onChange={(e) => setName(e.target.value)} placeholder="Username to restrict" aria-label="Username to restrict" onKeyDown={(e) => { if (e.key === 'Enter') void add() }} />
          <Button variant="primary" onClick={() => void add()}>Restrict</Button>
        </div>
        {items === null ? <Spinner label="Loading" /> : null}
        {items && !items.length ? <EmptyState title="No restricted accounts" body="You can also restrict someone from their profile menu." /> : null}
        {(items ?? []).map((p) => (
          <div key={p.id} className="glass row" style={{ padding: 10, borderRadius: 14, gap: 10 }}>
            <Avatar src={p.avatar_url} name={p.display_name || p.username} />
            <span className="grow"><strong>{p.display_name || p.username}</strong><span className="small muted" style={{ display: 'block' }}>@{p.username}</span></span>
            <Button variant="glass" size="sm" onClick={() => void remove(p)}>Remove</Button>
          </div>
        ))}
      </div>
    </>
  )
}
