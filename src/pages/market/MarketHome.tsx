import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PackageSearch, Plus, Search, ShieldCheck } from 'lucide-react'
import { useT } from '@/lib/i18n'
import { Button } from '@/components/ui/Button'
import { EmptyState, Spinner } from '@/components/ui/Feedback'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAsync } from '@/hooks/common'
import { formatPrice, listCategories, searchListings } from '@/services/market'

/** Buy & Sell: browse and search listings, post your own. Payments are not in the app, so a deal is between buyer and seller. */
export default function MarketHomePage() {
  const { lang } = useT()
  const { data: cats } = useAsync(listCategories, [])
  const [q, setQ] = useState('')
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<string | null>(null)
  useEffect(() => { const t = window.setTimeout(() => setQuery(q), 350); return () => window.clearTimeout(t) }, [q])
  const { data: items, loading } = useAsync(() => searchListings({ q: query, categoryId: cat }), [query, cat])

  return (
    <>
      <PageHeader title="Buy & Sell" back actions={<Link to="/market/mine" className="small">My listings</Link>} />
      <div className="stack">
        <label className="glass row" style={{ padding: '10px 14px', borderRadius: 14 }}>
          <Search size={18} aria-hidden />
          <input className="grow" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products and services" aria-label="Search listings" style={{ background: 'none', border: 0, outline: 0, color: 'inherit' }} />
        </label>

        <GlassPanel padded className="row" style={{ gap: 12 }}>
          <ShieldCheck size={24} color="var(--accent)" aria-hidden style={{ flex: 'none' }} />
          <span className="small muted">Payments are not available in the app. Meet in a safe public place, check the item before you pay, and never send money in advance to someone you do not know.</span>
        </GlassPanel>

        {cats ? (
          <div className="chip-row">
            <button type="button" className="chip" aria-pressed={cat === null} onClick={() => setCat(null)}>All</button>
            {cats.map((c) => (
              <button key={c.id} type="button" className="chip" aria-pressed={cat === c.id} onClick={() => setCat(cat === c.id ? null : c.id)}>{lang === 'bn' && c.name_bn ? c.name_bn : c.name}</button>
            ))}
          </div>
        ) : null}

        {loading ? <Spinner label="Loading" /> : null}
        {items && items.length === 0 ? <EmptyState icon={<PackageSearch size={28} />} title="No listings found" body="Be the first to sell something here." /> : null}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
          {(items ?? []).map((l) => (
            <Link key={l.id} to={`/market/${l.id}`} className="glass" style={{ borderRadius: 14, overflow: 'hidden', display: 'block' }}>
              <div className="skeleton" style={{ aspectRatio: '1 / 1' }}>{l.media[0] ? <img src={l.media[0].url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}</div>
              <div style={{ padding: '8px 10px' }}>
                <strong>{formatPrice(l.price_paisa)}</strong>
                <div className="small" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                {l.location ? <div className="small muted">{l.location}</div> : null}
              </div>
            </Link>
          ))}
        </div>

        <div className="form-actions">
          <Link to="/market/sell" className="btn btn--primary"><Plus size={18} aria-hidden /> Sell something</Link>
        </div>
      </div>
    </>
  )
}
