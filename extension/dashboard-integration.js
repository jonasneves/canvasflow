/**
 * Dashboard Integration Module
 * Drop this file into any extension to make it openable from Extensions Dashboard
 *
 * Usage in background.js:
 *   importScripts('path/to/dashboard-integration.js');
 *
 * Or ES modules:
 *   import './dashboard-integration.js';
 */

(function() {
  chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    // Ping action - just check if integration is present (no user gesture needed)
    if (request.action === 'ping') {
      sendResponse({ success: true, integrated: true });
      return false;
    }

    if (request.action === 'openPopup' || request.action === 'openPanel' || request.action === 'open') {
      const manifest = chrome.runtime.getManifest();

      if (manifest.side_panel) {
        chrome.windows.getCurrent((window) => {
          chrome.sidePanel.open({ windowId: window.id })
            .then(() => sendResponse({ success: true }))
            .catch((error) => {
              console.error('Dashboard integration error:', error);
              sendResponse({ success: false, error: error.message });
            });
        });
      } else if (manifest.action?.default_popup) {
        chrome.action.openPopup()
          .then(() => sendResponse({ success: true }))
          .catch((error) => {
            console.error('Dashboard integration error:', error);
            sendResponse({ success: false, error: error.message });
          });
      } else if (manifest.options_ui || manifest.options_page) {
        const optionsUrl = manifest.options_ui?.page || manifest.options_page;
        chrome.tabs.create({ url: chrome.runtime.getURL(optionsUrl) })
          .then(() => sendResponse({ success: true }))
          .catch((error) => {
            console.error('Dashboard integration error:', error);
            sendResponse({ success: false, error: error.message });
          });
      } else {
        sendResponse({ success: false, error: 'No UI to open' });
      }

      return true;
    }
  });

  console.log('Dashboard integration enabled');
})();
