import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { useMe } from '@/app/AuthProvider'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { ErrorState, Spinner } from '@/components/ui/Feedback'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { PageHeader } from '@/components/ui/PageHeader'
import { useToast } from '@/components/ui/Toast'
import { useAsync } from '@/hooks/common'
import { timeAgo } from '@/lib/format'
import { errorMessage } from '@/lib/supabase'
import { getOrCreateDm } from '@/services/chat'
import { CONDITIONS, deleteListing, formatPrice, getListing, setListingStatus } from '@/services/market'

export default function MarketListingPage() {
  const { id = '' } = useParams()
  const me = useMe()
  const nav = useNavigate()
  const toast = useToast()
  const [tick, setTick] = useState(0)
  const { data: l, loading } = useAsync(() => getListing(id), [id, tick])
  const [photo, setPhoto] = useState(0)
  if (loading) return <Spinner label="Loading" />
  if (!l) return <><PageHeader title="Listing" back="/market" /><ErrorState message="This listing is not available." /></>
  const mine = l.seller_id === me.id
  const name = l.seller?.display_name || l.seller?.username || 'Seller'
  const act = async (fn: () => Promise<void>, msg: string, then?: () => void) => {
    try { await fn(); toast.show(msg); then ? then() : setTick((t) => t + 1) } catch (e) { toast.error(errorMessage(e)) }
  }
  return (
    <>
      <PageHeader title="Listing" back="/market" />
      <div className="stack">
        {l.media.length ? (
          <>
            <img src={l.media[photo]?.url} alt={l.title} style={{ width: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: 14, background: '#0002' }} />
            {l.media.length > 1 ? <div className="row" style={{ gap: 6 }}>{l.media.map((m, i) => <button key={m.url} type="button" aria-label={`Photo ${i + 1}`} onClick={() => setPhoto(i)} style={{ width: 54, height: 54, padding: 0, border: i === photo ? '2px solid var(--accent)' : '2px solid transparent', borderRadius: 8, overflow: 'hidden' }}><img src={m.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></button>)}</div> : null}
          </>
        ) : null}
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>{formatPrice(l.price_paisa)}{l.negotiable ? <span className="small muted"> · negotiable</span> : null}</h1>
          <p style={{ margin: '4px 0' }}>{l.title}</p>
          <p className="small muted">{[l.condition ? CONDITIONS.find((c) => c.value === l.condition)?.label : null, l.location, timeAgo(l.created_at)].filter(Boolean).join(' · ')}{l.status !== 'published' ? ` · ${l.status}` : ''}</p>
        </div>
        {l.description ? <GlassPanel padded><p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{l.description}</p></GlassPanel> : null}
        {l.seller ? (
          <Link to={`/u/${l.seller.username}`} className="glass row" style={{ padding: 12, borderRadius: 14, gap: 10 }}>
            <Avatar src={l.seller.avatar_url} name={name} /><span className="grow"><strong>{name}</strong><span className="small muted" style={{ display: 'block' }}>Seller</span></span>
          </Link>
        ) : null}
        {mine ? (
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            {l.status === 'published' ? <Button variant="glass" onClick={() => void act(() => setListingStatus(l.id, 'sold'), 'Marked as sold')}>Mark as sold</Button> : null}
            {l.status === 'published' ? <Button variant="glass" onClick={() => void act(() => setListingStatus(l.id, 'paused'), 'Paused')}>Pause</Button> : null}
            {l.status !== 'published' ? <Button variant="glass" onClick={() => void act(() => setListingStatus(l.id, 'published'), 'Published again')}>Publish again</Button> : null}
            <Button variant="glass" onClick={() => { if (window.confirm('Delete this listing?')) void act(() => deleteListing(l.id), 'Deleted', () => nav('/market/mine', { replace: true })) }}>Delete</Button>
          </div>
        ) : (
          <Button variant="primary" icon={<MessageCircle size={18} />} onClick={() => void act(async () => { nav(`/messages/${await getOrCreateDm(l.seller_id)}`) }, 'Opening chat')}>Message seller</Button>
        )}
        {!mine ? <p className="small muted">Payments are not in the app. Check the item before you pay, and meet in a safe public place.</p> : null}
      </div>
    </>
  )
}
