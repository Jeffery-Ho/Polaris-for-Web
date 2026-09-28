import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const platformFaviconFiles = ["chatgpt", "claude", "gemini", "grok", "doubao", "kimi", "qianwen", "yuanbao", "xiaohongshu"];
const [buildManifest, background, content, windowSource, windowHtml, windowCss, searchInputSource, tokensCss] = await Promise.all([
  readFile(new URL("../manifest.build.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../src/background.js", import.meta.url), "utf8"),
  readFile(new URL("../src/content.js", import.meta.url), "utf8"),
  readFile(new URL("../src/window.js", import.meta.url), "utf8"),
  readFile(new URL("../polaris-home.html", import.meta.url), "utf8"),
  readFile(new URL("../src/window.css", import.meta.url), "utf8"),
  readFile(new URL("../src/search-input.js", import.meta.url), "utf8"),
  readFile(new URL("../src/tokens.css", import.meta.url), "utf8")
]);

test("manifest.build.json 声明 Polaris 窗口和系统 side panel 入口", () => {
  assert.deepEqual(buildManifest.permissions, ["storage", "tabs", "sidePanel", "scripting"]);
  assert.equal(buildManifest.action.default_title, "Open Polaris");
  assert.deepEqual(buildManifest.side_panel, { default_path: "sidepanel.html" });
  assert.equal(buildManifest.background.service_worker, "src/background.js");
  assert.equal(buildManifest.background.type, "module");
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
  assert.match(content, /__POLARIS_CONTENT_SCRIPT_ACTIVE__/);
});

