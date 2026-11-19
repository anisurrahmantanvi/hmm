import { useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImagePlus, X } from 'lucide-react'
import { useMe } from '@/app/AuthProvider'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/Feedback'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { PageHeader } from '@/components/ui/PageHeader'
import { useToast } from '@/components/ui/Toast'
import { validateImage } from '@/lib/image'
import { errorMessage } from '@/lib/supabase'
import { uploadImage, removeImages } from '@/services/storage'
import { createStory } from '@/services/stories'

const COLORS = ['#0b0b0c', '#1d4ed8', '#047857', '#b45309', '#be123c', '#6d28d9']

/** Make a story: a photo (with optional caption) or a text card on a colour. Lasts 24 hours; friends can see it. */
export default function StoryCreatePage() {
  const me = useMe()
  const nav = useNavigate()
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [bg, setBg] = useState(COLORS[0])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const problem = validateImage(f, { maxBytes: 20 * 1024 * 1024 })
    if (problem) return setErr(problem)
    setErr(null)
    if (preview) URL.revokeObjectURL(preview)
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }
  const clear = () => { if (preview) URL.revokeObjectURL(preview); setFile(null); setPreview(null) }

  const share = async () => {
    if (!file && !text.trim()) return setErr('Add a photo or write something.')
    setBusy(true)
    setErr(null)
    let url: string | null = null
    try {
      if (file) url = await uploadImage('post-media', me.id, file)
      await createStory({ imageUrl: url, body: text, bg })
      toast.show('Story shared for 24 hours')
      nav('/', { replace: true })
    } catch (e) {
      if (url) void removeImages('post-media', [url])
      setErr(errorMessage(e))
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="New story" back />
      <div className="stack">
        {err ? <ErrorBanner>{err}</ErrorBanner> : null}
        <GlassPanel padded>
          <div style={{ position: 'relative', aspectRatio: '9 / 16', maxHeight: '60vh', margin: '0 auto', borderRadius: 16, overflow: 'hidden', background: bg, display: 'grid', placeItems: 'center' }}>
            {preview ? <img src={preview} alt="Story preview" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
            {text ? <p style={{ position: 'relative', color: '#fff', fontSize: 22, fontWeight: 700, textAlign: 'center', padding: 20, textShadow: preview ? '0 1px 4px rgba(0,0,0,.7)' : undefined, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{text}</p> : <span style={{ color: '#fff9' }}>{preview ? '' : 'Preview'}</span>}
            {preview ? <button type="button" className="icon-btn" aria-label="Remove photo" onClick={clear} style={{ position: 'absolute', top: 8, right: 8, background: '#0008', color: '#fff' }}><X size={18} /></button> : null}
          </div>
        </GlassPanel>
        <textarea className="input" rows={3} maxLength={300} value={text} onChange={(e) => setText(e.target.value)} placeholder={file ? 'Add a caption' : 'Write something'} aria-label="Story text" />
        {!file ? (
          <div className="row" role="group" aria-label="Background colour" style={{ gap: 10 }}>
            {COLORS.map((c) => (
              <button key={c} type="button" aria-label={`Colour ${c}`} aria-pressed={bg === c} onClick={() => setBg(c)} style={{ width: 30, height: 30, borderRadius: '50%', background: c, border: bg === c ? '3px solid var(--accent)' : '2px solid #8886' }} />
            ))}
          </div>
        ) : null}
        <div className="row" style={{ gap: 10 }}>
          <label className="btn btn--glass" style={{ cursor: 'pointer' }}>
            <ImagePlus size={18} aria-hidden /> {file ? 'Change photo' : 'Add photo'}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} hidden />
          </label>
          <Button variant="primary" onClick={() => void share()} disabled={busy}>{busy ? 'Sharing…' : 'Share story'}</Button>
        </div>
        <p className="small muted">Your friends can see it for 24 hours.</p>
      </div>
    </>
  )
}
