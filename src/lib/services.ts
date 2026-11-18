/** "All in one": inside the app, and official websites of other organisations. Official links only, no payments through iConnecto. */
export interface InternalService { to: string; name: string; hint: string; color: [string, string] }
export interface ExternalService { name: string; hint: string; url: string; host: string; color: [string, string] }
export interface ExternalGroup { title: string; items: ExternalService[] }

export const INTERNAL_SERVICES: InternalService[] = [
  { to: '/market', name: 'Buy & Sell', hint: 'Buy, sell & trade', color: ['#22c55e', '#0fa968'] },
  { to: '/pages', name: 'Pages', hint: 'Manage your pages', color: ['#5b5bf0', '#8b5cf6'] },
  { to: '/communities', name: 'Communities', hint: 'Join your community', color: ['#0a84ff', '#3aa0ff'] },
  { to: '/messages', name: 'iConnecto AI', hint: 'Ask anything, free', color: ['#111111', '#555555'] },
]

export const EXTERNAL_GROUPS: ExternalGroup[] = [
  {
    title: 'Train',
    items: [{ name: 'Bangladesh Railway', hint: 'Official e-ticket', url: 'https://eticket.railway.gov.bd/', host: 'eticket.railway.gov.bd', color: ['#0a7a4b', '#13a66a'] }],
  },
  {
    title: 'Bus',
    items: [
      { name: 'BRTC', hint: 'Bangladesh Road Transport Corporation', url: 'https://www.brtc.gov.bd/', host: 'brtc.gov.bd', color: ['#e5484d', '#ff7a59'] },
      { name: 'Shohoz', hint: 'Bus tickets (private company)', url: 'https://www.shohoz.com/', host: 'shohoz.com', color: ['#7c3aed', '#a78bfa'] },
    ],
  },
  {
    title: 'Air',
    items: [{ name: 'Biman Bangladesh', hint: 'National airline', url: 'https://www.biman-airlines.com/', host: 'biman-airlines.com', color: ['#0a84ff', '#2563eb'] }],
  },
  {
    title: 'Government',
    items: [
      { name: 'NID services', hint: 'Election Commission', url: 'https://services.nidw.gov.bd/', host: 'services.nidw.gov.bd', color: ['#0f766e', '#14b8a6'] },
      { name: 'e-Passport', hint: 'Passport application', url: 'https://www.epassport.gov.bd/', host: 'epassport.gov.bd', color: ['#1d4ed8', '#3b82f6'] },
      { name: 'Birth registration', hint: 'BDRIS', url: 'https://bdris.gov.bd/', host: 'bdris.gov.bd', color: ['#b45309', '#f59e0b'] },
      { name: 'National portal', hint: 'Government services', url: 'https://bangladesh.gov.bd/', host: 'bangladesh.gov.bd', color: ['#166534', '#22c55e'] },
    ],
  },
]
