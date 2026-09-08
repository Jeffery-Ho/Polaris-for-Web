import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const listRule = styles.match(/\.gpt-paragraph-nav__list \{([\s\S]*?)\n\}/)?.[1] || "";

test("Maker 列表在滚动边界隔离宿主会话滚动", () => {
  assert.match(listRule, /overflow-y: auto;/);
  assert.match(listRule, /overscroll-behavior-y: contain;/);
});
