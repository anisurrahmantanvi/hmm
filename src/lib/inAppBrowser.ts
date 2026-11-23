import { Capacitor, registerPlugin } from '@capacitor/core'

interface InAppBrowserApi { open(o: { url: string }): Promise<void> }
const plugin = registerPlugin<InAppBrowserApi>('InAppBrowser')

/**
 * Opens an official website. In the Android app it opens a Chrome Custom Tab on top of the app (a real browser, so sign-in,
 * OTP and payment work and Hmm never sees what is typed). On the web it opens a new tab. Only https links are allowed.
 */
export function openWebsite(url: string): void {
  if (!/^https:\/\//i.test(url)) return
  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('InAppBrowser')) {
    plugin.open({ url }).catch(() => { window.open(url, '_blank', 'noopener,noreferrer') })
  } else {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}
