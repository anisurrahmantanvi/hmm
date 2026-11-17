/** Words the person does not want to see in comments. Matching is local to this device. */
const KEY = 'iconnecto.hiddenWords'
export interface HiddenWords { on: boolean; words: string[] }

export function getHiddenWords(): HiddenWords {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const v = JSON.parse(raw) as Partial<HiddenWords>
      return { on: v.on !== false, words: Array.isArray(v.words) ? v.words.filter((w) => typeof w === 'string') : [] }
    }
  } catch { /* ignore */ }
  return { on: true, words: [] }
}
export function saveHiddenWords(v: HiddenWords): void {
  try { localStorage.setItem(KEY, JSON.stringify(v)) } catch { /* ignore */ }
}
export function matchesHiddenWord(text: string): boolean {
  const { on, words } = getHiddenWords()
  if (!on || !words.length) return false
  const t = text.toLowerCase()
  return words.some((w) => w && t.includes(w))
}
