import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const contentSource = await readFile(new URL("../src/content.js", import.meta.url), "utf8");
const settingsPanelSource = await readFile(new URL("../src/settings-panel.jsx", import.meta.url), "utf8");
const settingsStyles = await readFile(new URL("../src/settings-panel.css", import.meta.url), "utf8");

test("设置面板 Header 提供赞赏入口", () => {
  assert.match(contentSource, /supportLabel: t\("support\.aria"\)/);
  assert.match(contentSource, /const SUPPORT_URL = "https:\/\/jeffery-ho\.github\.io\/polaris-landing\/\?utm_source=polaris_extension&utm_medium=support_entry&utm_campaign=polaris_support"/);
  assert.match(contentSource, /supportUrl: SUPPORT_URL/);
  assert.doesNotMatch(contentSource, /getSupportLink\(/);
  assert.doesNotMatch(contentSource, /SUPPORT_LINK_CLASS/);
  assert.match(settingsPanelSource, /const support = createElement\("a", "polaris-settings-support-link"\)/);
  assert.match(settingsPanelSource, /support\.href = model\.supportUrl/);
  assert.match(settingsPanelSource, /support\.target = "_blank"/);
  assert.match(settingsPanelSource, /support\.rel = "noreferrer"/);
  assert.match(settingsPanelSource, /header\.append\(app, support\)/);
  assert.match(settingsPanelSource, /createSupportHeartIcon\(\)/);
  assert.match(settingsStyles, /\.polaris-settings-support-link \{[\s\S]*?width: 30px;[\s\S]*?color: #ff375f;/);
});
