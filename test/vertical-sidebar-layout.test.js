import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const contentSource = await readFile(new URL("../src/content.js", import.meta.url), "utf8");
const settingsPanelSource = await readFile(new URL("../src/settings-panel.jsx", import.meta.url), "utf8");
const settingsStyles = await readFile(new URL("../src/settings-panel.css", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
const i18nSource = await readFile(new URL("../src/i18n.js", import.meta.url), "utf8");

function functionSource(source, name, nextName) {
  const start = source.indexOf(`  function ${name}(`);
  const end = source.indexOf(`  function ${nextName}(`, start);
  return source.slice(start, end);
}

test("布局配置默认横向并兼容旧配置", () => {
  assert.match(contentSource, /const CONFIG_SCHEMA_VERSION = 8;/);
  assert.match(contentSource, /navigationLayout: "horizontal"/);
  assert.match(contentSource, /function normalizeNavigationLayout\(value\)/);
  assert.match(contentSource, /result\.navigationLayout = normalizeNavigationLayout\(config && config\.navigationLayout\);/);

  const normalizeConfig = functionSource(contentSource, "normalizeConfig", "enabledLevelsByPlatformEqual");
  assert.match(normalizeConfig, /result\.navigationLayout = normalizeNavigationLayout\(config && config\.navigationLayout\);/);

  const configsEqual = functionSource(contentSource, "configsEqual", "hasSyncStorage");
  assert.match(configsEqual, /first\.navigationLayout === second\.navigationLayout/);
});

test("Maker pane 将搜索和列表作为垂直布局左侧整体", () => {
  assert.match(contentSource, /gpt-paragraph-nav__maker-pane/);
  assert.match(contentSource, /function getMakerPane\(root = getRoot\(\)\)/);
  assert.match(contentSource, /root\.classList\.toggle\("is-layout-vertical", state\.config\.navigationLayout === "vertical"\)/);
  assert.match(styles, /#gpt-paragraph-nav\.is-layout-vertical \{[\s\S]*?display: grid;[\s\S]*?grid-template-columns: minmax\(0, 1fr\) auto;/);
  assert.match(styles, /#gpt-paragraph-nav\.is-layout-vertical \.gpt-paragraph-nav__maker-pane \{[\s\S]*?grid-column: 1;/);
  assert.match(styles, /#gpt-paragraph-nav\.is-layout-vertical \.gpt-paragraph-nav__controls \{[\s\S]*?grid-column: 2;[\s\S]*?flex-direction: column;/);
  assert.match(contentSource, /function verticalMarkerPaneWidth\(root, controls\)/);
  assert.match(contentSource, /clampedControlPosition\(position, controls, root = controls\.closest/);
  assert.match(contentSource, /window\.innerWidth - rect\.width - markerPaneWidth/);
  assert.match(styles, /#gpt-paragraph-nav\.is-layout-vertical \.gpt-paragraph-nav__floating-active \{[\s\S]*?right: calc\(var\(--gpt-nav-control-column-width, 0px\) \+ 8px\);/);
});

test("垂直 Sidebar 更新 Tab 无障碍方向和选中指示器", () => {
  assert.match(contentSource, /capsule\.setAttribute\("aria-orientation", isVerticalLayout \? "vertical" : "horizontal"\)/);
  assert.match(contentSource, /indicator\.style\.height = `\$\{activeTab\.offsetHeight\}px`/);
  assert.match(contentSource, /indicator\.style\.transform = `translateY\(\$\{activeTab\.offsetTop\}px\)`/);
  assert.match(contentSource, /orientation: isVerticalLayout \? "vertical" : "horizontal"/);
  assert.match(styles, /#gpt-paragraph-nav\.is-layout-vertical \.gpt-paragraph-nav__control-tab-indicator \{[\s\S]*?right: 3px;[\s\S]*?bottom: auto;/);
});

test("设置面板提供可访问的布局单选项并同步本地化文案", () => {
  assert.match(settingsPanelSource, /function createNavigationLayoutSelector\(model\)/);
  assert.match(settingsPanelSource, /input\.type = "radio"/);
  assert.match(settingsPanelSource, /model\.navigationLayout\.options/);
  assert.match(contentSource, /navigationLayout: \{/);
  assert.match(contentSource, /onNavigationLayoutChange\(layout\)/);
  assert.match(settingsStyles, /\.polaris-settings-layout-options \{/);
  assert.match(i18nSource, /"settings\.layout"/);
  assert.match(i18nSource, /"settings\.layoutHorizontal"/);
  assert.match(i18nSource, /"settings\.layoutVertical"/);
});
