function isWindowUrl(tab, windowUrl) {
  return tab?.url === windowUrl || tab?.pendingUrl === windowUrl;
}

export function matchingPolarisTab(windowInfo, windowUrl, expectedTabId = null) {
  if (windowInfo?.type !== "popup" || !Array.isArray(windowInfo.tabs)) {
    return null;
  }

  if (expectedTabId !== null && expectedTabId !== undefined) {
    const storedTab = windowInfo.tabs.find((tab) => tab?.id === expectedTabId);
    return isWindowUrl(storedTab, windowUrl) ? storedTab : null;
  }

  return windowInfo.tabs.find((tab) => isWindowUrl(tab, windowUrl)) || null;
}

export function restorePopupWindowUpdate() {
  return { state: "normal", focused: true };
}
