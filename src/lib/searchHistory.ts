/** Recent searches, kept on this device only. */
const KEY = 'iconnecto.searchHistory'
const OFF = 'iconnecto.searchHistoryOff'
export const isHistoryOn = () => { try { return localStorage.getItem(OFF) !== '1' } catch { return true } }
export function setHistoryOn(on: boolean): void { try { if (on) localStorage.removeItem(OFF); else { localStorage.setItem(OFF, '1'); localStorage.removeItem(KEY) } } catch { /* ignore */ } }
export function getSearchHistory(): string[] {
  try { const v = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown; return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [] } catch { return [] }
}
function save(list: string[]) { try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 15))) } catch { /* ignore */ } }
export function addSearch(q: string): void {
  const t = q.trim()
  if (t.length < 2 || !isHistoryOn()) return
  save([t, ...getSearchHistory().filter((x) => x.toLowerCase() !== t.toLowerCase())])
}
export function removeSearch(q: string): void { save(getSearchHistory().filter((x) => x !== q)) }
export function clearSearchHistory(): void { save([]) }
