import test from "node:test";
import assert from "node:assert/strict";

import {
  preserveMarkerListDragPosition,
  shouldStartMarkerListPointerDrag
} from "../src/marker-list-drag.js";

test("Maker 按钮不会启动列表拖拽", () => {
  const marker = {};
  const target = { closest: (selector) => selector === ".gpt-paragraph-nav__marker" ? marker : null };

  assert.equal(shouldStartMarkerListPointerDrag(target), false);
});

test("列表空白区域仍可启动拖拽", () => {
  assert.equal(shouldStartMarkerListPointerDrag({ closest: () => null }), true);
  assert.equal(shouldStartMarkerListPointerDrag(null), true);
});

test("流式插入 Maker 后同步拖拽起点和最新滚动范围", () => {
  const list = {};
  const drag = {
    kind: "list",
    list,
    startScrollTop: 40,
    maxScrollTop: 80
  };

  preserveMarkerListDragPosition({
    drag,
    list,
    maxScrollTop: 120,
    scrollDelta: 20
  });

  assert.equal(drag.startScrollTop, 60);
  assert.equal(drag.maxScrollTop, 120);
});
