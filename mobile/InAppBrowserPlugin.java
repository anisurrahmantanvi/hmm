package com.iconnecto.app;

import android.net.Uri;

import androidx.browser.customtabs.CustomTabsIntent;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Opens a website in a Chrome Custom Tab: the real browser, shown on top of the app, so sign-in, OTP and payment pages work
 * and Hmm never sees what the person types there. Only https links are opened.
 */
@CapacitorPlugin(name = "InAppBrowser")
public class InAppBrowserPlugin extends Plugin {
  @PluginMethod
  public void open(PluginCall call) {
    String url = call.getString("url", "");
    if (url == null || !url.startsWith("https://")) {
      call.reject("Only https links can be opened.");
      return;
    }
    try {
      CustomTabsIntent tab = new CustomTabsIntent.Builder().setShowTitle(true).build();
      getActivity().runOnUiThread(() -> {
        try {
          tab.launchUrl(getActivity(), Uri.parse(url));
          call.resolve();
        } catch (Exception e) {
          call.reject(e.getMessage());
        }
      });
    } catch (Exception e) {
      call.reject(e.getMessage());
    }
  }
}
