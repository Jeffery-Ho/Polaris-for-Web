import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const platformFaviconFiles = ["chatgpt", "claude", "gemini", "grok", "doubao", "kimi", "qianwen", "yuanbao", "xiaohongshu"];
const [manifest, buildManifest, background, content, windowSource, windowHtml, windowCss, searchInputSource] = await Promise.all([
  readFile(new URL("../manifest.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../manifest.build.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../src/background.js", import.meta.url), "utf8"),
  readFile(new URL("../src/content.js", import.meta.url), "utf8"),
  readFile(new URL("../src/window.js", import.meta.url), "utf8"),
  readFile(new URL("../polaris-home.html", import.meta.url), "utf8"),
  readFile(new URL("../src/window.css", import.meta.url), "utf8"),
  readFile(new URL("../src/search-input.js", import.meta.url), "utf8")
]);

test("两个源 manifest 都声明独立 Polaris 窗口入口", () => {
  for (const source of [manifest, buildManifest]) {
    assert.deepEqual(source.permissions, ["storage", "tabs"]);
    assert.equal(source.action.default_title, "Open Polaris");
    assert.equal(source.background.service_worker, "src/background.js");
    assert.equal(source.background.type, "module");
  }
});

test("后台窗口复用并跟随最近的普通标签页", () => {
  assert.match(background, /chrome\.action\.onClicked/);
  assert.match(background, /chrome\.windows\.create/);
  assert.match(background, /type: "popup"/);
  assert.match(background, /chrome\.windows\.update\(existing\.id, restorePopupWindowUpdate\(\)\)/);
  assert.match(background, /active: true, lastFocusedWindow: true/);
  assert.match(background, /chrome\.tabs\.onUpdated/);
  assert.match(background, /sourceWindowId = tab\?\.windowId/);
  assert.match(background, /SOURCE_WINDOW_STORAGE_KEY]: lastNormalWindowId/);
  assert.match(background, /publishEmptySnapshot/);
  assert.match(background, /publishEmptySnapshot\(targetTab\.id, isSupportedCandidateUrl\(targetTab\.url\)\)/);
  assert.match(background, /persistWindowConfigCommand/);
  assert.match(background, /POLARIS_WINDOW_STATE/);
  assert.match(background, /POLARIS_WINDOW_IMAGE/);
  assert.match(background, /message\.command === "refresh-state"/);
  assert.match(background, /message\.windowType === "popup"/);
  assert.match(background, /isNormalSourceTab/);
});

test("内容脚本通过快照桥提供 Maker、章节和设置操作", () => {
  assert.match(content, /POLARIS_WINDOW_REQUEST_STATE/);
  assert.match(content, /POLARIS_WINDOW_COMMAND/);
  assert.match(content, /POLARIS_CONTENT_STATE/);
  assert.match(content, /POLARIS_WINDOW_CHAPTERS/);
  assert.match(content, /request-image-preview/);
  assert.match(content, /markerItems/);
  assert.match(content, /mergeWindowConfigPatch/);
  assert.match(content, /revision: Date\.now\(\)/);
  assert.match(content, /routeKey: currentRouteKey/);
  assert.match(content, /reset-config/);
  assert.match(content, /is-window-managed/);
});

