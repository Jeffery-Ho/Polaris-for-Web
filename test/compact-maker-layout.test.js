import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

test("缩小模式为用户 Maker 的标题、内边距和折叠箭头分别预留宽度", () => {
  assert.match(
    styles,
    /gpt-paragraph-nav__marker\.gpt-paragraph-nav__marker--user \{\n  max-width: min\(190px, calc\(100vw - 28px\)\);/
  );
  assert.match(
    styles,
    /gpt-paragraph-nav__marker--user \.gpt-paragraph-nav__preview \{\n  max-width: 160px;/
  );
  assert.match(
    styles,
    /gpt-paragraph-nav__user-chevron \{[\s\S]*?flex: 0 0 8px;[\s\S]*?width: 8px;[\s\S]*?height: 8px;/
  );
});

test("缩小模式为折叠分组的计数、余量和箭头扩展宽度", () => {
  assert.match(
    styles,
    /is-control-minimized \.gpt-paragraph-nav__fold \{\n  max-width: min\(280px, calc\(100vw - 28px\)\);/
  );
});
