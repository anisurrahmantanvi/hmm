import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Plus, X, type LucideIcon } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

export interface ArcItem { to: string; icon: LucideIcon; label: string; badge?: number; end?: boolean; create?: boolean }

type Side = 'left' | 'right'
interface Spot { side: Side; bottom: number }
const SPOT_KEY = 'iconnecto.arcSpot'
const FAB = 60
const EDGE = 16

function loadSpot(): Spot {
  try {
    const v = JSON.parse(localStorage.getItem(SPOT_KEY) ?? 'null') as Spot | null
    if (v && (v.side === 'left' || v.side === 'right') && Number.isFinite(v.bottom)) return v
  } catch { /* ignore */ }
  return { side: 'right', bottom: 18 }
}
const clampBottom = (b: number) => Math.max(EDGE, Math.min(window.innerHeight - FAB - 80, b))

/** Position on a quarter circle around the button. sx: -1 opens towards the left, 1 towards the right; sy: -1 opens upwards, 1 downwards. */
function place(i: number, n: number, radius: number, sx: number, sy: number) {
  const t = n <= 1 ? 0.5 : i / (n - 1)
  const a = (Math.PI / 2) * t
  return { x: sx * Math.cos(a) * radius, y: sy * Math.sin(a) * radius }
}

/** Thumb Arc: one round button under the thumb; it opens the whole app as arcs around the finger. */
export function ArcNav({ outer, inner, createTo }: { outer: ArcItem[]; inner: ArcItem[]; createTo: string }) {
  const [open, setOpen] = useState(false)
  const [spot, setSpot] = useState<Spot>(loadSpot)
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null)
  const moved = useRef(false)
  const start = useRef<{ x: number; y: number } | null>(null)
  const { pathname } = useLocation()
  useEffect(() => { setOpen(false) }, [pathname])
  const outerAll: ArcItem[] = [{ to: createTo, icon: Plus, label: 'Create', create: true }, ...outer]
  const unread = [...outer, ...inner].reduce((n, x) => n + (x.badge ?? 0), 0)

  const sx = spot.side === 'right' ? -1 : 1
  const centerY = window.innerHeight - spot.bottom - FAB / 2
  const sy = centerY < 330 ? 1 : -1 // near the top: open downwards

  const right = spot.side === 'right'
  const ringStyle: CSSProperties = {
    left: right ? 'auto' : EDGE + FAB / 2,
    right: right ? EDGE + FAB / 2 : 'auto',
    bottom: `calc(${spot.bottom + FAB / 2}px + var(--safe-bottom))`,
  }
  const fabStyle: CSSProperties = drag
    ? { left: drag.x - FAB / 2, top: drag.y - FAB / 2, right: 'auto', bottom: 'auto' }
    : { left: right ? 'auto' : EDGE, right: right ? EDGE : 'auto', bottom: `calc(${spot.bottom}px + var(--safe-bottom))` }

  const onDown = (e: RPointerEvent<HTMLButtonElement>) => {
    start.current = { x: e.clientX, y: e.clientY }
    moved.current = false
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onMove = (e: RPointerEvent<HTMLButtonElement>) => {
    const s0 = start.current
    if (!s0) return
    if (!moved.current && Math.hypot(e.clientX - s0.x, e.clientY - s0.y) < 10) return
    moved.current = true
    setOpen(false)
    setDrag({ x: e.clientX, y: e.clientY })
  }
  const onUp = (e: RPointerEvent<HTMLButtonElement>) => {
    start.current = null
    if (!moved.current) return
    const next: Spot = { side: e.clientX < window.innerWidth / 2 ? 'left' : 'right', bottom: clampBottom(window.innerHeight - e.clientY - FAB / 2) }
    setSpot(next)
    setDrag(null)
    try { localStorage.setItem(SPOT_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }

  const ring = (items: ArcItem[], radius: number, tag: string) =>
    items.map((it, i) => {
      const p = place(i, items.length, radius, sx, sy)
      const Icon = it.icon
      return (
        <NavLink
          key={tag + it.to}
          to={it.to}
          end={it.end}
          className={`arc__item ${it.create ? 'arc__item--create' : ''}`}
          style={{ ['--x' as string]: `${p.x}px`, ['--y' as string]: `${p.y}px`, ['--d' as string]: `${i * 28}ms` }}
          onClick={() => setOpen(false)}
        >
          <Icon size={22} aria-hidden />
          <span className="sr-only">{it.label}</span>
          {(it.badge ?? 0) > 0 ? <span className="arc__badge" aria-label={`${it.badge} unread`}>{(it.badge ?? 0) > 99 ? '99+' : it.badge}</span> : null}
        </NavLink>
      )
    })

  return (
    <div className={`arc ${open ? 'arc--open' : ''}`}>
      {open ? <button type="button" className="arc__scrim" aria-label="Close menu" onClick={() => setOpen(false)} /> : null}
      <nav
        className="arc__ring"
        aria-label="Main navigation"
        aria-hidden={!open}
        style={ringStyle}
      >
        {ring(outerAll, 192, 'o')}
        {ring(inner, 100, 'i')}
      </nav>
      <button
        type="button"
        className={`arc__fab ${drag ? 'arc__fab--drag' : ''}`}
        style={fabStyle}
        aria-expanded={open}
        aria-label={open ? 'Close menu' : 'Open menu (drag to move)'}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => { start.current = null; setDrag(null) }}
        onClick={() => { if (!moved.current) setOpen((v) => !v) }}
      >
        {open ? <X size={24} aria-hidden /> : <Logo size={30} decorative />}
        {!open && unread > 0 ? <span className="arc__dot" aria-hidden /> : null}
      </button>
    </div>
  )
}
