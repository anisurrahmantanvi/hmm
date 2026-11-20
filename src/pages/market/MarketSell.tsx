import { useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImagePlus, X } from 'lucide-react'
import { useMe } from '@/app/AuthProvider'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/Feedback'
import { PageHeader } from '@/components/ui/PageHeader'
import { useToast } from '@/components/ui/Toast'
import { useAsync } from '@/hooks/common'
import { validateImage } from '@/lib/image'
import { errorMessage } from '@/lib/supabase'
import { CONDITIONS, createListing, listCategories, type Condition } from '@/services/market'
import { removeImages, uploadImage } from '@/services/storage'

const MAX_PHOTOS = 5

export default function MarketSellPage() {
  const me = useMe()
  const nav = useNavigate()
  const toast = useToast()
  const { data: cats } = useAsync(listCategories, [])
  const [files, setFiles] = useState<{ file: File; url: string }[]>([])
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [price, setPrice] = useState('')
  const [cat, setCat] = useState('')
  const [cond, setCond] = useState<Condition | ''>('')
  const [nego, setNego] = useState(false)
  const [loc, setLoc] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const add = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? [])
    e.target.value = ''
    const next = [...files]
    for (const f of picked) {
      if (next.length >= MAX_PHOTOS) break
      const problem = validateImage(f, { maxBytes: 20 * 1024 * 1024 })
      if (problem) { setErr(problem); continue }
      next.push({ file: f, url: URL.createObjectURL(f) })
    }
    setFiles(next)
  }
  const drop = (i: number) => { URL.revokeObjectURL(files[i].url); setFiles(files.filter((_, k) => k !== i)) }

  const submit = async () => {
    const taka = Number(price || 0)
    if (title.trim().length < 3) return setErr('Write a title (at least 3 letters).')
    if (!Number.isFinite(taka) || taka < 0) return setErr('Enter a valid price.')
    setBusy(true); setErr(null)
    const urls: string[] = []
    try {
      for (const f of files) urls.push(await uploadImage('market-media', me.id, f.file))
      const id = await createListing({ title, description: desc, categoryId: cat || null, condition: cond || null, priceTaka: taka, negotiable: nego, location: loc, imageUrls: urls })
      toast.show('Listing published')
      nav(`/market/${id}`, { replace: true })
    } catch (e) {
      void removeImages('market-media', urls)
      setErr(errorMessage(e)); setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Sell something" back="/market" />
      <div className="stack">
        {err ? <ErrorBanner>{err}</ErrorBanner> : null}
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {files.map((f, i) => (
            <span key={f.url} style={{ position: 'relative', width: 84, height: 84, borderRadius: 12, overflow: 'hidden' }}>
              <img src={f.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button type="button" className="icon-btn" aria-label="Remove photo" onClick={() => drop(i)} style={{ position: 'absolute', top: 2, right: 2, background: '#0008', color: '#fff' }}><X size={14} /></button>
            </span>
          ))}
          {files.length < MAX_PHOTOS ? (
            <label className="btn btn--glass" style={{ cursor: 'pointer', width: 84, height: 84, display: 'grid', placeItems: 'center' }}>
              <ImagePlus size={22} aria-label="Add photos" /><input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={add} />
            </label>
          ) : null}
        </div>
        <input className="input" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="Title" aria-label="Title" />
        <input className="input" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="Price in ৳ (0 = free / ask)" aria-label="Price in taka" />
        <select className="input" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category">
          <option value="">Category</option>
          {(cats ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input" value={cond} onChange={(e) => setCond(e.target.value as Condition | '')} aria-label="Condition">
          <option value="">Condition</option>
          {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <input className="input" value={loc} maxLength={120} onChange={(e) => setLoc(e.target.value)} placeholder="Location (area, city)" aria-label="Location" />
        <textarea className="input" rows={5} maxLength={5000} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Describe the item" aria-label="Description" />
        <label className="row" style={{ gap: 8 }}><input type="checkbox" checked={nego} onChange={(e) => setNego(e.target.checked)} /> Price is negotiable</label>
        <Button variant="primary" onClick={() => void submit()} disabled={busy}>{busy ? 'Publishing…' : 'Publish listing'}</Button>
      </div>
    </>
  )
}
