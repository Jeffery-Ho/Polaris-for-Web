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
  assert.match(styles, /#gpt-paragraph-nav\.is-layout-vertical \.gpt-paragraph-nav__maker-pane \{[\s\S]*?grid-column: 1;[\s\S]*?justify-self: stretch;[\s\S]*?width: 100%;/);
  assert.match(styles, /#gpt-paragraph-nav\.is-layout-vertical \.gpt-paragraph-nav__marker-row \{[\s\S]*?width: 100%;/);
  assert.match(styles, /#gpt-paragraph-nav\.is-layout-vertical \.gpt-paragraph-nav__search \{[\s\S]*?align-self: stretch;[\s\S]*?width: 100%;/);
  assert.match(styles, /#gpt-paragraph-nav\.is-layout-vertical \.gpt-paragraph-nav__controls \{[\s\S]*?grid-column: 2;[\s\S]*?flex-direction: column;/);
  const applyConfig = functionSource(contentSource, "applyConfig", "isVisible");
  assert.match(applyConfig, /const isVerticalLayout = root\.classList\.contains\("is-layout-vertical"\);/);
  assert.match(applyConfig, /const availableWidth = Math\.max\(0, window\.innerWidth - \(position\?\.right \?\? DEFAULT_RIGHT_OFFSET\)\);/);
  assert.match(applyConfig, /const verticalNavWidth = Math\.min\(/);
  assert.match(applyConfig, /isVerticalLayout\s*\?\s*`\$\{Math\.round\(verticalNavWidth\)\}px`/);
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

test("垂直 Sidebar 只显示图标并保留每个 Tab 的无障碍标题", () => {
  assert.match(contentSource, /function createControlTabIcon\(key\)/);
  assert.match(contentSource, /gpt-paragraph-nav__control-tab-icon--vertical/);
  assert.match(contentSource, /title\.textContent = key === "chapters" \? "book-open" : "information"/);
  assert.match(contentSource, /tab\.setAttribute\("aria-label", label\)/);
  assert.match(contentSource, /M12,5 L11\.4059,4\.40589/);
  assert.match(contentSource, /M9,18 C13\.9706,18 18,13\.9706 18,9/);
  assert.match(styles, /#gpt-paragraph-nav\.is-layout-vertical \.gpt-paragraph-nav__control-tab-label,[\s\S]*?#gpt-paragraph-nav\.is-layout-vertical \.gpt-paragraph-nav__control-tab-chevron \{[\s\S]*?display: none;/);
  assert.match(styles, /#gpt-paragraph-nav\.is-layout-vertical \.gpt-paragraph-nav__control-tab \{[\s\S]*?width: 34px;[\s\S]*?min-width: 34px;/);
  assert.match(styles, /\.gpt-paragraph-nav__control-tab-icon--vertical \{\n  display: none;/);
  assert.match(styles, /#gpt-paragraph-nav\.is-layout-vertical \.gpt-paragraph-nav__control-tab-icon--vertical \{[\s\S]*?display: block;[\s\S]*?width: 24px;[\s\S]*?height: 24px;/);
});

test("垂直 Sidebar 的搜索栏默认仅显示图标并在聚焦时展开", () => {
  assert.match(contentSource, /function ensureMarkerSearchIcon\(wrapper\)/);
  assert.match(contentSource, /wrapper\.prepend\(icon\)/);
  assert.match(styles, /#gpt-paragraph-nav\.is-layout-vertical \.gpt-paragraph-nav__search-icon \{[\s\S]*?-webkit-mask:/);
  assert.match(styles, /#gpt-paragraph-nav\.is-layout-vertical \.gpt-paragraph-nav__search-input \{[\s\S]*?width: 32px;[\s\S]*?text-indent: -9999px;/);
  assert.match(styles, /#gpt-paragraph-nav\.is-layout-vertical \.gpt-paragraph-nav__search-input:focus \{[\s\S]*?width: min\(220px, 100%\);[\s\S]*?text-indent: 0;/);
  assert.match(styles, /#gpt-paragraph-nav\.is-layout-vertical \.gpt-paragraph-nav__search:focus-within \.gpt-paragraph-nav__search-icon \{[\s\S]*?display: none;/);
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
