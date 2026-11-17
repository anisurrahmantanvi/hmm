import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Plus, X, type LucideIcon } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

export interface ArcItem { to: string; icon: LucideIcon; label: string; badge?: number; end?: boolean; create?: boolean }

/** Position on a quarter circle around the bottom-right corner: 0 = straight left, 1 = straight up. */
function place(i: number, n: number, radius: number) {
  const t = n <= 1 ? 0.5 : i / (n - 1)
  const a = (Math.PI / 2) * t
  return { x: -Math.cos(a) * radius, y: -Math.sin(a) * radius }
}

/** Thumb Arc: one round button under the thumb; it opens the whole app as arcs around the finger. */
export function ArcNav({ outer, inner, createTo }: { outer: ArcItem[]; inner: ArcItem[]; createTo: string }) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => { setOpen(false) }, [pathname])
  const outerAll: ArcItem[] = [{ to: createTo, icon: Plus, label: 'Create', create: true }, ...outer]
  const unread = [...outer, ...inner].reduce((n, x) => n + (x.badge ?? 0), 0)

  const ring = (items: ArcItem[], radius: number, tag: string) =>
    items.map((it, i) => {
      const p = place(i, items.length, radius)
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
      <nav className="arc__ring" aria-label="Main navigation" aria-hidden={!open}>
        {ring(outerAll, 175, 'o')}
        {ring(inner, 100, 'i')}
      </nav>
      <button type="button" className="arc__fab" aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((v) => !v)}>
        {open ? <X size={24} aria-hidden /> : <Logo size={30} decorative />}
        {!open && unread > 0 ? <span className="arc__dot" aria-hidden /> : null}
      </button>
    </div>
  )
}
