import { Link } from 'react-router-dom'
import { useMe } from '@/app/AuthProvider'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Spinner } from '@/components/ui/Feedback'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAsync } from '@/hooks/common'
import { supabase } from '@/lib/supabase'
import { countFriends } from '@/services/friends'

interface P { id: string; content: string; like_count: number; comment_count: number; share_count: number; created_at: string }

async function load(uid: string) {
  const since = new Date(Date.now() - 30 * 864e5).toISOString()
  const [posts, reels, friends] = await Promise.all([
    supabase.from('posts').select('id, content, like_count, comment_count, share_count, created_at').eq('author_id', uid).order('created_at', { ascending: false }).limit(300),
    supabase.from('reels').select('view_count, like_count').eq('author_id', uid).limit(300),
    countFriends(uid),
  ])
  const ps = (posts.data ?? []) as P[]
  const rs = (reels.data ?? []) as { view_count: number; like_count: number }[]
  const recent = ps.filter((p) => p.created_at >= since)
  const sum = (a: P[], k: 'like_count' | 'comment_count' | 'share_count') => a.reduce((n, p) => n + (p[k] ?? 0), 0)
  return {
    friends: friends ?? 0, posts: ps.length, posts30: recent.length,
    likes: sum(ps, 'like_count'), comments: sum(ps, 'comment_count'), shares: sum(ps, 'share_count'),
    likes30: sum(recent, 'like_count'), comments30: sum(recent, 'comment_count'),
    reels: rs.length, reelViews: rs.reduce((n, r) => n + (r.view_count ?? 0), 0), reelLikes: rs.reduce((n, r) => n + (r.like_count ?? 0), 0),
    top: [...ps].sort((a, b) => b.like_count + b.comment_count - (a.like_count + a.comment_count)).slice(0, 5),
  }
}

/** Read-only summary of how my posts and reels are doing. Numbers come from the counters already stored on each post. */
export default function CreatorInsightsPage() {
  const me = useMe()
  const { data: d, loading } = useAsync(() => load(me.id), [me.id])
  const Stat = ({ label, value }: { label: string; value: number }) => (
    <GlassPanel padded><div style={{ fontSize: 24, fontWeight: 700 }}>{value.toLocaleString('en-US')}</div><div className="small muted">{label}</div></GlassPanel>
  )
  return (
    <>
      <PageHeader title="Creator insights" back="/settings" />
      <div className="stack">
        {loading || !d ? <Spinner label="Loading" /> : (
          <>
            <h2 className="section-title">Last 30 days</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              <Stat label="Posts" value={d.posts30} /><Stat label="Likes on them" value={d.likes30} /><Stat label="Comments on them" value={d.comments30} /><Stat label="Friends" value={d.friends} />
            </div>
            <h2 className="section-title">All time</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              <Stat label="Posts" value={d.posts} /><Stat label="Likes" value={d.likes} /><Stat label="Comments" value={d.comments} /><Stat label="Shares" value={d.shares} />
              <Stat label="Reels" value={d.reels} /><Stat label="Reel views" value={d.reelViews} />
            </div>
            <h2 className="section-title">Top posts</h2>
            {d.top.length === 0 ? <p className="small muted">No posts yet.</p> : d.top.map((p) => (
              <Link key={p.id} to={`/p/${p.id}`} className="glass" style={{ padding: 12, borderRadius: 14, display: 'block' }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.content || 'Photo post'}</div>
                <div className="small muted">{p.like_count} likes · {p.comment_count} comments · {p.share_count} shares</div>
              </Link>
            ))}
            <p className="small muted">Impressions and reach are not tracked yet, so they are not shown.</p>
          </>
        )}
      </div>
    </>
  )
}