test("独立窗口包含导航、章节、设置和无对话平台空状态", () => {
  assert.match(windowHtml, /window\.js/);
  assert.match(background, /polaris-home\.html/);
  assert.match(windowSource, /renderNavigation/);
  assert.match(windowSource, /renderChapters/);
  assert.match(windowSource, /renderSettings/);
  assert.match(windowSource, /supportedPlatforms/);
  assert.match(windowSource, /startSourceObserver/);
  assert.match(windowSource, /startThemeObserver/);
  assert.match(windowSource, /matchMedia\(SYSTEM_THEME_QUERY\)/);
  assert.match(windowSource, /addEventListener\("change", refresh\)/);
  assert.match(windowSource, /chrome\.tabs\?\.onActivated/);
  assert.match(windowSource, /chrome\.tabs\?\.onUpdated/);
  assert.match(windowSource, /setInterval\(requestSourceState, 1200\)/);
  assert.match(windowSource, /const shouldRetry = !snapshot \|\| Boolean\(snapshot\.supportedRoute && !snapshot\.hasConversation\)/);
  assert.match(windowSource, /if \(isLoading \|\| snapshot\.loading\)/);
  assert.match(windowSource, /Reading conversation/);
  assert.match(windowSource, /windowType: currentWindow\.type/);
  assert.match(windowSource, /No conversation here/);
  assert.match(windowSource, /jump-to-marker/);
  assert.match(windowSource, /request-chapters/);
  assert.match(windowSource, /state\.chapters = \[\]/);
  assert.match(windowSource, /matchesSearch/);
  assert.match(windowSource, /input\.type = "text"/);
  assert.match(windowSource, /input\.lang = locale === "zh" \? "zh-CN" : "en"/);
  assert.match(windowSource, /if \(item\.type === "user"\)/);
  assert.doesNotMatch(windowSource, /append\(copy, element\("span", "maker-chevron"/);
  assert.doesNotMatch(windowSource, /empty-symbol|platform-grid|platform-chip|iconLabel/);
  assert.match(windowSource, /platform-stack/);
  assert.match(windowSource, /platform-favicon/);
  assert.match(windowSource, /icon\.alt = label/);
  assert.match(windowSource, /download-diagnostics/);
});

test("独立窗口图片预览使用纯黑 60% 遮罩", () => {
  assert.match(windowCss, /\.image-preview \{[^}]*background: rgba\(0, 0, 0, \.6\);/);
});

test("独立窗口缩略图加载失败后移除破图并保留 Maker 文本", () => {
  assert.match(windowSource, /image\.addEventListener\("error", \(\) => \{[\s\S]*?image\.remove\(\)/);
  assert.match(windowSource, /button\.append\(image\);[\s\S]*?button\.append\(copy\)/);
});

test("搜索输入支持中文输入法组合态并在提交后刷新", () => {
  for (const source of [searchInputSource]) {
    assert.match(source, /compositionstart/);
    assert.match(source, /compositionend/);
    assert.match(source, /event\.isComposing/);
  }
  assert.match(windowSource, /bindSearchInput/);
  assert.match(content, /bindSearchInput/);
});

test("空状态使用每个平台打包的 favicon 资源", async () => {
  await Promise.all(platformFaviconFiles.map((name) => access(new URL(`../icons/platform-${name}.png`, import.meta.url))));
  assert.equal((windowSource.match(/icons\/platform-[^"']+\.png/g) || []).length, platformFaviconFiles.length);
  assert.doesNotMatch(windowSource, /from ["']\.\/assets\/platform-favicons\/[^"']+\.png["']/);
  assert.match(windowSource, /chrome\.runtime\.getURL\(favicon\)/);
  for (const source of [manifest, buildManifest]) {
    const resources = source.web_accessible_resources?.flatMap((entry) => entry.resources) || [];
    for (const name of platformFaviconFiles) assert.ok(resources.includes(`icons/platform-${name}.png`));
  }
});

test("独立窗口使用浏览器原生关闭控制和工具窗层级", () => {
  assert.doesNotMatch(windowSource, /window-close/);
  assert.match(windowSource, /window-identity/);
  assert.match(windowSource, /window-search/);
  assert.match(windowSource, /window-tabs/);
  assert.match(windowCss, /background: #f6f8fa/);
  assert.match(windowCss, /radial-gradient\(90% 70% at 5% 0%/);
  assert.match(windowCss, /rgba\(211, 143, 88, \.16\)/);
  assert.match(windowCss, /--window-header-background: rgba\(255, 255, 255, \.6\)/);
  assert.match(windowCss, /--window-search-background: rgba\(255, 255, 255, \.85\)/);
  assert.match(windowCss, /--window-header-background: rgba\(0, 0, 0, \.6\)/);
  assert.match(windowCss, /--window-search-background: rgba\(0, 0, 0, \.85\)/);
  assert.match(windowCss, /border-radius: 18px/);
  assert.match(windowCss, /\.window-search[^}]*border-radius: 18px/);
  assert.match(windowCss, /\.window-tabs[^}]*background: #dedee3/);
  assert.doesNotMatch(windowCss, /\.window-tabs[^}]*border:\s*1px/);
  assert.doesNotMatch(windowCss, /\.window-tabs[^}]*inset/);
  assert.match(windowCss, /\.window-tab\.is-active[^}]*background: #fff/);
  assert.doesNotMatch(windowCss, /\.window-tab\.is-active[^}]*inset/);
  assert.match(windowCss, /\.window-tab[^}]*border-radius: 14px/);
  assert.match(windowCss, /border-bottom: 1px solid var\(--border\)/);
  assert.match(windowCss, /min-width: 320px/);
  assert.doesNotMatch(windowCss, /empty-symbol|platform-grid|platform-chip|platform-icon/);
  assert.match(windowCss, /\.platform-stack/);
  assert.match(windowCss, /\.platform-favicon/);
  assert.match(windowCss, /margin-top: 42px/);
  assert.doesNotMatch(windowCss, /margin-top: auto/);
  assert.match(windowCss, /margin-left: -7px/);
});
