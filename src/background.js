import { matchingPolarisTab, restorePopupWindowUpdate } from "./window-lifecycle.js";

const WINDOW_STORAGE_KEY = "polaris-window-id";
const WINDOW_TAB_STORAGE_KEY = "polaris-window-tab-id";
const SOURCE_WINDOW_STORAGE_KEY = "polaris-source-window-id";
const SOURCE_TAB_STORAGE_KEY = "polaris-source-tab-id";
const DEFAULT_WINDOW = {
  type: "popup",
  width: 420,
  height: 760,
  focused: true,
  url: "polaris-home.html"
};

let polarisWindowId = null;
let polarisWindowTabId = null;
let lastNormalWindowId = null;
let currentTabId = null;
let latestSnapshot = null;

function isSupportedCandidateUrl(url) {
  try {
    const hostname = new URL(url || "").hostname;
    return [
      "chatgpt.com",
      "chat.openai.com",
      "claude.ai",
      "gemini.google.com",
      "grok.com",
      "www.doubao.com",
      "www.kimi.com",
      "kimi.com",
      "www.qianwen.com",
      "qianwen.com",
      "yb.tencent.com",
      "yuanbao.tencent.com",
      "diandian.xiaohongshu.com",
      "www.xiaohongshu.com",
      "www.askdiandian.com",
      "www.diandianlife.top"
    ].some((supported) => hostname === supported || hostname.endsWith(`.${supported}`));
  } catch {
    return false;
  }
}

function isPolarisTab(tab) {
  if (!tab || tab.id === undefined) {
    return false;
  }
  if (tab.id === polarisWindowTabId) {
    return true;
  }
  return tab.url === chrome.runtime.getURL("polaris-home.html");
}

function isNormalSourceTab(tab) {
  return Boolean(tab?.id !== undefined && tab.windowId !== polarisWindowId && !isPolarisTab(tab));
}

async function publishEmptySnapshot(tabId, supportedRoute = false) {
  const stored = await chrome.storage.sync.get("gpt-paragraph-nav-config");
  const config = latestSnapshot?.config || stored["gpt-paragraph-nav-config"] || {};
  try {
    await chrome.runtime.sendMessage({
      type: "POLARIS_WINDOW_STATE",
      tabId,
      snapshot: {
        activeMarkerKey: "",
        config,
        hasConversation: false,
        headings: [],
        markerItems: [],
        platform: "default",
        revision: Date.now(),
        releaseNotes: [],
        routeKey: "",
        supportedRoute,
        theme: "light",
        version: ""
      }
    });
  } catch {
    // The Polaris window may not be open while the source tab changes.
  }
}

async function readStoredNumber(key) {
  const result = await chrome.storage.local.get(key);
  const value = Number(result[key]);
  return Number.isInteger(value) && value >= 0 ? value : null;
}

async function writeWindowState(windowId, tabId) {
  polarisWindowId = windowId;
  polarisWindowTabId = tabId;
  await chrome.storage.local.set({
    [WINDOW_STORAGE_KEY]: windowId,
    [WINDOW_TAB_STORAGE_KEY]: tabId
  });
}

async function forgetWindowState() {
  polarisWindowId = null;
  polarisWindowTabId = null;
  await chrome.storage.local.remove([WINDOW_STORAGE_KEY, WINDOW_TAB_STORAGE_KEY]);
}

async function restoreWindowState() {
  if (polarisWindowId === null) {
    polarisWindowId = await readStoredNumber(WINDOW_STORAGE_KEY);
  }
  if (polarisWindowTabId === null) {
    polarisWindowTabId = await readStoredNumber(WINDOW_TAB_STORAGE_KEY);
  }
  if (lastNormalWindowId === null) {
    lastNormalWindowId = await readStoredNumber(SOURCE_WINDOW_STORAGE_KEY);
  }
  if (currentTabId === null) {
    currentTabId = await readStoredNumber(SOURCE_TAB_STORAGE_KEY);
  }
}

async function existingPolarisWindow() {
  await restoreWindowState();
  if (polarisWindowId === null) {
    return null;
  }
  try {
    const existing = await chrome.windows.get(polarisWindowId, { populate: true });
    const windowUrl = chrome.runtime.getURL("polaris-home.html");
    const matchingTab = matchingPolarisTab(existing, windowUrl, polarisWindowTabId);
    if (!matchingTab) {
      await forgetWindowState();
      return null;
    }
    if (matchingTab.id !== polarisWindowTabId) {
      await writeWindowState(existing.id, matchingTab.id);
    }
    return existing;
  } catch {
    await forgetWindowState();
    return null;
  }
}

async function rememberNormalTab(tab) {
  if (!isNormalSourceTab(tab)) {
    return;
  }
  lastNormalWindowId = tab.windowId;
  currentTabId = tab.id ?? null;
  await chrome.storage.local.set({
    [SOURCE_WINDOW_STORAGE_KEY]: lastNormalWindowId,
    [SOURCE_TAB_STORAGE_KEY]: currentTabId
  });
}

