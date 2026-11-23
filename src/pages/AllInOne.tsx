import { Link } from 'react-router-dom'
import { ChevronRight, ExternalLink } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { openWebsite } from '@/lib/inAppBrowser'
import { EXTERNAL_GROUPS, INTERNAL_SERVICES } from '@/lib/services'

const tile = (c: [string, string]) => ({ background: `linear-gradient(135deg, ${c[0]}, ${c[1]})` })

/** All in one: Hmm's own services, and quick links to official websites that open in a browser tab on top of the app. */
export default function AllInOnePage() {
  return (
    <>
      <PageHeader title="All in one" back="/menu" />
      <div className="stack">
        <h2 className="aio-title">Hmm</h2>
        <div className="mgrid">
          {INTERNAL_SERVICES.map((s) => (
            <Link key={s.name} to={s.to} className="mtile">
              <span className="mtile__icon" style={tile(s.color)} aria-hidden>{s.name.slice(0, 1)}</span>
              <span className="mtile__text"><strong>{s.name}</strong><span>{s.hint}</span></span>
              <ChevronRight size={18} className="mtile__chev" aria-hidden />
            </Link>
          ))}
        </div>

        {EXTERNAL_GROUPS.map((g) => (
          <section key={g.title}>
            <h2 className="aio-title">{g.title}</h2>
            <div className="mgrid">
              {g.items.map((s) => (
                <button key={s.url} type="button" className="mtile aio-ext" onClick={() => openWebsite(s.url)} aria-label={`${s.name}, opens ${s.host}`}>
                  <span className="mtile__icon" style={tile(s.color)} aria-hidden>{s.name.slice(0, 1)}</span>
                  <span className="mtile__text"><strong>{s.name}</strong><span>{s.hint}</span><span className="aio-host">{s.host}</span></span>
                  <ExternalLink size={16} className="mtile__chev" aria-hidden />
                </button>
              ))}
            </div>
          </section>
        ))}

        <p className="small muted aio-note">
          These are websites of other organisations, not run by Hmm. They open in a browser on top of the app. Sign in and pay only on their own page. Hmm never sees your password, NID or payment details.
        </p>
      </div>
    </>
  )
}
