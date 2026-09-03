import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const contentSource = await readFile(new URL("../src/content.js", import.meta.url), "utf8");
const stylesSource = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
const settingsSource = await readFile(new URL("../src/settings-panel.jsx", import.meta.url), "utf8");

test("Header 工具栏配置可迁移、同步并保留悬浮坐标", () => {
  assert.match(contentSource, /const CONFIG_SCHEMA_VERSION = 8;/);
  assert.match(contentSource, /controlPlacement: CONTROL_PLACEMENTS\.FLOATING/);
  assert.match(contentSource, /chatgptHeaderInsertIndex: 0/);
  assert.match(contentSource, /result\.controlPlacement = normalizeControlPlacement\(config && config\.controlPlacement\);/);
  assert.match(contentSource, /result\.chatgptHeaderInsertIndex = normalizeHeaderInsertIndex\(config && config\.chatgptHeaderInsertIndex\);/);
  assert.match(contentSource, /first\.controlPosition\?\.top === second\.controlPosition\?\.top[\s\S]*first\.controlPlacement === second\.controlPlacement/);
});

test("ChatGPT Header 仅移动 Polaris 容器，并在宿主重绘后可重新挂载", () => {
  assert.match(contentSource, /function chatGPTHeaderToolbar\(\)/);
  assert.match(contentSource, /function placeHeaderToolbarHost\(toolbar, host, insertIndex\)/);
  assert.match(contentSource, /toolbar\.insertBefore\(host, actions\[index\] \|\| null\);/);
  assert.match(contentSource, /function restoreFloatingControls\(root\)/);
  assert.match(contentSource, /function headerToolbarFits\(toolbar, host\)/);
  assert.match(contentSource, /syncControlPlacement\(root\);/);
});

test("Header 模式通过原最小化按钮拖动，并在完成后隐藏拖动把手", () => {
  assert.match(contentSource, /kind: "header-toolbar"/);
  assert.match(contentSource, /headerInsertIndexForPointer\(/);
  assert.match(contentSource, /chatgptHeaderInsertIndex: drag\.headerInsertIndex/);
  assert.match(contentSource, /data-drag-handle-dismissed/);
  assert.match(stylesSource, /\.gpt-paragraph-nav__header-toolbar-host\.is-dragging::before/);
  assert.match(stylesSource, /\[data-drag-handle-dismissed\] \.gpt-paragraph-nav__control-compact-toggle/);
});

test("设置页仅通过 ChatGPT 模型暴露 Header 工具栏开关", () => {
  assert.match(contentSource, /headerToolbar: isChatGPTPage\(\) \?/);
  assert.match(contentSource, /onHeaderToolbarChange\(isEnabled\)/);
  assert.match(settingsSource, /if \(model\.headerToolbar\)/);
});
