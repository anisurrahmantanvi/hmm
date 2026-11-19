import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Eye, Plus, Trash2, X } from 'lucide-react'
import { useMe } from '@/app/AuthProvider'
import { Avatar } from '@/components/ui/Avatar'
import { timeAgo } from '@/lib/format'
import { deleteStory, fetchStoryGroups, listStoryViewers, markStoryViewed, type StoryGroup } from '@/services/stories'
import type { ProfileLite } from '@/types/db'

const SECONDS = 6

/** Full-screen viewer: tap right/left for next/previous, auto-advances every 6 s. */
export default function StoryViewerPage() {
  const { userId = '' } = useParams()
  const me = useMe()
  const nav = useNavigate()
  const [group, setGroup] = useState<StoryGroup | null | undefined>(undefined)
  const [i, setI] = useState(0)
  const [viewers, setViewers] = useState<ProfileLite[] | null>(null)
  const [paused, setPaused] = useState(false)
  const t0 = useRef(0)
  const [pct, setPct] = useState(0)

  useEffect(() => {
    let off = false
    void fetchStoryGroups(me.id).then((gs) => { if (!off) setGroup(gs.find((g) => g.author.id === userId) ?? null) }).catch(() => !off && setGroup(null))
    return () => { off = true }
  }, [me.id, userId])

  const story = group?.stories[i]
  const isMine = userId === me.id
  useEffect(() => {
    if (!story) return
    setViewers(null)
    setPct(0)
    t0.current = Date.now()
    if (!isMine) void markStoryViewed(story.id)
  }, [story?.id, isMine]) // eslint-disable-line react-hooks/exhaustive-deps

  const next = () => { if (group && i < group.stories.length - 1) setI(i + 1); else nav(-1) }
  const prev = () => { if (i > 0) setI(i - 1) }

  useEffect(() => {
    if (!story || paused) return
    const id = window.setInterval(() => {
      const p = ((Date.now() - t0.current) / (SECONDS * 1000)) * 100
      if (p >= 100) { window.clearInterval(id); next() } else setPct(p)
    }, 100)
    return () => window.clearInterval(id)
  }, [story?.id, paused]) // eslint-disable-line react-hooks/exhaustive-deps

  if (group === undefined) return <div style={{ position: 'fixed', inset: 0, background: '#000' }} />
  if (!group || !story) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#000', color: '#fff', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div><p>No active story.</p><button type="button" className="btn btn--glass" onClick={() => nav(-1)}>Back</button></div>
      </div>
    )
  }
  const name = group.author.display_name || group.author.username
  const remove = async () => { await deleteStory(story.id); nav(-1) }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: story.image_url ? '#000' : story.bg, color: '#fff', display: 'flex', flexDirection: 'column' }}>
      {story.image_url ? <img src={story.image_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} /> : null}
      {story.body ? <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: story.image_url ? 'end center' : 'center', padding: 24, pointerEvents: 'none' }}><p style={{ fontSize: story.image_url ? 18 : 26, fontWeight: 700, textAlign: 'center', textShadow: '0 1px 5px rgba(0,0,0,.8)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{story.body}</p></div> : null}
      <div style={{ position: 'absolute', inset: 0, display: 'flex' }} onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} onPointerLeave={() => setPaused(false)}>
        <button type="button" aria-label="Previous" onClick={prev} style={{ flex: 1, background: 'none', border: 0 }} />
        <button type="button" aria-label="Next" onClick={next} style={{ flex: 2, background: 'none', border: 0 }} />
      </div>
      <div style={{ position: 'relative', padding: '10px 12px', background: 'linear-gradient(#0009, transparent)' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {group.stories.map((s, k) => (
            <span key={s.id} style={{ flex: 1, height: 3, borderRadius: 2, background: '#fff5', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', background: '#fff', width: k < i ? '100%' : k === i ? `${pct}%` : '0%' }} /></span>
          ))}
        </div>
        <div className="row" style={{ marginTop: 8, gap: 8 }}>
          <Avatar src={group.author.avatar_url} name={name} size="sm" />
          <strong className="grow">{name} <span className="small" style={{ opacity: 0.8, fontWeight: 400 }}>{timeAgo(story.created_at)}</span></strong>
          {isMine ? <button type="button" className="icon-btn" aria-label="Add another story" onClick={() => nav('/stories/new')} style={{ color: '#fff' }}><Plus size={22} /></button> : null}
          {isMine ? <button type="button" className="icon-btn" aria-label="Delete story" onClick={() => void remove()} style={{ color: '#fff' }}><Trash2 size={20} /></button> : null}
          <button type="button" className="icon-btn" aria-label="Close" onClick={() => nav(-1)} style={{ color: '#fff' }}><X size={22} /></button>
        </div>
      </div>
      {isMine ? (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, background: 'linear-gradient(transparent, #000a)' }}>
          <button type="button" className="btn btn--glass btn--sm" onClick={() => { setPaused(true); void listStoryViewers(story.id).then(setViewers) }}><Eye size={16} aria-hidden /> Viewers</button>
          {viewers ? (
            <div style={{ marginTop: 8, maxHeight: 160, overflowY: 'auto' }}>
              {viewers.length === 0 ? <p className="small">No views yet.</p> : viewers.map((v) => <div key={v.id} className="row" style={{ gap: 8, padding: '4px 0' }}><Avatar src={v.avatar_url} name={v.display_name || v.username} size="sm" /><span>{v.display_name || v.username}</span></div>)}
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setViewers(null); setPaused(false) }}>Close list</button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
