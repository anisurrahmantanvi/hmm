import { Link, useParams } from 'react-router-dom'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/Feedback'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAsync } from '@/hooks/common'
import { getPageBySlug } from '@/services/pages'
import { getPageSettings } from '@/services/pageExtras'

/** Public policy page of a Page: its own contact details and policy, plus the Hmm Terms and Privacy Policy. */
export default function PagePolicyPage() {
  const { slug = '' } = useParams()
  const s = useAsync(async () => {
    const page = await getPageBySlug(slug)
    if (!page) return null
    return { page, ...(await getPageSettings(page.id)) }
  }, [slug])
  return (
    <>
      <PageHeader title="Page policy" back />
      <div className="stack">
        {s.loading ? <ListSkeleton rows={3} /> : s.error ? <ErrorState message={s.error} onRetry={s.reload} /> : !s.data ? <EmptyState title="Page not found" /> : (
          <>
            <h2 style={{ fontSize: 20 }}>{s.data.page.name}</h2>
            <GlassPanel padded className="col">
              <strong>Contact</strong>
              {s.data.settings.contact_email ? <a href={`mailto:${s.data.settings.contact_email}`}>{s.data.settings.contact_email}</a> : <span className="small muted">The Page has not added a contact email. You can message the Page on Hmm.</span>}
              {s.data.page.website ? <a href={s.data.page.website} target="_blank" rel="noopener noreferrer">{s.data.page.website}</a> : null}
            </GlassPanel>
            <GlassPanel padded className="col">
              <strong>This Page&apos;s policy</strong>
              {s.data.settings.policy_text ? <p style={{ whiteSpace: 'pre-wrap' }}>{s.data.settings.policy_text}</p> : <span className="small muted">This Page has not written its own policy yet.</span>}
              {s.data.settings.privacy_policy_url ? <a href={s.data.settings.privacy_policy_url} target="_blank" rel="noopener noreferrer">Privacy policy of this Page</a> : null}
            </GlassPanel>
            <GlassPanel padded className="col">
              <strong>Hmm rules for Pages</strong>
              <span className="small muted">Every Page on Hmm follows these.</span>
              <Link to="/terms">Terms of Service</Link>
              <Link to="/privacy-policy">Privacy Policy</Link>
            </GlassPanel>
          </>
        )}
      </div>
    </>
  )
}
