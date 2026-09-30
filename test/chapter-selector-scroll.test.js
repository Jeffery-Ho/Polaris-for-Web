import test from "node:test";
import assert from "node:assert/strict";
import { revealChapterOption } from "../src/chapter-selector-scroll.js";

function createSelector({ scrollTop = 0, top = 100, bottom = 280 } = {}) {
  return {
    scrollTop,
    getBoundingClientRect: () => ({ top, bottom })
  };
}

test("切换到目录下方章节时，将当前项完整滚入可视区域", () => {
  const selector = createSelector();
  const option = { getBoundingClientRect: () => ({ top: 300, bottom: 332 }) };

  revealChapterOption(selector, option);

  assert.equal(selector.scrollTop, 60);
});

test("切换到目录上方章节时，将当前项完整滚入可视区域", () => {
  const selector = createSelector({ scrollTop: 160 });
  const option = { getBoundingClientRect: () => ({ top: 72, bottom: 104 }) };

  revealChapterOption(selector, option);

  assert.equal(selector.scrollTop, 124);
});

test("当前章节已完整可见时保持目录位置", () => {
  const selector = createSelector({ scrollTop: 80 });
  const option = { getBoundingClientRect: () => ({ top: 140, bottom: 172 }) };

  revealChapterOption(selector, option);

  assert.equal(selector.scrollTop, 80);
});
