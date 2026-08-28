import test from "node:test";
import assert from "node:assert/strict";

import { createMarkerListActiveTracker } from "../src/marker-list-active-tracker.js";

function element(key) {
  return { key, isConnected: true };
}

test("活动 Maker 切换只更新前后两个元素", () => {
  [20, 100, 400, 800].forEach((makerCount) => {
    const makers = Array.from({ length: makerCount }, (_, index) => element(`maker-${index}`));
    const updates = [];
    const tracker = createMarkerListActiveTracker({
      setActive(marker, isActive) {
        updates.push([marker.key, isActive]);
      }
    });

    tracker.sync(makers[0]);
    updates.length = 0;
    tracker.sync(makers[makerCount - 1]);

    assert.deepEqual(updates, [
      ["maker-0", false],
      [`maker-${makerCount - 1}`, true]
    ]);
  });
});

test("重复同步同一 Maker 不重复切换活动状态", () => {
  const marker = element("maker-current");
  let updateCount = 0;
  const tracker = createMarkerListActiveTracker({
    setActive() {
      updateCount += 1;
    }
  });

  tracker.sync(marker);
  updateCount = 0;

  assert.equal(tracker.sync(marker), marker);
  assert.equal(tracker.current(), marker);
  assert.equal(updateCount, 0);
});

test("已断开的活动元素自动失效并可映射到重建节点", () => {
  const original = element("maker-stable");
  const replacement = element("maker-stable");
  const tracker = createMarkerListActiveTracker({
    setActive() {}
  });

  tracker.sync(original);
  original.isConnected = false;

  assert.equal(tracker.current(), null);
  assert.equal(tracker.sync(replacement), replacement);
  assert.equal(tracker.current(), replacement);
});
