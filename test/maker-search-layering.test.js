import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

function styleRule(selector) {
  const match = styles.match(new RegExp(`(?:^|\\n)${selector.replace(/([.*+?^${}()|[\]\\])/g, "\\$1")} \\{([\\s\\S]*?)\\n\\}`));
  return match?.[1] || "";
}

test("滚动 Maker 列表位于搜索栏下层", () => {
  assert.match(styleRule(".gpt-paragraph-nav__list"), /position: relative;/);
  assert.match(styleRule(".gpt-paragraph-nav__list"), /z-index: 0;/);
  assert.match(styleRule(".gpt-paragraph-nav__search"), /position: relative;/);
  assert.match(styleRule(".gpt-paragraph-nav__search"), /z-index: 1;/);
});
