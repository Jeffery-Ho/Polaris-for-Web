import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const contentSource = await readFile(new URL("../src/content.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("Header 右侧的心形赞赏入口指向独立 landing 页面", () => {
  assert.match(contentSource, /const SUPPORT_PAGE_URL = "https:\/\/jeffery-ho\.github\.io\/polaris-landing\/"/);
  assert.match(contentSource, /link\.className = SUPPORT_LINK_CLASS/);
  assert.match(contentSource, /link\.target = "_blank"/);
  assert.match(contentSource, /link\.rel = "noreferrer"/);
  assert.match(contentSource, /createSupportHeartIcon\(\)/);
  assert.match(contentSource, /getControlCapsule\(root\);\n    getSupportLink\(root\);/);
  assert.match(contentSource, /const rect = controls instanceof HTMLElement \? controls\.getBoundingClientRect\(\) : capsule\.getBoundingClientRect\(\);/);
  assert.match(styles, /\.gpt-paragraph-nav__controls \{[\s\S]*?align-self: flex-end;[\s\S]*?gap: 6px;/);
  assert.match(styles, /\.gpt-paragraph-nav__support-link \{[\s\S]*?flex: 0 0 30px;[\s\S]*?color: #ff375f;/);
});
