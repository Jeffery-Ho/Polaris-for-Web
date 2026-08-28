import test from "node:test";
import assert from "node:assert/strict";

import {
  hasExceededMarkerListDragThreshold,
  preserveMarkerListDragPosition
} from "../src/marker-list-drag.js";

test("移动必须超过 4px 才进入拖动", () => {
  assert.equal(hasExceededMarkerListDragThreshold({ deltaX: 4, deltaY: 0, threshold: 4 }), false);
  assert.equal(hasExceededMarkerListDragThreshold({ deltaX: 0, deltaY: -4, threshold: 4 }), false);
  assert.equal(hasExceededMarkerListDragThreshold({ deltaX: 4.01, deltaY: 0, threshold: 4 }), true);
  assert.equal(hasExceededMarkerListDragThreshold({ deltaX: 0, deltaY: -5, threshold: 4 }), true);
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
