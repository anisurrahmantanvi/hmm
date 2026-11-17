import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMe } from '@/app/AuthProvider'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/Feedback'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { PageHeader } from '@/components/ui/PageHeader'
import { useToast } from '@/components/ui/Toast'
import { useAsync } from '@/hooks/common'
import { errorMessage } from '@/lib/supabase'
import { listFavorites, removeFavorite } from '@/services/favorites'

export default function FavoritesPage() {
  const me = useMe()
  const toast = useToast()
  const s = useAsync(() => listFavorites(me.id), [me.id])
  const [gone, setGone] = useState<string[]>([])
  const rows = (s.data ?? []).filter((p) => !gone.includes(p.id))
  const remove = async (id: string) => {
    try { await removeFavorite(me.id, id); setGone((g) => [...g, id]) } catch (e) { toast.error(errorMessage(e)) }
  }
  return (
    <>
      <PageHeader title="Favorites" back />
      <div className="stack">
        <p className="small muted">Favorites are accounts whose latest posts you can see with the Favorites chip on Home. Add one from the post menu.</p>
        {s.loading ? <ListSkeleton rows={3} /> : s.error ? <ErrorState message={s.error} onRetry={s.reload} /> : s.data === null ? (
          <EmptyState title="Available after the next database update" body="Favorites will be listed here once the update is installed." />
        ) : !rows.length ? <EmptyState title="No favorites yet" /> : (
          <GlassPanel className="settings-list">
            {rows.map((p) => (
              <div key={p.id} className="list-row">
                <Avatar src={p.avatar_url} name={p.display_name || p.username} size="md" />
                <Link to={`/u/${p.username}`} className="grow truncate"><strong>{p.display_name || p.username}</strong></Link>
                <button type="button" className="btn btn--sm" onClick={() => void remove(p.id)}>Remove</button>
              </div>
            ))}
          </GlassPanel>
        )}
      </div>
    </>
  )
}
