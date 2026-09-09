import test from "node:test";
import assert from "node:assert/strict";

import { createPointerDragLifecycle } from "../src/pointer-drag-lifecycle.js";

function pointer(pointerId, clientX, clientY) {
  return { pointerId, clientX, clientY };
}

test("超过 4px 后进入拖动，正常释放会返回可持久化结果", () => {
  const lifecycle = createPointerDragLifecycle({ threshold: 4 });
  const drag = lifecycle.begin({ pointerId: 1, startX: 10, startY: 10, kind: "list" });

  assert.equal(lifecycle.begin({ pointerId: 2 }), null);
  assert.equal(lifecycle.move(pointer(1, 14, 10)).didStart, false);
  assert.equal(lifecycle.move(pointer(1, 14.01, 10)).didStart, true);

  const result = lifecycle.finish({ pointerId: 1, persistPosition: true, reason: "pointerup" });
  assert.equal(result.drag, drag);
  assert.equal(result.persistPosition, true);
  assert.equal(result.reason, "pointerup");
  assert.equal(lifecycle.active, null);
});

test("blur 或 lostpointercapture 取消拖动后，下一次 pointerdown 可以重新开始", () => {
  const lifecycle = createPointerDragLifecycle();
  lifecycle.begin({ pointerId: 1, startX: 0, startY: 0, kind: "controls" });
  lifecycle.move(pointer(1, 8, 0));

  const cancelled = lifecycle.cancel("lostpointercapture");
  assert.equal(cancelled.persistPosition, false);
  assert.equal(cancelled.reason, "lostpointercapture");

  const nextDrag = lifecycle.begin({ pointerId: 2, startX: 4, startY: 4, kind: "controls" });
  assert.ok(nextDrag);
  assert.equal(nextDrag.pointerId, 2);
  assert.equal(lifecycle.finish({ pointerId: 2, persistPosition: false, reason: "blur" }).persistPosition, false);
});

test("错误指针不会结束当前拖动，点击阈值内不会变成拖动", () => {
  const lifecycle = createPointerDragLifecycle();
  lifecycle.begin({ pointerId: 7, startX: 20, startY: 20, kind: "list" });

  assert.equal(lifecycle.move(pointer(8, 30, 30)), null);
  assert.equal(lifecycle.finish({ pointerId: 8, persistPosition: true, reason: "pointerup" }), null);
  assert.equal(lifecycle.move(pointer(7, 24, 24)).didStart, false);
  assert.equal(lifecycle.active.didDrag, false);
});
