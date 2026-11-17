/** Digital wellbeing: counts the time the app is open and visible on this device. Everything stays on the device. */
const USAGE = 'iconnecto.usage'
const PREFS = 'iconnecto.wellbeing'
export interface WellbeingPrefs { breakMin: number; dailyLimitMin: number }
const DEFAULTS: WellbeingPrefs = { breakMin: 0, dailyLimitMin: 0 }

export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function getUsage(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(USAGE) ?? '{}') as Record<string, number> } catch { return {} }
}
export function addUsage(seconds: number): number {
  const u = getUsage()
  const k = dayKey()
  u[k] = (u[k] ?? 0) + seconds
  const keep = Object.keys(u).sort().slice(-14)
  const trimmed: Record<string, number> = {}
  keep.forEach((d) => { trimmed[d] = u[d] })
  try { localStorage.setItem(USAGE, JSON.stringify(trimmed)) } catch { /* ignore */ }
  return trimmed[k]
}
export function getWellbeingPrefs(): WellbeingPrefs {
  try { return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(PREFS) ?? '{}') as Partial<WellbeingPrefs>) } } catch { return DEFAULTS }
}
export function setWellbeingPrefs(p: Partial<WellbeingPrefs>): WellbeingPrefs {
  const next = { ...getWellbeingPrefs(), ...p }
  try { localStorage.setItem(PREFS, JSON.stringify(next)) } catch { /* ignore */ }
  return next
}
export function formatMinutes(sec: number): string {
  const m = Math.round(sec / 60)
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`
}
