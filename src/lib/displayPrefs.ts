/** Per-device display and media preferences (Accessibility & Media settings). Stored in localStorage. */
export interface DisplayPrefs {
  fontSize: 'small' | 'normal' | 'large' | 'xlarge'
  reducedMotion: boolean
  highContrast: boolean
  dataSaver: boolean
  reelsAutoplay: boolean
  /** Flat, minimal look without frosted-glass boxes. On by default. */
  minimal: boolean
}
const KEY = 'iconnecto.displayPrefs'
export const DEFAULTS: DisplayPrefs = { fontSize: 'normal', reducedMotion: false, highContrast: false, dataSaver: false, reelsAutoplay: true, minimal: true }
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
}

export function setDisplayPrefs(patch: Partial<DisplayPrefs>): DisplayPrefs {
  const next = { ...getDisplayPrefs(), ...patch }
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* ignore */ }
  applyDisplayPrefs(next)
  return next
}
