import "./i18n.js";

(() => {
  const root = document.getElementById("polaris-window");
  const i18n = globalThis.PolarisI18n || { locale: "en", t: (key) => key };
  const { locale, t } = i18n;
  const supportedPlatforms = [
    ["chatgpt", "ChatGPT"],
    ["claude", "Claude"],
    ["gemini", "Gemini"],
    ["grok", "Grok"],
    ["doubao", "Doubao"],
    ["kimi", "Kimi"],
    ["qianwen", "Qwen"],
    ["yuanbao", "Yuanbao"],
    ["xiaohongshu", "点点 AI"]
  ];
  const state = {
    snapshot: null,
    activeTab: "navigation",
    markerQuery: "",
    chapterQuery: "",
    chapterIndex: 0,
    chapters: [],
    imageUrls: [],
    imageIndex: 0,
    sourceTabId: null,
    routeKey: ""
  };

  function send(message) {
    try {
      chrome.runtime.sendMessage({ type: "POLARIS_WINDOW_COMMAND", ...message });
    } catch {
      // The extension can be reloaded while this window is still open.
    }
  }

  async function sendReady() {
    try {
      const currentWindow = await chrome.windows.getCurrent({ populate: true });
      const currentTab = currentWindow.tabs?.find((tab) => tab.active) || currentWindow.tabs?.[0];
      chrome.runtime.sendMessage({
        type: "POLARIS_WINDOW_READY",
        windowId: currentWindow.id,
        windowTabId: currentTab?.id
      });
    } catch {
      // The background worker will be recreated after an extension reload.
    }
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function iconLabel(platform) {
    return platform === "xiaohongshu" ? "点" : (platform || "AI").slice(0, 2).toUpperCase();
  }

  function activePlatformLabel(snapshot) {
    return supportedPlatforms.find(([key]) => key === snapshot?.platform)?.[1] || "Polaris";
  }

  function applyTheme(snapshot) {
    const theme = snapshot?.theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
  }

  function render() {
    const snapshot = state.snapshot || { markerItems: [], hasConversation: false, supportedRoute: false };
    document.querySelector(".image-preview")?.remove();
    applyTheme(snapshot);
    root.replaceChildren(renderHeader(snapshot), renderBody(snapshot));
    if (state.imageUrls.length) renderImagePreview();
  }

  function renderHeader(snapshot) {
    const header = element("header", "window-header");
    const identity = element("div", "window-identity");
    const icon = element("img", "window-logo");
    icon.src = chrome.runtime.getURL("icons/gpt-voyager-icon-96.png");
    icon.alt = "";
    identity.append(icon, element("div", "window-title", "Polaris"));
    const platform = element("span", "window-platform", activePlatformLabel(snapshot));
    identity.append(platform);
    header.append(identity);

    const search = element("label", "window-search");
    search.setAttribute("aria-label", locale === "zh" ? "搜索 Maker" : "Search Makers");
    const input = document.createElement("input");
    input.type = "search";
    input.placeholder = locale === "zh" ? "搜索" : "Search";
    input.value = state.activeTab === "chapters" ? state.chapterQuery : state.markerQuery;
    input.addEventListener("input", () => {
      if (state.activeTab === "chapters") state.chapterQuery = input.value;
      else state.markerQuery = input.value;
      render();
      const nextInput = document.querySelector(".window-search input");
      if (nextInput instanceof HTMLInputElement) {
        nextInput.focus();
        nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length);
      }
    });
    search.append(input);
    header.append(search);

    const tabs = element("nav", "window-tabs");
    [
      ["navigation", locale === "zh" ? "导航" : "Navigation"],
      ["chapters", locale === "zh" ? "章节" : "Chapters"],
      ["settings", locale === "zh" ? "设置" : "Settings"]
    ].forEach(([key, label]) => {
      const button = element("button", `window-tab${state.activeTab === key ? " is-active" : ""}`);
      button.type = "button";
      button.setAttribute("aria-pressed", String(state.activeTab === key));
      button.append(element("span", "window-tab-label", label));
      button.addEventListener("click", () => {
        state.activeTab = key;
        if (key === "chapters") send({ command: "request-chapters" });
        render();
      });
      tabs.appendChild(button);
    });
    header.append(tabs);
    return header;
  }

  function renderBody(snapshot) {
    const body = element("section", "window-body");
    if (state.activeTab === "settings") {
      body.appendChild(renderSettings(snapshot));
      return body;
    }
    if (state.activeTab === "chapters") {
      body.appendChild(renderChapters(snapshot));
      return body;
    }
    body.appendChild(renderNavigation(snapshot));
    return body;
  }

  function renderNavigation(snapshot) {
    const panel = element("div", "navigation-panel");
    if (!snapshot.supportedRoute || !snapshot.hasConversation) {
      const empty = element("div", "empty-state");
      empty.append(element("div", "empty-symbol", "◌"));
      empty.append(element("h1", "empty-title", locale === "zh" ? "这里还没有对话" : "No conversation here"));
      empty.append(element("p", "empty-copy", locale === "zh" ? "打开支持的 AI 对话后，Maker 会出现在这里。" : "Open a supported AI conversation to see its Makers here."));
      const platforms = element("div", "platform-grid");
      supportedPlatforms.forEach(([key, label]) => {
        const chip = element("span", "platform-chip");
        chip.append(element("span", "platform-icon", iconLabel(key)), element("span", "platform-name", label));
        platforms.appendChild(chip);
      });
      empty.append(platforms);
      panel.appendChild(empty);
      return panel;
    }

    const items = filterItems(snapshot.markerItems || [], state.markerQuery);
    if (!items.length) {
      panel.appendChild(element("p", "empty-search", locale === "zh" ? "没有匹配的 Maker" : "No matching Makers"));
      return panel;
    }
    const list = element("div", "maker-list");
    items.forEach((item) => list.appendChild(renderMarker(item)));
    panel.appendChild(list);
    return panel;
  }

  function filterItems(items, query) {
    const normalized = String(query || "").trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => matchesSearch(normalized, item.title || ""));
  }

  function matchesSearch(query, title) {
    const needle = Array.from(String(query || "").toLocaleLowerCase()).filter((character) => character.trim());
    const haystack = Array.from(String(title || "").toLocaleLowerCase()).filter((character) => character.trim());
    let index = 0;
    for (const character of haystack) {
      if (character === needle[index]) index += 1;
      if (index === needle.length) return true;
    }
    return needle.length === 0;
  }

  function renderMarker(item) {
    if (item.type === "empty") return element("p", "empty-search", item.message);
    const button = element("button", `maker-card maker-card-${item.type}${item.isExpanded ? " is-expanded" : ""}`);
    button.type = "button";
    button.dataset.itemType = item.type;
    button.setAttribute("aria-label", item.ariaLabel || item.title || item.preview || "Maker");
    const copy = element("span", "maker-copy");
    copy.append(element("span", "maker-preview", item.preview || item.title || ""));
    if (item.type === "ai") copy.append(element("span", "maker-title", item.title || ""));
    if (item.type === "user") copy.append(element("span", "maker-title", item.title || ""));
    if (item.type === "fold") copy.append(element("span", "maker-remainder", item.remainder || ""));
    if (item.type === "earlier") copy.append(element("span", "maker-title", item.preview || ""));
    if (item.thumbnailSrc && item.type === "user") {
      const image = element("img", "maker-thumb");
      image.src = item.thumbnailSrc;
      image.alt = "";
      image.addEventListener("click", (event) => {
        event.stopPropagation();
        send({ command: "request-image-preview", groupKey: item.groupKey });
      });
      button.append(image);
    }
    button.append(copy, element("span", "maker-chevron", item.isExpanded ? "⌃" : "⌄"));
    button.addEventListener("click", () => {
      if (item.type === "ai") send({ command: "jump-to-marker", markerKey: item.markerKey });
      if (item.type === "user") send({ command: "toggle-user-group", groupKey: item.groupKey });
      if (item.type === "fold") send({ command: "toggle-fold-group", foldKey: item.foldKey });
      if (item.type === "earlier") send({ command: "toggle-earlier-groups" });
    });
    return button;
  }

  function renderChapters(snapshot) {
    const panel = element("div", "chapters-panel");
    const chapters = state.chapters.length ? state.chapters : (snapshot.headings || []).map((heading) => ({
      id: heading.id,
      title: heading.title,
      markerKey: heading.markerKey,
      paragraphs: []
    }));
    if (!chapters.length) {
      panel.appendChild(element("p", "empty-search", locale === "zh" ? "当前对话没有章节" : "No chapters in this conversation"));
      return panel;
    }
    const filtered = chapters.filter((chapter) => matchesSearch(state.chapterQuery, chapter.title));
    const chips = element("div", "chapter-chips");
    filtered.forEach((chapter) => {
      const index = chapters.indexOf(chapter);
      const chip = element("button", `chapter-chip${index === state.chapterIndex ? " is-active" : ""}`, chapter.title);
      chip.type = "button";
      chip.addEventListener("click", () => { state.chapterIndex = index; render(); });
      chips.appendChild(chip);
    });
    panel.appendChild(chips);
    const chapter = chapters[state.chapterIndex] || chapters[0];
    const card = element("article", "chapter-card");
    card.appendChild(element("h1", "chapter-title", chapter.title));
    const blocks = Array.isArray(chapter.blocks) && chapter.blocks.length
      ? chapter.blocks
      : (chapter.paragraphs || []).map((text) => ({ tagName: "p", text }));
    blocks.forEach((block) => {
      const tagName = ["pre", "blockquote", "li"].includes(block.tagName) ? block.tagName : "p";
      card.appendChild(element(tagName, `chapter-paragraph chapter-${tagName}`, block.text || (block.hasImage ? "[Image]" : "")));
    });
    if (!blocks.length) card.appendChild(element("p", "chapter-paragraph chapter-muted", locale === "zh" ? "内容将在展开章节时加载。" : "Content loads when this chapter is opened."));
    const actions = element("div", "chapter-actions");
    const copy = element("button", "secondary-button", locale === "zh" ? "复制本章" : "Copy chapter");
    copy.type = "button";
    copy.addEventListener("click", () => navigator.clipboard?.writeText([chapter.title, ...(chapter.paragraphs || [])].join("\n\n")));
    const full = element("button", "secondary-button", locale === "zh" ? "复制全文" : "Copy full text");
    full.type = "button";
    full.addEventListener("click", () => navigator.clipboard?.writeText(chapters.map((entry) => [entry.title, ...(entry.paragraphs || [])].join("\n\n")).join("\n\n")));
    const jump = element("button", "secondary-button", locale === "zh" ? "跳转来源" : "Jump to source");
    jump.type = "button";
    jump.addEventListener("click", () => send({ command: "jump-to-chapter", markerKey: chapter.markerKey }));
    actions.append(copy, full, jump);
    card.appendChild(actions);
    panel.appendChild(card);
    return panel;
  }

  function renderSettings(snapshot) {
    const panel = element("div", "settings-panel");
    panel.appendChild(element("h1", "settings-title", locale === "zh" ? "设置" : "Settings"));
    const config = snapshot.config || {};
    [["maxVisible", locale === "zh" ? "最大 Maker 数量" : "Maximum markers", 1, 80], ["maxVisibleUserGroups", locale === "zh" ? "用户分组上限" : "User group limit", 1, 80], ["foldThreshold", locale === "zh" ? "折叠阈值" : "Fold threshold", 2, 80], ["tooltipMaxWidth", locale === "zh" ? "提示宽度" : "Tooltip width", 160, 720]].forEach(([key, label, min, max]) => {
      const wrapper = element("label", "settings-range");
      const line = element("span", "settings-range-line");
      line.append(element("span", "settings-label", label), element("output", "settings-value", String(config[key] ?? min)));
      const input = document.createElement("input");
      input.type = "range";
      input.min = String(min);
      input.max = String(max);
      input.value = String(config[key] ?? min);
      input.addEventListener("input", () => { line.querySelector("output").textContent = input.value; send({ command: "update-config", patch: { [key]: Number(input.value) } }); });
      wrapper.append(line, input);
      panel.appendChild(wrapper);
    });
    const types = element("fieldset", "settings-types");
    types.appendChild(element("legend", "settings-legend", locale === "zh" ? "Maker 类型" : "Maker types"));
    [["strong", locale === "zh" ? "粗体文本" : "Bold text"], ["orderedList", locale === "zh" ? "有序列表" : "Ordered list"], ["unorderedList", locale === "zh" ? "无序列表" : "Unordered list"]].forEach(([key, label]) => {
      const checkbox = element("label", "settings-check");
      const input = document.createElement("input");
      input.type = "checkbox";
      const platform = snapshot.platform || "default";
      const configKey = key === "strong" ? "enabledStrongByPlatform" : key === "orderedList" ? "enabledOrderedListByPlatform" : "enabledUnorderedListByPlatform";
      input.checked = Boolean(config[configKey]?.[platform]);
      input.addEventListener("change", () => send({ command: "update-config", patch: { [configKey]: { [platform]: input.checked } } }));
      checkbox.append(input, element("span", "settings-check-label", label));
      types.appendChild(checkbox);
    });
    panel.appendChild(types);
    const levels = element("fieldset", "settings-types");
    levels.appendChild(element("legend", "settings-legend", locale === "zh" ? "标题级别" : "Heading levels"));
    const platform = snapshot.platform || "default";
    const selectedLevels = Array.isArray(config.enabledLevelsByPlatform?.[platform])
      ? config.enabledLevelsByPlatform[platform]
      : [1, 2, 3];
    [1, 2, 3, 4].forEach((level) => {
      const checkbox = element("label", "settings-check");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = selectedLevels.includes(level);
      input.disabled = input.checked && selectedLevels.length <= 1;
      input.addEventListener("change", () => {
        const nextLevels = selectedLevels.filter((selected) => selected !== level);
        if (input.checked) nextLevels.push(level);
        nextLevels.sort((first, second) => first - second);
        send({ command: "update-config", patch: { enabledLevelsByPlatform: { [platform]: nextLevels } } });
      });
      checkbox.append(input, element("span", "settings-check-label", `H${level}`));
      levels.appendChild(checkbox);
    });
    panel.appendChild(levels);
    panel.appendChild(element("p", "settings-supported", locale === "zh" ? "支持 ChatGPT、Claude、Gemini、Grok、Doubao、Kimi、Qwen、Yuanbao 和点点 AI。" : "Supports ChatGPT, Claude, Gemini, Grok, Doubao, Kimi, Qwen, Yuanbao, and Diandian AI."));
    const footer = element("div", "settings-footer");
    [[locale === "zh" ? "恢复默认" : "Reset", "reset-config"], [locale === "zh" ? "下载诊断" : "Download diagnostics", "download-diagnostics"], [locale === "zh" ? "发送诊断" : "Send diagnostics", "send-diagnostics"]].forEach(([label, command]) => {
      const button = element("button", "secondary-button", label);
      button.type = "button";
      button.addEventListener("click", () => send({ command }));
      footer.appendChild(button);
    });
    panel.appendChild(footer);
    const links = element("div", "settings-links");
    [[locale === "zh" ? "更新说明" : "Release notes", "https://github.com/Jeffery-Ho/Polaris-for-Web/blob/main/changelog.md"], [locale === "zh" ? "反馈" : "Feedback", "https://github.com/Jeffery-Ho/Polaris-for-Web/issues"]].forEach(([label, url]) => {
      const link = element("a", "settings-link", label);
      link.href = url;
      link.target = "_blank";
      link.rel = "noreferrer";
      links.appendChild(link);
    });
    panel.appendChild(links);
    const note = snapshot.releaseNotes?.[0];
    if (note) panel.appendChild(element("p", "settings-release-note", `${note.version}: ${note.summary || note.title || ""}`));
    panel.appendChild(element("p", "settings-version", snapshot.version || ""));
    return panel;
  }

  function renderImagePreview() {
    const overlay = element("div", "image-preview");
    overlay.addEventListener("click", (event) => { if (event.target === overlay) { state.imageUrls = []; render(); } });
    const close = element("button", "preview-close", "×");
    close.type = "button";
    close.addEventListener("click", () => { state.imageUrls = []; render(); });
    const image = element("img", "preview-image");
    image.src = state.imageUrls[state.imageIndex] || "";
    image.alt = "";
    const previous = element("button", "preview-nav preview-previous", "‹");
    previous.type = "button";
    previous.disabled = state.imageUrls.length < 2;
    previous.addEventListener("click", () => { state.imageIndex = (state.imageIndex - 1 + state.imageUrls.length) % state.imageUrls.length; render(); });
    const next = element("button", "preview-nav preview-next", "›");
    next.type = "button";
    next.disabled = state.imageUrls.length < 2;
    next.addEventListener("click", () => { state.imageIndex = (state.imageIndex + 1) % state.imageUrls.length; render(); });
    overlay.append(close, previous, image, next);
    document.body.appendChild(overlay);
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (!message || typeof message.type !== "string") return;
    if (message.type === "POLARIS_WINDOW_STATE" && message.snapshot) {
      const nextTabId = message.tabId ?? null;
      const changedSource = state.sourceTabId !== nextTabId || state.routeKey !== (message.snapshot.routeKey || "") || state.snapshot?.revision !== message.snapshot.revision;
      if (changedSource) {
        state.chapters = [];
        state.imageUrls = [];
        state.imageIndex = 0;
        state.chapterIndex = 0;
      }
      state.sourceTabId = nextTabId;
      state.routeKey = message.snapshot.routeKey || "";
      state.snapshot = message.snapshot;
      if (state.activeTab === "chapters" && !state.chapters.length && message.snapshot.hasConversation) send({ command: "request-chapters" });
      render();
    }
    if (message.type === "POLARIS_WINDOW_CHAPTERS") {
      state.chapters = Array.isArray(message.chapters) ? message.chapters : [];
      render();
    }
    if (message.type === "POLARIS_WINDOW_IMAGE") {
      state.imageUrls = Array.isArray(message.imageUrls) ? message.imageUrls : [];
      state.imageIndex = 0;
      if (state.imageUrls.length) render();
    }
  });

  render();
  window.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === "f") {
      event.preventDefault();
      if (event.shiftKey) {
        state.activeTab = "chapters";
        state.chapterQuery = "";
        send({ command: "request-chapters" });
      }
      render();
      const input = document.querySelector(".window-search input");
      if (input instanceof HTMLInputElement) {
        input.focus();
        input.select();
      }
    }
    if (event.key === "Escape" && state.imageUrls.length) {
      state.imageUrls = [];
      render();
    }
    if (!event.metaKey && !event.ctrlKey && !event.altKey && state.imageUrls.length && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      event.preventDefault();
      state.imageIndex = (state.imageIndex + (event.key === "ArrowLeft" ? -1 : 1) + state.imageUrls.length) % state.imageUrls.length;
      render();
    }
  });
  void sendReady();
})();
