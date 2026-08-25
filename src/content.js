import { mountSettingsPanel } from "./settings-panel.jsx";
import { chatGPTConversationIdFromPath, parseChatGPTConversation } from "./chatgpt-conversation.js";
import { doubaoMessageRoleFromClassNames } from "./doubao-message-role.js";
import { pageThemeFromColors } from "./page-theme.js";
import { releaseNotesForUpdate } from "./release-notes.js";
import {
  scrollTableMarkerIntoView,
  TABLE_MARKER_LEVEL,
  tableMarkerEntries,
  tableMarkerEntryForTarget
} from "./table-marker.js";
import {
  appendSanitizedChapterContent,
  appendSanitizedChapterNode,
  appendParsedMarkdownInline,
  CHAPTER_BLOCK_SELECTOR,
  parseChapterMarkdown
} from "./chapter-markdown.js";

(() => {
  const { locale, t } = globalThis.PolarisI18n;
  const ROOT_ID = "gpt-paragraph-nav";
  const DEBUG_ATTR = "data-gpt-paragraph-nav";
  const HEADING_SELECTOR = "h1, h2, h3, h4";
  const ROLE_HEADING_SELECTOR = '[role="heading"][aria-level]';
  const STRONG_HEADING_SELECTOR = "p, li";
  const NUMBERED_HEADING_SELECTOR = "p, div";
  const ASSISTANT_MESSAGE_SELECTOR = '[data-message-author-role="assistant"]';
  const USER_MESSAGE_SELECTOR = '[data-message-author-role="user"]';
  const DOUBAO_ASSISTANT_MESSAGE_SELECTOR = [
    ".receive-message-box",
    ".receive-message-content-block",
    ".receive-message-content-block-merge",
    '[class*="receive-message-box"]',
    '[class*="receive-message-content-block"]'
  ].join(", ");
  const DOUBAO_LEGACY_USER_MESSAGE_SELECTOR = [
    ".send-message-box",
    ".send-message-content-block",
    '[class*="send-message-box"]',
    '[class*="send-message-content-block"]'
  ].join(", ");
  const DOUBAO_USER_MESSAGE_SELECTOR = [
    ".bg-g-send-msg-bubble-bg",
    DOUBAO_LEGACY_USER_MESSAGE_SELECTOR
  ].join(", ");
  const KIMI_ASSISTANT_MESSAGE_SELECTOR = [
    ".segment.segment-assistant .markdown",
    ".segment-assistant .markdown",
    ".segment-assistant .markdown-container",
    '[class*="segment-assistant"] [class*="markdown"]'
  ].join(", ");
  const KIMI_USER_MESSAGE_SELECTOR = ".segment.segment-user";
  const QIANWEN_ASSISTANT_MESSAGE_SELECTOR = [
    '[class*="message-select-wrapper-answer"] .qk-markdown',
    ".chat-answers-card-wrap .qk-markdown",
    ".answer-common-card .qk-markdown",
    ".markdown-pc-special-class .qk-markdown"
  ].join(", ");
  const QIANWEN_USER_MESSAGE_SELECTOR = [
    '[class*="message-select-wrapper-question"]',
    ".chat-questions-card-wrap",
    ".question-common-card"
  ].join(", ");
  const QIANWEN_VIDEO_LIST_SELECTOR = [
    ".card_card_video",
    '[class*="card_card_video"]',
    '[data-tpl*="video_note_list"]'
  ].join(", ");
  const QIANWEN_VIDEO_TITLE_SELECTOR = '[class*="item-title"]';
  const YUANBAO_ASSISTANT_MESSAGE_SELECTOR = [
    '[data-conv-speaker="ai"] .hyc-common-markdown',
    '[data-conv-speaker="ai"]',
    ".agent-chat__list__item--ai .hyc-common-markdown"
  ].join(", ");
  const YUANBAO_USER_MESSAGE_SELECTOR = [
    '[data-conv-speaker="user"]',
    '[data-conv-speaker="human"]',
    ".agent-chat__list__item--user"
  ].join(", ");
  const XIAOHONGSHU_ASSISTANT_MARKDOWN_SELECTOR = [
    ".markdown-styles-diandian-main-v3",
    ".markdown-styles-diandian-main-v2",
    ".markdown-styles-diandian-main",
    ".markdown-styles-deep-research",
    ".markdown-styles-pc-main",
    ".markdown-styles-xhs-main",
    '[class*="markdown-styles-diandian-main"]',
    '[class*="markdown-styles-deep-research"]',
    '[class*="markdown-styles-pc-main"]',
    '[class*="markdown-styles-xhs-main"]'
  ].join(", ");
  const XIAOHONGSHU_ASSISTANT_FALLBACK_SELECTOR = [
    ".xhs-ai-chat-page .round-item",
    ".xhs-ai-chat-page .scroll-container",
    ".xhs-ai-chat-page .chat-container",
    '[class*="xhs-ai-chat-page"] [class*="round-item"]',
    '[class*="xhs-ai-chat-page"] [class*="scroll-container"]',
    '[class*="xhs-ai-chat-page"] [class*="chat-container"]'
  ].join(", ");
  const XIAOHONGSHU_MESSAGE_ITEM_SELECTOR = [
    ".xhs-ai-chat-page .round-item",
    '[class*="xhs-ai-chat-page"] [class*="round-item"]'
  ].join(", ");
  const XIAOHONGSHU_USER_MESSAGE_ROOT_SELECTOR = [
    ".user-message-wrapper",
    '[class*="user-message-wrapper"]'
  ].join(", ");
  const XIAOHONGSHU_USER_MESSAGE_SELECTOR = [
    ".xhs-ai-chat-page .user-message",
    '[class*="xhs-ai-chat-page"] [class*="user-message"]',
    '[class*="xhs-ai-chat-page"] [class*="user-content"]',
    '[class*="xhs-ai-chat-page"] [class*="message-user"]'
  ].join(", ");
  const YUANBAO_VIDEO_CARD_SELECTOR = [
    ".ybc-chat-videoBoxV2-bigCard",
    ".video-box-v2_ybc-chat-videoBoxV2-bigCard",
    '[class*="ybc-chat-videoBoxV2-bigCard"]',
    '[class*="video-box-v2_ybc-chat-videoBoxV2-bigCard"]'
  ].join(", ");
  const YUANBAO_VIDEO_TITLE_SELECTORS = [
    "h1, h2",
    '[class*="title"], [class*="Title"]',
    '[data-title], [title], [aria-label]'
  ];
  const MARKDOWN_FALLBACK_SELECTOR = [
    "main .markdown",
    '[class*="markdown"]',
    '[class*="md-box"]',
    '[class*="mdbox"]'
  ].join(", ");
  const USER_INPUT_SELECTOR = [
    "textarea",
    "input",
    '[contenteditable="true"]',
    '[contenteditable=""]',
    '[role="textbox"]',
    ".ProseMirror"
  ].join(", ");
  const CONTROLS_CLASS = "gpt-paragraph-nav__controls";
  const CONTROL_CAPSULE_CLASS = "gpt-paragraph-nav__control-capsule";
  const CONTROL_TAB_INDICATOR_CLASS = "gpt-paragraph-nav__control-tab-indicator";
  const CONTROL_COMPACT_TOGGLE_CLASS = "gpt-paragraph-nav__control-compact-toggle";
  const SETTINGS_CLASS = "gpt-paragraph-nav__settings";
  const LIST_ID = "gpt-paragraph-nav-list";
  const SETTINGS_PANEL_ID = "gpt-paragraph-nav-settings-panel";
  const CHATGPT_CONVERSATION_CHANNEL = "polaris-for-web-chatgpt-conversation";
  const CHATGPT_CONVERSATION_REQUEST = "request";
  const CHATGPT_CONVERSATION_RESPONSE = "response";
  const CHATGPT_CONVERSATION_REFRESH_DELAY_MS = 300;
  const ROUTE_CHANGE_EVENT = "polaris-for-web-route-change";
  const FLOATING_ACTIVE_CLASS = "gpt-paragraph-nav__floating-active";
  const LIQUID_GLASS_SELECTOR = [
    `.${CONTROL_CAPSULE_CLASS}`,
    `.${CONTROL_COMPACT_TOGGLE_CLASS}`,
    ".gpt-paragraph-nav__search-input",
    ".gpt-paragraph-nav__fold",
    ".gpt-paragraph-nav__marker",
    ".gpt-paragraph-nav__floating-active"
  ].join(", ");
  const QUEUE_MAX_VISIBLE = 30;
  const DEFAULT_TOP_GAP = 8;
  const TABLE_MARKER_SCROLL_GAP = 12;
  const DEFAULT_RIGHT_OFFSET = 14;
  const MARKER_LIST_SCROLL_PERSIST_MS = 1200;
  const DEFAULT_HEADER_HEIGHT = 64;
  const CONFIG_STORAGE_KEY = "gpt-paragraph-nav-config";
  const RATING_DISMISSAL_STORAGE_KEY = "polaris-rating-dismissed-until";
  const RELEASE_NOTICE_STORAGE_KEY = "polaris-release-notice-version";
  const RATING_DISMISSAL_DURATION_MS = 24 * 60 * 60 * 1000;
  const CONFIG_SCHEMA_VERSION = 7;
  const POINTER_DRAG_THRESHOLD = 4;
  const EXPLOSION_EMPTY_TEXT = t("chapters.empty");
  const EXPLOSION_BLOCK_SELECTOR = CHAPTER_BLOCK_SELECTOR;
  const CONVERSATION_HEADER_SELECTOR = [
    '[data-testid="conversation-header"]',
    '[data-testid="chat-header"]',
    "main header"
  ].join(", ");
  const CONFIG_FIELDS = [
    { key: "maxVisible", label: t("settings.maxVisible"), min: 1, max: 80, step: 1, unit: "" },
    { key: "maxVisibleUserGroups", label: t("settings.maxVisibleUserGroups"), min: 1, max: 80, step: 1, unit: "" },
    { key: "foldThreshold", label: t("settings.foldThreshold"), min: 2, max: 80, step: 1, unit: "" },
    { key: "tooltipMaxWidth", label: t("settings.tooltipMaxWidth"), min: 160, max: 720, step: 10, unit: "px" }
  ];
  const PLATFORM_KEYS = ["chatgpt", "doubao", "kimi", "qianwen", "yuanbao", "xiaohongshu", "default"];
  const MARKER_LEVEL_OPTIONS = [1, 2, 3, 4];
  const DEFAULT_ENABLED_LEVELS_BY_PLATFORM = Object.freeze({
    chatgpt: [1, 2, 3],
    doubao: [1, 2, 3],
    kimi: [1, 2],
    qianwen: [1, 2, 3],
    yuanbao: [1, 2],
    xiaohongshu: [1, 2, 3, 4],
    default: [1, 2, 3]
  });
  const DEFAULT_UNORDERED_LIST_BY_PLATFORM = Object.freeze({
    chatgpt: true,
    doubao: true,
    kimi: true,
    qianwen: true,
    yuanbao: true,
    xiaohongshu: true,
    default: true
  });
  const DEFAULT_CONFIG = Object.freeze({
    controlPosition: null,
    isControlMinimized: false,
    maxVisible: QUEUE_MAX_VISIBLE,
    maxVisibleUserGroups: 20,
    foldThreshold: 20,
    tooltipMaxWidth: 360,
    configVersion: CONFIG_SCHEMA_VERSION,
    enabledLevelsByPlatform: DEFAULT_ENABLED_LEVELS_BY_PLATFORM,
    enabledUnorderedListByPlatform: DEFAULT_UNORDERED_LIST_BY_PLATFORM
  });
  const markerKeys = new WeakMap();
  const liquidGlassSignatures = new WeakMap();
  const settingsPanelControllers = new WeakMap();
  const extensionMetadata = {
    iconUrl: "",
    routeBridgeUrl: "",
    releaseVersion: "",
    version: ""
  };
  let nextMarkerKey = 1;

  const state = {
    headings: [],
    markerGroups: [],
    conversationMetrics: null,
    activeHeading: null,
    activeMarkerKey: "",
    observer: null,
    scheduled: 0,
    scrollScheduled: 0,
    floatingScheduled: 0,
    markerListScrollScheduled: 0,
    markerListScrollUntil: 0,
    markerListScrollAnimation: 0,
    markerListScrollTarget: 0,
    markerNoticeTimer: 0,
    pointerDrag: null,
    suppressNextClick: false,
    suppressNextClickTimer: 0,
    liquidGlassObserver: null,
    liquidGlassElements: new Set(),
    lastDebugSignature: "",
    lastRenderedHeadingCount: 0,
    markerSearchQuery: "",
    chatGPTConversation: null,
    chatGPTConversationRefreshTimer: 0,
    chatGPTConversationRequestId: 0,
    explosionSearchQuery: "",
    expandedFoldGroups: new Set(),
    expandedUserMarkerKeys: new Set(),
    areEarlierUserGroupsExpanded: false,
    userMarkerExpansionInitialized: false,
    isCollapsed: false,
    collapsedListHeight: 0,
    ratingDismissedUntil: 0,
    releaseNotes: [],
    isReleaseNoticeOpen: false,
    releaseNoticeFocusPending: false,
    releaseNoticeReturnControlTab: null,
    shouldMarkReleaseNoticeRead: false,
    config: { ...DEFAULT_CONFIG },
    activeControlTab: "navigation",
    isExplosionOpen: false,
    explosionSections: [],
    activeExplosionSectionIndex: 0,
    lastExplosionRenderSignature: "",
    scrollLock: null,
    routeKey: "",
    isExtensionContextInvalidated: false
  };

  function isExtensionContextValid() {
    try {
      return typeof chrome !== "undefined" && Boolean(chrome.runtime && chrome.runtime.id);
    } catch {
      return false;
    }
  }

  function cacheExtensionMetadata() {
    try {
      const manifest = chrome.runtime.getManifest();
      extensionMetadata.iconUrl = chrome.runtime.getURL("icons/gpt-voyager-icon-96.png");
      extensionMetadata.routeBridgeUrl = chrome.runtime.getURL("src/route-bridge.js");
      extensionMetadata.releaseVersion = manifest.version;
      extensionMetadata.version = manifest.version_name || `v${manifest.version}`;
      return true;
    } catch {
      disposeInvalidExtensionContext();
      return false;
    }
  }

  function runtimeLastError() {
    try {
      return chrome.runtime.lastError || null;
    } catch {
      disposeInvalidExtensionContext();
      return null;
    }
  }

  function disposeInvalidExtensionContext() {
    if (state.isExtensionContextInvalidated) {
      return;
    }

    state.isExtensionContextInvalidated = true;
    window.clearTimeout(state.scheduled);
    window.clearTimeout(state.markerNoticeTimer);
    window.cancelAnimationFrame(state.markerListScrollAnimation);
    state.markerListScrollAnimation = 0;
    state.observer?.disconnect();
    state.liquidGlassObserver?.disconnect();
    closeExplosionOverlay();
    state.isReleaseNoticeOpen = false;
    unlockPageScroll();
    removeNavigationRoot();
  }

  function getRoot() {
    let root = document.getElementById(ROOT_ID);
    if (!root) {
      root = document.createElement("div");
      root.id = ROOT_ID;
      root.setAttribute("aria-label", t("navigation.rootLabel"));
      root.setAttribute("role", "navigation");
      document.documentElement.appendChild(root);
    }
    return root;
  }

  function updatePageTheme(root) {
    const fallbackTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const pageSurfaces = [
      document.querySelector("main"),
      document.querySelector('[role="main"]'),
      document.body,
      document.documentElement
    ].filter((element) => element instanceof HTMLElement);
    const theme = pageThemeFromColors(
      pageSurfaces.map((element) => window.getComputedStyle(element).backgroundColor),
      fallbackTheme
    );

    if (root.dataset.pageTheme !== theme) {
      root.dataset.pageTheme = theme;
    }
  }

  function getControls(root = getRoot()) {
    let controls = root.querySelector(`.${CONTROLS_CLASS}`);
    if (!controls) {
      controls = document.createElement("div");
      controls.className = CONTROLS_CLASS;
      root.prepend(controls);
    }
    return controls;
  }

  function getList(root = getRoot()) {
    let list = root.querySelector(`#${LIST_ID}`);
    if (!list) {
      list = document.createElement("div");
      list.id = LIST_ID;
      list.className = "gpt-paragraph-nav__list";
      list.setAttribute("role", "tabpanel");
      list.setAttribute("aria-labelledby", "gpt-paragraph-nav-tab-navigation");
      list.addEventListener("scroll", () => {
        if (!state.markerListScrollAnimation) {
          state.markerListScrollTarget = list.scrollTop;
        }
        scheduleFloatingActiveUpdate();
      }, { passive: true });
      root.appendChild(list);
    }
    return list;
  }

  function getMarkerSearchInput(root = getRoot()) {
    let input = root.querySelector(".gpt-paragraph-nav__search-input");
    if (!(input instanceof HTMLInputElement)) {
      if (input) {
        input.remove();
      }

      const wrapper = document.createElement("div");
      wrapper.className = "gpt-paragraph-nav__search";

      input = document.createElement("input");
      input.type = "search";
      input.className = "gpt-paragraph-nav__search-input";
      input.placeholder = t("search.markers.placeholder");
      input.setAttribute("aria-label", t("search.markers.placeholder"));
      input.autocomplete = "off";
      input.value = state.markerSearchQuery;
      input.addEventListener("input", () => {
        state.markerSearchQuery = input.value;
        state.expandedFoldGroups.clear();
        if (input.value) {
          state.isCollapsed = false;
        }
        scheduleRender();
      });
      input.addEventListener("focus", () => {
        if (state.isCollapsed) {
          state.isCollapsed = false;
          scheduleRender();
        }
      });

      wrapper.appendChild(input);
      const list = getList(root);
      root.insertBefore(wrapper, list);
    } else if (document.activeElement !== input && input.value !== state.markerSearchQuery) {
      input.value = state.markerSearchQuery;
    }

    return input;
  }

  function getFloatingActive(root = getRoot()) {
    let floating = root.querySelector(`.${FLOATING_ACTIVE_CLASS}`);
    if (!(floating instanceof HTMLButtonElement)) {
      if (floating) {
        floating.remove();
      }
      floating = document.createElement("button");
      floating.type = "button";
      floating.className = FLOATING_ACTIVE_CLASS;
      floating.hidden = true;
      floating.tabIndex = -1;
      floating.setAttribute("aria-hidden", "true");
      floating.addEventListener("click", () => {
        const marker = getActiveMarker();
        const heading = getActiveHeading();
        if (heading) {
          jumpToHeading(heading, "smooth");
        }
        if (marker) {
          requestActiveMarkerListScrollPersistence();
          marker.focus({ preventScroll: true });
          updateFloatingActiveMarker(marker);
        }
      });
      root.appendChild(floating);
    }
    return floating;
  }

  function toggleNavigation() {
    if (!state.markerGroups.length) {
      return;
    }
    if (!state.isCollapsed) {
      state.collapsedListHeight = getList().offsetHeight;
    }
    state.isCollapsed = !state.isCollapsed;
  }

  function syncControlTabIndicator(root = getRoot()) {
    const capsule = root.querySelector(`.${CONTROL_CAPSULE_CLASS}`);
    if (!(capsule instanceof HTMLElement)) {
      return;
    }

    const indicator = capsule.querySelector(`.${CONTROL_TAB_INDICATOR_CLASS}`);
    const activeTab = capsule.querySelector(".gpt-paragraph-nav__control-tab.is-active");
    if (!(indicator instanceof HTMLElement) || !(activeTab instanceof HTMLElement)) {
      return;
    }

    indicator.style.width = `${activeTab.offsetWidth}px`;
    indicator.style.transform = `translateX(${activeTab.offsetLeft}px)`;
  }

  function syncControlTabs(root = getRoot()) {
    const capsule = root.querySelector(`.${CONTROL_CAPSULE_CLASS}`);
    const isMinimized = state.config.isControlMinimized;
    if (!(capsule instanceof HTMLElement)) {
      return;
    }

    root.classList.toggle("is-settings-open", state.activeControlTab === "settings");
    root.classList.toggle("is-control-minimized", isMinimized);
    root.classList.toggle("has-custom-control-position", Boolean(activeControlPosition()));
    capsule.classList.toggle("is-minimized", isMinimized);
    capsule.setAttribute("role", isMinimized ? "group" : "tablist");
    capsule.setAttribute("aria-label", isMinimized
      ? `${t("controls.label")}: ${t(`tab.${state.activeControlTab}`)}`
      : t("controls.label"));
    root.querySelectorAll("[data-control-tab]").forEach((tab) => {
      const isActive = tab.dataset.controlTab === state.activeControlTab;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
      tab.hidden = isMinimized && !isActive;
      tab.setAttribute("aria-hidden", String(isMinimized && !isActive));
      tab.tabIndex = isActive ? 0 : -1;
      if (tab.dataset.controlTab === "navigation") {
        tab.setAttribute("aria-expanded", String(!state.isCollapsed));
      }
    });
    const indicator = capsule.querySelector(`.${CONTROL_TAB_INDICATOR_CLASS}`);
    if (indicator instanceof HTMLElement) {
      indicator.hidden = false;
    }
    const toggle = capsule.querySelector(`.${CONTROL_COMPACT_TOGGLE_CLASS}`);
    if (toggle instanceof HTMLButtonElement) {
      toggle.setAttribute("aria-label", t(isMinimized ? "controls.maximize" : "controls.minimize"));
      toggle.replaceChildren(createControlCompactIcon(isMinimized));
    }
    syncControlTabIndicator(root);

    const settings = root.querySelector(`.${SETTINGS_CLASS}`);
    if (settings instanceof HTMLElement) {
      settings.hidden = state.activeControlTab !== "settings";
      settings.setAttribute("aria-labelledby", "gpt-paragraph-nav-tab-settings");
      settings.removeAttribute("aria-label");
    }
  }

  function activateControlTab(tabKey, { toggleNavigationWhenActive = false, openChapters = false } = {}) {
    const isActive = state.activeControlTab === tabKey;
    state.activeControlTab = tabKey;
    if (tabKey === "navigation" && isActive && toggleNavigationWhenActive) {
      toggleNavigation();
      render();
      return;
    }
    if (tabKey === "chapters" && openChapters) {
      openExplosionOverlay();
    }
    const root = document.getElementById(ROOT_ID);
    if (root instanceof HTMLElement) {
      syncControlTabs(root);
    }
  }

  function createControlCompactIcon(isMinimized) {
    const namespace = "http://www.w3.org/2000/svg";
    const icon = document.createElementNS(namespace, "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("focusable", "false");
    const path = document.createElementNS(namespace, "path");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", isMinimized ? "1.8" : "1.5");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("d", isMinimized
      ? "M8 16L16 8M11 8h5v5M13 16H8v-5"
      : "M5 12H19");
    icon.appendChild(path);
    return icon;
  }

  function setControlMinimized(isMinimized) {
    state.config = normalizeConfig({
      ...state.config,
      controlPosition: isMinimized ? null : state.config.controlPosition,
      isControlMinimized: isMinimized
    });
    saveConfig(state.config);
    render();
  }

  function getControlCapsule(root = getRoot()) {
    const controls = getControls(root);
    let capsule = controls.querySelector(`.${CONTROL_CAPSULE_CLASS}`);
    if (!capsule) {
      capsule = document.createElement("div");
      capsule.className = CONTROL_CAPSULE_CLASS;
      capsule.setAttribute("role", "tablist");
      capsule.setAttribute("aria-label", t("controls.label"));

      const compactToggle = document.createElement("button");
      compactToggle.type = "button";
      compactToggle.className = CONTROL_COMPACT_TOGGLE_CLASS;
      compactToggle.addEventListener("click", () => {
        setControlMinimized(!state.config.isControlMinimized);
      });
      capsule.appendChild(compactToggle);

      const indicator = document.createElement("span");
      indicator.className = CONTROL_TAB_INDICATOR_CLASS;
      indicator.setAttribute("aria-hidden", "true");
      indicator.style.transition = "none";
      capsule.appendChild(indicator);

      [
        { key: "navigation", label: t("tab.navigation"), controls: LIST_ID },
        { key: "chapters", label: t("tab.chapters"), controls: "gpt-paragraph-nav-chapters" },
        { key: "settings", label: t("tab.settings"), controls: SETTINGS_PANEL_ID }
      ].forEach(({ key, label, controls: controlsId }) => {
        const tab = document.createElement("button");
        tab.type = "button";
        tab.className = "gpt-paragraph-nav__control-tab";
        tab.dataset.controlTab = key;
        tab.id = `gpt-paragraph-nav-tab-${key}`;
        tab.setAttribute("role", "tab");
        tab.setAttribute("aria-controls", controlsId);
        if (key === "navigation") {
          const icon = document.createElement("img");
          icon.className = "gpt-paragraph-nav__control-tab-icon";
          icon.alt = "";
          icon.width = 16;
          icon.height = 16;
          icon.src = extensionMetadata.iconUrl;
          tab.appendChild(icon);

          const title = document.createElement("span");
          title.className = "gpt-paragraph-nav__control-tab-label";
          title.textContent = label;
          tab.appendChild(title);

          const chevron = document.createElement("span");
          chevron.className = "gpt-paragraph-nav__control-tab-chevron";
          chevron.setAttribute("aria-hidden", "true");
          tab.appendChild(chevron);
        } else {
          tab.textContent = label;
        }
        tab.addEventListener("click", () => {
          activateControlTab(key, {
            toggleNavigationWhenActive: key === "navigation",
            openChapters: key === "chapters"
          });
        });
        capsule.appendChild(tab);
      });

      capsule.addEventListener("keydown", (event) => {
        const tabs = Array.from(capsule.querySelectorAll("[data-control-tab]"));
        const currentIndex = tabs.indexOf(document.activeElement);
        if (currentIndex < 0) {
          return;
        }
        let nextIndex = currentIndex;
        if (event.key === "ArrowRight") {
          nextIndex = (currentIndex + 1) % tabs.length;
        } else if (event.key === "ArrowLeft") {
          nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        } else if (event.key === "Home") {
          nextIndex = 0;
        } else if (event.key === "End") {
          nextIndex = tabs.length - 1;
        } else {
          return;
        }
        event.preventDefault();
        const nextTab = tabs[nextIndex];
        if (nextTab.dataset.controlTab !== "chapters") {
          activateControlTab(nextTab.dataset.controlTab);
        }
        nextTab.focus();
      });

      controls.appendChild(capsule);
      requestAnimationFrame(() => {
        indicator.style.transition = "";
      });
    }
    syncControlTabs(root);
    return capsule;
  }

  function getSettings(root = getRoot()) {
    const controls = getControls(root);
    let settings = controls.querySelector(`.${SETTINGS_CLASS}`);
    if (!settings) {
      settings = document.createElement("div");
      settings.className = SETTINGS_CLASS;
      settings.id = SETTINGS_PANEL_ID;
      settings.setAttribute("role", "tabpanel");
      settings.setAttribute("aria-labelledby", "gpt-paragraph-nav-tab-settings");
      settings.tabIndex = -1;
      controls.appendChild(settings);
    }

    syncSettingsInputs(settings);
    settings.hidden = state.activeControlTab !== "settings";
    return settings;
  }

  function getExplosionOverlay(root = getRoot()) {
    let overlay = root.querySelector(".gpt-paragraph-nav__explosion-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "gpt-paragraph-nav-chapters";
      overlay.className = "gpt-paragraph-nav__explosion-overlay";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-label", t("chapters.label"));
      overlay.hidden = true;

      const content = document.createElement("div");
      content.className = "gpt-paragraph-nav__explosion-content";
      content.setAttribute("aria-label", t("chapters.label"));

      const header = document.createElement("div");
      header.className = "gpt-paragraph-nav__explosion-header";

      const searchInput = document.createElement("input");
      searchInput.type = "search";
      searchInput.className = "gpt-paragraph-nav__explosion-search-input";
      searchInput.placeholder = t("search.chapters.placeholder");
      searchInput.setAttribute("aria-label", t("search.chapters.placeholder"));
      searchInput.autocomplete = "off";
      searchInput.value = state.explosionSearchQuery;
      searchInput.addEventListener("input", () => {
        state.explosionSearchQuery = searchInput.value;
        syncExplosionOverlay(overlay);
      });
      header.appendChild(searchInput);

      const actions = document.createElement("div");
      actions.className = "gpt-paragraph-nav__explosion-actions";

      const copyMenu = document.createElement("details");
      copyMenu.className = "gpt-paragraph-nav__explosion-copy-menu";

      const copyMenuTrigger = document.createElement("summary");
      copyMenuTrigger.className = "gpt-paragraph-nav__explosion-action gpt-paragraph-nav__explosion-copy-menu-trigger";
      copyMenuTrigger.textContent = t("chapters.copy");
      copyMenu.appendChild(copyMenuTrigger);

      const copyMenuItems = document.createElement("div");
      copyMenuItems.className = "gpt-paragraph-nav__explosion-copy-menu-items";

      const currentSectionButton = document.createElement("button");
      currentSectionButton.type = "button";
      currentSectionButton.className = "gpt-paragraph-nav__explosion-copy-menu-item";
      currentSectionButton.dataset.explosionAction = "copy-current-section";
      currentSectionButton.textContent = t("chapters.copyCurrent");
      currentSectionButton.addEventListener("click", async () => {
        await copyCurrentExplosionSection();
        copyMenu.open = false;
      });
      copyMenuItems.appendChild(currentSectionButton);

      const fullTextButton = document.createElement("button");
      fullTextButton.type = "button";
      fullTextButton.className = "gpt-paragraph-nav__explosion-copy-menu-item";
      fullTextButton.dataset.explosionAction = "copy-full-text";
      fullTextButton.textContent = t("chapters.copyFull");
      fullTextButton.addEventListener("click", async () => {
        await copyFullExplosionText();
        copyMenu.open = false;
      });
      copyMenuItems.appendChild(fullTextButton);
      copyMenu.appendChild(copyMenuItems);
      actions.appendChild(copyMenu);

      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "gpt-paragraph-nav__explosion-close";
      closeButton.dataset.explosionAction = "close";
      closeButton.setAttribute("aria-label", t("chapters.close"));
      closeButton.setAttribute("title", t("chapters.close"));
      closeButton.addEventListener("click", closeExplosionOverlay);
      actions.appendChild(closeButton);

      header.appendChild(actions);
      content.appendChild(header);
      const chips = document.createElement("div");
      chips.className = "gpt-paragraph-nav__explosion-chips";
      content.appendChild(chips);

      const body = document.createElement("div");
      body.className = "gpt-paragraph-nav__explosion-body";
      content.appendChild(body);

      const shortcutHint = document.createElement("div");
      shortcutHint.className = "gpt-paragraph-nav__explosion-shortcut-hint";
      shortcutHint.textContent = t("chapters.shortcutHint");
      content.appendChild(shortcutHint);
      overlay.appendChild(content);

      root.appendChild(overlay);
    }

    const searchInput = overlay.querySelector(".gpt-paragraph-nav__explosion-search-input");
    if (searchInput instanceof HTMLInputElement && document.activeElement !== searchInput && searchInput.value !== state.explosionSearchQuery) {
      searchInput.value = state.explosionSearchQuery;
    }
    syncExplosionOverlay(overlay);
    return overlay;
  }

  function getReleaseNoticeOverlay(root = getRoot()) {
    let overlay = root.querySelector(".gpt-paragraph-nav__release-notice-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "gpt-paragraph-nav__release-notice-overlay";
      overlay.id = "gpt-paragraph-nav-release-notice";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-labelledby", "gpt-paragraph-nav-release-notice-title");
      overlay.hidden = true;
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
          closeReleaseNotice();
        }
      });

      const card = document.createElement("section");
      card.className = "gpt-paragraph-nav__release-notice-card";

      const header = document.createElement("header");
      header.className = "gpt-paragraph-nav__release-notice-header";
      const title = document.createElement("h2");
      title.id = "gpt-paragraph-nav-release-notice-title";
      title.className = "gpt-paragraph-nav__release-notice-title";
      const titleIcon = document.createElement("img");
      titleIcon.className = "gpt-paragraph-nav__release-notice-title-icon";
      titleIcon.alt = "";
      titleIcon.height = 20;
      titleIcon.src = extensionMetadata.iconUrl;
      titleIcon.width = 20;
      const titleText = document.createElement("span");
      titleText.textContent = t("releaseNotice.title");
      title.append(titleIcon, titleText);
      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "gpt-paragraph-nav__release-notice-close";
      closeButton.setAttribute("aria-label", t("releaseNotice.close"));
      closeButton.setAttribute("title", t("releaseNotice.close"));
      closeButton.addEventListener("click", closeReleaseNotice);
      header.append(title, closeButton);

      const summary = document.createElement("p");
      summary.className = "gpt-paragraph-nav__release-notice-summary";
      summary.textContent = t("releaseNotice.summary", { version: extensionMetadata.version });

      const notes = document.createElement("div");
      notes.className = "gpt-paragraph-nav__release-notice-notes";

      const feedback = document.createElement("p");
      feedback.className = "gpt-paragraph-nav__release-notice-feedback";
      feedback.textContent = `💬 ${t("releaseNotice.feedback")}`;

      const actions = document.createElement("div");
      actions.className = "gpt-paragraph-nav__release-notice-actions";
      const email = document.createElement("a");
      email.className = "gpt-paragraph-nav__release-notice-action is-icon";
      email.setAttribute("aria-label", t("releaseNotice.emailAction"));
      email.href = "mailto:jefferyho.build@gmail.com";
      email.title = t("releaseNotice.emailAction");
      email.appendChild(createReleaseNoticeMailIcon());
      const issue = document.createElement("a");
      issue.className = "gpt-paragraph-nav__release-notice-action is-icon";
      issue.setAttribute("aria-label", t("releaseNotice.issueAction"));
      issue.href = "https://github.com/Jeffery-Ho/Polaris-for-Web/issues";
      issue.rel = "noreferrer";
      issue.target = "_blank";
      issue.title = t("releaseNotice.issueAction");
      issue.appendChild(createReleaseNoticeIcon("M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.161-1.11-1.47-1.11-1.47-.908-.62.069-.608.069-.608 1.003.071 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.03-2.688-.103-.253-.447-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.748-1.026 2.748-1.026.546 1.379.202 2.398.1 2.65.64.7 1.029 1.595 1.029 2.688 0 3.848-2.339 4.695-4.566 4.944.359.31.678.921.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.481A10.019 10.019 0 0 0 22 12.017C22 6.484 17.523 2 12 2Z"));
      const acknowledge = document.createElement("button");
      acknowledge.type = "button";
      acknowledge.className = "gpt-paragraph-nav__release-notice-action is-primary";
      acknowledge.textContent = t("releaseNotice.acknowledge");
      acknowledge.addEventListener("click", closeReleaseNotice);
      actions.append(email, issue, acknowledge);

      card.append(header, summary, notes, feedback, actions);
      overlay.appendChild(card);
      root.appendChild(overlay);
    }

    syncReleaseNoticeOverlay(overlay);
    return overlay;
  }

  function createReleaseNoticeIcon(pathData) {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("focusable", "false");
    icon.setAttribute("viewBox", "0 0 24 24");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    path.setAttribute("fill", "currentColor");
    icon.appendChild(path);
    return icon;
  }

  function createReleaseNoticeMailIcon() {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("fill", "none");
    icon.setAttribute("focusable", "false");
    icon.setAttribute("viewBox", "0 0 24 24");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M4 6.5h16v11H4zM4.5 7l7.5 6 7.5-6");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("stroke-width", "1.7");
    icon.appendChild(path);
    return icon;
  }

  function syncReleaseNoticeOverlay(overlay) {
    const notes = overlay.querySelector(".gpt-paragraph-nav__release-notice-notes");
    if (notes instanceof HTMLElement) {
      notes.replaceChildren();
      state.releaseNotes.forEach((note) => {
        const localizedNote = note[locale] || note.en;
        const section = document.createElement("section");
        section.className = "gpt-paragraph-nav__release-note";
        const heading = document.createElement("h3");
        heading.textContent = `${note.version} · ${localizedNote.title}`;
        const changes = document.createElement("ul");
        localizedNote.changes.forEach((change) => {
          const item = document.createElement("li");
          item.textContent = change;
          changes.appendChild(item);
        });
        section.append(heading, changes);
        notes.appendChild(section);
      });
    }

    overlay.hidden = !state.isReleaseNoticeOpen;
    if (state.isReleaseNoticeOpen && state.releaseNoticeFocusPending) {
      state.releaseNoticeFocusPending = false;
      const acknowledge = overlay.querySelector(".gpt-paragraph-nav__release-notice-action.is-primary");
      if (acknowledge instanceof HTMLButtonElement) {
        requestAnimationFrame(() => acknowledge.focus());
      }
    }
  }

  function closeReleaseNotice() {
    if (!state.isReleaseNoticeOpen) {
      return;
    }

    state.isReleaseNoticeOpen = false;
    state.releaseNoticeFocusPending = false;
    if (state.releaseNoticeReturnControlTab) {
      state.activeControlTab = state.releaseNoticeReturnControlTab;
      state.releaseNoticeReturnControlTab = null;
    }
    unlockPageScroll();
    if (state.shouldMarkReleaseNoticeRead) {
      state.shouldMarkReleaseNoticeRead = false;
      saveReleaseNoticeVersion();
    }
    render();
  }

  function normalizeNumber(value, fallback, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return fallback;
    }
    return Math.min(Math.max(Math.round(number), min), max);
  }

  function normalizeControlPosition(position) {
    if (!position || typeof position !== "object") {
      return null;
    }

    const top = Number(position.top);
    const right = Number(position.right);
    if (!Number.isFinite(top) || !Number.isFinite(right)) {
      return null;
    }

    return {
      top: Math.max(0, Math.round(top)),
      right: Math.max(0, Math.round(right))
    };
  }

  function maxHeadingLevelForPlatform(platformKey = currentPlatformKey()) {
    if (platformKey === "yuanbao" || platformKey === "kimi") {
      return 2;
    }
    return platformKey === "xiaohongshu" ? 4 : 3;
  }

  function supportedMarkerLevelsForPlatform(platformKey = currentPlatformKey()) {
    const maxLevel = maxHeadingLevelForPlatform(platformKey);
    return MARKER_LEVEL_OPTIONS.filter((level) => level <= maxLevel);
  }

  function defaultEnabledLevelsForPlatform(platformKey) {
    const levels = DEFAULT_ENABLED_LEVELS_BY_PLATFORM[platformKey] || DEFAULT_ENABLED_LEVELS_BY_PLATFORM.default;
    return [...levels];
  }

  function normalizeEnabledLevels(levels, platformKey) {
    const supportedLevels = supportedMarkerLevelsForPlatform(platformKey);
    const supportedSet = new Set(supportedLevels);
    const normalizedLevels = Array.isArray(levels)
      ? Array.from(new Set(levels.map((level) => Number(level))))
        .filter((level) => supportedSet.has(level))
        .sort((first, second) => first - second)
      : [];

    return normalizedLevels.length ? normalizedLevels : defaultEnabledLevelsForPlatform(platformKey);
  }

  function normalizeEnabledLevelsByPlatform(config) {
    const source = config && config.enabledLevelsByPlatform;
    return PLATFORM_KEYS.reduce((result, platformKey) => {
      result[platformKey] = normalizeEnabledLevels(source && source[platformKey], platformKey);
      return result;
    }, {});
  }

  function normalizeUnorderedListByPlatform(config) {
    const source = config && config.enabledUnorderedListByPlatform;
    return PLATFORM_KEYS.reduce((result, platformKey) => {
      result[platformKey] = source && Object.prototype.hasOwnProperty.call(source, platformKey)
        ? Boolean(source[platformKey])
        : DEFAULT_UNORDERED_LIST_BY_PLATFORM[platformKey];
      return result;
    }, {});
  }

  function normalizeConfig(config) {
    const result = CONFIG_FIELDS.reduce((normalizedConfig, field) => {
      normalizedConfig[field.key] = normalizeNumber(
        config && config[field.key],
        DEFAULT_CONFIG[field.key],
        field.min,
        field.max
      );
      return normalizedConfig;
    }, {});
    result.enabledLevelsByPlatform = normalizeEnabledLevelsByPlatform(config);
    result.enabledUnorderedListByPlatform = normalizeUnorderedListByPlatform(config);
    result.controlPosition = normalizeControlPosition(config && config.controlPosition);
    result.isControlMinimized = Boolean(config && config.isControlMinimized);
    if ((Number(config && config.configVersion) || 1) < 2) {
      result.enabledLevelsByPlatform.xiaohongshu = normalizeEnabledLevels(
        [...result.enabledLevelsByPlatform.xiaohongshu, 4],
        "xiaohongshu"
      );
    }
    result.configVersion = CONFIG_SCHEMA_VERSION;
    return result;
  }

  function enabledLevelsByPlatformEqual(first, second) {
    return PLATFORM_KEYS.every((platformKey) => {
      const firstLevels = normalizeEnabledLevels(first && first[platformKey], platformKey);
      const secondLevels = normalizeEnabledLevels(second && second[platformKey], platformKey);
      return firstLevels.length === secondLevels.length
      && firstLevels.every((level, index) => level === secondLevels[index]);
    });
  }

  function enabledUnorderedListByPlatformEqual(first, second) {
    return PLATFORM_KEYS.every((platformKey) => {
      const firstEnabled = first && Object.prototype.hasOwnProperty.call(first, platformKey)
        ? Boolean(first[platformKey])
        : DEFAULT_UNORDERED_LIST_BY_PLATFORM[platformKey];
      const secondEnabled = second && Object.prototype.hasOwnProperty.call(second, platformKey)
        ? Boolean(second[platformKey])
        : DEFAULT_UNORDERED_LIST_BY_PLATFORM[platformKey];
      return firstEnabled === secondEnabled;
    });
  }

  function configsEqual(first, second) {
    return CONFIG_FIELDS.every((field) => first[field.key] === second[field.key])
      && enabledLevelsByPlatformEqual(first.enabledLevelsByPlatform, second.enabledLevelsByPlatform)
      && enabledUnorderedListByPlatformEqual(first.enabledUnorderedListByPlatform, second.enabledUnorderedListByPlatform)
      && first.controlPosition?.top === second.controlPosition?.top
      && first.controlPosition?.right === second.controlPosition?.right
      && first.isControlMinimized === second.isControlMinimized;
  }

  function hasSyncStorage() {
    try {
      return isExtensionContextValid() && Boolean(chrome.storage && chrome.storage.sync);
    } catch {
      return false;
    }
  }

  function hasLocalStorage() {
    try {
      return isExtensionContextValid() && Boolean(chrome.storage && chrome.storage.local);
    } catch {
      return false;
    }
  }

  function readRatingDismissedUntil() {
    if (!hasLocalStorage()) {
      return Promise.resolve(0);
    }

    return new Promise((resolve) => {
      try {
        chrome.storage.local.get(RATING_DISMISSAL_STORAGE_KEY, (result) => {
          if (!isExtensionContextValid()) {
            disposeInvalidExtensionContext();
            resolve(0);
            return;
          }
          const error = runtimeLastError();
          if (error) {
            console.warn("[Polaris for Web] rating dismissal read failed", error);
            resolve(0);
            return;
          }
          const dismissedUntil = Number(result[RATING_DISMISSAL_STORAGE_KEY]);
          resolve(Number.isFinite(dismissedUntil) && dismissedUntil > Date.now() ? dismissedUntil : 0);
        });
      } catch {
        disposeInvalidExtensionContext();
        resolve(0);
      }
    });
  }

  function dismissRating() {
    const dismissedUntil = Date.now() + RATING_DISMISSAL_DURATION_MS;
    state.ratingDismissedUntil = dismissedUntil;
    render();

    if (!hasLocalStorage()) {
      return;
    }

    try {
      chrome.storage.local.set({ [RATING_DISMISSAL_STORAGE_KEY]: dismissedUntil }, () => {
        if (!isExtensionContextValid()) {
          disposeInvalidExtensionContext();
          return;
        }
        const error = runtimeLastError();
        if (error) {
          console.warn("[Polaris for Web] rating dismissal write failed", error);
        }
      });
    } catch {
      disposeInvalidExtensionContext();
    }
  }

  function isTopLevelFrame() {
    try {
      return window.top === window;
    } catch {
      return false;
    }
  }

  function readReleaseNoticeVersion() {
    if (!hasLocalStorage()) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      try {
        chrome.storage.local.get(RELEASE_NOTICE_STORAGE_KEY, (result) => {
          if (!isExtensionContextValid()) {
            disposeInvalidExtensionContext();
            resolve(null);
            return;
          }
          const error = runtimeLastError();
          if (error) {
            console.warn("[Polaris for Web] release notice read failed", error);
            resolve(null);
            return;
          }
          const version = result[RELEASE_NOTICE_STORAGE_KEY];
          resolve(typeof version === "string" ? version : null);
        });
      } catch {
        disposeInvalidExtensionContext();
        resolve(null);
      }
    });
  }

  function saveReleaseNoticeVersion() {
    if (!hasLocalStorage()) {
      return;
    }

    try {
      chrome.storage.local.set({ [RELEASE_NOTICE_STORAGE_KEY]: extensionMetadata.releaseVersion }, () => {
        if (!isExtensionContextValid()) {
          disposeInvalidExtensionContext();
          return;
        }
        const error = runtimeLastError();
        if (error) {
          console.warn("[Polaris for Web] release notice write failed", error);
        }
      });
    } catch {
      disposeInvalidExtensionContext();
    }
  }

  function loadLegacyConfig() {
    try {
      const rawConfig = window.localStorage.getItem(CONFIG_STORAGE_KEY);
      return rawConfig ? normalizeConfig(JSON.parse(rawConfig)) : null;
    } catch {
      return null;
    }
  }

  function readSyncConfig() {
    if (!hasSyncStorage()) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      try {
        chrome.storage.sync.get(CONFIG_STORAGE_KEY, (result) => {
          if (!isExtensionContextValid()) {
            disposeInvalidExtensionContext();
            resolve(null);
            return;
          }
        const error = runtimeLastError();
        if (error) {
          console.warn("[Polaris for Web] config sync read failed", error);
          resolve(null);
          return;
        }

        if (Object.prototype.hasOwnProperty.call(result, CONFIG_STORAGE_KEY)) {
          resolve(normalizeConfig(result[CONFIG_STORAGE_KEY]));
          return;
        }

        resolve(null);
        });
      } catch {
        disposeInvalidExtensionContext();
        resolve(null);
      }
    });
  }

  function writeSyncConfig(config) {
    if (!hasSyncStorage()) {
      return Promise.resolve();
    }

    const nextConfig = normalizeConfig(config);
    return new Promise((resolve) => {
      try {
        chrome.storage.sync.set({ [CONFIG_STORAGE_KEY]: nextConfig }, () => {
          if (!isExtensionContextValid()) {
            disposeInvalidExtensionContext();
            resolve();
            return;
          }
        const error = runtimeLastError();
        if (error) {
          console.warn("[Polaris for Web] config sync write failed", error);
        }
        resolve();
        });
      } catch {
        disposeInvalidExtensionContext();
        resolve();
      }
    });
  }

  async function loadConfig() {
    const syncConfig = await readSyncConfig();
    if (syncConfig) {
      return syncConfig;
    }

    const legacyConfig = loadLegacyConfig();
    if (legacyConfig) {
      await writeSyncConfig(legacyConfig);
      return legacyConfig;
    }

    return { ...DEFAULT_CONFIG };
  }

  function saveConfig(config) {
    writeSyncConfig(config);
  }

  function watchConfigChanges() {
    if (!hasSyncStorage() || !chrome.storage.onChanged) {
      return;
    }

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "sync" || !changes[CONFIG_STORAGE_KEY]) {
        return;
      }

      const nextConfig = normalizeConfig(changes[CONFIG_STORAGE_KEY].newValue);
      if (configsEqual(state.config, nextConfig)) {
        return;
      }

      const userGroupLimitChanged = state.config.maxVisibleUserGroups !== nextConfig.maxVisibleUserGroups;
      state.config = nextConfig;
      if (userGroupLimitChanged) {
        state.areEarlierUserGroupsExpanded = false;
      }
      render();
    });
  }

  function syncSettingsInputs(settings) {
    let controller = settingsPanelControllers.get(settings);
    if (!controller) {
      controller = mountSettingsPanel(settings);
      settingsPanelControllers.set(settings, controller);
    }
    controller.render(createSettingsPanelModel());
  }

  function enabledLevelsForPlatform(platformKey, config = state.config) {
    return normalizeEnabledLevels(
      config && config.enabledLevelsByPlatform && config.enabledLevelsByPlatform[platformKey],
      platformKey
    );
  }

  function enabledLevelsForCurrentPlatform(config = state.config) {
    return enabledLevelsForPlatform(currentPlatformKey(), config);
  }

  function createSettingsPanelModel() {
    const platformKey = currentPlatformKey();
    const supportedLevels = new Set(supportedMarkerLevelsForPlatform(platformKey));
    const enabledLevels = enabledLevelsForPlatform(platformKey);
    const enabledSet = new Set(enabledLevels);
    return {
      appName: t("settings.appName"),
      contactLabel: t("contact.label"),
      emailLabel: t("contact.email"),
      emailUrl: "mailto:jefferyho.build@gmail.com",
      fields: CONFIG_FIELDS.map((field) => ({ ...field, value: state.config[field.key] })),
      iconUrl: extensionMetadata.iconUrl,
      issueLabel: t("contact.issue"),
      issueUrl: "https://github.com/Jeffery-Ho/Polaris-for-Web/issues",
      markerLevels: MARKER_LEVEL_OPTIONS
        .filter((level) => supportedLevels.has(level))
        .map((level) => ({
          isDisabled: enabledSet.has(level) && enabledLevels.length <= 1,
          isSelected: enabledSet.has(level),
          key: `h${level}`,
          label: `H${level}`,
          level
        })),
      markerTypesLabel: t("settings.markerTypes"),
      onConfigChange(key, value) {
        state.config = normalizeConfig({ ...state.config, [key]: value });
        if (key === "maxVisibleUserGroups") {
          state.areEarlierUserGroupsExpanded = false;
        }
      },
      onConfigCommit() {
        saveConfig(state.config);
        render();
      },
      onDismissRating() {
        dismissRating();
      },
      onMarkerLevelChange(level, isEnabled) {
        updateEnabledLevelForCurrentPlatform(level, isEnabled);
        saveConfig(state.config);
        render();
      },
      onOpenReleaseNotes() {
        state.releaseNotes = releaseNotesForUpdate(null, extensionMetadata.releaseVersion, 1);
        state.isReleaseNoticeOpen = state.releaseNotes.length > 0;
        state.releaseNoticeFocusPending = state.isReleaseNoticeOpen;
        state.shouldMarkReleaseNoticeRead = false;
        if (state.isReleaseNoticeOpen) {
          state.releaseNoticeReturnControlTab = state.activeControlTab;
          lockPageScroll();
          render();
        }
      },
      onReset() {
        state.config = normalizeConfig(DEFAULT_CONFIG);
        state.areEarlierUserGroupsExpanded = false;
        saveConfig(state.config);
        render();
      },
      onUnorderedListChange(isEnabled) {
        updateEnabledUnorderedListForCurrentPlatform(isEnabled);
        saveConfig(state.config);
        render();
      },
      resetLabel: t("settings.reset"),
      ratingAction: t("settings.ratingAction"),
      ratingAriaLabel: t("settings.ratingAria"),
      ratingDismissLabel: t("settings.ratingDismiss"),
      ratingPrompt: t("settings.ratingPrompt"),
      ratingUrl: "https://chromewebstore.google.com/detail/polaris-ai-chat-navigator/lkdbbnpcfkjdfnopecpbdaeegncdmajb",
      releaseNotesLabel: t("settings.releaseNotes"),
      settingsTitle: t("settings.title"),
      showRating: state.ratingDismissedUntil <= Date.now(),
      supportedPlatformsLabel: t("settings.supportedPlatforms"),
      unorderedList: {
        isSelected: enabledUnorderedListForPlatform(platformKey),
        label: t("settings.unorderedList")
      },
      version: extensionMetadata.version
    };
  }

  function updateEnabledLevelForCurrentPlatform(level, isEnabled) {
    const platformKey = currentPlatformKey();
    const supportedLevels = new Set(supportedMarkerLevelsForPlatform(platformKey));
    if (!supportedLevels.has(level)) {
      return;
    }

    const currentLevels = enabledLevelsForPlatform(platformKey);
    const nextLevels = isEnabled
      ? Array.from(new Set([...currentLevels, level]))
      : currentLevels.filter((currentLevel) => currentLevel !== level);
    if (!nextLevels.length) {
      return;
    }

    state.config = normalizeConfig({
      ...state.config,
      enabledLevelsByPlatform: {
        ...state.config.enabledLevelsByPlatform,
        [platformKey]: nextLevels
      }
    });
  }

  function enabledUnorderedListForPlatform(platformKey, config = state.config) {
    const source = config && config.enabledUnorderedListByPlatform;
    return source && Object.prototype.hasOwnProperty.call(source, platformKey)
      ? Boolean(source[platformKey])
      : DEFAULT_UNORDERED_LIST_BY_PLATFORM[platformKey];
  }

  function updateEnabledUnorderedListForCurrentPlatform(isEnabled) {
    const platformKey = currentPlatformKey();
    state.config = normalizeConfig({
      ...state.config,
      enabledUnorderedListByPlatform: {
        ...state.config.enabledUnorderedListByPlatform,
        [platformKey]: Boolean(isEnabled)
      }
    });
  }

  function activeControlPosition() {
    return state.pointerDrag?.kind === "controls"
      ? state.pointerDrag.controlPosition
      : state.config.controlPosition;
  }

  function clampedControlPosition(position, controls) {
    const rect = controls.getBoundingClientRect();
    return {
      top: Math.min(position.top, Math.max(0, window.innerHeight - rect.height - 16)),
      right: Math.min(position.right, Math.max(0, window.innerWidth - rect.width))
    };
  }

  function applyConfig(root, controlPosition = activeControlPosition()) {
    const controls = root.querySelector(`.${CONTROLS_CLASS}`);
    const position = controlPosition && controls instanceof HTMLElement
      ? clampedControlPosition(controlPosition, controls)
      : null;
    root.style.setProperty("--gpt-nav-top", position
      ? `${position.top}px`
      : `calc(var(--gpt-conversation-header-height, ${DEFAULT_HEADER_HEIGHT}px) + ${DEFAULT_TOP_GAP}px)`);
    root.style.setProperty("--gpt-nav-right", position ? `${position.right}px` : `${DEFAULT_RIGHT_OFFSET}px`);
    root.style.setProperty("--gpt-nav-width", position
      ? `calc(100vw - ${position.right}px)`
      : `calc(100vw - ${DEFAULT_RIGHT_OFFSET * 2}px)`);
    root.style.setProperty("--gpt-nav-tooltip-max-width", `${state.config.tooltipMaxWidth}px`);
  }

  function isVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
  }

  function elementFromNode(node) {
    if (node instanceof HTMLElement) {
      return node;
    }
    return node && node.parentElement instanceof HTMLElement ? node.parentElement : null;
  }

  function isExplosionOpen() {
    return state.isExplosionOpen;
  }

  function isEditableElement(element) {
    return element instanceof HTMLElement && Boolean(element.closest(USER_INPUT_SELECTOR));
  }

  function isShortcutTargetEditable() {
    const activeElement = document.activeElement;
    return isEditableElement(activeElement);
  }

  function normalizeExplosionText(text) {
    return text
      .replace(/\r\n/g, "\n")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function isDecorativeExplosionText(text) {
    return !text || /^[\-–—_*#>|=\s]+$/.test(text);
  }

  function isExplosionBlockElement(element, container) {
    if (!(element instanceof HTMLElement) || !isVisible(element) || !container.contains(element)) {
      return false;
    }

    if (isInsideNavigationRoot(element) || isUserInputContext(element)) {
      return false;
    }

    if (element.matches("li li")) {
      return false;
    }

    const nestedBlock = element.parentElement && element.parentElement.closest(EXPLOSION_BLOCK_SELECTOR);
    return !(nestedBlock instanceof HTMLElement && container.contains(nestedBlock));
  }

  function tableTextFromElement(table) {
    const rows = Array.from(table.querySelectorAll("tr"))
      .map((row) => Array.from(row.children)
        .filter((cell) => cell instanceof HTMLTableCellElement)
        .map((cell) => normalizeExplosionText(cell.innerText || cell.textContent || "").replace(/\|/g, "\\|"))
        .filter(Boolean));

    if (!rows.length) {
      return normalizeExplosionText(table.innerText || table.textContent || "");
    }

    const columnCount = Math.max(...rows.map((row) => row.length));
    return [
      `| ${rows[0].join(" | ")} |`,
      `| ${Array.from({ length: columnCount }, () => "---").join(" | ")} |`,
      ...rows.slice(1).map((row) => `| ${row.join(" | ")} |`)
    ].join("\n");
  }

  function explosionBlockFromElement(element) {
    const tagName = element.tagName.toLowerCase();
    const text = tagName === "table"
      ? tableTextFromElement(element)
      : normalizeExplosionText(element.innerText || element.textContent || "");
    const hasImage = tagName === "img" || Boolean(element.querySelector("img"));
    return { element, tagName, text, hasImage };
  }

  function collectExplosionBlocksFromContainer(container) {
    const blocks = [];
    container.querySelectorAll(EXPLOSION_BLOCK_SELECTOR).forEach((block) => {
      if (!(block instanceof HTMLElement) || !isExplosionBlockElement(block, container)) {
        return;
      }

      const explosionBlock = explosionBlockFromElement(block);
      if ((!explosionBlock.text && !explosionBlock.hasImage) || (explosionBlock.text && isDecorativeExplosionText(explosionBlock.text))) {
        return;
      }

      blocks.push(explosionBlock);
    });

    if (blocks.length) {
      return blocks;
    }

    return normalizeExplosionText(container.innerText || container.textContent || "")
      .split(/\n{2,}/)
      .map((segment) => normalizeExplosionText(segment))
      .filter((segment) => segment && !isDecorativeExplosionText(segment))
      .map((text) => ({ element: null, tagName: "p", text }));
  }

  function collectExplosionBlocks(containers = getAssistantContainers()) {
    return containers
      .filter((container) => container instanceof HTMLElement && !isInsideNavigationRoot(container))
      .flatMap((container) => collectExplosionBlocksFromContainer(container));
  }

  function collectExplosionParagraphsFromContainer(container) {
    return collectExplosionBlocksFromContainer(container).map((block) => block.text);
  }

  function collectExplosionParagraphs(containers = getAssistantContainers()) {
    return containers
      .filter((container) => container instanceof HTMLElement && !isInsideNavigationRoot(container))
      .flatMap((container) => collectExplosionParagraphsFromContainer(container));
  }

  function containerForHeading(headings, containers) {
    const headingToContainer = new Map();
    containers.forEach((container) => {
      headings.forEach((heading) => {
        if (container.contains(heading.element)) {
          headingToContainer.set(heading.element, container);
        }
      });
    });
    return headingToContainer;
  }

  function nextHeadingItemInContainer(headings, currentHeading, headingToContainer) {
    const container = headingToContainer.get(currentHeading.element);
    if (!container) {
      return null;
    }

    const currentIndex = headings.findIndex((heading) => heading.element === currentHeading.element);
    if (currentIndex < 0) {
      return null;
    }

    for (let index = currentIndex + 1; index < headings.length; index += 1) {
      const nextHeading = headings[index];
      if (headingToContainer.get(nextHeading.element) === container) {
        return nextHeading;
      }
    }

    return null;
  }

  function nodesBetweenHeadingBounds(container, startHeading, endHeading) {
    const blocks = Array.from(container.querySelectorAll(EXPLOSION_BLOCK_SELECTOR))
      .filter((block) => block instanceof HTMLElement && isExplosionBlockElement(block, container));

    return blocks.filter((block) => {
      if (!(block instanceof HTMLElement)) {
        return false;
      }
      const startsAtOrAfterHeading = startHeading === block || Boolean(startHeading.compareDocumentPosition(block) & Node.DOCUMENT_POSITION_FOLLOWING);
      const beforeNextHeading = !endHeading || Boolean(block.compareDocumentPosition(endHeading) & Node.DOCUMENT_POSITION_FOLLOWING);
      return startsAtOrAfterHeading && beforeNextHeading;
    });
  }

  function sectionBlocksFromHeading(container, heading, nextHeading) {
    const blocks = nodesBetweenHeadingBounds(container, heading, nextHeading);
    const sectionBlocks = blocks
      .map((block) => explosionBlockFromElement(block))
      .filter((block) => (block.text || block.hasImage) && (!block.text || !isDecorativeExplosionText(block.text)));

    const headingText = normalizeExplosionText(heading.innerText || heading.textContent || "");
    return sectionBlocks.filter((block, index) => !(index === 0 && block.text === headingText));
  }

  function fallbackExplosionSection(blocks = collectExplosionBlocks()) {
    return {
      id: "explosion-fallback-section",
      title: t("chapters.fullText"),
      markerKey: "",
      startElement: null,
      endElement: null,
      blocks,
      paragraphs: blocks.map((block) => block.text)
    };
  }

  function collectExplosionSections(headings = state.headings, containers = getAssistantContainers()) {
    if (!headings.length) {
      return [fallbackExplosionSection()];
    }

    const headingToContainer = containerForHeading(headings, containers);

    return headings.map((heading) => {
      const container = headingToContainer.get(heading.element);
      const nextHeading = nextHeadingItemInContainer(headings, heading, headingToContainer);
      const blocks = container ? sectionBlocksFromHeading(container, heading.element, nextHeading?.element || null) : [];
      return {
        id: heading.id,
        title: heading.title,
        markerKey: markerKeyFor(heading.element),
        startElement: heading.element,
        endElement: nextHeading?.element || null,
        blocks,
        paragraphs: blocks.map((block) => block.text)
      };
    });
  }

  function activeExplosionSectionIndexFromState(sections = state.explosionSections) {
    if (!sections.length) {
      return 0;
    }

    if (!state.isExplosionOpen && state.activeMarkerKey) {
      const sectionIndex = sections.findIndex((section) => section.markerKey === state.activeMarkerKey);
      if (sectionIndex >= 0) {
        return sectionIndex;
      }
    }

    return Math.min(Math.max(state.activeExplosionSectionIndex, 0), sections.length - 1);
  }

  function appendExplosionContent(target, source) {
    appendSanitizedChapterContent(target, source, document, location.href);
  }

  function appendExplosionTable(container, table) {
    const wrapper = document.createElement("div");
    wrapper.className = "gpt-paragraph-nav__explosion-table-wrap";
    wrapper.appendChild(table);
    container.appendChild(wrapper);
    return true;
  }

  function renderExplosionTable(container, source) {
    if (!source.querySelector("tr")) {
      return false;
    }

    const table = document.createElement("table");
    table.className = "gpt-paragraph-nav__explosion-table";
    appendExplosionContent(table, source);
    return appendExplosionTable(container, table);
  }

  function renderParsedMarkdownExplosionTable(container, markdownTable) {
    const table = document.createElement("table");
    table.className = "gpt-paragraph-nav__explosion-table";
    const head = document.createElement("thead");
    const headerRow = document.createElement("tr");
    markdownTable.headers.forEach((header) => {
      const cell = document.createElement("th");
      cell.scope = "col";
      appendParsedMarkdownInline(cell, header, document, location.href);
      headerRow.appendChild(cell);
    });
    head.appendChild(headerRow);
    table.appendChild(head);

    const body = document.createElement("tbody");
    markdownTable.rows.forEach((row) => {
      const tableRow = document.createElement("tr");
      row.forEach((value) => {
        const cell = document.createElement("td");
        appendParsedMarkdownInline(cell, value, document, location.href);
        tableRow.appendChild(cell);
      });
      body.appendChild(tableRow);
    });
    table.appendChild(body);
    return appendExplosionTable(container, table);
  }

  function appendParsedMarkdownList(target, list) {
    const element = document.createElement(list.ordered ? "ol" : "ul");
    element.className = "gpt-paragraph-nav__explosion-list";
    list.items.forEach((item) => {
      const listItem = document.createElement("li");
      if (typeof item.checked === "boolean") {
        listItem.className = "gpt-paragraph-nav__explosion-task-item";
        const checkbox = document.createElement("input");
        checkbox.className = "gpt-paragraph-nav__explosion-task-checkbox";
        checkbox.type = "checkbox";
        checkbox.checked = item.checked;
        checkbox.disabled = true;
        checkbox.setAttribute("aria-hidden", "true");
        listItem.appendChild(checkbox);
      }
      appendParsedMarkdownInline(listItem, item.inline, document, location.href);
      item.children.forEach((child) => appendParsedMarkdownList(listItem, child));
      element.appendChild(listItem);
    });
    target.appendChild(element);
  }

  function renderParsedMarkdownBlocks(container, blocks, sectionRole, paragraphIndex) {
    blocks.forEach((block) => {
      if (block.type === "table") {
        renderParsedMarkdownExplosionTable(container, block);
        return;
      }
      if (block.type === "list") {
        appendParsedMarkdownList(container, block);
        return;
      }
      if (block.type === "codeBlock") {
        const pre = document.createElement("pre");
        pre.className = "gpt-paragraph-nav__explosion-code";
        const code = document.createElement("code");
        code.textContent = block.value;
        pre.appendChild(code);
        container.appendChild(pre);
        return;
      }
      if (block.type === "rule") {
        const rule = document.createElement("hr");
        rule.className = "gpt-paragraph-nav__explosion-rule";
        container.appendChild(rule);
        return;
      }
      const isHeading = block.type === "heading";
      const element = document.createElement(isHeading ? `h${block.level}` : block.type === "quote" ? "blockquote" : "p");
      element.className = isHeading
        ? "gpt-paragraph-nav__explosion-heading"
        : block.type === "quote" ? "gpt-paragraph-nav__explosion-quote" : "gpt-paragraph-nav__explosion-paragraph";
      element.dataset.explosionParagraphIndex = String(paragraphIndex);
      element.dataset.explosionSectionRole = sectionRole;
      if (block.type === "quote") {
        renderParsedMarkdownBlocks(element, block.blocks, sectionRole, paragraphIndex);
      } else {
        appendParsedMarkdownInline(element, block.children, document, location.href);
      }
      container.appendChild(element);
    });
  }

  function parsedMarkdownBlocksForExplosionBlock(block) {
    if (block.tagName !== "p") {
      return null;
    }
    if (block.element instanceof HTMLElement && Array.from(block.element.children).some((child) => child.tagName !== "BR")) {
      return null;
    }
    return parseChapterMarkdown(block.text);
  }

  function renderExplosionSectionBlocks(container, blocks, sectionRole, section = null) {
    if (!blocks.length) {
      const empty = document.createElement("p");
      empty.className = "gpt-paragraph-nav__explosion-empty";
      empty.textContent = EXPLOSION_EMPTY_TEXT;
      container.appendChild(empty);
      if (section?.startElement instanceof HTMLElement && section.startElement.isConnected) {
        const jumpButton = document.createElement("button");
        jumpButton.type = "button";
        jumpButton.className = "gpt-paragraph-nav__explosion-action gpt-paragraph-nav__explosion-jump-source";
        jumpButton.textContent = t("chapters.jumpToSource");
        jumpButton.setAttribute("aria-label", t("chapters.jumpToSourceAria", { title: section.title }));
        jumpButton.addEventListener("click", () => jumpToExplosionSectionSource(section));
        container.appendChild(jumpButton);
      }
      return;
    }

    blocks.forEach((block, index) => {
      const markdownBlocks = parsedMarkdownBlocksForExplosionBlock(block);
      if (markdownBlocks) {
        renderParsedMarkdownBlocks(container, markdownBlocks, sectionRole, index);
        return;
      }

      if (block.tagName === "table" && block.element instanceof HTMLTableElement && renderExplosionTable(container, block.element)) {
        return;
      }

      if (block.tagName === "pre") {
        const pre = document.createElement("pre");
        pre.className = "gpt-paragraph-nav__explosion-code";
        const code = document.createElement("code");
        code.textContent = block.text;
        pre.appendChild(code);
        container.appendChild(pre);
        return;
      }

      if (block.tagName === "ul" || block.tagName === "ol") {
        const list = document.createElement(block.tagName);
        list.className = "gpt-paragraph-nav__explosion-list";
        if (block.element) {
          appendExplosionContent(list, block.element);
        }
        if (list.childElementCount) {
          container.appendChild(list);
          return;
        }
      }

      if (block.tagName === "img") {
        const figure = document.createElement("figure");
        figure.className = "gpt-paragraph-nav__explosion-figure";
        appendSanitizedChapterNode(figure, block.element, document, location.href);
        if (figure.childElementCount) {
          container.appendChild(figure);
        }
        return;
      }

      const isHeading = /^h[1-6]$/.test(block.tagName);
      const element = document.createElement(isHeading || block.tagName === "blockquote" || block.tagName === "figure" ? block.tagName : "p");
      element.className = isHeading
        ? "gpt-paragraph-nav__explosion-heading"
        : `gpt-paragraph-nav__explosion-${block.tagName === "blockquote" ? "quote" : block.tagName === "figure" ? "figure" : "paragraph"}`;
      element.dataset.explosionParagraphIndex = String(index);
      element.dataset.explosionSectionRole = sectionRole;
      if (block.element) {
        appendExplosionContent(element, block.element);
      } else {
        element.textContent = block.text;
      }
      container.appendChild(element);
    });
  }

  function renderExplosionSections(body, sections = state.explosionSections) {
    body.textContent = "";

    if (!sections.length) {
      const empty = document.createElement("p");
      empty.className = "gpt-paragraph-nav__explosion-empty";
      empty.textContent = EXPLOSION_EMPTY_TEXT;
      body.appendChild(empty);
      return;
    }

    const activeIndex = activeExplosionSectionIndexFromState(sections);
    const section = sections[activeIndex];
    const sectionNode = document.createElement("section");
    sectionNode.className = "gpt-paragraph-nav__explosion-section is-current";
    sectionNode.dataset.explosionSectionIndex = String(activeIndex);

    const title = document.createElement("div");
    title.className = "gpt-paragraph-nav__explosion-section-title";
    title.textContent = section.title;
    sectionNode.appendChild(title);

    renderExplosionSectionBlocks(sectionNode, section.blocks || [], "current", section);
    body.appendChild(sectionNode);
  }

  function renderExplosionChips(container, sections = state.explosionSections) {
    container.textContent = "";
    if (!sections.length || (sections.length === 1 && sections[0].markerKey === "")) {
      container.hidden = true;
      return;
    }

    container.hidden = false;
    const activeIndex = activeExplosionSectionIndexFromState(sections);
    filteredExplosionSections(sections).forEach(({ section, index }) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "gpt-paragraph-nav__explosion-chip";
      chip.textContent = section.title;
      chip.classList.toggle("is-active", index === activeIndex);
      chip.addEventListener("click", () => {
        activateExplosionSection(index);
      });
      container.appendChild(chip);
    });
  }

  function activateExplosionSection(index) {
    const sections = state.explosionSections;
    if (!sections.length) {
      return;
    }

    state.activeExplosionSectionIndex = ((index % sections.length) + sections.length) % sections.length;
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }

    const overlay = document.querySelector(`#${ROOT_ID} .gpt-paragraph-nav__explosion-overlay`);
    if (!(overlay instanceof HTMLElement)) {
      return;
    }

    syncExplosionOverlay(overlay);
    resetExplosionBodyScroll(overlay);
    requestAnimationFrame(() => {
      const activeChip = overlay.querySelector(".gpt-paragraph-nav__explosion-chip.is-active");
      activeChip?.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  }

  function explosionRenderSignature(sections = state.explosionSections) {
    const activeIndex = activeExplosionSectionIndexFromState(sections);
    return JSON.stringify({
      activeIndex,
      searchQuery: state.explosionSearchQuery,
      sections: sections.map((section) => ({
        id: section.id,
        title: section.title,
        markerKey: section.markerKey,
        paragraphs: section.paragraphs
      }))
    });
  }

  function resetExplosionBodyScroll(overlay) {
    const body = overlay.querySelector(".gpt-paragraph-nav__explosion-body");
    if (body instanceof HTMLElement) {
      body.scrollTop = 0;
    }
  }

  function syncExplosionOverlay(overlay) {
    const body = overlay.querySelector(".gpt-paragraph-nav__explosion-body");
    const chips = overlay.querySelector(".gpt-paragraph-nav__explosion-chips");
    const signature = explosionRenderSignature();
    if (body instanceof HTMLElement && signature !== state.lastExplosionRenderSignature) {
      renderExplosionSections(body);
      if (chips instanceof HTMLElement) {
        renderExplosionChips(chips);
      }
      state.lastExplosionRenderSignature = signature;
    }

    overlay.hidden = !state.isExplosionOpen;
    overlay.classList.toggle("is-open", state.isExplosionOpen);
  }

  function lockPageScroll() {
    if (state.scrollLock) {
      return;
    }

    state.scrollLock = {
      htmlOverflow: document.documentElement.style.overflow,
      bodyOverflow: document.body.style.overflow
    };
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }

  function unlockPageScroll() {
    if (!state.scrollLock) {
      return;
    }

    document.documentElement.style.overflow = state.scrollLock.htmlOverflow;
    document.body.style.overflow = state.scrollLock.bodyOverflow;
    state.scrollLock = null;
  }

  function openExplosionOverlay() {
    state.explosionSections = collectExplosionSections();
    state.activeExplosionSectionIndex = activeExplosionSectionIndexFromState(state.explosionSections);
    state.lastExplosionRenderSignature = "";
    state.isExplosionOpen = true;
    lockPageScroll();
    const overlay = getExplosionOverlay();
    syncExplosionOverlay(overlay);
    requestAnimationFrame(() => {
      resetExplosionBodyScroll(overlay);
    });
  }

  function closeExplosionOverlay() {
    if (!state.isExplosionOpen) {
      return;
    }

    state.isExplosionOpen = false;
    state.explosionSearchQuery = "";
    state.explosionSections = [];
    state.activeExplosionSectionIndex = 0;
    state.lastExplosionRenderSignature = "";
    unlockPageScroll();
    state.activeControlTab = "navigation";
    const root = document.getElementById(ROOT_ID);
    if (root instanceof HTMLElement) {
      syncControlTabs(root);
    }
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
    const overlay = document.querySelector(`#${ROOT_ID} .gpt-paragraph-nav__explosion-overlay`);
    if (overlay instanceof HTMLElement) {
      syncExplosionOverlay(overlay);
    }
  }

  function jumpToExplosionSectionSource(section) {
    const source = section?.startElement;
    if (!(source instanceof HTMLElement) || !source.isConnected) {
      return;
    }

    if (section.markerKey) {
      state.activeMarkerKey = section.markerKey;
    }
    closeExplosionOverlay();
    requestAnimationFrame(() => {
      const activeMarker = syncActiveMarker();
      updateFloatingActiveMarker(activeMarker);
      jumpToHeading({ element: source });
    });
  }

  function toggleExplosionOverlay() {
    if (isExplosionOpen()) {
      closeExplosionOverlay();
      return;
    }
    state.activeControlTab = "chapters";
    openExplosionOverlay();
    const root = document.getElementById(ROOT_ID);
    if (root instanceof HTMLElement) {
      syncControlTabs(root);
    }
  }

  async function writeTextToClipboard(text) {
    if (!text) {
      return false;
    }

    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {}
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);
    textarea.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    textarea.remove();
    return copied;
  }

  function currentExplosionSectionText() {
    const section = state.explosionSections[activeExplosionSectionIndexFromState()];
    if (!section) {
      return "";
    }
    const parts = section.markerKey ? [section.title, ...section.paragraphs] : section.paragraphs;
    return normalizeExplosionText(parts.filter(Boolean).join("\n\n"));
  }

  function fullExplosionText() {
    return normalizeExplosionText(collectExplosionParagraphs().join("\n\n"));
  }

  function showCopyToast(message) {
    const overlay = document.querySelector(`#${ROOT_ID} .gpt-paragraph-nav__explosion-overlay`);
    if (!(overlay instanceof HTMLElement)) {
      return;
    }

    overlay.querySelectorAll(".gpt-paragraph-nav__copy-toast").forEach((toast) => toast.remove());
    const toast = document.createElement("div");
    toast.className = "gpt-paragraph-nav__copy-toast";
    toast.textContent = message;
    overlay.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    window.setTimeout(() => {
      toast.classList.remove("is-visible");
      window.setTimeout(() => toast.remove(), 180);
    }, 1400);
  }

  async function copyCurrentExplosionSection() {
    const copied = await writeTextToClipboard(currentExplosionSectionText());
    if (copied) {
      showCopyToast(t("chapters.copySuccess"));
    }
    return copied;
  }

  async function copyFullExplosionText() {
    const copied = await writeTextToClipboard(fullExplosionText());
    if (copied) {
      showCopyToast(t("chapters.copySuccess"));
    }
    return copied;
  }

  function isInsideNavigationRoot(node) {
    const root = document.getElementById(ROOT_ID);
    return root instanceof HTMLElement && node instanceof Node && root.contains(node);
  }

  function isUserInputContext(node) {
    const element = elementFromNode(node);
    return element instanceof HTMLElement && Boolean(element.closest(USER_INPUT_SELECTOR));
  }

  function getConversationHeaderHeight() {
    const headers = Array.from(document.querySelectorAll(CONVERSATION_HEADER_SELECTOR))
      .filter((header) => header instanceof HTMLElement && isVisible(header))
      .map((header) => header.getBoundingClientRect())
      .filter((rect) => rect.top <= 4 && rect.bottom > 0);

    if (!headers.length) {
      return DEFAULT_HEADER_HEIGHT;
    }

    return Math.round(Math.max(...headers.map((rect) => rect.height)));
  }

  function updateHeaderOffset(root) {
    root.style.setProperty("--gpt-conversation-header-height", `${getConversationHeaderHeight()}px`);
  }

  function isDoubaoPage() {
    return window.location.hostname === "www.doubao.com" || window.location.hostname.endsWith(".doubao.com");
  }

  function isKimiPage() {
    return window.location.hostname === "kimi.com" || window.location.hostname.endsWith(".kimi.com");
  }

  function isQianwenPage() {
    return window.location.hostname === "qianwen.com" || window.location.hostname.endsWith(".qianwen.com");
  }

  function isYuanbaoPage() {
    return window.location.hostname === "yb.tencent.com"
      || window.location.hostname.endsWith(".yb.tencent.com")
      || window.location.hostname === "yuanbao.tencent.com"
      || window.location.hostname.endsWith(".yuanbao.tencent.com");
  }

  function isXiaohongshuPage() {
    return window.location.hostname === "diandian.xiaohongshu.com"
      || window.location.hostname.endsWith(".diandian.xiaohongshu.com")
      || (window.location.hostname === "www.xiaohongshu.com" && window.location.pathname.startsWith("/ai_chat"))
      || window.location.hostname === "www.askdiandian.com"
      || window.location.hostname.endsWith(".askdiandian.com")
      || window.location.hostname === "www.diandianlife.top"
      || window.location.hostname.endsWith(".diandianlife.top");
  }

  function isXiaohongshuMainChatPage() {
    return window.location.hostname === "www.xiaohongshu.com" && window.location.pathname.startsWith("/ai_chat");
  }

  function isUnsupportedXiaohongshuMainPage() {
    return window.location.hostname === "www.xiaohongshu.com" && !window.location.pathname.startsWith("/ai_chat");
  }

  function isSupportedRoute() {
    return !isUnsupportedXiaohongshuMainPage();
  }

  function currentRouteKey() {
    const { origin, pathname, search } = window.location;
    return `${origin}${pathname}${search}`;
  }

  function isChatGPTPage() {
    return window.location.hostname === "chatgpt.com"
      || window.location.hostname.endsWith(".chatgpt.com")
      || window.location.hostname === "chat.openai.com"
      || window.location.hostname.endsWith(".chat.openai.com");
  }

  function currentPlatformKey() {
    if (isChatGPTPage()) {
      return "chatgpt";
    }
    if (isDoubaoPage()) {
      return "doubao";
    }
    if (isKimiPage()) {
      return "kimi";
    }
    if (isQianwenPage()) {
      return "qianwen";
    }
    if (isYuanbaoPage()) {
      return "yuanbao";
    }
    if (isXiaohongshuPage()) {
      return "xiaohongshu";
    }
    return "default";
  }

  function getAssistantContainerSelectors() {
    if (isUnsupportedXiaohongshuMainPage()) {
      return [];
    }

    if (isXiaohongshuPage()) {
      return [
        XIAOHONGSHU_ASSISTANT_MARKDOWN_SELECTOR,
        XIAOHONGSHU_ASSISTANT_FALLBACK_SELECTOR,
        ASSISTANT_MESSAGE_SELECTOR,
        MARKDOWN_FALLBACK_SELECTOR
      ];
    }

    if (isYuanbaoPage()) {
      return [YUANBAO_ASSISTANT_MESSAGE_SELECTOR, ASSISTANT_MESSAGE_SELECTOR, MARKDOWN_FALLBACK_SELECTOR];
    }

    if (isKimiPage()) {
      return [KIMI_ASSISTANT_MESSAGE_SELECTOR, ASSISTANT_MESSAGE_SELECTOR, MARKDOWN_FALLBACK_SELECTOR];
    }

    if (isQianwenPage()) {
      return [QIANWEN_ASSISTANT_MESSAGE_SELECTOR, ASSISTANT_MESSAGE_SELECTOR, MARKDOWN_FALLBACK_SELECTOR];
    }

    if (isDoubaoPage()) {
      return [DOUBAO_ASSISTANT_MESSAGE_SELECTOR, ASSISTANT_MESSAGE_SELECTOR, MARKDOWN_FALLBACK_SELECTOR];
    }

    return [ASSISTANT_MESSAGE_SELECTOR, MARKDOWN_FALLBACK_SELECTOR];
  }

  function getAssistantContainers() {
    for (const selector of getAssistantContainerSelectors()) {
      const containers = Array.from(document.querySelectorAll(selector))
        .filter((node) => node instanceof HTMLElement
          && isVisible(node)
          && !isInsideNavigationRoot(node)
          && !isUserInputContext(node));
      if (containers.length > 0) {
        return containers;
      }
    }

    return [];
  }

  function getUserContainerSelectors() {
    if (isUnsupportedXiaohongshuMainPage()) {
      return [];
    }

    if (isXiaohongshuPage()) {
      return [
        XIAOHONGSHU_USER_MESSAGE_ROOT_SELECTOR,
        XIAOHONGSHU_USER_MESSAGE_SELECTOR,
        USER_MESSAGE_SELECTOR
      ];
    }

    if (isYuanbaoPage()) {
      return [YUANBAO_USER_MESSAGE_SELECTOR, USER_MESSAGE_SELECTOR];
    }

    if (isKimiPage()) {
      return [KIMI_USER_MESSAGE_SELECTOR, USER_MESSAGE_SELECTOR];
    }

    if (isQianwenPage()) {
      return [QIANWEN_USER_MESSAGE_SELECTOR, USER_MESSAGE_SELECTOR];
    }

    if (isDoubaoPage()) {
      return [DOUBAO_USER_MESSAGE_SELECTOR, USER_MESSAGE_SELECTOR];
    }

    return [USER_MESSAGE_SELECTOR];
  }

  function doubaoMessageRoleForContainer(container) {
    if (!(container instanceof HTMLElement)) {
      return "";
    }
    if (doubaoMessageRoleFromClassNames(container.classList) === "user") {
      return "user";
    }
    return container.matches(USER_MESSAGE_SELECTOR) ? "user" : "";
  }

  function getUserContainers() {
    for (const selector of getUserContainerSelectors()) {
      const containers = Array.from(document.querySelectorAll(selector))
        .filter((node) => node instanceof HTMLElement
          && isVisible(node)
          && !isInsideNavigationRoot(node)
          && !isUserInputContext(node)
          && (!isDoubaoPage() || doubaoMessageRoleForContainer(node) === "user"));
      if (containers.length > 0) {
        return containers;
      }
    }

    if (isXiaohongshuMainChatPage()) {
      return getXiaohongshuUserFallbackContainers();
    }

    return [];
  }

  function getXiaohongshuUserFallbackContainers() {
    const candidates = Array.from(document.querySelectorAll(XIAOHONGSHU_MESSAGE_ITEM_SELECTOR))
      .filter((node) => node instanceof HTMLElement
        && isVisible(node)
        && !isInsideNavigationRoot(node)
        && !isUserInputContext(node)
        && !node.matches(XIAOHONGSHU_ASSISTANT_MARKDOWN_SELECTOR)
        && !node.querySelector(XIAOHONGSHU_ASSISTANT_MARKDOWN_SELECTOR)
        && Boolean(normalizeTitle(node.innerText || node.textContent || "")));
    return candidates.filter((candidate) => !candidates.some((other) => other !== candidate && other.contains(candidate)));
  }

  function normalizeTitle(text) {
    return text.replace(/\s+/g, " ").trim();
  }

  function firstLineMarkerTitle(text) {
    return text.split(/\r?\n/)
      .map((line) => normalizeTitle(line))
      .find(Boolean) || "";
  }

  function compareDocumentOrder(left, right) {
    if (left === right) {
      return 0;
    }
    return left.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  }

  function compareConversationPosition(left, right) {
    const leftTop = left.getBoundingClientRect().top + window.scrollY;
    const rightTop = right.getBoundingClientRect().top + window.scrollY;
    if (Math.abs(leftTop - rightTop) > 1) {
      return leftTop - rightTop;
    }
    return compareDocumentOrder(left, right);
  }

  function makeUserMarkerItem(element) {
    const title = normalizeTitle(element.innerText || element.textContent || "");
    return {
      element,
      title,
      previewTitle: firstLineMarkerTitle(element.innerText || element.textContent || "") || title,
      markerKey: markerKeyFor(element)
    };
  }

  function chatGPTMessageIdForContainer(container) {
    if (!(container instanceof HTMLElement)) {
      return "";
    }
    const messageElement = container.closest("[data-message-id], [data-messageid]")
      || container.querySelector("[data-message-id], [data-messageid]");
    return messageElement instanceof HTMLElement
      ? messageElement.getAttribute("data-message-id") || messageElement.getAttribute("data-messageid") || ""
      : "";
  }

  function assistantContainerForHeading(heading, assistantContainers) {
    let matchedContainer = null;
    assistantContainers.forEach((container) => {
      if (!container.contains(heading.element)) {
        return;
      }
      if (!matchedContainer || matchedContainer.contains(container)) {
        matchedContainer = container;
      }
    });
    return matchedContainer;
  }

  function collectChatGPTMarkerGroups(conversation, assistantContainers, headings) {
    const groupsByMessageId = new Map(conversation.userMessages.map((message) => {
      const title = normalizeTitle(message.text);
      const user = {
        element: null,
        markerKey: `chatgpt-user-${message.id}`,
        previewTitle: firstLineMarkerTitle(message.text) || title,
        title,
        order: message.order
      };
      return [message.id, { key: user.markerKey, user, headings: [] }];
    }));
    const orphanGroup = { key: "orphan", user: null, headings: [] };

    headings.forEach((heading) => {
      const assistantContainer = assistantContainerForHeading(heading, assistantContainers);
      const assistantMessageId = chatGPTMessageIdForContainer(assistantContainer);
      const userMessageId = conversation.assistantToUserMessageId[assistantMessageId];
      const group = groupsByMessageId.get(userMessageId) || orphanGroup;
      group.headings.push(heading);
    });

    return [...groupsByMessageId.values(), orphanGroup]
      .filter((group) => group.user || group.headings.length)
      .sort((left, right) => (left.user ? left.user.order : Number.MAX_SAFE_INTEGER) - (right.user ? right.user.order : Number.MAX_SAFE_INTEGER));
  }

  function collectMarkerGroups(userContainers, assistantContainers, headings) {
    if (isChatGPTPage() && state.chatGPTConversation) {
      return collectChatGPTMarkerGroups(state.chatGPTConversation, assistantContainers, headings);
    }
    const userItems = userContainers
      .map((element) => makeUserMarkerItem(element))
      .filter((user) => Boolean(user.title))
      .sort((left, right) => compareConversationPosition(left.element, right.element));
    const userItemByElement = new Map(userItems.map((user) => [user.element, user]));
    const headingToAssistant = new Map();
    headings.forEach((heading) => {
      assistantContainers.forEach((container) => {
        if (!container.contains(heading.element)) {
          return;
        }
        const currentContainer = headingToAssistant.get(heading);
        if (!currentContainer || currentContainer.contains(container)) {
          headingToAssistant.set(heading, container);
        }
      });
    });
    const entries = [
      ...userContainers.map((element) => ({ type: "user", element })),
      ...assistantContainers.map((element) => ({ type: "assistant", element }))
    ].sort((left, right) => compareConversationPosition(left.element, right.element));
    const groupsByKey = new Map();
    const orphanGroup = { key: "orphan", user: null, headings: [] };
    const assistantToUser = new Map();
    let currentUser = null;

    entries.forEach((entry) => {
      if (entry.type === "user") {
        const user = userItemByElement.get(entry.element);
        if (!user) {
          return;
        }
        currentUser = user;
        groupsByKey.set(user.markerKey, { key: user.markerKey, user, headings: [] });
        return;
      }

      assistantToUser.set(entry.element, currentUser);
    });

    headings.forEach((heading) => {
      let user = assistantToUser.get(headingToAssistant.get(heading));
      if (!user && isXiaohongshuMainChatPage()) {
        user = userItems
          .filter((item) => compareConversationPosition(item.element, heading.element) <= 0)
          .pop() || null;
      }
      const group = user ? groupsByKey.get(user.markerKey) : orphanGroup;
      group.headings.push(heading);
    });

    return [...groupsByKey.values(), orphanGroup]
      .filter((group) => group.user || group.headings.length)
      .sort((left, right) => {
        const leftElement = left.user ? left.user.element : left.headings[0].element;
        const rightElement = right.user ? right.user.element : right.headings[0].element;
        return compareConversationPosition(leftElement, rightElement);
      });
  }

  function syncUserMarkerExpansion(groups) {
    if (state.userMarkerExpansionInitialized) {
      return;
    }

    const userGroups = groups.filter((group) => group.user);
    if (!userGroups.length) {
      return;
    }
    state.expandedUserMarkerKeys.add(userGroups[userGroups.length - 1].key);
    state.userMarkerExpansionInitialized = true;
  }

  function clampLevel(level) {
    if (Number.isNaN(level)) {
      return 2;
    }
    return Math.min(Math.max(level, 1), 4);
  }

  function headingLevelFor(element) {
    if (/^H[1-4]$/.test(element.tagName)) {
      return Number(element.tagName.slice(1));
    }
    return clampLevel(Number(element.getAttribute("aria-level")));
  }

  function makeHeadingItem(element, index, level, sourceType = "heading") {
    return {
      element,
      level: clampLevel(level),
      title: normalizeTitle(element.textContent || t("heading.fallback", { index: index + 1 })),
      id: element.id || `gpt-paragraph-heading-${index + 1}`,
      sourceType
    };
  }

  function tableMarkerCandidates(containers) {
    return containers.flatMap((container) => Array.from(container.querySelectorAll("table"))
      .filter((table) => table instanceof HTMLTableElement && isVisible(table))
      .map((table) => ({
        element: table,
        fingerprint: normalizeTitle(table.innerText || table.textContent || ""),
        cells: table.rows.length
          ? Array.from(table.rows[0].cells).map((cell) => cell.innerText || cell.textContent || "")
          : []
      })));
  }

  function collectTableHeadings(containers, seen, headings) {
    const tables = tableMarkerCandidates(containers);

    tableMarkerEntries(tables).forEach(({ element, title, fingerprint }, tableMarkerIndex) => {
      if (seen.has(element)) {
        return;
      }
      seen.add(element);
      headings.push({
        element,
        level: TABLE_MARKER_LEVEL,
        title,
        id: element.id || `gpt-paragraph-heading-${headings.length + 1}`,
        sourceType: "table",
        tableMarkerIndex,
        tableMarkerFingerprint: fingerprint
      });
    });
  }

  function markdownLevelFromText(text) {
    const match = text.match(/^(#{1,4})\s+\S/);
    return match ? match[1].length : null;
  }

  function numberedHeadingLevelFromText(text) {
    if (/^(?:第)?[一二三四五六七八九十百千万]+[、.．]\s*\S/.test(text)) {
      return 1;
    }

    return null;
  }

  function getLeadingStrong(element) {
    const firstElement = Array.from(element.childNodes)
      .find((node) => node.nodeType === Node.ELEMENT_NODE);

    if (!(firstElement instanceof HTMLElement)) {
      return null;
    }

    if (firstElement.matches("strong, b")) {
      return firstElement;
    }

    return null;
  }

  function isStandaloneStrongHeading(element) {
    const titleElement = getLeadingStrong(element);
    if (!titleElement) {
      return false;
    }

    const blockText = normalizeTitle(element.textContent || "");
    const titleText = normalizeTitle(titleElement.textContent || "");
    if (!titleText || titleText.length > 160) {
      return false;
    }

    const markdownLevel = markdownLevelFromText(blockText);
    if (markdownLevel) {
      return true;
    }

    if (/^\d{1,2}[.．、]\s+\S/.test(blockText)) {
      return false;
    }

    return blockText === titleText;
  }

  function isStandaloneNumberedHeading(element) {
    const text = normalizeTitle(element.textContent || "");
    if (!text || text.length > 180) {
      return false;
    }

    if (!numberedHeadingLevelFromText(text)) {
      return false;
    }

    const nestedBlocks = element.querySelectorAll("p, div, ul, ol, table, pre, blockquote");
    return nestedBlocks.length === 0;
  }

  function isUnorderedListItem(element) {
    const parentList = element.parentElement;
    return parentList instanceof HTMLElement && parentList.tagName === "UL";
  }

  function firstListItemBlock(element) {
    return Array.from(element.children)
      .find((child) => child instanceof HTMLElement
        && !child.matches("ul, ol, table, pre, blockquote")
        && normalizeTitle(child.textContent || ""));
  }

  function isTopLevelUnorderedListItem(element, container) {
    const parentList = element.parentElement;
    if (!(parentList instanceof HTMLElement) || parentList.tagName !== "UL") {
      return false;
    }

    return !parentList.parentElement
      || parentList.parentElement === container
      || !parentList.parentElement.closest("li");
  }

  function titleFromListItemStrong(element) {
    const titleElement = getLeadingStrong(element) || (firstListItemBlock(element) && getLeadingStrong(firstListItemBlock(element)));
    if (!titleElement) {
      return "";
    }

    const title = normalizeTitle(titleElement.textContent || "");
    return title && title.length <= 80 ? title : "";
  }

  function titleFromListItemText(element) {
    const sourceElement = firstListItemBlock(element) || element;
    const text = normalizeTitle(sourceElement.textContent || element.textContent || "");
    if (!text || text.length > 180) {
      return "";
    }

    const separatedTitle = text.match(/^([^:：]{2,80})[:：]\s*\S/);
    if (separatedTitle) {
      return normalizeTitle(separatedTitle[1]);
    }

    if (text.length <= 48 && !/[。！？.!?；;，,]\s*\S/.test(text)) {
      return text;
    }

    return "";
  }

  function unorderedListHeadingTitle(element, container) {
    if (!isTopLevelUnorderedListItem(element, container)) {
      return "";
    }

    if (element.querySelector("ul, ol, table, pre, blockquote")) {
      return "";
    }

    return titleFromListItemStrong(element) || titleFromListItemText(element);
  }

  function titleFromAttribute(element) {
    return normalizeTitle(element.getAttribute("data-title") || element.getAttribute("title") || element.getAttribute("aria-label") || "");
  }

  function firstLineTitle(element) {
    return normalizeTitle((element.textContent || "").split(/\n/)[0] || "");
  }

  function isLikelyVideoTitle(element, title) {
    if (!title || title.length > 160) {
      return false;
    }

    if (/^(播放|暂停|更多|关闭|分享|重播)$/.test(title)) {
      return false;
    }

    const className = String(element.className || "");
    return !/(sub.?title|desc|time|duration|button|icon|play|cover)/i.test(className);
  }

  function titleForYuanbaoVideoCard(card) {
    for (const selector of YUANBAO_VIDEO_TITLE_SELECTORS) {
      const candidates = Array.from(card.querySelectorAll(selector))
        .filter((node) => node instanceof HTMLElement && isVisible(node));

      for (const candidate of candidates) {
        const title = titleFromAttribute(candidate) || firstLineTitle(candidate);
        if (isLikelyVideoTitle(candidate, title)) {
          return { element: candidate, title };
        }
      }
    }

    const fallbackTitle = titleFromAttribute(card) || firstLineTitle(card);
    if (fallbackTitle && fallbackTitle.length <= 160) {
      return { element: card, title: fallbackTitle };
    }

    return null;
  }

  function collectYuanbaoVideoCardHeadings(seen, headings) {
    if (!isYuanbaoPage()) {
      return;
    }

    document.querySelectorAll(YUANBAO_VIDEO_CARD_SELECTOR).forEach((card) => {
      if (!(card instanceof HTMLElement) || !isVisible(card) || seen.has(card)) {
        return;
      }

      const title = titleForYuanbaoVideoCard(card);
      if (!title || seen.has(title.element)) {
        return;
      }

      seen.add(card);
      seen.add(title.element);
      headings.push({
        element: title.element,
        level: 2,
        title: title.title,
        id: title.element.id || `gpt-paragraph-heading-${headings.length + 1}`
      });
    });
  }

  function collectQianwenVideoListHeadings(seen, headings) {
    if (!isQianwenPage()) {
      return;
    }

    document.querySelectorAll(QIANWEN_VIDEO_LIST_SELECTOR).forEach((card) => {
      if (!(card instanceof HTMLElement) || !isVisible(card) || seen.has(card)) {
        return;
      }

      const titleElement = Array.from(card.querySelectorAll(QIANWEN_VIDEO_TITLE_SELECTOR))
        .find((node) => node instanceof HTMLElement && isVisible(node) && normalizeTitle(node.textContent || ""));
      if (!(titleElement instanceof HTMLElement) || seen.has(titleElement)) {
        return;
      }

      const title = normalizeTitle(titleElement.textContent || "");
      if (!title || title.length > 160) {
        return;
      }

      seen.add(card);
      seen.add(titleElement);
      headings.push({
        element: titleElement,
        level: 2,
        title,
        id: titleElement.id || `gpt-paragraph-heading-${headings.length + 1}`
      });
    });
  }

  function collectHeadings(containers = getAssistantContainers()) {
    const seen = new Set();
    const headings = [];

    containers.forEach((container) => {
      container.querySelectorAll(`${HEADING_SELECTOR}, ${ROLE_HEADING_SELECTOR}`).forEach((heading) => {
        if (heading instanceof HTMLElement && isVisible(heading) && !seen.has(heading)) {
          seen.add(heading);
          headings.push(makeHeadingItem(heading, headings.length, headingLevelFor(heading)));
        }
      });
    });

    containers.forEach((container) => {
      container.querySelectorAll(STRONG_HEADING_SELECTOR).forEach((heading) => {
        if (!(heading instanceof HTMLElement) || !isVisible(heading) || seen.has(heading)) {
          return;
        }
        if (heading.tagName === "LI" && isUnorderedListItem(heading)) {
          return;
        }
        if (!isStandaloneStrongHeading(heading)) {
          return;
        }

        seen.add(heading);
        const markdownLevel = markdownLevelFromText(normalizeTitle(heading.textContent || ""));
        headings.push(makeHeadingItem(heading, headings.length, markdownLevel || 2));
      });
    });

    containers.forEach((container) => {
      container.querySelectorAll(NUMBERED_HEADING_SELECTOR).forEach((heading) => {
        if (!(heading instanceof HTMLElement) || !isVisible(heading) || seen.has(heading)) {
          return;
        }
        if (!isStandaloneNumberedHeading(heading)) {
          return;
        }

        seen.add(heading);
        const level = numberedHeadingLevelFromText(normalizeTitle(heading.textContent || ""));
        headings.push(makeHeadingItem(heading, headings.length, level || 2));
      });
    });

    containers.forEach((container) => {
      container.querySelectorAll("ul > li").forEach((heading) => {
        if (!(heading instanceof HTMLElement) || !isVisible(heading) || seen.has(heading)) {
          return;
        }

        const title = unorderedListHeadingTitle(heading, container);
        if (!title) {
          return;
        }

        seen.add(heading);
        headings.push({
          element: heading,
          level: 3,
          title,
          id: heading.id || `gpt-paragraph-heading-${headings.length + 1}`,
          sourceType: "unordered-list"
        });
      });
    });

    collectTableHeadings(containers, seen, headings);
    collectYuanbaoVideoCardHeadings(seen, headings);
    collectQianwenVideoListHeadings(seen, headings);
    const platformKey = currentPlatformKey();
    const maxHeadingLevel = maxHeadingLevelForPlatform(platformKey);
    const enabledLevels = new Set(enabledLevelsForCurrentPlatform());
    const unorderedListEnabled = enabledUnorderedListForPlatform(platformKey);
    const usableHeadings = headings.filter((item) => {
      if (item.title.length <= 0) {
        return false;
      }
      if (item.sourceType === "unordered-list") {
        return unorderedListEnabled;
      }
      return item.level <= maxHeadingLevel && enabledLevels.has(item.level);
    });
    debugCollection(containers, usableHeadings);
    return usableHeadings.sort((left, right) => compareConversationPosition(left.element, right.element));
  }

  function debugCollection(containers, headings) {
    const metrics = getConversationMetrics(containers);
    const signature = [
      containers.length,
      document.querySelectorAll(HEADING_SELECTOR).length,
      document.querySelectorAll(ROLE_HEADING_SELECTOR).length,
      headings.length,
      Math.round(metrics.length)
    ].join(":");

    if (signature === state.lastDebugSignature) {
      return;
    }

    state.lastDebugSignature = signature;
    console.info("[Polaris for Web] scan", {
      assistantContainers: containers.length,
      domHeadings: document.querySelectorAll(HEADING_SELECTOR).length,
      roleHeadings: document.querySelectorAll(ROLE_HEADING_SELECTOR).length,
      usableHeadings: headings.length,
      conversationLength: Math.round(metrics.length),
      titles: headings.slice(0, 8).map((heading) => heading.title)
    });
  }

  function ensureHeadingIds(headings) {
    headings.forEach((item) => {
      if (!item.element.id) {
        item.element.id = item.id;
      }
    });
  }

  function getConversationMetrics(containers) {
    const visibleContainers = containers.filter(isVisible);
    if (!visibleContainers.length) {
      return getDocumentMetrics();
    }

    const positions = visibleContainers.map((container) => {
      const rect = container.getBoundingClientRect();
      return {
        top: rect.top + window.scrollY,
        bottom: rect.bottom + window.scrollY
      };
    });

    const top = Math.min(...positions.map((position) => position.top));
    const bottom = Math.max(...positions.map((position) => position.bottom));
    if (bottom <= top) {
      return getDocumentMetrics();
    }

    return {
      top,
      bottom,
      length: bottom - top
    };
  }

  function getDocumentMetrics() {
    const documentHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      window.innerHeight
    );
    return {
      top: 0,
      bottom: documentHeight,
      length: documentHeight
    };
  }

  function normalizeSearchQuery(query) {
    return Array.from(query || "")
      .filter((char) => char.trim().length > 0)
      .join("")
      .toLocaleLowerCase();
  }

  function matchesSearch(query, title) {
    const needle = Array.from(normalizeSearchQuery(query));
    if (!needle.length) {
      return true;
    }

    const haystack = Array.from(normalizeSearchQuery(title));
    let needleIndex = 0;
    for (const char of haystack) {
      if (char === needle[needleIndex]) {
        needleIndex += 1;
        if (needleIndex === needle.length) {
          return true;
        }
      }
    }
    return false;
  }

  function filteredHeadings(headings = state.headings) {
    if (!normalizeSearchQuery(state.markerSearchQuery)) {
      return headings;
    }
    return headings.filter((heading) => matchesSearch(state.markerSearchQuery, heading.title));
  }

  function filteredMarkerGroups(groups = state.markerGroups) {
    const hasQuery = Boolean(normalizeSearchQuery(state.markerSearchQuery));
    if (!hasQuery) {
      return groups.map((group) => ({ ...group, visibleHeadings: group.headings }));
    }

    return groups
      .map((group) => {
        const userMatches = group.user && matchesSearch(state.markerSearchQuery, group.user.title);
        const visibleHeadings = userMatches
          ? group.headings
          : group.headings.filter((heading) => matchesSearch(state.markerSearchQuery, heading.title));
        return { ...group, visibleHeadings, userMatches };
      })
      .filter((group) => group.userMatches || group.visibleHeadings.length > 0);
  }

  function limitedMarkerGroups(groups = state.markerGroups) {
    if (normalizeSearchQuery(state.markerSearchQuery)) {
      return { groups, earlierUserGroupCount: 0 };
    }

    const userGroups = groups.filter((group) => group.user);
    const earlierUserGroupCount = Math.max(0, userGroups.length - state.config.maxVisibleUserGroups);
    if (!earlierUserGroupCount || state.areEarlierUserGroupsExpanded) {
      return { groups, earlierUserGroupCount };
    }

    const hiddenGroupKeys = new Set(userGroups.slice(0, earlierUserGroupCount).map((group) => group.key));
    return {
      groups: groups.filter((group) => !hiddenGroupKeys.has(group.key)),
      earlierUserGroupCount
    };
  }

  function filteredExplosionSections(sections = state.explosionSections) {
    return sections
      .map((section, index) => ({ section, index }))
      .filter(({ section }) => matchesSearch(state.explosionSearchQuery, section.title));
  }

  function foldEnabledFor(headings = state.headings) {
    return !state.markerSearchQuery && headings.length >= state.config.foldThreshold;
  }

  function fullFoldGroups(headings = state.headings) {
    if (!foldEnabledFor(headings)) {
      return [];
    }

    const size = state.config.foldThreshold;
    const fullGroupCount = Math.floor(headings.length / size);
    return Array.from({ length: fullGroupCount }, (_, index) => ({
      index,
      group: headings.slice(index * size, (index + 1) * size)
    }));
  }

  function trailingHeadings(headings = state.headings) {
    if (!foldEnabledFor(headings)) {
      return headings;
    }
    const size = state.config.foldThreshold;
    return headings.slice(Math.floor(headings.length / size) * size);
  }

  function foldKeyFor(group, index) {
    return `${group.key}:${index}`;
  }

  function markerWidthFor(title) {
    const characterCount = Array.from(title).length;
    return Math.max(24, Math.ceil((characterCount / 50) * 24));
  }

  function markerPreviewFor(title) {
    return title;
  }

  function markerKeyFor(element) {
    let key = markerKeys.get(element);
    if (!key) {
      key = `marker-${nextMarkerKey}`;
      nextMarkerKey += 1;
      markerKeys.set(element, key);
    }
    return key;
  }

  function nearestVerticalScrollContainer(element) {
    for (let parent = element.parentElement; parent instanceof HTMLElement; parent = parent.parentElement) {
      const overflowY = window.getComputedStyle(parent).overflowY;
      if (parent.scrollHeight > parent.clientHeight && /^(auto|scroll|overlay)$/.test(overflowY)) {
        return parent;
      }
    }
    return null;
  }

  function jumpToTable(heading, behavior) {
    return scrollTableMarkerIntoView({
      element: heading.element,
      scrollContainer: nearestVerticalScrollContainer(heading.element),
      headerHeight: getConversationHeaderHeight(),
      gap: TABLE_MARKER_SCROLL_GAP,
      behavior
    });
  }

  function currentElementForHeading(heading) {
    if (heading.element instanceof HTMLElement && heading.element.isConnected) {
      return heading.element;
    }
    const element = document.getElementById(heading.id);
    if (element instanceof HTMLElement && element.isConnected && heading.sourceType !== "table") {
      return element;
    }
    if (heading.sourceType !== "table") {
      return null;
    }
    const currentTable = tableMarkerEntryForTarget(
      tableMarkerCandidates(getAssistantContainers()),
      heading.tableMarkerIndex,
      heading.title,
      heading.tableMarkerFingerprint
    );
    return currentTable && currentTable.element instanceof HTMLElement && currentTable.element.isConnected
      ? currentTable.element
      : null;
  }

  function jumpToHeading(heading, behavior = "smooth") {
    const element = currentElementForHeading(heading);
    if (!element) {
      return false;
    }
    const currentHeading = element === heading.element ? heading : { ...heading, element };
    let didJump;
    if (currentHeading.sourceType === "table") {
      didJump = jumpToTable(currentHeading, behavior);
    } else {
      element.scrollIntoView({ behavior, block: "start" });
      didJump = true;
    }
    if (!didJump) {
      return false;
    }
    window.history.replaceState(null, "", `#${encodeURIComponent(element.id)}`);
    return true;
  }

  function scrollMarkerIntoListView(marker) {
    const list = getList();
    const markerRect = marker.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    const topOverflow = listRect.top - markerRect.top;
    const bottomOverflow = markerRect.bottom - listRect.bottom;

    if (topOverflow > 0) {
      list.scrollTop -= topOverflow + 8;
    } else if (bottomOverflow > 0) {
      list.scrollTop += bottomOverflow + 8;
    }
    state.markerListScrollTarget = list.scrollTop;
  }

  function getLiquidGlassDisplacementMap({ height, width, radius, depth }) {
    const yStart = Math.ceil((radius / height) * 15);
    const yEnd = Math.floor(100 - (radius / height) * 15);
    const xStart = Math.ceil((radius / width) * 15);
    const xEnd = Math.floor(100 - (radius / width) * 15);
    return "data:image/svg+xml;utf8," + encodeURIComponent(`<svg height="${height}" width="${width}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <style>.mix { mix-blend-mode: screen; }</style>
  <defs>
    <linearGradient id="Y" x1="0" x2="0" y1="${yStart}%" y2="${yEnd}%">
      <stop offset="0%" stop-color="#0F0" />
      <stop offset="100%" stop-color="#000" />
    </linearGradient>
    <linearGradient id="X" x1="${xStart}%" x2="${xEnd}%" y1="0" y2="0">
      <stop offset="0%" stop-color="#F00" />
      <stop offset="100%" stop-color="#000" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" height="${height}" width="${width}" fill="#808080" />
  <g filter="blur(2px)">
    <rect x="0" y="0" height="${height}" width="${width}" fill="#000080" />
    <rect x="0" y="0" height="${height}" width="${width}" fill="url(#Y)" class="mix" />
    <rect x="0" y="0" height="${height}" width="${width}" fill="url(#X)" class="mix" />
    <rect x="${depth}" y="${depth}" height="${Math.max(1, height - 2 * depth)}" width="${Math.max(1, width - 2 * depth)}" fill="#808080" rx="${radius}" ry="${radius}" filter="blur(${depth}px)" />
  </g>
</svg>`);
  }

  function getLiquidGlassDisplacementFilter({ height, width, radius, depth, strength, chromaticAberration }) {
    const displacementMap = getLiquidGlassDisplacementMap({ height, width, radius, depth });
    return "data:image/svg+xml;utf8," + encodeURIComponent(`<svg height="${height}" width="${width}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="displace" color-interpolation-filters="sRGB">
      <feImage x="0" y="0" height="${height}" width="${width}" href="${displacementMap}" result="displacementMap" />
      <feDisplacementMap in="SourceGraphic" in2="displacementMap" scale="${strength + chromaticAberration * 2}" xChannelSelector="R" yChannelSelector="G" />
      <feColorMatrix type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="displacedR" />
      <feDisplacementMap in="SourceGraphic" in2="displacementMap" scale="${strength + chromaticAberration}" xChannelSelector="R" yChannelSelector="G" />
      <feColorMatrix type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="displacedG" />
      <feDisplacementMap in="SourceGraphic" in2="displacementMap" scale="${strength}" xChannelSelector="R" yChannelSelector="G" />
      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="displacedB" />
      <feBlend in="displacedR" in2="displacedG" mode="screen" />
      <feBlend in2="displacedB" mode="screen" />
    </filter>
  </defs>
</svg>`) + "#displace";
  }

  function getLiquidGlassObserver() {
    if (typeof ResizeObserver === "undefined") {
      return null;
    }
    if (!state.liquidGlassObserver) {
      state.liquidGlassObserver = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.target instanceof HTMLElement) {
            updateLiquidGlassFilter(entry.target);
          }
        });
      });
    }
    return state.liquidGlassObserver;
  }

  function syncLiquidGlassElements(root = getRoot()) {
    state.liquidGlassElements.forEach((element) => {
      if (!element.isConnected || !root.contains(element)) {
        const observer = getLiquidGlassObserver();
        if (observer) {
          observer.unobserve(element);
        }
        state.liquidGlassElements.delete(element);
        liquidGlassSignatures.delete(element);
      }
    });
    root.querySelectorAll(LIQUID_GLASS_SELECTOR).forEach((element) => {
      if (element instanceof HTMLElement) {
        observeLiquidGlassElement(element);
      }
    });
  }

  function observeLiquidGlassElement(element) {
    if (!state.liquidGlassElements.has(element)) {
      state.liquidGlassElements.add(element);
      const observer = getLiquidGlassObserver();
      if (observer) {
        observer.observe(element);
      }
    }
    updateLiquidGlassFilter(element);
  }

  function updateLiquidGlassFilter(element) {
    const rect = element.getBoundingClientRect();
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    if (width <= 0 || height <= 0) {
      element.style.removeProperty("--gpt-liquid-glass-filter");
      liquidGlassSignatures.delete(element);
      return;
    }

    const style = window.getComputedStyle(element);
    const radius = Math.max(0, Math.round(parseFloat(style.borderTopLeftRadius) || 0));
    const depth = Math.max(3, Math.min(10, Math.round(Math.min(width, height) / 4)));
    const strength = Math.max(18, Math.min(42, Math.round(Math.min(width, height) * 1.2)));
    const chromaticAberration = element.classList.contains(FLOATING_ACTIVE_CLASS) || element.classList.contains("is-active") ? 2 : 1;
    const signature = `${width}:${height}:${radius}:${depth}:${strength}:${chromaticAberration}`;
    if (liquidGlassSignatures.get(element) === signature) {
      return;
    }

    const filterUrl = getLiquidGlassDisplacementFilter({
      height,
      width,
      radius,
      depth,
      strength,
      chromaticAberration
    });
    element.style.setProperty("--gpt-liquid-glass-filter", `url("${filterUrl}")`);
    liquidGlassSignatures.set(element, signature);
  }

  function requestActiveMarkerListScrollPersistence() {
    state.markerListScrollUntil = performance.now() + MARKER_LIST_SCROLL_PERSIST_MS;
    persistActiveMarkerListScroll();
  }

  function persistActiveMarkerListScroll() {
    if (state.markerListScrollScheduled) {
      return;
    }
    state.markerListScrollScheduled = window.requestAnimationFrame(() => {
      state.markerListScrollScheduled = 0;
      const marker = getActiveMarker();
      if (!(marker instanceof HTMLElement) || state.isCollapsed) {
        state.markerListScrollUntil = 0;
        return;
      }

      scrollMarkerIntoListView(marker);
      updateFloatingActiveMarker(marker);
      if (performance.now() < state.markerListScrollUntil) {
        persistActiveMarkerListScroll();
      }
    });
  }

  function appendFoldControl(list, headings, foldKey) {
    const first = headings[0];
    const remainingCount = headings.length - 1;
    const isExpanded = state.expandedFoldGroups.has(foldKey);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gpt-paragraph-nav__fold";
    button.classList.toggle("is-expanded", isExpanded);
    button.setAttribute("aria-expanded", String(isExpanded));
    button.setAttribute("aria-label", isExpanded
      ? t("fold.collapseAria", { title: first.title, count: remainingCount })
      : t("fold.expandAria", { title: first.title, count: remainingCount }));
    button.title = first.title;

    const countBadge = document.createElement("span");
    countBadge.className = "gpt-paragraph-nav__fold-count";
    countBadge.textContent = String(headings.length);
    button.appendChild(countBadge);

    const label = document.createElement("span");
    label.className = "gpt-paragraph-nav__fold-label";
    label.textContent = markerPreviewFor(first.title);
    button.appendChild(label);

    const remainder = document.createElement("span");
    remainder.className = "gpt-paragraph-nav__fold-remainder";
    remainder.textContent = t("fold.remainder", { count: remainingCount });
    button.appendChild(remainder);

    const chevron = document.createElement("span");
    chevron.className = "gpt-paragraph-nav__fold-chevron";
    chevron.setAttribute("aria-hidden", "true");
    button.appendChild(chevron);

    button.addEventListener("click", () => {
      if (state.expandedFoldGroups.has(foldKey)) {
        state.expandedFoldGroups.delete(foldKey);
      } else {
        state.expandedFoldGroups.add(foldKey);
      }
      render();
    });
    appendMarkerRow(list, "ai", button);
  }

  function appendMarkerRow(list, kind, marker) {
    const row = document.createElement("div");
    row.className = `gpt-paragraph-nav__marker-row gpt-paragraph-nav__marker-row--${kind}`;
    row.appendChild(marker);
    list.appendChild(row);
  }

  function appendMarker(list, heading) {
    const markerKey = markerKeyFor(heading.element);
    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = `gpt-paragraph-nav__marker gpt-paragraph-nav__marker--ai level-${heading.level}`;
    marker.style.setProperty("--marker-width", `${markerWidthFor(heading.title)}px`);
    marker.setAttribute("aria-label", heading.title);
    marker.dataset.markerKey = markerKey;

    const preview = document.createElement("span");
    preview.className = "gpt-paragraph-nav__preview";
    preview.textContent = markerPreviewFor(heading.title);
    marker.appendChild(preview);

    const label = document.createElement("span");
    label.className = "gpt-paragraph-nav__label";
    label.textContent = heading.title;
    marker.appendChild(label);

    marker.addEventListener("click", () => {
      if (!jumpToHeading(heading)) {
        return;
      }
      state.activeMarkerKey = markerKey;
      syncActiveMarker(state.activeMarkerKey);
      requestActiveMarkerListScrollPersistence();
      updateFloatingActiveMarker();
    });
    appendMarkerRow(list, "ai", marker);
  }

  function showMarkerNotice(message) {
    const root = getRoot();
    root.querySelectorAll(".gpt-paragraph-nav__marker-notice").forEach((notice) => notice.remove());
    const notice = document.createElement("div");
    notice.className = "gpt-paragraph-nav__marker-notice";
    notice.setAttribute("role", "status");
    notice.setAttribute("aria-live", "polite");
    notice.textContent = message;
    root.appendChild(notice);
    requestAnimationFrame(() => notice.classList.add("is-visible"));
    window.clearTimeout(state.markerNoticeTimer);
    state.markerNoticeTimer = window.setTimeout(() => {
      notice.classList.remove("is-visible");
      window.setTimeout(() => notice.remove(), 180);
    }, 2200);
  }

  function appendUserMarker(list, group) {
    const { user } = group;
    const isExpanded = state.expandedUserMarkerKeys.has(group.key);
    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = "gpt-paragraph-nav__marker gpt-paragraph-nav__marker--user";
    marker.style.setProperty("--marker-width", `${markerWidthFor(user.previewTitle)}px`);
    marker.setAttribute("aria-expanded", String(isExpanded));
    marker.setAttribute("aria-label", isExpanded
      ? t("userMarker.collapseAria", { title: user.title })
      : t("userMarker.expandAria", { title: user.title }));
    marker.dataset.userMarkerKey = group.key;

    const preview = document.createElement("span");
    preview.className = "gpt-paragraph-nav__preview";
    preview.textContent = markerPreviewFor(user.previewTitle);
    marker.appendChild(preview);

    const chevron = document.createElement("span");
    chevron.className = "gpt-paragraph-nav__user-chevron";
    chevron.setAttribute("aria-hidden", "true");
    marker.appendChild(chevron);

    const label = document.createElement("span");
    label.className = "gpt-paragraph-nav__label";
    label.textContent = user.title;
    marker.appendChild(label);

    marker.addEventListener("click", () => {
      if (isChatGPTPage() && group.visibleHeadings.length === 0) {
        showMarkerNotice(t("userMarker.replyNotLoaded"));
        return;
      }
      if (state.expandedUserMarkerKeys.has(group.key)) {
        state.expandedUserMarkerKeys.delete(group.key);
      } else {
        state.expandedUserMarkerKeys.add(group.key);
      }
      render();
    });
    appendMarkerRow(list, "user", marker);
  }

  function appendEarlierUserGroupsControl(list, count) {
    const isExpanded = state.areEarlierUserGroupsExpanded;
    const label = t("userMarker.earlierGroups", { count });
    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = "gpt-paragraph-nav__marker gpt-paragraph-nav__marker--user";
    marker.style.setProperty("--marker-width", `${markerWidthFor(label)}px`);
    marker.setAttribute("aria-expanded", String(isExpanded));
    marker.setAttribute("aria-label", isExpanded
      ? t("userMarker.collapseEarlierAria", { count })
      : t("userMarker.expandEarlierAria", { count }));

    const preview = document.createElement("span");
    preview.className = "gpt-paragraph-nav__preview";
    preview.textContent = label;
    marker.appendChild(preview);

    const chevron = document.createElement("span");
    chevron.className = "gpt-paragraph-nav__user-chevron";
    chevron.setAttribute("aria-hidden", "true");
    marker.appendChild(chevron);

    marker.addEventListener("click", () => {
      state.areEarlierUserGroupsExpanded = !state.areEarlierUserGroupsExpanded;
      render();
    });
    appendMarkerRow(list, "user", marker);
  }

  function displayedHeadingCount(group, headings) {
    if (!headings.length) {
      return 0;
    }
    if (!foldEnabledFor(headings)) {
      return headings.length;
    }

    const groups = fullFoldGroups(headings);
    const trailing = trailingHeadings(headings);
    return groups.reduce((count, { index, group: foldedHeadings }) => (
      count + 1 + (state.expandedFoldGroups.has(foldKeyFor(group, index)) ? foldedHeadings.length : 0)
    ), trailing.length);
  }

  function appendMarkerGroup(list, group) {
    const isSearchActive = Boolean(normalizeSearchQuery(state.markerSearchQuery));
    const isExpanded = !group.user || isSearchActive || state.expandedUserMarkerKeys.has(group.key);

    if (group.user) {
      appendUserMarker(list, group);
    }

    if (isExpanded && group.visibleHeadings.length) {
      const foldEnabled = foldEnabledFor(group.visibleHeadings);
      const groups = foldEnabled ? fullFoldGroups(group.visibleHeadings) : [];
      const trailing = foldEnabled ? trailingHeadings(group.visibleHeadings) : group.visibleHeadings;
      groups.forEach(({ group: foldedHeadings, index }) => {
        const foldKey = foldKeyFor(group, index);
        appendFoldControl(list, foldedHeadings, foldKey);
        if (state.expandedFoldGroups.has(foldKey)) {
          foldedHeadings.forEach((heading) => appendMarker(list, heading));
        }
      });
      trailing.forEach((heading) => appendMarker(list, heading));
    }
  }

  function render() {
    if (!isExtensionContextValid()) {
      disposeInvalidExtensionContext();
      return;
    }

    if (!isSupportedRoute()) {
      closeExplosionOverlay();
      removeNavigationRoot();
      return;
    }

    const root = getRoot();
    updatePageTheme(root);
    getReleaseNoticeOverlay(root);

    const assistantContainers = getAssistantContainers();
    const userContainers = getUserContainers();
    const hasChatGPTConversation = isChatGPTPage() && Boolean(state.chatGPTConversation?.userMessages.length);
    if (!assistantContainers.length && !userContainers.length && !hasChatGPTConversation) {
      closeExplosionOverlay();
      if (!state.isReleaseNoticeOpen) {
        removeNavigationRoot();
      }
      return;
    }

    updateHeaderOffset(root);
    getControlCapsule(root);
    getSettings(root);
    applyConfig(root);
    const controls = getControls(root);
    const controlWidth = controls.getBoundingClientRect().width;
    if (controlWidth > 0) {
      root.style.setProperty("--gpt-nav-controls-width", `${Math.round(controlWidth)}px`);
    }
    applyConfig(root);
    const list = getList(root);
    stopMarkerListScrollAnimation(list);
    getMarkerSearchInput(root);
    const searchInput = root.querySelector(".gpt-paragraph-nav__search-input");
    const searchWrapper = searchInput instanceof HTMLElement
      ? searchInput.closest(".gpt-paragraph-nav__search")
      : null;
    if (searchWrapper instanceof HTMLElement) {
      searchWrapper.hidden = state.isCollapsed;
    }
    getExplosionOverlay(root);
    const headings = collectHeadings(assistantContainers);
    const markerGroups = collectMarkerGroups(userContainers, assistantContainers, headings);
    syncUserMarkerExpansion(markerGroups);
    const filteredGroups = filteredMarkerGroups(markerGroups);
    const { groups: visibleGroups, earlierUserGroupCount } = limitedMarkerGroups(filteredGroups);
    const metrics = getConversationMetrics([...assistantContainers, ...userContainers]);
    ensureHeadingIds(headings);
    state.headings = headings;
    state.markerGroups = markerGroups;
    state.conversationMetrics = metrics;
    document.documentElement.setAttribute(DEBUG_ATTR, `loaded:${headings.length}:${Math.round(metrics.length)}`);
    const displayedCount = visibleGroups.reduce((count, group) => {
      const isSearchActive = Boolean(normalizeSearchQuery(state.markerSearchQuery));
      const isExpanded = !group.user || isSearchActive || state.expandedUserMarkerKeys.has(group.key);
      return count + (group.user ? 1 : 0) + (isExpanded ? displayedHeadingCount(group, group.visibleHeadings) : 0);
    }, earlierUserGroupCount ? 1 : 0);
    const hasMarkers = markerGroups.length > 0;
    root.style.setProperty("--queue-visible-count", String(Math.min(displayedCount || 1, state.config.maxVisible)));
    root.classList.toggle("is-empty", !hasMarkers);
    root.classList.toggle("is-collapsed", state.isCollapsed && hasMarkers);
    list.style.height = state.isCollapsed && state.collapsedListHeight > 0 ? `${state.collapsedListHeight}px` : "";
    list.setAttribute("aria-hidden", String(state.isCollapsed));
    list.textContent = "";
    syncLiquidGlassElements(root);

    if (state.isCollapsed) {
      updateFloatingActiveMarker(null);
      state.lastRenderedHeadingCount = headings.length;
      return;
    }

    if (!visibleGroups.length && state.markerSearchQuery) {
      const empty = document.createElement("div");
      empty.className = "gpt-paragraph-nav__search-empty";
      empty.textContent = t("search.empty");
      list.appendChild(empty);
    }

    let isEarlierUserGroupsControlAppended = false;
    visibleGroups.forEach((group) => {
      if (earlierUserGroupCount && !isEarlierUserGroupsControlAppended && group.user) {
        appendEarlierUserGroupsControl(list, earlierUserGroupCount);
        isEarlierUserGroupsControlAppended = true;
      }
      appendMarkerGroup(list, group);
    });
    if (earlierUserGroupCount && !isEarlierUserGroupsControlAppended) {
      appendEarlierUserGroupsControl(list, earlierUserGroupCount);
    }
    syncMarkerListScrollTarget(list);
    syncLiquidGlassElements(root);

    requestAnimationFrame(() => {
      state.collapsedListHeight = list.offsetHeight;
    });
    state.lastRenderedHeadingCount = headings.length;
    updateActiveMarker();
    if (performance.now() < state.markerListScrollUntil) {
      persistActiveMarkerListScroll();
    }
  }

  function scheduleRender() {
    window.clearTimeout(state.scheduled);
    state.scheduled = window.setTimeout(render, 120);
  }

  function resetRouteState() {
    window.clearTimeout(state.scheduled);
    window.clearTimeout(state.markerNoticeTimer);
    state.markerNoticeTimer = 0;
    window.cancelAnimationFrame(state.markerListScrollAnimation);
    state.markerListScrollAnimation = 0;
    state.markerListScrollTarget = 0;
    if (state.pointerDrag) {
      state.pointerDrag.root.classList.remove("is-dragging");
      state.pointerDrag = null;
    }
    document.documentElement.classList.remove("gpt-paragraph-nav--dragging");
    state.suppressNextClick = false;
    window.clearTimeout(state.suppressNextClickTimer);
    state.suppressNextClickTimer = 0;
    state.headings = [];
    state.markerGroups = [];
    state.conversationMetrics = null;
    state.activeHeading = null;
    state.activeMarkerKey = "";
    state.isCollapsed = false;
    state.collapsedListHeight = 0;
    state.activeControlTab = "navigation";
    state.releaseNoticeReturnControlTab = null;
    state.explosionSections = [];
    state.activeExplosionSectionIndex = 0;
    state.lastExplosionRenderSignature = "";
    state.lastRenderedHeadingCount = 0;
    state.markerListScrollUntil = 0;
    state.markerSearchQuery = "";
    state.chatGPTConversation = null;
    window.clearTimeout(state.chatGPTConversationRefreshTimer);
    state.chatGPTConversationRefreshTimer = 0;
    state.explosionSearchQuery = "";
    state.expandedFoldGroups.clear();
    state.expandedUserMarkerKeys.clear();
    state.areEarlierUserGroupsExpanded = false;
    state.userMarkerExpansionInitialized = false;
  }

  function removeNavigationRoot() {
    const root = document.getElementById(ROOT_ID);
    if (root) {
      const settings = root.querySelector(`.${SETTINGS_CLASS}`);
      const controller = settings && settingsPanelControllers.get(settings);
      if (controller) {
        controller.unmount();
        settingsPanelControllers.delete(settings);
      }
      root.remove();
    }
    document.documentElement.removeAttribute(DEBUG_ATTR);
  }

  function handleRouteChange() {
    const nextRouteKey = currentRouteKey();
    if (nextRouteKey === state.routeKey) {
      return;
    }

    state.routeKey = nextRouteKey;
    closeExplosionOverlay();
    resetRouteState();
    if (!isSupportedRoute()) {
      removeNavigationRoot();
      return;
    }
    scheduleChatGPTConversationRefresh();
    scheduleRender();
  }

  function scheduleChatGPTConversationRefresh() {
    if (!isChatGPTPage()) {
      return;
    }
    window.clearTimeout(state.chatGPTConversationRefreshTimer);
    state.chatGPTConversationRefreshTimer = window.setTimeout(() => {
      state.chatGPTConversationRefreshTimer = 0;
      const conversationId = chatGPTConversationIdFromPath(window.location.pathname);
      if (!conversationId) {
        return;
      }
      state.chatGPTConversationRequestId += 1;
      window.postMessage({
        channel: CHATGPT_CONVERSATION_CHANNEL,
        conversationId,
        requestId: state.chatGPTConversationRequestId,
        routeKey: currentRouteKey(),
        type: CHATGPT_CONVERSATION_REQUEST
      }, window.location.origin);
    }, CHATGPT_CONVERSATION_REFRESH_DELAY_MS);
  }

  function handleChatGPTConversationMessage(event) {
    if (event.source !== window || event.origin !== window.location.origin) {
      return;
    }
    const data = event.data;
    if (!data || data.channel !== CHATGPT_CONVERSATION_CHANNEL || data.type !== CHATGPT_CONVERSATION_RESPONSE) {
      return;
    }
    const conversationId = chatGPTConversationIdFromPath(window.location.pathname);
    if (data.requestId !== state.chatGPTConversationRequestId
      || !conversationId
      || data.conversationId !== conversationId
      || data.routeKey !== currentRouteKey()) {
      return;
    }
    if (!data.conversation || data.error) {
      return;
    }
    const conversation = parseChatGPTConversation(data.conversation);
    if (!conversation.userMessages.length) {
      return;
    }
    state.chatGPTConversation = conversation;
    scheduleRender();
  }

  function watchRouteChanges() {
    if (!isExtensionContextValid()) {
      disposeInvalidExtensionContext();
      return;
    }

    window.addEventListener(ROUTE_CHANGE_EVENT, handleRouteChange);
    if (document.querySelector("script[data-polaris-route-bridge]")) {
      scheduleChatGPTConversationRefresh();
      return;
    }

    const bridge = document.createElement("script");
    bridge.src = extensionMetadata.routeBridgeUrl;
    bridge.dataset.polarisRouteBridge = "true";
    bridge.addEventListener("load", scheduleChatGPTConversationRefresh, { once: true });
    (document.head || document.documentElement).appendChild(bridge);
  }

  function shouldIgnoreMutation(mutation) {
    return isInsideNavigationRoot(mutation.target) || isUserInputContext(mutation.target);
  }

  function handleDocumentMutations(mutations) {
    if (mutations.every(shouldIgnoreMutation)) {
      return;
    }
    scheduleChatGPTConversationRefresh();
    scheduleRender();
  }

  function getActiveHeading() {
    if (!state.activeMarkerKey) {
      return null;
    }
    return state.headings.find((heading) => markerKeyFor(heading.element) === state.activeMarkerKey) || null;
  }

  function getActiveMarker() {
    const list = getList();
    if (!state.activeMarkerKey) {
      return null;
    }
    const activeMarker = list.querySelector(`[data-marker-key="${CSS.escape(state.activeMarkerKey)}"]`);
    return activeMarker instanceof HTMLElement ? activeMarker : null;
  }

  function clearActiveMarker() {
    state.activeHeading = null;
    state.activeMarkerKey = "";
    updateFloatingActiveMarker(syncActiveMarker(""));
  }

  function syncActiveMarker(activeMarkerKey = state.activeMarkerKey) {
    const list = getList();
    let activeMarker = null;
    let hasMarkedActive = false;
    list.querySelectorAll(".gpt-paragraph-nav__marker").forEach((marker) => {
      const isActive = Boolean(activeMarkerKey && !hasMarkedActive && marker.dataset.markerKey === activeMarkerKey);
      marker.classList.toggle("is-active", isActive);
      if (isActive) {
        activeMarker = marker;
        hasMarkedActive = true;
      }
      updateLiquidGlassFilter(marker);
    });
    return activeMarker;
  }

  function updateActiveMarker() {
    if (!state.headings.length || !state.activeMarkerKey) {
      clearActiveMarker();
      return;
    }

    const active = getActiveHeading();
    if (!active) {
      clearActiveMarker();
      return;
    }

    const group = state.markerGroups.find((candidate) => candidate.headings
      .some((heading) => markerKeyFor(heading.element) === state.activeMarkerKey));
    const visibleHeadings = group
      ? (normalizeSearchQuery(state.markerSearchQuery)
        ? group.headings.filter((heading) => matchesSearch(state.markerSearchQuery, heading.title))
        : group.headings)
      : filteredHeadings(state.headings);
    if (group && foldEnabledFor(visibleHeadings)) {
      const markerIndex = visibleHeadings.findIndex((heading) => markerKeyFor(heading.element) === state.activeMarkerKey);
      const size = state.config.foldThreshold;
      const fullGroupCount = Math.floor(visibleHeadings.length / size);
      if (markerIndex >= 0 && markerIndex < fullGroupCount * size) {
        const groupIndex = Math.floor(markerIndex / size);
        const foldKey = foldKeyFor(group, groupIndex);
        if (!state.expandedFoldGroups.has(foldKey)) {
          state.expandedFoldGroups.add(foldKey);
          scheduleRender();
          return;
        }
      }
    }

    state.activeHeading = active ? active.element : null;
    updateFloatingActiveMarker(syncActiveMarker(markerKeyFor(active.element)));
  }

  function isMarkerVisibleInViewport(marker) {
    const rect = marker.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
  }

  function updateFloatingActiveMarker(activeMarker = syncActiveMarker(state.activeMarkerKey)) {
    const root = getRoot();
    const floating = getFloatingActive(root);
    if (!(activeMarker instanceof HTMLElement) || state.isCollapsed || state.activeControlTab === "settings") {
      floating.hidden = true;
      floating.textContent = "";
      return;
    }

    const list = getList(root);
    if (isMarkerVisibleInViewport(activeMarker)) {
      floating.hidden = true;
      floating.textContent = "";
      return;
    }

    const rootRect = root.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    const preview = activeMarker.querySelector(".gpt-paragraph-nav__preview");
    floating.textContent = preview ? preview.textContent : activeMarker.getAttribute("aria-label") || "";
    floating.style.setProperty("--marker-width", activeMarker.style.getPropertyValue("--marker-width") || "24px");
    floating.style.setProperty("--floating-active-bottom", `calc(${Math.max(0, rootRect.bottom - listRect.bottom)}px + 20pt)`);
    floating.hidden = false;
    updateLiquidGlassFilter(floating);
  }

  function scheduleFloatingActiveUpdate() {
    if (state.floatingScheduled) {
      return;
    }
    state.floatingScheduled = window.requestAnimationFrame(() => {
      state.floatingScheduled = 0;
      updateFloatingActiveMarker();
    });
  }

  function scheduleScrollWork() {
    if (state.scrollScheduled) {
      return;
    }
    state.scrollScheduled = window.requestAnimationFrame(() => {
      state.scrollScheduled = 0;
      updateActiveMarker();
    });
  }

  function wheelDeltaYInPixels(event) {
    if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
      return event.deltaY * 16;
    }
    if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
      return event.deltaY * window.innerHeight;
    }
    return event.deltaY;
  }

  function markerListMaxScrollTop(list) {
    return Math.max(0, list.scrollHeight - list.clientHeight);
  }

  function clampMarkerListScrollTop(scrollTop, maxScrollTop) {
    return Math.min(maxScrollTop, Math.max(0, scrollTop));
  }

  function syncMarkerListScrollTarget(list) {
    const maxScrollTop = markerListMaxScrollTop(list);
    if (state.markerListScrollAnimation) {
      state.markerListScrollTarget = clampMarkerListScrollTop(state.markerListScrollTarget, maxScrollTop);
      return;
    }
    state.markerListScrollTarget = clampMarkerListScrollTop(list.scrollTop, maxScrollTop);
  }

  function stopMarkerListScrollAnimation(list) {
    window.cancelAnimationFrame(state.markerListScrollAnimation);
    state.markerListScrollAnimation = 0;
    state.markerListScrollTarget = list.scrollTop;
  }

  function animateMarkerListScroll(list) {
    if (state.markerListScrollAnimation) {
      return;
    }

    const step = () => {
      const maxScrollTop = markerListMaxScrollTop(list);
      const targetScrollTop = clampMarkerListScrollTop(state.markerListScrollTarget, maxScrollTop);
      const distance = targetScrollTop - list.scrollTop;
      if (Math.abs(distance) < 0.5) {
        list.scrollTop = targetScrollTop;
        state.markerListScrollAnimation = 0;
        state.markerListScrollTarget = targetScrollTop;
        return;
      }

      list.scrollTop += distance * 0.35;
      state.markerListScrollAnimation = window.requestAnimationFrame(step);
    };

    state.markerListScrollAnimation = window.requestAnimationFrame(step);
  }

  function markerListWheelHitWidth(root, list) {
    const controls = root.querySelector(`.${CONTROLS_CLASS}`);
    const controlWidth = controls instanceof HTMLElement ? controls.getBoundingClientRect().width : 0;
    const markerWidths = Array.from(list.querySelectorAll(".gpt-paragraph-nav__marker, .gpt-paragraph-nav__fold"))
      .filter((marker) => marker instanceof HTMLElement)
      .map((marker) => marker.getBoundingClientRect().width);
    const maxMarkerWidth = markerWidths.length ? Math.max(...markerWidths) : 0;
    const configuredMaxWidth = state.config.tooltipMaxWidth || DEFAULT_CONFIG.tooltipMaxWidth;
    return Math.min(root.getBoundingClientRect().width, Math.max(configuredMaxWidth, controlWidth, maxMarkerWidth));
  }

  function markerListInteractionTarget(event) {
    const root = document.getElementById(ROOT_ID);
    if (!(root instanceof HTMLElement) || root.classList.contains("is-empty") || root.classList.contains("is-collapsed")) {
      return null;
    }

    const controls = root.querySelector(`.${CONTROLS_CLASS}`);
    if (controls instanceof HTMLElement && event.target instanceof Node && controls.contains(event.target)) {
      return null;
    }

    const list = root.querySelector(`#${LIST_ID}`);
    if (!(list instanceof HTMLElement)) {
      return null;
    }

    const maxScrollTop = markerListMaxScrollTop(list);
    if (maxScrollTop <= 0) {
      return null;
    }

    const listRect = list.getBoundingClientRect();
    if (event.clientY < listRect.top || event.clientY > listRect.bottom) {
      return null;
    }

    const rootRect = root.getBoundingClientRect();
    const hitRight = rootRect.right;
    const hitLeft = Math.max(rootRect.left, hitRight - markerListWheelHitWidth(root, list));
    if (event.clientX < hitLeft || event.clientX > hitRight) {
      return null;
    }

    return { root, list, maxScrollTop };
  }

  function handleMarkerListWheel(event) {
    if (state.isExplosionOpen || state.isReleaseNoticeOpen || state.pointerDrag) {
      return;
    }

    const deltaY = wheelDeltaYInPixels(event);
    if (!deltaY) {
      return;
    }

    const target = markerListInteractionTarget(event);
    if (!target) {
      return;
    }

    const { list, maxScrollTop } = target;
    if (event.target instanceof Node && list.contains(event.target)) {
      return;
    }

    const currentTarget = state.markerListScrollAnimation ? state.markerListScrollTarget : list.scrollTop;
    const nextScrollTop = clampMarkerListScrollTop(currentTarget + deltaY, maxScrollTop);
    if (nextScrollTop === currentTarget) {
      return;
    }

    event.preventDefault();
    state.markerListScrollTarget = nextScrollTop;
    animateMarkerListScroll(list);
  }

  function isPrimaryPointer(event) {
    return event.isPrimary && (event.pointerType !== "mouse" || event.button === 0);
  }

  function suppressNextClick() {
    state.suppressNextClick = true;
    window.clearTimeout(state.suppressNextClickTimer);
    state.suppressNextClickTimer = window.setTimeout(() => {
      state.suppressNextClick = false;
      state.suppressNextClickTimer = 0;
    }, 0);
  }

  function handlePointerDragClick(event) {
    if (!state.suppressNextClick) {
      return;
    }

    state.suppressNextClick = false;
    window.clearTimeout(state.suppressNextClickTimer);
    state.suppressNextClickTimer = 0;
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function handlePointerDown(event) {
    if (state.pointerDrag || state.isExplosionOpen || !isPrimaryPointer(event)) {
      return;
    }

    const root = document.getElementById(ROOT_ID);
    if (!(root instanceof HTMLElement)) {
      return;
    }

    const capsule = root.querySelector(`.${CONTROL_CAPSULE_CLASS}`);
    if (capsule instanceof HTMLElement && event.target instanceof Node && capsule.contains(event.target)) {
      const rect = capsule.getBoundingClientRect();
      state.pointerDrag = {
        kind: "controls",
        pointerId: event.pointerId,
        root,
        startX: event.clientX,
        startY: event.clientY,
        controlPosition: {
          top: rect.top,
          right: Math.max(0, window.innerWidth - rect.right)
        },
        didDrag: false
      };
      return;
    }

    const target = markerListInteractionTarget(event);
    if (!target) {
      return;
    }

    state.pointerDrag = {
      kind: "list",
      pointerId: event.pointerId,
      root: target.root,
      list: target.list,
      maxScrollTop: target.maxScrollTop,
      startX: event.clientX,
      startY: event.clientY,
      startScrollTop: target.list.scrollTop,
      didDrag: false
    };
  }

  function handlePointerMove(event) {
    const drag = state.pointerDrag;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.didDrag && Math.max(Math.abs(deltaX), Math.abs(deltaY)) < POINTER_DRAG_THRESHOLD) {
      return;
    }

    if (!drag.didDrag) {
      drag.didDrag = true;
      drag.root.classList.add("is-dragging");
      drag.root.classList.add("has-custom-control-position");
      document.documentElement.classList.add("gpt-paragraph-nav--dragging");
    }

    if (drag.kind === "controls") {
      const controls = drag.root.querySelector(`.${CONTROLS_CLASS}`);
      if (controls instanceof HTMLElement) {
        drag.controlPosition = clampedControlPosition({
          top: drag.controlPosition.top + deltaY,
          right: drag.controlPosition.right - deltaX
        }, controls);
        drag.startX = event.clientX;
        drag.startY = event.clientY;
        applyConfig(drag.root, drag.controlPosition);
      }
    } else {
      drag.list.scrollTop = Math.min(
        drag.maxScrollTop,
        Math.max(0, drag.startScrollTop - deltaY)
      );
      state.markerListScrollTarget = drag.list.scrollTop;
      scheduleFloatingActiveUpdate();
    }

    if (event.cancelable) {
      event.preventDefault();
    }
  }

  function finishPointerDrag(event, persistPosition) {
    const drag = state.pointerDrag;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    state.pointerDrag = null;
    drag.root.classList.remove("is-dragging");
    document.documentElement.classList.remove("gpt-paragraph-nav--dragging");
    if (!drag.didDrag) {
      return;
    }

    if (drag.kind === "controls") {
      if (persistPosition) {
        state.config = normalizeConfig({
          ...state.config,
          controlPosition: drag.controlPosition
        });
        saveConfig(state.config);
      }
      drag.root.classList.toggle("has-custom-control-position", Boolean(state.config.controlPosition));
      applyConfig(drag.root);
    }

    if (persistPosition) {
      suppressNextClick();
    }
  }

  function handlePointerUp(event) {
    finishPointerDrag(event, true);
  }

  function handlePointerCancel(event) {
    finishPointerDrag(event, false);
  }

  function handleKeydown(event) {
    if (event.defaultPrevented) {
      return;
    }

    if (event.key === "Escape" && state.isReleaseNoticeOpen) {
      event.preventDefault();
      closeReleaseNotice();
      return;
    }

    if (state.isReleaseNoticeOpen) {
      return;
    }

    if (event.key === "Escape" && state.isExplosionOpen) {
      const copyMenu = document.querySelector(`#${ROOT_ID} .gpt-paragraph-nav__explosion-copy-menu`);
      if (copyMenu instanceof HTMLDetailsElement && copyMenu.open) {
        event.preventDefault();
        copyMenu.open = false;
        return;
      }
      event.preventDefault();
      closeExplosionOverlay();
      return;
    }

    if (state.isExplosionOpen && event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      if (isShortcutTargetEditable()) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      activateExplosionSection(state.activeExplosionSectionIndex + (event.key === "ArrowLeft" ? -1 : 1));
      return;
    }

    if (event.key === "Escape" && state.activeControlTab === "settings") {
      event.preventDefault();
      state.activeControlTab = "navigation";
      render();
      return;
    }

    if ((event.metaKey || event.ctrlKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === "f") {
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement && activeElement.matches(".gpt-paragraph-nav__search-input, .gpt-paragraph-nav__explosion-search-input")) {
        event.preventDefault();
        activeElement.select();
        return;
      }
      if (isShortcutTargetEditable()) {
        return;
      }

      event.preventDefault();
      if (state.isExplosionOpen) {
        const overlay = document.querySelector(`#${ROOT_ID} .gpt-paragraph-nav__explosion-overlay`);
        const input = overlay && overlay.querySelector(".gpt-paragraph-nav__explosion-search-input");
        if (input instanceof HTMLInputElement) {
          input.focus();
          input.select();
        }
      } else {
        if (state.activeControlTab !== "navigation") {
          state.activeControlTab = "navigation";
          const root = document.getElementById(ROOT_ID);
          if (root instanceof HTMLElement) {
            syncControlTabs(root);
          }
        }
        const input = getMarkerSearchInput();
        input.focus();
        input.select();
      }
      return;
    }

    if (isShortcutTargetEditable()) {
      return;
    }

    if ((event.metaKey || event.ctrlKey) && event.shiftKey && !event.altKey && event.key.toLowerCase() === "f") {
      event.preventDefault();
      toggleExplosionOverlay();
    }
  }

  function handleDocumentClick(event) {
    if (state.activeControlTab !== "settings" || !(event.target instanceof Node)) {
      return;
    }

    const root = document.getElementById(ROOT_ID);
    const releaseNotice = root && root.querySelector(".gpt-paragraph-nav__release-notice-overlay");
    if (releaseNotice instanceof HTMLElement && releaseNotice.contains(event.target)) {
      return;
    }
    const controls = root && root.querySelector(`.${CONTROLS_CLASS}`);
    if (controls instanceof HTMLElement && controls.contains(event.target)) {
      return;
    }

    state.activeControlTab = "navigation";
    render();
  }

  async function start() {
    if (!cacheExtensionMetadata()) {
      return;
    }

    document.documentElement.setAttribute(DEBUG_ATTR, "loaded:0");
    state.config = await loadConfig();
    state.ratingDismissedUntil = await readRatingDismissedUntil();
    const lastSeenReleaseVersion = await readReleaseNoticeVersion();
    if (isTopLevelFrame()) {
      state.releaseNotes = releaseNotesForUpdate(lastSeenReleaseVersion, extensionMetadata.releaseVersion);
      state.isReleaseNoticeOpen = state.releaseNotes.length > 0;
      state.releaseNoticeFocusPending = state.isReleaseNoticeOpen;
      state.shouldMarkReleaseNoticeRead = state.isReleaseNoticeOpen;
      if (state.isReleaseNoticeOpen) {
        lockPageScroll();
      }
    }
    watchConfigChanges();
    state.routeKey = currentRouteKey();
    watchRouteChanges();
    window.addEventListener("message", handleChatGPTConversationMessage);
    render();

    state.observer = new MutationObserver(handleDocumentMutations);
    state.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    window.addEventListener("scroll", scheduleScrollWork, { passive: true });
    window.addEventListener("wheel", handleMarkerListWheel, { passive: false, capture: true });
    window.addEventListener("pointerdown", handlePointerDown, { capture: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: false, capture: true });
    window.addEventListener("pointerup", handlePointerUp, { capture: true });
    window.addEventListener("pointercancel", handlePointerCancel, { capture: true });
    window.addEventListener("click", handlePointerDragClick, { capture: true });
    window.addEventListener("resize", scheduleRender, { passive: true });
    window.addEventListener("keydown", handleKeydown, { capture: true });
    document.addEventListener("click", handleDocumentClick);
    console.info("[Polaris for Web] loaded");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
