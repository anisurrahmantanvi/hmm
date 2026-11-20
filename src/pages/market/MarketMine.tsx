import { Link } from 'react-router-dom'
import { PackageSearch } from 'lucide-react'
import { useMe } from '@/app/AuthProvider'
import { EmptyState, Spinner } from '@/components/ui/Feedback'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAsync } from '@/hooks/common'
import { formatPrice, searchListings } from '@/services/market'

export default function MarketMinePage() {
  const me = useMe()
  const { data: items, loading } = useAsync(() => searchListings({ sellerId: me.id }), [me.id])
  return (
    <>
      <PageHeader title="My listings" back="/market" />
      <div className="stack">
        {loading ? <Spinner label="Loading" /> : null}
        {items && !items.length ? <EmptyState icon={<PackageSearch size={28} />} title="You have no listings" body="Tap Sell something to post your first one." /> : null}
        {(items ?? []).map((l) => (
          <Link key={l.id} to={`/market/${l.id}`} className="glass row" style={{ padding: 10, borderRadius: 14, gap: 10 }}>
            <span className="skeleton" style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flex: 'none' }}>{l.media[0] ? <img src={l.media[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}</span>
            <span className="grow"><strong>{l.title}</strong><span className="small muted" style={{ display: 'block' }}>{formatPrice(l.price_paisa)} · {l.status}</span></span>
          </Link>
        ))}
        <Link to="/market/sell" className="btn btn--primary">Sell something</Link>
      </div>
    </>
  )
}
