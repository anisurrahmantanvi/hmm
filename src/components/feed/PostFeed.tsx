import { useCallback, useEffect, useMemo, type ReactNode } from 'react'
import { fetchFavoritePosts } from '@/services/favorites'
import { getFeedFilters } from '@/services/feedPrefs'
import type { Page, PostView } from '@/types/db'
import { useMe } from '@/app/AuthProvider'
import { usePaged, useInfiniteSentinel } from '@/hooks/common'
import { PostCard } from './PostCard'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, PostSkeleton, Spinner } from '@/components/ui/Feedback'
import {
  discoverPosts,
  fetchCommunityPosts,
  fetchFeed,
  fetchSavedPosts,
  fetchUserPosts,
  searchPosts,
} from '@/services/posts'
import { fetchPagePosts } from '@/services/pages'

export type PostSource =
  | { kind: 'home' }
  | { kind: 'explore' }
  | { kind: 'author'; authorId: string }
  | { kind: 'community'; communityId: string }
  | { kind: 'page'; pageId: string }
  | { kind: 'saved' }
  | { kind: 'search'; query: string }
  | { kind: 'discover' }
  | { kind: 'favorites' }

interface PostFeedProps {
  source: PostSource
  empty: { icon?: ReactNode; title: string; body?: string; action?: ReactNode }
  /** Change this number to force a reload (pull-to-refresh button). */
  refreshKey?: number
  canModerate?: boolean
  /** Hide posts after the viewer removes the bookmark on the Saved screen. */
  removeWhenUnsaved?: boolean
}

/** A paginated, self-contained list of posts: loading skeletons, empty and error states, infinite scroll. */
export function PostFeed({ source, empty, refreshKey = 0, canModerate = false, removeWhenUnsaved = false }: PostFeedProps) {
  const me = useMe()
  const key = JSON.stringify(source)

  const fetchPage = useCallback(
    async (cursor: string | null) => {
      const load = (): Promise<Page<PostView>> => {
        switch (source.kind) {
          case 'home': return fetchFeed(me.id, 'following', cursor)
          case 'explore': return fetchFeed(me.id, 'all', cursor)
          case 'author': return fetchUserPosts(me.id, source.authorId, cursor)
          case 'community': return fetchCommunityPosts(me.id, source.communityId, cursor)
          case 'page': return fetchPagePosts(me.id, source.pageId, cursor)
          case 'saved': return fetchSavedPosts(me.id, cursor)
          case 'search': return searchPosts(me.id, source.query, cursor)
          case 'discover': return discoverPosts(me.id, cursor)
          case 'favorites': return fetchFavoritePosts(me.id)
        }
      }
      // Hidden posts and snoozed accounts only apply to the main feeds.
      if (source.kind !== 'home' && source.kind !== 'explore' && source.kind !== 'discover') return load()
      const [f, res] = await Promise.all([getFeedFilters(me.id), load()])
      return { ...res, items: res.items.filter((p) => !f.hidden.has(p.id) && !f.snoozed.has(p.author_id)) }
    },
    // `key` stands in for `source` so an equal-but-new object does not trigger a reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, me.id, refreshKey],
  )

  // The home feed keeps its first page on this phone, so it shows at once next time and refreshes behind the scenes.
  const cacheKey = source.kind === 'home' ? `iconnecto.feedCache.${me.id}` : null
  const initial = useMemo<PostView[] | undefined>(() => {
    if (!cacheKey) return undefined
    try { const v = JSON.parse(localStorage.getItem(cacheKey) || 'null') as PostView[] | null; return Array.isArray(v) && v.length ? v : undefined } catch { return undefined }
  }, [cacheKey])
  const { items, loading, loadingMore, error, hasMore, loadMore, reload, setItems } = usePaged<PostView>(fetchPage, true, initial)
  useEffect(() => {
    if (!cacheKey || loading || error || !items.length) return
    try { localStorage.setItem(cacheKey, JSON.stringify(items.slice(0, 12))) } catch { /* ignore */ }
  }, [cacheKey, loading, error, items])
  const sentinel = useInfiniteSentinel(loadMore, hasMore && !loadingMore && !error)

  const onChange = useCallback(
    (next: PostView) => {
      if (removeWhenUnsaved && !next.saved) setItems((prev) => prev.filter((p) => p.id !== next.id))
      else setItems((prev) => prev.map((p) => (p.id === next.id ? next : p)))
    },
    [setItems, removeWhenUnsaved],
  )
  const onDeleted = useCallback((id: string) => setItems((prev) => prev.filter((p) => p.id !== id)), [setItems])

  if (loading) {
    return (
      <div className="stack" aria-busy="true" aria-label="Loading posts">
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    )
  }
  if (error && !items.length) return <ErrorState message={error} onRetry={reload} />
  if (!items.length) return <EmptyState {...empty} />

  return (
    <div className="stack">
      {items.map((p) => (
        <PostCard key={p.id} post={p} onChange={onChange} onDeleted={onDeleted} canModerate={canModerate} />
      ))}
      {loadingMore ? <Spinner label="Loading more posts" /> : null}
      {error ? <ErrorState message={error} onRetry={loadMore} /> : null}
      {hasMore && !loadingMore && !error ? (
        <div ref={sentinel} className="center">
          <Button variant="ghost" size="sm" onClick={loadMore}>Load more</Button>
        </div>
      ) : null}
    </div>
  )
}
