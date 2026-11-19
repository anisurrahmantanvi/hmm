import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useMe } from '@/app/AuthProvider'
import { Avatar } from '@/components/ui/Avatar'
import { fetchStoryGroups, type StoryGroup } from '@/services/stories'

/** Row of friends' active stories at the top of the feed. The first bubble adds (or opens) my own story. */
export function StoryTray() {
  const me = useMe()
  const [groups, setGroups] = useState<StoryGroup[] | null>(null)
  useEffect(() => {
    let off = false
    void fetchStoryGroups(me.id).then((g) => !off && setGroups(g)).catch(() => !off && setGroups([]))
    return () => { off = true }
  }, [me.id])
  if (groups === null) return null
  const mine = groups.find((g) => g.author.id === me.id)
  const others = groups.filter((g) => g.author.id !== me.id)
  const ring = (seen: boolean): React.CSSProperties => ({ padding: 2, borderRadius: '50%', border: `2px solid ${seen ? 'var(--border, #8884)' : 'var(--accent)'}`, display: 'inline-flex' })
  return (
    <section className="glass" style={{ padding: '10px 0', borderRadius: 0 }} aria-label="Stories">
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '0 14px' }}>
        <div style={{ flex: 'none', width: 68, textAlign: 'center' }}>
          {mine ? (
            <Link to={`/stories/${me.id}`} aria-label="Open your story" style={ring(true)}><Avatar src={me.avatar_url} name={me.display_name || me.username} size="lg" /></Link>
          ) : (
            <Link to="/stories/new" aria-label="Add to your story" style={{ position: 'relative', display: 'inline-flex' }}>
              <Avatar src={me.avatar_url} name={me.display_name || me.username} size="lg" />
              <span style={{ position: 'absolute', right: -2, bottom: -2, background: 'var(--accent)', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'grid', placeItems: 'center' }}><Plus size={14} aria-hidden /></span>
            </Link>
          )}
          <div className="small" style={{ marginTop: 4 }}>{mine ? 'Your story' : 'Add story'}</div>
        </div>
        {others.map((g) => (
          <Link key={g.author.id} to={`/stories/${g.author.id}`} style={{ flex: 'none', width: 68, textAlign: 'center' }} aria-label={`${g.author.display_name || g.author.username}'s story`}>
            <span style={ring(g.allSeen)}><Avatar src={g.author.avatar_url} name={g.author.display_name || g.author.username} size="lg" /></span>
            <div className="small" style={{ marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.author.display_name || g.author.username}</div>
          </Link>
        ))}
      </div>
    </section>
  )
}
