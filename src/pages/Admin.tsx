import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Button } from '@/components/ui/Button'
import { ErrorState, ListSkeleton } from '@/components/ui/Feedback'
import { useAsync, useDebounce } from '@/hooks/common'
import { useToast } from '@/components/ui/Toast'
import { timeAgo } from '@/lib/format'
import { errorMessage } from '@/lib/supabase'
import { adminDeleteContent, adminReports, adminSetReport, adminStats, adminUsers, isAppAdmin, type AdminReport } from '@/services/admin'

type Tab = 'overview' | 'reports' | 'users'

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="admin-stat"><strong>{value.toLocaleString()}</strong><span>{label}</span></div>
  )
}

function Overview() {
  const s = useAsync(adminStats, [])
  if (s.loading && !s.data) return <ListSkeleton rows={3} />
  if (s.error || !s.data) return <ErrorState message={s.error ?? 'Could not load'} onRetry={s.reload} />
  const d = s.data
  return (
    <div className="admin-grid">
      <Stat label="Users" value={d.users} /><Stat label="New (7 days)" value={d.new_users_7d} />
      <Stat label="Posts" value={d.posts} /><Stat label="Comments" value={d.comments} />
      <Stat label="Reels" value={d.reels} /><Stat label="Pages" value={d.pages} />
      <Stat label="Communities" value={d.communities} /><Stat label="Open reports" value={d.open_reports} />
    </div>
  )
}

function Reports() {
  const toast = useToast()
  const [status, setStatus] = useState<'open' | 'resolved' | 'dismissed'>('open')
  const r = useAsync(() => adminReports(status), [status])
  const act = async (fn: () => Promise<void>) => {
    try { await fn(); r.reload() } catch (e) { toast.show(errorMessage(e)) }
  }
  const remove = (x: AdminReport) => {
    if (x.target_type !== 'post' && x.target_type !== 'comment') return
    if (!window.confirm(`Delete this ${x.target_type} permanently?`)) return
    void act(async () => { await adminDeleteContent(x.target_type as 'post' | 'comment', x.target_id, `report ${x.reason}`); await adminSetReport(x.id, 'resolved') })
  }
  return (
    <>
      <div className="row" style={{ gap: 8, marginBottom: 10 }}>
        {(['open', 'resolved', 'dismissed'] as const).map((s) => (
          <button key={s} type="button" className={`chip ${status === s ? 'chip--active' : ''}`} aria-pressed={status === s} onClick={() => setStatus(s)}>{s}</button>
        ))}
      </div>
      {r.loading && !r.data ? <ListSkeleton rows={3} /> : null}
      {r.error && !r.data ? <ErrorState message={r.error} onRetry={r.reload} /> : null}
      {r.data && !r.data.length ? <p className="muted">No {status} reports.</p> : null}
      {(r.data ?? []).map((x) => (
        <GlassPanel key={x.id} padded className="admin-report">
          <div className="row"><strong>{x.reason}</strong><span className="grow" /><span className="small faint">{timeAgo(x.created_at)}</span></div>
          <div className="small muted">{x.target_type} · reported by {x.reporter ?? 'unknown'}</div>
          <p className="admin-report__target">{x.target_label ?? '(removed)'}</p>
          {x.details ? <p className="small">{x.details}</p> : null}
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            {x.target_type === 'user' ? <Link className="btn btn--glass" to={`/u/${(x.target_label ?? '').replace('@', '')}`}>View profile</Link> : null}
            {x.target_type === 'post' ? <Link className="btn btn--glass" to={`/p/${x.target_id}`}>View post</Link> : null}
            {(x.target_type === 'post' || x.target_type === 'comment') && x.target_label ? <Button variant="glass" onClick={() => remove(x)}>Delete content</Button> : null}
            {x.status === 'open' ? (
              <>
                <Button variant="primary" onClick={() => void act(() => adminSetReport(x.id, 'resolved'))}>Resolve</Button>
                <Button variant="glass" onClick={() => void act(() => adminSetReport(x.id, 'dismissed'))}>Dismiss</Button>
              </>
            ) : <Button variant="glass" onClick={() => void act(() => adminSetReport(x.id, 'open'))}>Reopen</Button>}
          </div>
        </GlassPanel>
      ))}
    </>
  )
}

function Users() {
  const [q, setQ] = useState('')
  const dq = useDebounce(q)
  const u = useAsync(() => adminUsers(dq), [dq])
  return (
    <>
      <input className="admin-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or username" aria-label="Search users" />
      {u.loading && !u.data ? <ListSkeleton rows={4} /> : null}
      {u.error && !u.data ? <ErrorState message={u.error} onRetry={u.reload} /> : null}
      <GlassPanel>
        {(u.data ?? []).map((x) => (
          <Link key={x.id} to={`/u/${x.username}`} className="list-row">
            <span className="grow"><strong>{x.display_name || x.username}</strong><span className="small muted" style={{ display: 'block' }}>@{x.username} · joined {timeAgo(x.created_at)} · {x.posts_count} posts · {x.followers_count} followers</span></span>
          </Link>
        ))}
      </GlassPanel>
    </>
  )
}

/** Admin panel. Only accounts listed in app_admins can open it (checked again by every database function). */
export default function AdminPage() {
  const gate = useAsync(isAppAdmin, [])
  const [tab, setTab] = useState<Tab>('overview')
  if (gate.loading) return <ListSkeleton rows={2} />
  if (gate.data !== true) return <Navigate to="/menu" replace />
  return (
    <>
      <PageHeader title="Admin panel" back="/menu" />
      <div className="stack">
        <div className="row" style={{ gap: 8 }}>
          {(['overview', 'reports', 'users'] as const).map((t) => (
            <button key={t} type="button" className={`chip ${tab === t ? 'chip--active' : ''}`} aria-pressed={tab === t} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
        {tab === 'overview' ? <Overview /> : tab === 'reports' ? <Reports /> : <Users />}
      </div>
    </>
  )
}
