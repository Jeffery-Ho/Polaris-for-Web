import test from "node:test";
import assert from "node:assert/strict";

import {
  captureHistoricalScrollPosition,
  restoreHistoricalScrollPosition
} from "../src/historical-scroll-position.js";

function scrollContainer({ scrollTop = 800, scrollHeight = 2_000, clientHeight = 500 } = {}) {
  return {
    scrollTop,
    scrollHeight,
    clientHeight,
    calls: [],
    getBoundingClientRect() { return { top: 100 }; },
    scrollTo({ top, behavior }) {
      this.scrollTop = top;
      this.calls.push({ top, behavior });
    }
  };
}

test("优先按重新映射的可见消息锚点恢复像素位置", () => {
  const container = scrollContainer();
  const originalAnchor = { getBoundingClientRect: () => ({ top: 260 }) };
  const position = captureHistoricalScrollPosition({
    scrollContainer: container,
    anchorElement: originalAnchor,
    anchorKey: "message-42"
  });
  container.scrollTop = 0;
  container.scrollHeight = 4_000;
  const remountedAnchor = { isConnected: true, getBoundingClientRect: () => ({ top: 620 }) };

  const method = restoreHistoricalScrollPosition({
    scrollContainer: container,
    position,
    resolveAnchor: () => remountedAnchor
  });

  assert.equal(method, "anchor");
  assert.deepEqual(container.calls, [{ top: 360, behavior: "auto" }]);
});

test("锚点不可用时按扫描前距底部距离恢复", () => {
  const container = scrollContainer();
  const position = captureHistoricalScrollPosition({ scrollContainer: container });
  container.scrollHeight = 3_000;
  container.scrollTop = 0;

  const method = restoreHistoricalScrollPosition({
    scrollContainer: container,
    position,
    resolveAnchor: () => null
  });

  assert.equal(method, "bottom-distance");
  assert.deepEqual(container.calls, [{ top: 1_800, behavior: "auto" }]);
});

test("位置尺寸无效时最后回退扫描前 scrollTop", () => {
  const container = scrollContainer();
  const method = restoreHistoricalScrollPosition({
    scrollContainer: container,
    position: {
      anchorKey: "missing",
      anchorOffset: null,
      distanceFromBottom: Number.NaN,
      scrollTop: 640
    }
  });

  assert.equal(method, "scroll-top");
  assert.deepEqual(container.calls, [{ top: 640, behavior: "auto" }]);
});
