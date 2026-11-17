import { useState } from 'react'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { PageHeader } from '@/components/ui/PageHeader'
import { dayKey, formatMinutes, getUsage, getWellbeingPrefs, setWellbeingPrefs } from '@/lib/wellbeing'

const BREAKS = [0, 15, 30, 60]
const LIMITS = [0, 30, 60, 120, 180]
const label = (m: number) => (m === 0 ? 'Off' : m >= 60 ? `${m / 60} h` : `${m} min`)

/** Daily usage on this device and optional break / daily-limit reminders. */
export default function WellbeingPage() {
  const [p, setP] = useState(getWellbeingPrefs)
  const usage = getUsage()
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d })
  const max = Math.max(60, ...days.map((d) => usage[dayKey(d)] ?? 0))
  const choose = (title: string, hint: string, list: number[], value: number, key: 'breakMin' | 'dailyLimitMin') => (
    <div className="list-row" style={{ display: 'block' }}>
      <strong style={{ display: 'block' }}>{title}</strong><span className="small muted">{hint}</span>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        {list.map((m) => <button key={m} type="button" className={value === m ? 'btn btn--primary' : 'btn'} aria-pressed={value === m} onClick={() => setP(setWellbeingPrefs({ [key]: m }))}>{label(m)}</button>)}
      </div>
    </div>
  )
  return (
    <>
      <PageHeader title="Digital wellbeing" back />
      <div className="stack">
        <GlassPanel padded className="col">
          <strong>Today: {formatMinutes(usage[dayKey()] ?? 0)}</strong>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 120, marginTop: 14 }}>
            {days.map((d) => {
              const s = usage[dayKey(d)] ?? 0
              return (
                <div key={dayKey(d)} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ height: Math.max(4, (s / max) * 90), borderRadius: 6, background: 'linear-gradient(180deg,#3b82ff,#7a5cff)' }} title={formatMinutes(s)} />
                  <span className="small muted">{d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2)}</span>
                </div>
              )
            })}
          </div>
        </GlassPanel>
        <GlassPanel className="settings-list">
          {choose('Break reminder', 'A gentle reminder after this much continuous use.', BREAKS, p.breakMin, 'breakMin')}
          {choose('Daily limit reminder', 'A reminder when you reach this much time in a day.', LIMITS, p.dailyLimitMin, 'dailyLimitMin')}
        </GlassPanel>
        <p className="small muted">Time is counted only while iConnecto is open on this device and is saved on this device only. It does not block the app.</p>
      </div>
    </>
  )
}
