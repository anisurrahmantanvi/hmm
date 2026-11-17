import { Link, useParams } from 'react-router-dom'
import { useMe } from '@/app/AuthProvider'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/Feedback'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAsync } from '@/hooks/common'
import { timeAgo } from '@/lib/format'
import { getPageBySlug, myPageRole } from '@/services/pages'
import { listPageThreads } from '@/services/pageExtras'

/** Messages people sent to a Page. Only the Page team can open it. */
export default function PageInboxPage() {
  const me = useMe()
  const { slug = '' } = useParams()
  const s = useAsync(async () => {
    const page = await getPageBySlug(slug)
    if (!page) return { page: null, allowed: false, items: [] as Awaited<ReturnType<typeof listPageThreads>> }
    const role = await myPageRole(page.id, me.id)
    if (!role) return { page, allowed: false, items: [] }
    return { page, allowed: true, items: await listPageThreads(page.id) }
  }, [slug, me.id])
  return (
    <>
      <PageHeader title="Page inbox" back />
      <div className="stack">
        {s.loading ? <ListSkeleton rows={4} /> : s.error ? <ErrorState message={s.error} onRetry={s.reload} /> : !s.data?.allowed ? (
          <EmptyState title="Not available" body="Only people who work on this Page can read its messages." />
        ) : s.data.items === null ? (
          <EmptyState title="Available after the next database update" body="Page messages will appear here once the update is installed." />
        ) : !s.data.items.length ? (
          <EmptyState title="No messages yet" body="When people message your Page, the conversations show up here." />
        ) : (
          <GlassPanel className="settings-list">
            {s.data.items.map((t) => (
              <Link key={t.id} to={`/page/${slug}/inbox/${t.id}`} className="list-row">
                <Avatar src={t.user?.avatar_url ?? null} name={t.user?.display_name || t.user?.username || '?'} size="md" />
                <span className="grow" style={{ minWidth: 0 }}>
                  <strong className="truncate" style={{ display: 'block' }}>{t.user?.display_name || t.user?.username || 'Someone'}</strong>
                  <span className="small muted truncate" style={{ display: 'block' }}>{t.last_message} · {timeAgo(t.last_at)}</span>
                </span>
                {t.page_unread > 0 ? <span className="dot" aria-label="Unread" /> : null}
              </Link>
            ))}
          </GlassPanel>
        )}
      </div>
    </>
  )
}
