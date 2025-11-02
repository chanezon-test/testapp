// Background service worker for Criterion RT Extension

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open options page on first install
    chrome.runtime.openOptionsPage();
  }
});

// Handle messages from content scripts if needed
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Future: Could handle API requests here to avoid CORS issues
  return true;
});
