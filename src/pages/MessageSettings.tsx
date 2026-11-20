import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { PageHeader } from '@/components/ui/PageHeader'
import { useToast } from '@/components/ui/Toast'
import { useT } from '@/lib/i18n'
import { SETTINGS_SECTIONS } from '@/pages/settings/settingsMenu'

/** Message settings, opened from the gear in the inbox. The items live in settingsMenu.ts like the rest of Settings. */
export default function MessageSettingsPage() {
  const toast = useToast()
  const { tx } = useT()
  const sections = SETTINGS_SECTIONS.filter((s) => s.title === 'Messaging Settings' || s.title === 'Advanced Chat Features')
  return (
    <>
      <PageHeader title={tx('Message settings')} back="/messages" />
      <div className="stack">
        {sections.map((sec) => (
          <div key={sec.title}>
            <h2 className="section-title">{tx(sec.title)}</h2>
            <GlassPanel className="settings-list" as="nav" aria-label={tx(sec.title)}>
              {sec.items.map((it) =>
                it.to ? (
                  <Link key={it.title} to={it.to} className="list-row">
                    <strong className="grow">{tx(it.title)}</strong>
                    <ChevronRight size={18} className="chev" aria-hidden />
                  </Link>
                ) : (
                  <button key={it.title} type="button" className="list-row" onClick={() => toast.show(tx('Coming soon'))} style={{ width: '100%', textAlign: 'left' }}>
                    <strong className="grow">{tx(it.title)}</strong>
                    <ChevronRight size={18} className="chev" aria-hidden />
                  </button>
                ),
              )}
            </GlassPanel>
            {sec.soon?.length ? (
              <GlassPanel className="settings-list" as="section" aria-label={tx('Coming soon')} style={{ marginTop: 8 }}>
                {sec.soon.map((title) => (
                  <div key={title} className="list-row" aria-disabled="true" style={{ opacity: 0.6 }}>
                    <span className="grow">{tx(title)}</span>
                    <span className="small muted">{tx('Coming soon')}</span>
                  </div>
                ))}
              </GlassPanel>
            ) : null}
          </div>
        ))}
      </div>
    </>
  )
}
