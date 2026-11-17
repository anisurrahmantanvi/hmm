import { useEffect, useRef, useState } from 'react'
import { useMe } from '@/app/AuthProvider'
import { Button } from '@/components/ui/Button'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { PageHeader } from '@/components/ui/PageHeader'
import { useToast } from '@/components/ui/Toast'
import { ProfileMusic } from '@/components/profile/ProfileMusic'
import { ACCENTS, THEMES } from '@/lib/profileThemes'
import { errorMessage } from '@/lib/supabase'
import { uploadAudio } from '@/services/music'
import { DEFAULT_STYLE, getProfileStyle, saveProfileStyle, type ProfileStyle } from '@/services/profileStyle'
import { removeImages, uploadImage } from '@/services/storage'

/** Theme, accent colour, background photo, layout, display options and music of your own profile. */
export default function ProfileCustomizationPage() {
  const me = useMe()
  const toast = useToast()
  const [st, setSt] = useState<ProfileStyle>(DEFAULT_STYLE)
  const [installed, setInstalled] = useState(true)
  const [busy, setBusy] = useState(false)
  const bg = useRef<HTMLInputElement>(null)
  const music = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let off = false
    void getProfileStyle(me.id).then((r) => { if (!off) { setSt(r.style); setInstalled(r.installed) } })
    return () => { off = true }
  }, [me.id])

  const change = async (patch: Partial<ProfileStyle>) => {
    const before = st
    setSt({ ...st, ...patch })
    try { await saveProfileStyle(me.id, patch) } catch (e) { setSt(before); toast.error(errorMessage(e)) }
  }
  const pickBackground = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    try {
      const url = await uploadImage('covers', me.id, file)
      const old = st.background_url
      await change({ background_url: url })
      if (old) void removeImages('covers', [old])
    } catch (e) { toast.error(errorMessage(e)) } finally { setBusy(false); if (bg.current) bg.current.value = '' }
  }
  const pickMusic = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    try {
      const a = await uploadAudio(me.id, file)
      await change({ music_url: a.audio_url, music_title: a.title.slice(0, 80) })
      toast.show('Profile music saved')
    } catch (e) { toast.error(errorMessage(e)) } finally { setBusy(false); if (music.current) music.current.value = '' }
  }

  const Switch = ({ title, hint, checked, onChange }: { title: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div className="list-row">
      <span className="grow"><strong style={{ display: 'block' }}>{title}</strong><span className="small muted">{hint}</span></span>
      <span className="switch"><input type="checkbox" role="switch" aria-label={title} checked={checked} onChange={(e) => onChange(e.target.checked)} /><span className="switch__track" aria-hidden /></span>
    </div>
  )

  return (
    <>
      <PageHeader title="Profile customization" back />
      <div className="stack">
        {!installed ? <p className="small muted" role="status">Profile customization will be available after the next database update.</p> : null}

        <GlassPanel padded className="col">
          <strong>Theme</strong>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
            {THEMES.map((t) => (
              <button key={t.id} type="button" className="chip" aria-pressed={st.theme === t.id} disabled={!installed} onClick={() => void change({ theme: t.id })}>{t.label}</button>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel padded className="col">
          <strong>Accent colour</strong>
          <span className="small muted">Buttons and links on your profile use this colour.</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 10 }}>
            <button type="button" className="chip" aria-pressed={!st.accent} disabled={!installed} onClick={() => void change({ accent: null })}>Default</button>
            {ACCENTS.map((c) => (
              <button key={c} type="button" aria-label={`Accent ${c}`} aria-pressed={st.accent === c} disabled={!installed} onClick={() => void change({ accent: c })}
                style={{ width: 40, height: 40, borderRadius: '50%', background: c, border: st.accent === c ? '3px solid var(--text)' : '2px solid transparent', cursor: 'pointer' }} />
            ))}
          </div>
        </GlassPanel>

        <GlassPanel padded className="col">
          <strong>Background photo</strong>
          <span className="small muted">Shown behind your profile. Keep it simple so text stays readable.</span>
          {st.background_url ? <img src={st.background_url} alt="" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 12, marginTop: 10 }} /> : null}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <Button variant="glass" loading={busy} disabled={!installed} onClick={() => bg.current?.click()}>{st.background_url ? 'Change photo' : 'Choose photo'}</Button>
            {st.background_url ? <Button variant="ghost" disabled={busy} onClick={() => { const old = st.background_url; void change({ background_url: null }).then(() => { if (old) void removeImages('covers', [old]) }) }}>Remove</Button> : null}
          </div>
          <input ref={bg} type="file" accept="image/*" hidden onChange={(e) => void pickBackground(e.target.files?.[0])} />
        </GlassPanel>

        <GlassPanel className="settings-list">
          <div className="list-row" style={{ display: 'block' }}>
            <strong style={{ display: 'block' }}>Layout</strong>
            <span className="small muted">Where the About card goes on your profile.</span>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button type="button" className={st.layout === 'classic' ? 'btn btn--primary' : 'btn'} disabled={!installed} aria-pressed={st.layout === 'classic'} onClick={() => void change({ layout: 'classic' })}>About first</button>
              <button type="button" className={st.layout === 'about_last' ? 'btn btn--primary' : 'btn'} disabled={!installed} aria-pressed={st.layout === 'about_last'} onClick={() => void change({ layout: 'about_last' })}>Posts first</button>
            </div>
          </div>
          <Switch title="Show About card" hint="Work, education, location and joining date." checked={st.show_about} onChange={(v) => void change({ show_about: v })} />
          <Switch title="Show Reels strip" hint="Your reels above your posts." checked={st.show_reels} onChange={(v) => void change({ show_reels: v })} />
        </GlassPanel>

        <GlassPanel padded className="col">
          <strong>Profile music</strong>
          <span className="small muted">Visitors can tap play. It never starts by itself. MP3, M4A, AAC, OGG or WAV up to 8 MB. Only use music you have the right to share.</span>
          {st.music_url ? <div style={{ marginTop: 10 }}><ProfileMusic url={st.music_url} title={st.music_title} /></div> : null}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <Button variant="glass" loading={busy} disabled={!installed} onClick={() => music.current?.click()}>{st.music_url ? 'Change music' : 'Choose music'}</Button>
            {st.music_url ? <Button variant="ghost" disabled={busy} onClick={() => void change({ music_url: null, music_title: null })}>Remove</Button> : null}
          </div>
          <input ref={music} type="file" accept="audio/*" hidden onChange={(e) => void pickMusic(e.target.files?.[0])} />
        </GlassPanel>
      </div>
    </>
  )
}
