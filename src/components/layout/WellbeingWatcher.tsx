import { useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import { addUsage, getWellbeingPrefs } from '@/lib/wellbeing'

/** Counts open-and-visible time, and shows the break and daily-limit reminders chosen in Settings. */
export function WellbeingWatcher() {
  const toast = useToast()
  useEffect(() => {
    let session = 0 // continuous seconds since the last break reminder
    let limitShown = false
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') { session = 0; return }
      const today = addUsage(15)
      session += 15
      const p = getWellbeingPrefs()
      if (p.breakMin > 0 && session >= p.breakMin * 60) {
        session = 0
        toast.show(`You have been using Hmm for ${p.breakMin} minutes. Time for a short break?`)
      }
      if (p.dailyLimitMin > 0 && today >= p.dailyLimitMin * 60 && !limitShown) {
        limitShown = true
        toast.show(`You reached your daily limit of ${p.dailyLimitMin} minutes today.`)
      }
    }, 15000)
    return () => window.clearInterval(id)
  }, [toast])
  return null
}
