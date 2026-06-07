(() => {
  const ROOT_ID = "gpt-paragraph-nav";
  const DEBUG_ATTR = "data-gpt-paragraph-nav";
  const HEADING_SELECTOR = "h1, h2, h3";
  const ROLE_HEADING_SELECTOR = '[role="heading"][aria-level]';
  const STRONG_HEADING_SELECTOR = "p, li";
  const NUMBERED_HEADING_SELECTOR = "p, div";
  const ASSISTANT_MESSAGE_SELECTOR = '[data-message-author-role="assistant"]';
  const DOUBAO_ASSISTANT_MESSAGE_SELECTOR = [
    ".receive-message-box",
    ".receive-message-content-block",
    ".receive-message-content-block-merge",
    '[class*="receive-message-box"]',
    '[class*="receive-message-content-block"]'
  ].join(", ");
  const KIMI_ASSISTANT_MESSAGE_SELECTOR = [
    ".segment.segment-assistant .markdown",
    ".segment-assistant .markdown",
    ".segment-assistant .markdown-container",
    '[class*="segment-assistant"] [class*="markdown"]'
  ].join(", ");
  const QIANWEN_ASSISTANT_MESSAGE_SELECTOR = [
    '[class*="message-select-wrapper-answer"] .qk-markdown',
    ".chat-answers-card-wrap .qk-markdown",
    ".answer-common-card .qk-markdown",
    ".markdown-pc-special-class .qk-markdown"
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
  const CONTROLS_CLASS = "gpt-paragraph-nav__controls";
  const SETTINGS_CLASS = "gpt-paragraph-nav__settings";
  const LIST_ID = "gpt-paragraph-nav-list";
  const TOGGLE_ID = "gpt-paragraph-nav-toggle";
  const TOGGLE_LABEL_CLASS = "gpt-paragraph-nav__toggle-label";
  const TOGGLE_CHEVRON_CLASS = "gpt-paragraph-nav__toggle-chevron";
  const FLOATING_ACTIVE_CLASS = "gpt-paragraph-nav__floating-active";
  const LIQUID_GLASS_SELECTOR = [
    ".gpt-paragraph-nav__settings-trigger",
    ".gpt-paragraph-nav__settings-menu",
    ".gpt-paragraph-nav__settings-row input",
    ".gpt-paragraph-nav__toggle",
    ".gpt-paragraph-nav__settings-reset",
    ".gpt-paragraph-nav__marker",
    ".gpt-paragraph-nav__floating-active"
  ].join(", ");
  const QUEUE_MAX_VISIBLE = 30;
  const MARKER_LIST_SCROLL_PERSIST_MS = 1200;
  const DEFAULT_HEADER_HEIGHT = 64;
  const CONFIG_STORAGE_KEY = "gpt-paragraph-nav-config";
  const CONVERSATION_HEADER_SELECTOR = [
    '[data-testid="conversation-header"]',
    '[data-testid="chat-header"]',
    "main header"
  ].join(", ");
  const CONFIG_FIELDS = [
    { key: "topGap", label: "顶部间距", min: 0, max: 80, step: 1, unit: "px" },
    { key: "rightOffset", label: "右侧间距", min: 0, max: 80, step: 1, unit: "px" },
    { key: "maxVisible", label: "最大数量", min: 1, max: 80, step: 1, unit: "" },
    { key: "tooltipMaxWidth", label: "提示宽度", min: 160, max: 720, step: 10, unit: "px" }
  ];
  const PLATFORM_KEYS = ["chatgpt", "doubao", "kimi", "qianwen", "yuanbao", "default"];
  const MARKER_LEVEL_OPTIONS = [1, 2, 3];
  const DEFAULT_ENABLED_LEVELS_BY_PLATFORM = Object.freeze({
    chatgpt: [1, 2, 3],
    doubao: [1, 2, 3],
    kimi: [1, 2],
    qianwen: [1, 2, 3],
    yuanbao: [1, 2],
    default: [1, 2, 3]
  });
  const DEFAULT_CONFIG = Object.freeze({
    topGap: 8,
    rightOffset: 14,
    maxVisible: QUEUE_MAX_VISIBLE,
    tooltipMaxWidth: 360,
    enabledLevelsByPlatform: DEFAULT_ENABLED_LEVELS_BY_PLATFORM
  });
  const markerKeys = new WeakMap();
  const liquidGlassSignatures = new WeakMap();
  let nextMarkerKey = 1;

  const state = {
    headings: [],
    conversationMetrics: null,
    activeHeading: null,
    activeMarkerKey: "",
    observer: null,
    scheduled: 0,
    scrollScheduled: 0,
    floatingScheduled: 0,
    markerListScrollScheduled: 0,
    markerListScrollUntil: 0,
    liquidGlassObserver: null,
    liquidGlassElements: new Set(),
    lastDebugSignature: "",
    lastRenderedHeadingCount: 0,
    isCollapsed: false,
    collapsedListHeight: 0,
    syncEnabled: false,
    config: { ...DEFAULT_CONFIG }
  };

  function getRoot() {
    let root = document.getElementById(ROOT_ID);
    if (!root) {
      root = document.createElement("div");
      root.id = ROOT_ID;
      root.setAttribute("aria-label", "Polaris for Web paragraph navigation");
      root.setAttribute("role", "navigation");
      document.documentElement.appendChild(root);
    }
    return root;
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
      list.addEventListener("scroll", scheduleFloatingActiveUpdate, { passive: true });
      root.appendChild(list);
    }
    return list;
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

  function getToggleButton(root = getRoot()) {
    let button = root.querySelector(`#${TOGGLE_ID}`);
    if (!button) {
      button = document.createElement("button");
      button.id = TOGGLE_ID;
      button.type = "button";
      button.className = "gpt-paragraph-nav__toggle";
      button.addEventListener("click", () => {
        if (!state.isCollapsed) {
          state.collapsedListHeight = getList(root).offsetHeight;
        }
        state.isCollapsed = !state.isCollapsed;
        render();
      });
    }

    if (!button.querySelector(".gpt-paragraph-nav__toggle-icon")) {
      button.textContent = "";

      const icon = document.createElement("img");
      icon.className = "gpt-paragraph-nav__toggle-icon";
      icon.alt = "";
      icon.width = 32;
      icon.height = 32;
      icon.src = chrome.runtime.getURL("icons/gpt-voyager-icon-96.png");
      button.appendChild(icon);

      const label = document.createElement("span");
      label.className = TOGGLE_LABEL_CLASS;
      button.appendChild(label);

      const chevron = document.createElement("span");
      chevron.className = TOGGLE_CHEVRON_CLASS;
      chevron.setAttribute("aria-hidden", "true");
      button.appendChild(chevron);
    }
    getControls(root).appendChild(button);
    return button;
  }

  function getSettings(root = getRoot()) {
    const controls = getControls(root);
    let settings = controls.querySelector(`.${SETTINGS_CLASS}`);
    if (!settings) {
      settings = document.createElement("div");
      settings.className = SETTINGS_CLASS;

      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "gpt-paragraph-nav__settings-trigger";
      trigger.textContent = "设置";
      trigger.setAttribute("aria-label", "导航设置");
      settings.appendChild(trigger);

      const menu = document.createElement("div");
      menu.className = "gpt-paragraph-nav__settings-menu";
      menu.setAttribute("role", "menu");

      const meta = document.createElement("div");
      meta.className = "gpt-paragraph-nav__settings-meta";

      const syncStatus = document.createElement("div");
      syncStatus.className = "gpt-paragraph-nav__settings-sync";
      syncStatus.setAttribute("role", "status");
      syncStatus.setAttribute("aria-live", "polite");

      const syncDot = document.createElement("span");
      syncDot.className = "gpt-paragraph-nav__settings-sync-dot";
      syncDot.setAttribute("aria-hidden", "true");
      syncStatus.appendChild(syncDot);

      const syncText = document.createElement("span");
      syncText.className = "gpt-paragraph-nav__settings-sync-text";
      syncStatus.appendChild(syncText);

      meta.appendChild(syncStatus);

      const manifest = chrome.runtime.getManifest();
      const versionStatus = document.createElement("div");
      versionStatus.className = "gpt-paragraph-nav__settings-version";
      versionStatus.textContent = manifest.version_name || `v${manifest.version}`;
      meta.appendChild(versionStatus);
      menu.appendChild(meta);

      CONFIG_FIELDS.forEach((field) => {
        const row = document.createElement("label");
        row.className = "gpt-paragraph-nav__settings-row";

        const label = document.createElement("span");
        label.textContent = field.label;
        row.appendChild(label);

        const input = document.createElement("input");
        input.type = "number";
        input.min = String(field.min);
        input.max = String(field.max);
        input.step = String(field.step);
        input.dataset.configKey = field.key;
        input.addEventListener("input", () => {
          state.config = normalizeConfig({
            ...state.config,
            [field.key]: input.value
          });
          saveConfig(state.config);
          syncSettingsInputs(settings);
          render();
        });
        row.appendChild(input);

        if (field.unit) {
          const unit = document.createElement("span");
          unit.className = "gpt-paragraph-nav__settings-unit";
          unit.textContent = field.unit;
          row.appendChild(unit);
        }

        menu.appendChild(row);
      });

      const levelFilter = document.createElement("div");
      levelFilter.className = "gpt-paragraph-nav__settings-level-filter";
      levelFilter.setAttribute("role", "group");
      levelFilter.setAttribute("aria-label", "Marker 类型");

      const levelLegend = document.createElement("span");
      levelLegend.className = "gpt-paragraph-nav__settings-level-label";
      levelLegend.textContent = "Marker 类型";
      levelFilter.appendChild(levelLegend);

      const levelOptions = document.createElement("div");
      levelOptions.className = "gpt-paragraph-nav__settings-level-options";
      MARKER_LEVEL_OPTIONS.forEach((level) => {
        const option = document.createElement("label");
        option.className = "gpt-paragraph-nav__settings-level-option";
        option.dataset.markerLevelOption = String(level);

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.dataset.markerLevel = String(level);
        checkbox.addEventListener("change", () => {
          updateEnabledLevelForCurrentPlatform(level, checkbox.checked);
          saveConfig(state.config);
          syncSettingsInputs(settings);
          render();
        });
        option.appendChild(checkbox);

        const label = document.createElement("span");
        label.textContent = `H${level}`;
        option.appendChild(label);

        levelOptions.appendChild(option);
      });
      levelFilter.appendChild(levelOptions);
      menu.appendChild(levelFilter);

      const resetButton = document.createElement("button");
      resetButton.type = "button";
      resetButton.className = "gpt-paragraph-nav__settings-reset";
      resetButton.textContent = "重置配置";
      resetButton.addEventListener("click", () => {
        state.config = normalizeConfig(DEFAULT_CONFIG);
        saveConfig(state.config);
        syncSettingsInputs(settings);
        render();
      });
      menu.appendChild(resetButton);

      settings.appendChild(menu);
      controls.prepend(settings);
    }

    syncSettingsStatus(settings);
    syncSettingsInputs(settings);
    return settings;
  }

  function normalizeNumber(value, fallback, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return fallback;
    }
    return Math.min(Math.max(Math.round(number), min), max);
  }

  function maxHeadingLevelForPlatform(platformKey = currentPlatformKey()) {
    return platformKey === "yuanbao" || platformKey === "kimi" ? 2 : 3;
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

  function configsEqual(first, second) {
    return CONFIG_FIELDS.every((field) => first[field.key] === second[field.key])
      && enabledLevelsByPlatformEqual(first.enabledLevelsByPlatform, second.enabledLevelsByPlatform);
  }

  function hasSyncStorage() {
    return typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync;
  }

  function setSyncEnabled(isEnabled) {
    state.syncEnabled = isEnabled;
    const settings = document.querySelector(`#${ROOT_ID} .${SETTINGS_CLASS}`);
    if (settings) {
      syncSettingsStatus(settings);
    }
  }

  function syncSettingsStatus(settings) {
    const status = settings.querySelector(".gpt-paragraph-nav__settings-sync");
    const text = settings.querySelector(".gpt-paragraph-nav__settings-sync-text");
    if (!status || !text) {
      return;
    }

    status.classList.toggle("is-enabled", state.syncEnabled);
    text.textContent = state.syncEnabled ? "同步已启用" : "同步未启用";
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
      setSyncEnabled(false);
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      chrome.storage.sync.get(CONFIG_STORAGE_KEY, (result) => {
        if (chrome.runtime.lastError) {
          setSyncEnabled(false);
          console.warn("[Polaris for Web] config sync read failed", chrome.runtime.lastError);
          resolve(null);
          return;
        }

        setSyncEnabled(true);
        if (Object.prototype.hasOwnProperty.call(result, CONFIG_STORAGE_KEY)) {
          resolve(normalizeConfig(result[CONFIG_STORAGE_KEY]));
          return;
        }

        resolve(null);
      });
    });
  }

  function writeSyncConfig(config) {
    if (!hasSyncStorage()) {
      setSyncEnabled(false);
      return Promise.resolve();
    }

    const nextConfig = normalizeConfig(config);
    return new Promise((resolve) => {
      chrome.storage.sync.set({ [CONFIG_STORAGE_KEY]: nextConfig }, () => {
        if (chrome.runtime.lastError) {
          setSyncEnabled(false);
          console.warn("[Polaris for Web] config sync write failed", chrome.runtime.lastError);
        } else {
          setSyncEnabled(true);
        }
        resolve();
      });
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

      state.config = nextConfig;
      render();
    });
  }

  function syncSettingsInputs(settings) {
    settings.querySelectorAll("input[data-config-key]").forEach((input) => {
      const key = input.dataset.configKey;
      if (document.activeElement !== input && key in state.config) {
        input.value = String(state.config[key]);
      }
    });
    syncLevelFilterInputs(settings);
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

  function syncLevelFilterInputs(settings) {
    const platformKey = currentPlatformKey();
    const supportedLevels = new Set(supportedMarkerLevelsForPlatform(platformKey));
    const enabledLevels = enabledLevelsForPlatform(platformKey);
    const enabledSet = new Set(enabledLevels);

    settings.querySelectorAll("[data-marker-level-option]").forEach((option) => {
      const level = Number(option.dataset.markerLevelOption);
      const isSupported = supportedLevels.has(level);
      option.hidden = !isSupported;
    });

    settings.querySelectorAll("input[data-marker-level]").forEach((input) => {
      const level = Number(input.dataset.markerLevel);
      const isSupported = supportedLevels.has(level);
      input.checked = isSupported && enabledSet.has(level);
      input.disabled = !isSupported || (input.checked && enabledLevels.length <= 1);
    });
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

  function applyConfig(root) {
    root.style.setProperty("--gpt-nav-top-gap", `${state.config.topGap}px`);
    root.style.setProperty("--gpt-nav-right-offset", `${state.config.rightOffset}px`);
    root.style.setProperty("--gpt-nav-width", `calc(100vw - ${state.config.rightOffset * 2}px)`);
    root.style.setProperty("--gpt-nav-tooltip-max-width", `${state.config.tooltipMaxWidth}px`);
  }

  function isVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
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
    return "default";
  }

  function getAssistantContainerSelectors() {
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
        .filter((node) => node instanceof HTMLElement && isVisible(node));
      if (containers.length > 0) {
        return containers;
      }
    }

    return [];
  }

  function normalizeTitle(text) {
    return text.replace(/\s+/g, " ").trim();
  }

  function clampLevel(level) {
    if (Number.isNaN(level)) {
      return 2;
    }
    return Math.min(Math.max(level, 1), 4);
  }

  function headingLevelFor(element) {
    if (/^H[1-3]$/.test(element.tagName)) {
      return Number(element.tagName.slice(1));
    }
    return clampLevel(Number(element.getAttribute("aria-level")));
  }

  function makeHeadingItem(element, index, level) {
    return {
      element,
      level: clampLevel(level),
      title: normalizeTitle(element.textContent || `Heading ${index + 1}`),
      id: element.id || `gpt-paragraph-heading-${index + 1}`
    };
  }

  function markdownLevelFromText(text) {
    const match = text.match(/^(#{1,3})\s+\S/);
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

  function collectHeadings() {
    const containers = getAssistantContainers();
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

    collectYuanbaoVideoCardHeadings(seen, headings);
    collectQianwenVideoListHeadings(seen, headings);

    const platformKey = currentPlatformKey();
    const maxHeadingLevel = maxHeadingLevelForPlatform(platformKey);
    const enabledLevels = new Set(enabledLevelsForCurrentPlatform());
    const usableHeadings = headings.filter((item) => (
      item.title.length > 0
      && item.level <= maxHeadingLevel
      && enabledLevels.has(item.level)
    ));
    debugCollection(containers, usableHeadings);
    return usableHeadings;
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

  function markerWidthFor(title) {
    const characterCount = Array.from(title).length;
    return Math.max(24, Math.ceil((characterCount / 50) * 24));
  }

  function markerPreviewFor(title) {
    return Array.from(title).slice(0, 16).join("");
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

  function jumpToHeading(heading, behavior = "smooth") {
    heading.element.scrollIntoView({ behavior, block: "start" });
    window.history.replaceState(null, "", `#${encodeURIComponent(heading.element.id)}`);
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

  function render() {
    const root = getRoot();
    applyConfig(root);
    updateHeaderOffset(root);
    getSettings(root);
    const list = getList(root);
    const toggle = getToggleButton(root);
    const containers = getAssistantContainers();
    const headings = collectHeadings();
    const metrics = getConversationMetrics(containers);
    ensureHeadingIds(headings);
    state.headings = headings;
    state.conversationMetrics = metrics;
    document.documentElement.setAttribute(DEBUG_ATTR, `loaded:${headings.length}:${Math.round(metrics.length)}`);
    root.style.setProperty("--queue-visible-count", String(Math.min(headings.length || 1, state.config.maxVisible)));

    root.classList.toggle("is-empty", headings.length === 0);
    root.classList.toggle("is-collapsed", state.isCollapsed && headings.length > 0);
    toggle.hidden = headings.length === 0;
    toggle.querySelector(`.${TOGGLE_LABEL_CLASS}`).textContent = state.isCollapsed ? "展开全部" : "收起全部";
    toggle.setAttribute("aria-expanded", String(!state.isCollapsed));
    list.style.height = state.isCollapsed && state.collapsedListHeight > 0 ? `${state.collapsedListHeight}px` : "";
    list.setAttribute("aria-hidden", String(state.isCollapsed));
    list.textContent = "";

    if (state.isCollapsed) {
      updateFloatingActiveMarker(null);
      state.lastRenderedHeadingCount = headings.length;
      return;
    }

    headings.forEach((heading) => {
      const markerKey = markerKeyFor(heading.element);
      const marker = document.createElement("button");
      marker.type = "button";
      marker.className = `gpt-paragraph-nav__marker level-${heading.level}`;
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
        state.activeMarkerKey = markerKey;
        syncActiveMarker(state.activeMarkerKey);
        requestActiveMarkerListScrollPersistence();
        jumpToHeading(heading);
        updateFloatingActiveMarker();
      });

      list.appendChild(marker);
    });

    requestAnimationFrame(() => {
      state.collapsedListHeight = list.offsetHeight;
    });
    state.lastRenderedHeadingCount = headings.length;
    updateActiveMarker();
    syncLiquidGlassElements(root);
    if (performance.now() < state.markerListScrollUntil) {
      persistActiveMarkerListScroll();
    }
  }

  function scheduleRender() {
    window.clearTimeout(state.scheduled);
    state.scheduled = window.setTimeout(render, 120);
  }

  function getActiveMarker() {
    const list = getList();
    if (!state.activeMarkerKey) {
      return null;
    }
    const activeMarker = list.querySelector(`[data-marker-key="${CSS.escape(state.activeMarkerKey)}"]`);
    return activeMarker instanceof HTMLElement ? activeMarker : null;
  }

  function getActiveHeading() {
    if (!state.activeMarkerKey) {
      return null;
    }
    return state.headings.find((heading) => markerKeyFor(heading.element) === state.activeMarkerKey) || null;
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

  function isMarkerVisibleInViewport(marker) {
    const rect = marker.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
  }

  function updateFloatingActiveMarker(activeMarker = syncActiveMarker(state.activeMarkerKey)) {
    const root = getRoot();
    const floating = getFloatingActive(root);
    if (!(activeMarker instanceof HTMLElement) || state.isCollapsed) {
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
    state.activeHeading = active ? active.element : null;
    updateFloatingActiveMarker(syncActiveMarker(markerKeyFor(active.element)));
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

  function markerListWheelHitWidth(root, list) {
    const controls = root.querySelector(`.${CONTROLS_CLASS}`);
    const controlWidth = controls instanceof HTMLElement ? controls.getBoundingClientRect().width : 0;
    const markerWidths = Array.from(list.querySelectorAll(".gpt-paragraph-nav__marker"))
      .filter((marker) => marker instanceof HTMLElement)
      .map((marker) => marker.getBoundingClientRect().width);
    const maxMarkerWidth = markerWidths.length ? Math.max(...markerWidths) : 0;
    const configuredMaxWidth = state.config.tooltipMaxWidth || DEFAULT_CONFIG.tooltipMaxWidth;
    return Math.min(
      root.getBoundingClientRect().width,
      Math.max(configuredMaxWidth, controlWidth, maxMarkerWidth)
    );
  }

  function handleMarkerListWheel(event) {
    const deltaY = wheelDeltaYInPixels(event);
    if (!deltaY) {
      return;
    }

    const root = document.getElementById(ROOT_ID);
    if (!(root instanceof HTMLElement) || root.classList.contains("is-empty") || root.classList.contains("is-collapsed")) {
      return;
    }

    const controls = root.querySelector(`.${CONTROLS_CLASS}`);
    if (controls instanceof HTMLElement && event.target instanceof Node && controls.contains(event.target)) {
      return;
    }

    const list = root.querySelector(`#${LIST_ID}`);
    if (!(list instanceof HTMLElement)) {
      return;
    }

    const maxScrollTop = list.scrollHeight - list.clientHeight;
    if (maxScrollTop <= 0) {
      return;
    }

    const listRect = list.getBoundingClientRect();
    if (event.clientY < listRect.top || event.clientY > listRect.bottom) {
      return;
    }

    const rootRect = root.getBoundingClientRect();
    const hitWidth = markerListWheelHitWidth(root, list);
    const hitRight = rootRect.right;
    const hitLeft = Math.max(rootRect.left, hitRight - hitWidth);
    if (event.clientX < hitLeft || event.clientX > hitRight) {
      return;
    }

    const nextScrollTop = Math.min(maxScrollTop, Math.max(0, list.scrollTop + deltaY));
    if (nextScrollTop === list.scrollTop) {
      return;
    }

    event.preventDefault();
    list.scrollTop = nextScrollTop;
    scheduleFloatingActiveUpdate();
  }

  async function start() {
    document.documentElement.setAttribute(DEBUG_ATTR, "loaded:0");
    state.config = await loadConfig();
    watchConfigChanges();
    render();

    state.observer = new MutationObserver(scheduleRender);
    state.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    window.addEventListener("scroll", scheduleScrollWork, { passive: true });
    window.addEventListener("wheel", handleMarkerListWheel, { passive: false, capture: true });
    window.addEventListener("resize", scheduleRender, { passive: true });
    console.info("[Polaris for Web] loaded");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