async function activeNormalTab() {
  await restoreWindowState();
  if (lastNormalWindowId !== null) {
    const tabs = await chrome.tabs.query({ active: true, windowId: lastNormalWindowId });
    const activeTab = tabs.find(isNormalSourceTab);
    if (activeTab) {
      await rememberNormalTab(activeTab);
      return activeTab;
    }
    if (currentTabId !== null) {
      try {
        const rememberedTab = await chrome.tabs.get(currentTabId);
        if (rememberedTab.windowId === lastNormalWindowId && isNormalSourceTab(rememberedTab)) {
          await rememberNormalTab(rememberedTab);
          return rememberedTab;
        }
      } catch {
        // The remembered source tab may have been closed.
      }
    }
    const windowTabs = await chrome.tabs.query({ windowId: lastNormalWindowId });
    const fallbackTab = windowTabs.find((tab) => isNormalSourceTab(tab) && isSupportedCandidateUrl(tab.url))
      || windowTabs.find(isNormalSourceTab);
    if (fallbackTab) {
      await rememberNormalTab(fallbackTab);
      return fallbackTab;
    }
  }

  const activeTabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const activeTab = activeTabs.find(isNormalSourceTab);
  if (activeTab) {
    await rememberNormalTab(activeTab);
    return activeTab;
  }
  const focusedTabs = await chrome.tabs.query({ lastFocusedWindow: true });
  const tab = focusedTabs.find((candidate) => isNormalSourceTab(candidate) && isSupportedCandidateUrl(candidate.url))
    || focusedTabs.find(isNormalSourceTab)
    || null;
  await rememberNormalTab(tab);
  return tab;
}

async function requestContentState(tab, { publishEmpty = true } = {}) {
  const targetTab = tab || await activeNormalTab();
  if (!isNormalSourceTab(targetTab)) {
    return;
  }
  currentTabId = targetTab.id;
  if (publishEmpty) {
    await publishEmptySnapshot(targetTab.id, isSupportedCandidateUrl(targetTab.url));
  }
  if (!isSupportedCandidateUrl(targetTab.url)) {
    return;
  }
  try {
    await chrome.tabs.sendMessage(targetTab.id, { type: "POLARIS_WINDOW_REQUEST_STATE" });
  } catch {
    // The content script may not be ready on a newly activated page.
  }
}

async function forwardCommand(message) {
  const tab = await activeNormalTab();
  if (!tab?.id) {
    return;
  }
  currentTabId = tab.id;
  try {
    await chrome.tabs.sendMessage(tab.id, message);
  } catch {
    // Unsupported pages and pages that are still loading have no receiver.
  }
  if (message.command === "jump-to-marker" || message.command === "jump-to-chapter") {
    try {
      await chrome.tabs.update(tab.id, { active: true });
      await chrome.windows.update(tab.windowId, { focused: true });
    } catch {
      // The tab may have closed between the send and the focus request.
    }
  }
}

async function isCurrentSourceTab(tab) {
  if (!tab?.id || tab.windowId === polarisWindowId) {
    return false;
  }
  if (tab.id === currentTabId) {
    return true;
  }
  const activeTabs = await chrome.tabs.query({ active: true, windowId: tab.windowId });
  if (activeTabs[0]?.id !== tab.id) {
    return false;
  }
  await rememberNormalTab(tab);
  return true;
}

async function persistWindowConfigCommand(message) {
  if (message.command === "reset-config") {
    await chrome.storage.sync.remove("gpt-paragraph-nav-config");
    return;
  }
  if (message.command !== "update-config" || !message.patch || typeof message.patch !== "object") {
    return;
  }
  const key = "gpt-paragraph-nav-config";
  const stored = await chrome.storage.sync.get(key);
  const current = stored[key] && typeof stored[key] === "object" ? stored[key] : {};
  const patch = { ...message.patch };
  ["enabledLevelsByPlatform", "enabledOrderedListByPlatform", "enabledStrongByPlatform", "enabledUnorderedListByPlatform"].forEach((nestedKey) => {
    if (patch[nestedKey] && typeof patch[nestedKey] === "object") {
      patch[nestedKey] = { ...(current[nestedKey] || {}), ...patch[nestedKey] };
    }
  });
  await chrome.storage.sync.set({ [key]: { ...current, ...patch } });
}

