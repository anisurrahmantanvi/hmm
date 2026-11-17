import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMe } from '@/app/AuthProvider'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/Feedback'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { PageHeader } from '@/components/ui/PageHeader'
import { useToast } from '@/components/ui/Toast'
import { useAsync } from '@/hooks/common'
import { timeAgo } from '@/lib/format'
import { errorMessage } from '@/lib/supabase'
import { listHiddenPosts, listSnoozed, unhidePost, unsnoozeAccount } from '@/services/feedPrefs'

export function HiddenPostsPage() {
  const me = useMe()
  const toast = useToast()
  const s = useAsync(() => listHiddenPosts(me.id), [me.id])
  const [gone, setGone] = useState<string[]>([])
  const undo = async (id: string) => {
    try { await unhidePost(me.id, id); setGone((g) => [...g, id]); toast.show('Post will show in your feed again') } catch (e) { toast.error(errorMessage(e)) }
  }
  const rows = (s.data ?? []).filter((r) => !gone.includes(r.post_id))
  return (
    <>
      <PageHeader title="Hidden posts" back />
      <div className="stack">
        {s.loading ? <ListSkeleton rows={3} /> : s.error ? <ErrorState message={s.error} onRetry={s.reload} /> : s.data === null ? (
          <EmptyState title="Available after the next database update" body="Hidden posts will be listed here once the update is installed." />
        ) : !rows.length ? (
          <EmptyState title="No hidden posts" body={'Use "Not interested" on a post to hide it from your feed.'} />
        ) : (
          <GlassPanel className="settings-list">
            {rows.map((r) => (
              <div key={r.post_id} className="list-row">
                <Avatar src={r.post?.author?.avatar_url ?? null} name={r.post?.author?.display_name || r.post?.author?.username || '?'} size="md" />
                <Link to={`/p/${r.post_id}`} className="grow" style={{ minWidth: 0 }}>
                  <strong className="truncate" style={{ display: 'block' }}>{r.post?.author?.display_name || r.post?.author?.username || 'Unavailable post'}</strong>
                  <span className="small muted truncate" style={{ display: 'block' }}>{r.post?.content || 'Photo or media post'} · {timeAgo(r.created_at)}</span>
                </Link>
                <button type="button" className="btn btn--sm" onClick={() => void undo(r.post_id)}>Unhide</button>
              </div>
            ))}
          </GlassPanel>
        )}
      </div>
    </>
  )
}

export function SnoozedPage() {
  const me = useMe()
  const toast = useToast()
  const s = useAsync(() => listSnoozed(me.id), [me.id])
  const [gone, setGone] = useState<string[]>([])
  const undo = async (id: string) => {
    try { await unsnoozeAccount(me.id, id); setGone((g) => [...g, id]); toast.show('Posts from this account will show again') } catch (e) { toast.error(errorMessage(e)) }
  }
  const rows = (s.data ?? []).filter((r) => !gone.includes(r.target_id))
  return (
    <>
      <PageHeader title="Snoozed accounts" back />
      <div className="stack">
        <p className="small muted">Snoozing hides an account's posts from your feeds for 30 days. They are not told. Use the post menu to snooze someone.</p>
        {s.loading ? <ListSkeleton rows={3} /> : s.error ? <ErrorState message={s.error} onRetry={s.reload} /> : s.data === null ? (
          <EmptyState title="Available after the next database update" body="Snoozed accounts will be listed here once the update is installed." />
        ) : !rows.length ? (
          <EmptyState title="No snoozed accounts" />
        ) : (
          <GlassPanel className="settings-list">
            {rows.map((r) => (
              <div key={r.target_id} className="list-row">
                <Avatar src={r.target?.avatar_url ?? null} name={r.target?.display_name || r.target?.username || '?'} size="md" />
                <span className="grow" style={{ minWidth: 0 }}>
                  <strong className="truncate" style={{ display: 'block' }}>{r.target?.display_name || r.target?.username || 'Account'}</strong>
                  <span className="small muted">Back on {new Date(r.until).toLocaleDateString()}</span>
                </span>
                <button type="button" className="btn btn--sm" onClick={() => void undo(r.target_id)}>Unsnooze</button>
              </div>
            ))}
          </GlassPanel>
        )}
      </div>
    </>
  )
}
