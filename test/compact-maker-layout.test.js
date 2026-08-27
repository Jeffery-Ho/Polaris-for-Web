import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const contentSource = readFileSync(new URL("../src/content.js", import.meta.url), "utf8");

test("Maker 队列为 tips 阴影保留完整缓冲区", () => {
  assert.match(styles, /--gpt-marker-shadow-buffer: 32px;/);
  assert.match(
    styles,
    /max-height: calc\(var\(--queue-visible-count, 30\) \* 44px \+ var\(--gpt-marker-shadow-buffer\) \* 2\);/
  );
  assert.doesNotMatch(styles, /max\(0px, calc\(100% - 52px/);
  assert.match(
    styles,
    /\.gpt-paragraph-nav__list \{[\s\S]*?padding: var\(--gpt-marker-shadow-buffer\) var\(--gpt-marker-shadow-buffer\) var\(--gpt-marker-shadow-buffer\) 0;/
  );
});

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

test("缩小模式为折叠分组的标题、余量和箭头扩展宽度", () => {
  assert.match(
    styles,
    /is-control-minimized \.gpt-paragraph-nav__fold \{\n  max-width: min\(280px, calc\(100vw - 28px\)\);/
  );
});

test("折叠 Maker 分组仅保留后置余量和箭头", () => {
  assert.doesNotMatch(contentSource, /gpt-paragraph-nav__fold-count/);
  assert.doesNotMatch(styles, /gpt-paragraph-nav__fold-count/);
  assert.match(contentSource, /gpt-paragraph-nav__fold-remainder/);
  assert.match(contentSource, /gpt-paragraph-nav__fold-chevron/);
});

test("Maker 正文默认左对齐且不改变 AI 与用户分组的队列位置", () => {
  assert.match(
    styles,
    /\.gpt-paragraph-nav__marker \{[^}]*justify-content: flex-start;[^}]*text-align: left;/
  );
  assert.match(
    styles,
    /\.gpt-paragraph-nav__floating-active \{[^}]*justify-content: flex-start;[^}]*text-align: left;/
  );
  assert.match(
    styles,
    /\.gpt-paragraph-nav__fold-label \{[^}]*text-align: left;/
  );
  assert.match(
    styles,
    /\.gpt-paragraph-nav__marker-row--ai \{\n  justify-content: flex-start;\n\}[\s\S]*?\.gpt-paragraph-nav__marker-row--user \{\n  justify-content: flex-end;\n\}/
  );
});

test("搜索栏默认沿用主导航背景，悬停时显示输入背景", () => {
  assert.match(
    styles,
    /\.gpt-paragraph-nav__search-input \{[\s\S]*?background: var\(--gpt-glass-dark-button-bg\);/
  );
  assert.match(
    styles,
    /\.gpt-paragraph-nav__search-input:hover \{\n  background: var\(--gpt-glass-input-bg\);\n\}/
  );
  assert.match(
    styles,
    /\.gpt-paragraph-nav__search-input::placeholder \{\n  color: var\(--gpt-arco-text-2\);\n\}/
  );
});
