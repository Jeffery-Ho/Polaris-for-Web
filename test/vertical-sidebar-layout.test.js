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
  assert.match(contentSource, /const VERTICAL_LAYOUT_ENABLED = true;/);
  assert.match(contentSource, /navigationLayout: "horizontal"/);
  assert.match(contentSource, /function normalizeNavigationLayout\(value\)/);
  assert.match(contentSource, /return VERTICAL_LAYOUT_ENABLED && value === "vertical" \? "vertical" : "horizontal";/);
  assert.match(contentSource, /result\.navigationLayout = normalizeNavigationLayout\(config && config\.navigationLayout\);/);

  const normalizeConfig = functionSource(contentSource, "normalizeConfig", "enabledLevelsByPlatformEqual");
  assert.match(normalizeConfig, /result\.navigationLayout = normalizeNavigationLayout\(config && config\.navigationLayout\);/);

  const configsEqual = functionSource(contentSource, "configsEqual", "hasSyncStorage");
  assert.match(configsEqual, /first\.navigationLayout === second\.navigationLayout/);
});

test("Maker pane 在垂直布局中使用右侧用户分组和左侧 AI 子菜单", () => {
  assert.match(contentSource, /gpt-paragraph-nav__maker-pane/);
  assert.match(contentSource, /function getMakerPane\(root = getRoot\(\)\)/);
  assert.match(contentSource, /function getVerticalSubmenu\(root = getRoot\(\)\)/);
  assert.match(contentSource, /function getVerticalUserList\(root = getRoot\(\)\)/);
  assert.match(contentSource, /VERTICAL_USER_LIST_ID = "gpt-paragraph-nav-user-list"/);
  assert.match(contentSource, /verticalUserMarkerListReconciler\.reconcile\(/);
  assert.match(contentSource, /verticalAiMarkerRenderItems\(visibleGroups\.find/);
  assert.match(contentSource, /state\.verticalPinnedGroupKey = groupKey/);
  assert.match(contentSource, /list\.addEventListener\("pointerover"/);
  assert.match(contentSource, /list\.addEventListener\("focusin"/);
  assert.match(contentSource, /VERTICAL_SUBMENU_BACK_CLASS/);
  assert.match(contentSource, /root\.classList\.toggle\(\s*"is-layout-vertical",\s*VERTICAL_LAYOUT_ENABLED && state\.config\.navigationLayout === "vertical"\s*\)/);
  assert.match(styles, /#gpt-paragraph-nav\.is-layout-vertical \{[\s\S]*?display: grid;[\s\S]*?grid-template-columns: minmax\(0, 1fr\) auto;/);
  assert.match(styles, /#gpt-paragraph-nav\.is-layout-vertical \.gpt-paragraph-nav__maker-pane \{[\s\S]*?grid-column: 1;[\s\S]*?justify-self: end;[\s\S]*?width: min\(var\(--gpt-nav-maker-pane-width/);
  assert.match(styles, /grid-template-columns: minmax\(0, var\(--gpt-nav-vertical-ai-width, 0px\)\) minmax\(0, var\(--gpt-nav-vertical-user-width, 180px\)\)/);
  assert.match(styles, /\.gpt-paragraph-nav__vertical-submenu \{/);
  assert.match(styles, /\.gpt-paragraph-nav__vertical-user-list \{/);
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
  assert.match(settingsPanelSource, /function createNavigationLayoutPreview\(key\)/);
  assert.match(settingsPanelSource, /createNavigationLayoutPreview\(option\.key\)/);
  assert.match(settingsPanelSource, /function createNavigationMakerListPreview\(\)/);
  assert.match(settingsPanelSource, /createNavigationMakerListPreview\(\)/);
  assert.doesNotMatch(settingsPanelSource, /polaris-settings-layout-preview-traffic-lights/);
  assert.doesNotMatch(settingsPanelSource, /polaris-settings-layout-preview-dot/);
  assert.match(settingsPanelSource, /input\.type = "radio"/);
  assert.match(settingsPanelSource, /input\.setAttribute\("aria-label", option\.label\)/);
  assert.match(settingsPanelSource, /model\.navigationLayout\.options/);
  assert.match(settingsPanelSource, /body\.append\(createNavigationLayoutSelector\(model\), createSeparator\(\), sliders, createSeparator\(\)/);
  assert.match(contentSource, /navigationLayout: \{/);
  assert.match(contentSource, /onNavigationLayoutChange\(layout\)/);
  assert.match(settingsStyles, /\.polaris-settings-layout-options \{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
  assert.match(settingsStyles, /\.polaris-settings-layout-preview \{/);
  assert.match(settingsStyles, /\.polaris-settings-layout-preview-maker-list \{/);
  assert.match(settingsPanelSource, /polaris-settings-layout-preview-cascade/);
  assert.match(settingsPanelSource, /polaris-settings-layout-preview-user-list/);
  assert.match(settingsStyles, /\.polaris-settings-layout-preview-cascade \{/);
  assert.match(settingsStyles, /\.polaris-settings-layout-preview-user-item--active/);
  assert.match(settingsStyles, /\.polaris-settings-layout-preview-maker-item:nth-child\(2\)/);
  assert.match(settingsStyles, /\.polaris-settings-layout-preview-maker-item:nth-child\(3\)/);
  assert.match(settingsStyles, /\.polaris-settings-layout-preview-sidebar--right/);
  assert.doesNotMatch(settingsStyles, /\.polaris-settings-layout-preview-dot/);
  assert.match(settingsStyles, /\.polaris-settings-layout-input:checked \+ \.polaris-settings-layout-content \.polaris-settings-layout-preview/);
  assert.match(i18nSource, /"settings\.layout": "Tab Layout:"/);
  assert.match(i18nSource, /"settings\.layoutHorizontal": "Top of Window"/);
  assert.match(i18nSource, /"settings\.layoutVertical": "Sidebar"/);
  assert.match(i18nSource, /"settings\.layout": "Tab 布局："/);
  assert.match(i18nSource, /"settings\.layoutHorizontal": "窗口顶部"/);
  assert.match(i18nSource, /"settings\.layoutVertical": "侧边栏"/);
  assert.match(i18nSource, /"userMarker\.verticalBack": "Back to user groups"/);
  assert.match(i18nSource, /"userMarker\.verticalBack": "返回用户分组"/);
  assert.match(i18nSource, /"userMarker\.unassignedGroup": "Unassigned replies"/);
  assert.match(i18nSource, /"userMarker\.unassignedGroup": "未分组回复"/);
});

test("垂直级联保留搜索、滚动隔离和路由清理", () => {
  assert.match(contentSource, /function verticalSelectedGroupKey\(visibleGroups\)/);
  assert.match(contentSource, /if \(normalizeSearchQuery\(state\.markerSearchQuery\)\)/);
  assert.match(contentSource, /function verticalAiMarkerRenderItems\(group\)/);
  assert.match(contentSource, /userMarker\.noAiMarkers/);
  assert.match(contentSource, /closest\("\.gpt-paragraph-nav__list"\)/);
  assert.match(contentSource, /verticalUserMarkerListReconciler\.reset\(\)/);
  assert.match(contentSource, /state\.verticalPreviewGroupKey = ""/);
  assert.match(contentSource, /state\.verticalPinnedGroupKey = ""/);
});
