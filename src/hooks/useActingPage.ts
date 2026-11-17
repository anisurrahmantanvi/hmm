import { useEffect, useState } from 'react'
import { useMe } from '@/app/AuthProvider'
import { setActingAs, useActingAs } from '@/lib/actingAs'
import { getPageBySlug, myPageRole, type PageRow } from '@/services/pages'

const cache = new Map<string, PageRow>()

/** The Page this device is acting as, or null for the personal profile. Clears itself if you no longer manage the Page. */
export function useActingPage(): PageRow | null {
  const me = useMe()
  const slug = useActingAs()
  const [page, setPage] = useState<PageRow | null>(() => (slug ? cache.get(slug) ?? null : null))
  useEffect(() => {
    if (!slug) { setPage(null); return }
    const cached = cache.get(slug)
    if (cached) setPage(cached)
    let off = false
    void (async () => {
      try {
        const p = await getPageBySlug(slug)
        const role = p ? await myPageRole(p.id, me.id) : null
        if (off) return
        if (p && role) { cache.set(slug, p); setPage(p) } else { cache.delete(slug); setPage(null); setActingAs('') }
      } catch { /* offline: keep what we have */ }
    })()
    return () => { off = true }
  }, [slug, me.id])
  return slug ? page : null
}
