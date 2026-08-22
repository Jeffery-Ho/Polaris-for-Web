(() => {
  const messages = Object.freeze({
    en: Object.freeze({
      "navigation.rootLabel": "Polaris for Web navigation",
      "controls.label": "Polaris controls",
      "tab.navigation": "Navigation",
      "tab.chapters": "Chapters",
      "tab.settings": "Settings",
      "settings.label": "Navigation settings",
      "settings.maxVisible": "Maximum markers",
      "settings.foldThreshold": "Fold threshold",
      "settings.tooltipMaxWidth": "Tooltip width",
      "settings.markerTypes": "Marker types",
      "settings.unorderedList": "Unordered list",
      "settings.reset": "Reset settings",
      "sync.enabled": "Sync enabled",
      "sync.disabled": "Sync unavailable",
      "chapters.label": "AI response chapters",
      "chapters.copyCurrent": "Copy current chapter",
      "chapters.copyFull": "Copy full text",
      "chapters.copySuccess": "Copied",
      "chapters.close": "Close",
      "chapters.empty": "No AI response text is available on this page.",
      "chapters.fullText": "Full text",
      "search.markers.placeholder": "Search markers",
      "search.chapters.placeholder": "Search chapters",
      "search.empty": "No matching results",
      "fold.remainder": "{count} more",
      "fold.expandAria": "Expand {title}, {count} more",
      "fold.collapseAria": "Collapse {title}, {count} more",
      "heading.fallback": "Heading {index}"
    }),
    zh: Object.freeze({
      "navigation.rootLabel": "Polaris for Web 段落导航",
      "controls.label": "Polaris 控制面板",
      "tab.navigation": "导航",
      "tab.chapters": "章节",
      "tab.settings": "设置",
      "settings.label": "导航设置",
      "settings.maxVisible": "最大数量",
      "settings.foldThreshold": "折叠数量",
      "settings.tooltipMaxWidth": "提示宽度",
      "settings.markerTypes": "Marker 类型",
      "settings.unorderedList": "无序列表",
      "settings.reset": "重置配置",
      "sync.enabled": "同步已启用",
      "sync.disabled": "同步未启用",
      "chapters.label": "AI 回复章节视图",
      "chapters.copyCurrent": "复制当前章节",
      "chapters.copyFull": "复制全文",
      "chapters.copySuccess": "复制成功",
      "chapters.close": "关闭",
      "chapters.empty": "当前页面没有可提取的 AI 回复正文。",
      "chapters.fullText": "全文",
      "search.markers.placeholder": "搜索 marker",
      "search.chapters.placeholder": "搜索章节",
      "search.empty": "无匹配结果",
      "fold.remainder": "余下 {count} 条",
      "fold.expandAria": "展开 {title}，余下 {count} 条",
      "fold.collapseAria": "收起 {title}，余下 {count} 条",
      "heading.fallback": "标题 {index}"
    })
  });
  const locale = (navigator.language || "en").toLowerCase().startsWith("zh") ? "zh" : "en";

  function t(key, values = {}) {
    const message = messages[locale][key] || messages.en[key] || key;
    return message.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`));
  }

  globalThis.PolarisI18n = Object.freeze({ locale, t });
})();
