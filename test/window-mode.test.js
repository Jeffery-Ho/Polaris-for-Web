import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [manifest, buildManifest, background, content, windowSource, windowHtml, windowCss] = await Promise.all([
  readFile(new URL("../manifest.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../manifest.build.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../src/background.js", import.meta.url), "utf8"),
  readFile(new URL("../src/content.js", import.meta.url), "utf8"),
  readFile(new URL("../src/window.js", import.meta.url), "utf8"),
  readFile(new URL("../window.html", import.meta.url), "utf8"),
  readFile(new URL("../src/window.css", import.meta.url), "utf8")
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
  assert.match(background, /persistWindowConfigCommand/);
  assert.match(background, /POLARIS_WINDOW_STATE/);
  assert.match(background, /POLARIS_WINDOW_IMAGE/);
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
  assert.match(windowSource, /renderNavigation/);
  assert.match(windowSource, /renderChapters/);
  assert.match(windowSource, /renderSettings/);
  assert.match(windowSource, /supportedPlatforms/);
  assert.match(windowSource, /No conversation here/);
  assert.match(windowSource, /jump-to-marker/);
  assert.match(windowSource, /request-chapters/);
  assert.match(windowSource, /state\.chapters = \[\]/);
  assert.match(windowSource, /matchesSearch/);
  assert.match(windowSource, /download-diagnostics/);
});

test("独立窗口使用浏览器原生关闭控制和工具窗层级", () => {
  assert.doesNotMatch(windowSource, /window-close/);
  assert.match(windowSource, /window-identity/);
  assert.match(windowSource, /window-search/);
  assert.match(windowSource, /window-tabs/);
  assert.match(windowCss, /background: #f6f8fa/);
  assert.match(windowCss, /border-bottom: 1px solid var\(--border\)/);
  assert.match(windowCss, /min-width: 320px/);
});
