import { setDisplayPrefs } from '@/lib/displayPrefs'

/** Shown once, the first time someone opens the app: pick how it is laid out. Can be changed later in Settings. */
export function LayoutChooser() {
  return (
    <div className="chooser" role="dialog" aria-modal="true" aria-label="Choose your layout">
      <div className="chooser__box">
        <h2>Choose your layout</h2>
        <p className="muted small">You can change this anytime in Settings → Accessibility &amp; Media.</p>
        <button type="button" className="chooser__opt" onClick={() => setDisplayPrefs({ layout: 'arc' })}>
          <span className="chooser__pic chooser__pic--arc" aria-hidden><i /><i /><i /><b /></span>
          <span><strong>Thumb Arc</strong><span className="small muted" style={{ display: 'block' }}>New. One round button opens the app around your thumb. Full-screen posts.</span></span>
        </button>
        <button type="button" className="chooser__opt" onClick={() => setDisplayPrefs({ layout: 'classic' })}>
          <span className="chooser__pic chooser__pic--classic" aria-hidden><i /><i /><i /><u /></span>
          <span><strong>Classic</strong><span className="small muted" style={{ display: 'block' }}>The familiar look with a bar at the bottom.</span></span>
        </button>
      </div>
    </div>
  )
}
