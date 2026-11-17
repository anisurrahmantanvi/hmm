import { Music } from 'lucide-react'

/** The song a person chose for their profile. It never starts by itself: the visitor taps play. */
export function ProfileMusic({ url, title }: { url: string; title: string | null }) {
  return (
    <div className="glass col" style={{ padding: 10, gap: 6, borderRadius: 14 }}>
      <div className="row" style={{ gap: 8 }}>
        <Music size={18} aria-hidden />
        <span className="grow" style={{ minWidth: 0 }}>
          <strong className="truncate" style={{ display: 'block' }}>{title || 'Profile music'}</strong>
          <span className="small muted">Profile music</span>
        </span>
      </div>
      <audio
        controls
        preload="none"
        src={url}
        style={{ width: '100%' }}
        onPlay={(e) => document.querySelectorAll('audio').forEach((a) => { if (a !== e.currentTarget) a.pause() })}
      />
    </div>
  )
}
