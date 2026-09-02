import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const contentSource = await readFile(new URL("../src/content.js", import.meta.url), "utf8");
const stylesSource = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("更新说明将赞赏按钮置于操作区最左侧并沿用设置页心形样式", () => {
  assert.match(contentSource, /const support = document\.createElement\("a"\);/);
  assert.match(contentSource, /support\.className = "gpt-paragraph-nav__release-notice-action is-icon is-support";/);
  assert.match(contentSource, /support\.setAttribute\("aria-label", t\("support\.aria"\)\);/);
  assert.match(contentSource, /support\.href = SUPPORT_URL;/);
  assert.match(contentSource, /support\.target = "_blank";/);
  assert.match(contentSource, /support\.rel = "noreferrer";/);
  assert.match(contentSource, /actions\.append\(support, email, issue, acknowledge\);/);
  assert.match(stylesSource, /\.gpt-paragraph-nav__release-notice-action\.is-support \{[\s\S]*?color: #ff375f;/);
  assert.match(stylesSource, /\.gpt-paragraph-nav__release-notice-action\.is-support:hover,[\s\S]*?color: #ff2d55;/);
});
