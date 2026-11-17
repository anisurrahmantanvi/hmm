import { useState } from 'react'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { PageHeader } from '@/components/ui/PageHeader'
import { clearSearchHistory, getSearchHistory, isHistoryOn, removeSearch, setHistoryOn } from '@/lib/searchHistory'

export default function SearchHistoryPage() {
  const [on, setOn] = useState(isHistoryOn)
  const [list, setList] = useState(getSearchHistory)
  return (
    <>
      <PageHeader title="Search history" back />
      <div className="stack">
        <GlassPanel className="settings-list">
          <div className="list-row">
            <span className="grow"><strong style={{ display: 'block' }}>Save search history</strong><span className="small muted">Recent searches appear under the search box. Turning it off deletes them.</span></span>
            <span className="switch"><input type="checkbox" role="switch" aria-label="Save search history" checked={on} onChange={(e) => { setHistoryOn(e.target.checked); setOn(e.target.checked); setList(getSearchHistory()) }} /><span className="switch__track" aria-hidden /></span>
          </div>
        </GlassPanel>
        <GlassPanel className="settings-list">
          {list.length ? list.map((r) => (
            <div key={r} className="list-row"><span className="grow truncate">{r}</span><button type="button" className="btn btn--sm" onClick={() => { removeSearch(r); setList(getSearchHistory()) }}>Remove</button></div>
          )) : <p className="small muted" style={{ padding: 16 }}>No recent searches.</p>}
        </GlassPanel>
        {list.length ? <button type="button" className="btn btn--block" onClick={() => { clearSearchHistory(); setList([]) }}>Clear all</button> : null}
        <p className="small muted">Saved on this device only.</p>
      </div>
    </>
  )
}