async function openOrFocusWindow(tab) {
  await rememberNormalTab(tab);
  const sourceWindowId = tab?.windowId ?? lastNormalWindowId;
  const sourceTabId = tab?.id ?? currentTabId;
  const existing = await existingPolarisWindow();
  if (existing?.id !== undefined) {
    let restored = false;
    try {
      await chrome.windows.update(existing.id, restorePopupWindowUpdate());
      restored = true;
    } catch {
      await forgetWindowState();
    }
    if (restored) {
      try {
        await requestContentState();
      } catch {
        // A transient source-tab failure must not create a duplicate popup.
      }
      return;
    }
  }

  const created = await chrome.windows.create({
    ...DEFAULT_WINDOW,
    url: chrome.runtime.getURL("polaris-home.html")
  });
  const windowTab = created?.tabs?.[0];
  if (created?.id !== undefined && windowTab?.id !== undefined) {
    await writeWindowState(created.id, windowTab.id);
  }
  // Creating and focusing the popup emits an activation event before the
  // window IDs above are known. Restore the tab that triggered the action so
  // the ready handshake cannot accidentally target the popup itself.
  if (sourceWindowId !== null && sourceWindowId !== undefined) {
    lastNormalWindowId = sourceWindowId;
    currentTabId = sourceTabId ?? null;
    await chrome.storage.local.set({
      [SOURCE_WINDOW_STORAGE_KEY]: lastNormalWindowId,
      [SOURCE_TAB_STORAGE_KEY]: currentTabId
    });
  }
  await requestContentState(tab);
}

async function rememberWindowReadyState(message, sender) {
  const readyWindowId = Number.isInteger(message.windowId) ? message.windowId : sender.tab?.windowId;
  const readyTabId = Number.isInteger(message.windowTabId) ? message.windowTabId : sender.tab?.id;
  if (readyWindowId === undefined || readyTabId === undefined) {
    return;
  }
  const isPopup = message.windowType === undefined || message.windowType === "popup";
  if (isPopup) {
    polarisWindowId = readyWindowId;
    polarisWindowTabId = readyTabId;
    await chrome.storage.local.set({
      [WINDOW_STORAGE_KEY]: polarisWindowId,
      [WINDOW_TAB_STORAGE_KEY]: polarisWindowTabId
    });
    return;
  }
  polarisWindowId = null;
  polarisWindowTabId = readyTabId;
  await chrome.storage.local.remove(WINDOW_STORAGE_KEY);
  await chrome.storage.local.set({ [WINDOW_TAB_STORAGE_KEY]: polarisWindowTabId });
}

chrome.action.onClicked.addListener((tab) => {
  void openOrFocusWindow(tab);
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (!message || typeof message.type !== "string") {
    return;
  }

  if (message.type === "POLARIS_WINDOW_READY") {
    void rememberWindowReadyState(message, sender)
      .then(() => requestContentState())
      .catch(() => {});
    return;
  }

  if (message.type === "POLARIS_WINDOW_COMMAND") {
    if (message.command === "refresh-state") {
      void requestContentState(undefined, { publishEmpty: false });
      return;
    }
    if (message.command === "update-config" || message.command === "reset-config") {
      void persistWindowConfigCommand(message).catch(() => {});
    }
    void forwardCommand(message);
    return;
  }

  if (message.type === "POLARIS_CONTENT_STATE") {
    void isCurrentSourceTab(sender.tab).then((isCurrent) => {
      if (!isCurrent) return;
      latestSnapshot = message.snapshot;
      return chrome.runtime.sendMessage({
        type: "POLARIS_WINDOW_STATE",
        tabId: sender.tab?.id ?? null,
        snapshot: message.snapshot
      });
    }).catch(() => {});
    return;
  }

  if (message.type === "POLARIS_WINDOW_CHAPTERS") {
    void isCurrentSourceTab(sender.tab).then((isCurrent) => {
      if (!isCurrent) return;
      return chrome.runtime.sendMessage({
        type: "POLARIS_WINDOW_CHAPTERS",
        chapters: message.chapters
      });
    }).catch(() => {});
    return;
  }

  if (message.type === "POLARIS_WINDOW_IMAGE") {
    void isCurrentSourceTab(sender.tab).then((isCurrent) => {
      if (!isCurrent) return;
      return chrome.runtime.sendMessage({
        type: "POLARIS_WINDOW_IMAGE",
        imageUrls: message.imageUrls
      });
    }).catch(() => {});
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  if (activeInfo.windowId === polarisWindowId) {
    return;
  }
  void chrome.tabs.get(activeInfo.tabId).then((tab) => {
    void rememberNormalTab(tab);
    void requestContentState(tab);
  }).catch(() => {});
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.windowId === polarisWindowId || tabId !== currentTabId && !tab.active) {
    return;
  }
  if (changeInfo.url || changeInfo.status === "loading" || changeInfo.status === "complete") {
    void rememberNormalTab(tab);
    void requestContentState(tab);
  }
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === polarisWindowId || windowId === chrome.windows.WINDOW_ID_NONE) {
    return;
  }
  lastNormalWindowId = windowId;
  void requestContentState();
});

chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === polarisWindowId) {
    void forgetWindowState();
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === polarisWindowTabId) {
    void forgetWindowState();
  }
  if (tabId === currentTabId) {
    currentTabId = null;
    latestSnapshot = null;
    void publishEmptySnapshot(null);
    void chrome.storage.local.remove(SOURCE_TAB_STORAGE_KEY);
  }
});
