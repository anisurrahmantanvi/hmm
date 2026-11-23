import { GlassPanel } from '@/components/ui/GlassPanel'
import { EmptyState, Spinner } from '@/components/ui/Feedback'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAsync } from '@/hooks/common'
import { timeAgo } from '@/lib/format'
import { deviceLabel, myLoginEvents } from '@/services/loginActivity'

/** The sign-ins recorded for my account (last 90 days). If one is not yours, change your password. */
export default function LoginActivityPage() {
  const { data, loading } = useAsync(myLoginEvents, [])
  return (
    <>
      <PageHeader title="Login activity" back="/settings" />
      <div className="stack">
        <p className="small muted">We record the IP address and device of your sign-ins for security and to stop abuse, and keep them for 90 days. If you see a sign-in that is not you, change your password right away.</p>
        {loading ? <Spinner label="Loading" /> : null}
        {data && !data.length ? <EmptyState title="Nothing recorded yet" body="Sign-ins are recorded from now on." /> : null}
        {data && data.length ? (
          <GlassPanel>
            {data.map((e) => (
              <div key={e.id} className="list-row">
                <span className="grow"><strong>{deviceLabel(e.user_agent)}</strong><span className="small muted" style={{ display: 'block' }}>{e.ip ?? 'Address unknown'} · {timeAgo(e.created_at)}</span></span>
              </div>
            ))}
          </GlassPanel>
        ) : null}
      </div>
    </>
  )
}
