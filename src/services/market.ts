import { supabase } from '@/lib/supabase'

export interface MarketCategory { id: string; slug: string; name: string; name_bn: string | null; kind: 'physical' | 'digital' | 'service'; sort: number }

/** Returns null when the marketplace tables are not installed yet (before the database update). */
export async function listCategories(): Promise<MarketCategory[] | null> {
  const { data, error } = await supabase.from('dealsafe_categories').select('id, slug, name, name_bn, kind, sort').order('sort')
  if (error) return null
  return (data ?? []) as MarketCategory[]
}

export type Condition = 'new' | 'like_new' | 'used' | 'for_parts'
export const CONDITIONS: { value: Condition; label: string }[] = [
  { value: 'new', label: 'New' }, { value: 'like_new', label: 'Like new' }, { value: 'used', label: 'Used' }, { value: 'for_parts', label: 'For parts' },
]
export interface Listing {
  id: string; seller_id: string; category_id: string | null; title: string; description: string
  condition: Condition | null; price_paisa: number; negotiable: boolean; location: string | null
  status: 'draft' | 'published' | 'paused' | 'sold' | 'removed'; view_count: number; created_at: string
  media: { url: string; position: number }[]
  seller: { id: string; username: string; display_name: string | null; avatar_url: string | null } | null
}
const COLS = 'id, seller_id, category_id, title, description, condition, price_paisa, negotiable, location, status, view_count, created_at, media:dealsafe_listing_media(url, position), seller:profiles!seller_id(id, username, display_name, avatar_url)'

export const formatPrice = (paisa: number): string => (paisa <= 0 ? 'Free / ask' : `৳${(paisa / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}`)
const sorted = (l: Listing): Listing => ({ ...l, media: [...(l.media ?? [])].sort((a, b) => a.position - b.position) })

export async function searchListings(opts: { q?: string; categoryId?: string | null; sellerId?: string; includeMine?: boolean }): Promise<Listing[]> {
  let qb = supabase.from('dealsafe_listings').select(COLS).order('created_at', { ascending: false }).limit(60)
  if (opts.sellerId) qb = qb.eq('seller_id', opts.sellerId)
  else qb = qb.eq('status', 'published')
  if (opts.categoryId) qb = qb.eq('category_id', opts.categoryId)
  const q = (opts.q ?? '').trim().replace(/[%,()]/g, ' ')
  if (q) qb = qb.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
  const { data, error } = await qb
  if (error) throw new Error(error.message)
  return ((data ?? []) as unknown as Listing[]).map(sorted)
}
export async function getListing(id: string): Promise<Listing | null> {
  const { data, error } = await supabase.from('dealsafe_listings').select(COLS).eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? sorted(data as unknown as Listing) : null
}
export async function createListing(input: { title: string; description: string; categoryId: string | null; condition: Condition | null; priceTaka: number; negotiable: boolean; location: string; imageUrls: string[] }): Promise<string> {
  const { data, error } = await supabase.from('dealsafe_listings').insert({
    title: input.title.trim(), description: input.description.trim(), category_id: input.categoryId, condition: input.condition,
    price_paisa: Math.round(input.priceTaka * 100), negotiable: input.negotiable, location: input.location.trim() || null, status: 'published',
  }).select('id').single()
  if (error) throw new Error(error.message)
  const id = (data as { id: string }).id
  if (input.imageUrls.length) {
    const { error: e2 } = await supabase.from('dealsafe_listing_media').insert(input.imageUrls.map((url, position) => ({ listing_id: id, url, position })))
    if (e2) throw new Error(e2.message)
  }
  return id
}
export async function setListingStatus(id: string, status: 'published' | 'paused' | 'sold'): Promise<void> {
  const { error } = await supabase.from('dealsafe_listings').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
}
export async function deleteListing(id: string): Promise<void> {
  const { error } = await supabase.from('dealsafe_listings').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