test("内容脚本通过快照桥提供 Maker、章节和设置操作", () => {
  assert.match(content, /POLARIS_WINDOW_REQUEST_STATE/);
  assert.match(content, /POLARIS_WINDOW_COMMAND/);
  assert.match(content, /POLARIS_CONTENT_STATE/);
  assert.match(content, /POLARIS_WINDOW_CHAPTERS/);
  assert.match(content, /request-image-preview/);
  assert.match(content, /markerItems/);
  assert.match(content, /currentModelLabel/);
  assert.match(content, /Select ChatGPT model/);
  assert.match(content, /model: currentModelLabel\(\)/);
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

test("独立窗口图片预览使用中性遮罩并带有可读名称", () => {
  assert.match(windowCss, /\.image-preview \{[^}]*background: var\(--polaris-overlay\);/);
  assert.match(windowSource, /close\.setAttribute\("aria-label", t\("userMarker\.closeImagePreview"\)\)/);
  assert.match(windowSource, /previous\.setAttribute\("aria-label", t\("userMarker\.previousImage"\)\)/);
  assert.match(windowSource, /next\.setAttribute\("aria-label", t\("userMarker\.nextImage"\)\)/);
  assert.match(windowSource, /image\.alt = t\("userMarker\.imagePreview"\)/);
});

test("独立窗口缩略图加载失败后移除破图并保留 Maker 文本", () => {
  assert.match(windowSource, /image\.addEventListener\("error", \(\) => \{[\s\S]*?image\.remove\(\)/);
  assert.match(windowSource, /button\.append\(image\);[\s\S]*?button\.append\(copy\)/);
});

test("Maker 列表用同一套表面区分 agent 和用户卡片，并保留可见焦点", () => {
  assert.match(windowCss, /\.maker-card-ai \{[\s\S]*?background: var\(--polaris-bg-subtle\);/);
  assert.match(windowCss, /\.maker-card-user \{[\s\S]*?background: var\(--polaris-bg-elevated\);/);
  assert.match(windowCss, /\.maker-card:hover \{[\s\S]*?background: var\(--polaris-bg-subtle\);/);
  assert.match(windowCss, /\.maker-card:focus-visible[\s\S]*?outline: 2px solid var\(--polaris-focus\);/);
  assert.doesNotMatch(windowCss, /\.maker-card \{[^}]*outline:\s*0/);
});

test("Home 和 Side Panel 的 Maker 卡片不显示阴影", () => {
  assert.match(windowCss, /\.maker-card \{[^}]*box-shadow: none;/);
});

test("当前模型只在窗口标题显示一次，卡片不再重复模型名", () => {
  assert.match(windowSource, /function renderHeader\(snapshot\)[\s\S]*?if \(snapshot\.model\)[\s\S]*?maker-badge maker-badge-model/);
  assert.match(windowSource, /function renderMarker\(item\)/);
  assert.doesNotMatch(windowSource, /function renderMarker\(item, model/);
  assert.doesNotMatch(windowSource, /renderMarker\(item,/);
  assert.doesNotMatch(windowSource, /maker-badge-role|"Agent"/);
  assert.doesNotMatch(windowSource, /"maker-preview"/);
  assert.match(windowCss, /\.maker-badge \{[^}]*background: var\(--polaris-accent-subtle\);[^}]*color: var\(--polaris-accent\);/);
  assert.match(windowCss, /\.maker-badge \{[^}]*width: fit-content;/);
});

test("Home 和 Side Panel 不使用渐变背景", () => {
  assert.match(windowCss, /@import "\.\/tokens\.css"/);
  assert.match(tokensCss, /--window-background: var\(--polaris-bg\)/);
  assert.match(tokensCss, /--polaris-bg: #ffffff;/);
  assert.match(tokensCss, /--polaris-bg: #09090b;/);
  assert.doesNotMatch(windowCss, /radial-gradient|linear-gradient/);
  assert.doesNotMatch(tokensCss, /--window-background:[^;]*(?:radial-gradient|linear-gradient)/);
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
  const resources = buildManifest.web_accessible_resources?.flatMap((entry) => entry.resources) || [];
  for (const name of platformFaviconFiles) assert.ok(resources.includes(`icons/platform-${name}.png`));
});

test("独立窗口使用浏览器原生关闭控制和工具窗层级", () => {
  assert.doesNotMatch(windowSource, /window-close/);
  assert.match(windowSource, /window-identity/);
  assert.match(windowSource, /window-search/);
  assert.match(windowSource, /window-tabs/);
  assert.match(windowCss, /background: var\(--polaris-bg\)/);
  assert.doesNotMatch(windowCss, /radial-gradient|linear-gradient/);
  assert.match(windowCss, /border-radius: var\(--polaris-radius-md\)/);
  assert.match(windowCss, /\.window-search[^}]*border-radius: var\(--polaris-radius-md\)/);
  assert.match(windowCss, /\.window-tabs[^}]*background: var\(--polaris-bg-subtle\)/);
  assert.doesNotMatch(windowCss, /\.window-tabs[^}]*border:\s*1px/);
  assert.doesNotMatch(windowCss, /\.window-tabs[^}]*inset/);
  assert.match(windowCss, /\.window-tab\.is-active[^}]*background: var\(--polaris-bg-elevated\)/);
  assert.doesNotMatch(windowCss, /\.window-tab\.is-active[^}]*inset/);
  assert.match(windowCss, /\.window-tab[^}]*border-radius: var\(--polaris-radius-sm\)/);
  assert.match(windowCss, /border-bottom: 1px solid var\(--polaris-border\)/);
  assert.match(windowCss, /min-width: 320px/);
  assert.doesNotMatch(windowCss, /empty-symbol|platform-grid|platform-chip|platform-icon/);
  assert.match(windowCss, /\.platform-stack/);
  assert.match(windowCss, /\.platform-favicon/);
  assert.match(windowCss, /margin-top: 40px/);
  assert.doesNotMatch(windowCss, /margin-top: auto/);
  assert.match(windowCss, /margin-left: -8px/);
  assert.match(windowCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(windowCss, /\.maker-chevron \{[\s\S]*?border-right: 1\.5px solid currentColor;/);
});
