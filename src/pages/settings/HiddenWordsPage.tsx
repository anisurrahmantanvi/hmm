import { useState } from 'react'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { PageHeader } from '@/components/ui/PageHeader'
import { getHiddenWords, saveHiddenWords, type HiddenWords } from '@/lib/hiddenWords'

/** Comments containing these words are collapsed ("Hidden comment") until you tap Show. */
export default function HiddenWordsPage() {
  const [v, setV] = useState<HiddenWords>(getHiddenWords)
  const [draft, setDraft] = useState('')
  const update = (next: HiddenWords) => { setV(next); saveHiddenWords(next) }
  const add = () => {
    const w = draft.trim().toLowerCase()
    if (!w || v.words.includes(w)) { setDraft(''); return }
    update({ ...v, words: [...v.words, w].slice(0, 100) })
    setDraft('')
  }
  return (
    <>
      <PageHeader title="Hidden words" back />
      <div className="stack">
        <GlassPanel className="settings-list">
          <div className="list-row">
            <span className="grow"><strong style={{ display: 'block' }}>Hide comments with these words</strong><span className="small muted">Matching comments are collapsed. You can still tap Show.</span></span>
            <span className="switch"><input type="checkbox" role="switch" aria-label="Hide comments with these words" checked={v.on} onChange={(e) => update({ ...v, on: e.target.checked })} /><span className="switch__track" aria-hidden /></span>
          </div>
        </GlassPanel>
        <GlassPanel padded className="col">
          <form onSubmit={(e) => { e.preventDefault(); add() }} style={{ display: 'flex', gap: 8 }}>
            <input className="input" style={{ flex: 1 }} value={draft} maxLength={40} placeholder="Add a word or phrase" aria-label="Word to hide" onChange={(e) => setDraft(e.target.value)} />
            <button type="submit" className="btn btn--primary" disabled={!draft.trim()}>Add</button>
          </form>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {v.words.length ? v.words.map((w) => (
              <button key={w} type="button" className="chip" aria-label={`Remove ${w}`} onClick={() => update({ ...v, words: v.words.filter((x) => x !== w) })}>{w} ✕</button>
            )) : <span className="small muted">No words yet.</span>}
          </div>
        </GlassPanel>
        <p className="small muted">Saved on this device only. Matching ignores upper and lower case.</p>
      </div>
    </>
  )
}
