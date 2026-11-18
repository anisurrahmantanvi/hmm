import { Capacitor, registerPlugin } from '@capacitor/core'

/**
 * TEST ADS ONLY. Uses Google's public demo ad unit, so nothing here earns money and nothing can harm an AdMob account.
 * Real ad units are added later, after the privacy policy, consent screen and Play Data safety form are updated.
 * Works only in the Android app; does nothing on the web.
 */
interface AdMobApi {
  initialize(o: { initializeForTesting: boolean }): Promise<void>
  showBanner(o: { adId: string; adSize: string; position: string; margin: number; isTesting: boolean }): Promise<void>
  removeBanner(): Promise<void>
}
const AdMob = registerPlugin<AdMobApi>('AdMob')
const KEY = 'iconnecto.testAds'
const GOOGLE_DEMO_BANNER = 'ca-app-pub-3940256099942544/6300978111'

export const adsAvailable = () => Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('AdMob')

export function testAdsOn(): boolean {
  try { return localStorage.getItem(KEY) === '1' } catch { return false }
}

let ready = false
export async function showTestBanner(): Promise<void> {
  if (!adsAvailable()) return
  try {
    if (!ready) { await AdMob.initialize({ initializeForTesting: true }); ready = true }
    await AdMob.showBanner({ adId: GOOGLE_DEMO_BANNER, adSize: 'ADAPTIVE_BANNER', position: 'BOTTOM_CENTER', margin: 0, isTesting: true })
  } catch { /* ignore: ads are optional */ }
}

export async function hideTestBanner(): Promise<void> {
  if (!adsAvailable()) return
  try { await AdMob.removeBanner() } catch { /* ignore */ }
}

export async function setTestAds(on: boolean): Promise<void> {
  try { localStorage.setItem(KEY, on ? '1' : '0') } catch { /* ignore */ }
  if (on) await showTestBanner()
  else await hideTestBanner()
}
