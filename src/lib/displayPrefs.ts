import { useEffect, useState } from 'react'

/** Per-device display and media preferences (Accessibility & Media settings). Stored in localStorage. */
export interface DisplayPrefs {
  fontSize: 'small' | 'normal' | 'large' | 'xlarge'
  reducedMotion: boolean
  highContrast: boolean
  dataSaver: boolean
  reelsAutoplay: boolean
  /** Flat, minimal look without frosted-glass boxes. On by default. */
  minimal: boolean
  /** App layout: 'arc' = Thumb Arc (new), 'classic' = sidebar / bottom bar. null = not chosen yet. */
  layout: 'arc' | 'classic' | null
}
const KEY = 'iconnecto.displayPrefs'
export const DEFAULTS: DisplayPrefs = { fontSize: 'normal', reducedMotion: false, highContrast: false, dataSaver: false, reelsAutoplay: true, minimal: true, layout: null }
const SCALE = { small: 0.92, normal: 1, large: 1.12, xlarge: 1.25 }

export function getDisplayPrefs(): DisplayPrefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<DisplayPrefs>) }
  } catch { /* ignore */ }
  return DEFAULTS
}

export function applyDisplayPrefs(p: DisplayPrefs = getDisplayPrefs()): void {
  const r = document.documentElement
  r.style.setProperty('--fs', String(SCALE[p.fontSize] ?? 1))
  r.classList.toggle('reduce-motion', p.reducedMotion)
  r.classList.toggle('high-contrast', p.highContrast)
  r.classList.toggle('data-saver', p.dataSaver)
  r.classList.toggle('minimal', p.minimal)
  r.classList.toggle('arc', p.layout === 'arc')
}

export function setDisplayPrefs(patch: Partial<DisplayPrefs>): DisplayPrefs {
  const next = { ...getDisplayPrefs(), ...patch }
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* ignore */ }
  applyDisplayPrefs(next)
  try { window.dispatchEvent(new Event('iconnecto:display')) } catch { /* ignore */ }
  return next
}

/** Re-renders when the display preferences change (for example after choosing a layout). */
export function useDisplayPrefs(): DisplayPrefs {
  const [p, setP] = useState(getDisplayPrefs)
  useEffect(() => {
    const on = () => setP(getDisplayPrefs())
    window.addEventListener('iconnecto:display', on)
    return () => window.removeEventListener('iconnecto:display', on)
  }, [])
  return p
}
