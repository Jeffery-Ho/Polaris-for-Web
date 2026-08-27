import test from "node:test";
import assert from "node:assert/strict";

import { createMarkerListScrollPersistence } from "../src/marker-list-scroll-persistence.js";

function createHarness() {
  let currentTime = 0;
  let nextFrameId = 1;
  const frames = new Map();
  let revealCount = 0;
  let unrelatedFrameCount = 0;
  let canKeepVisible = true;

  const persistence = createMarkerListScrollPersistence({
    durationMs: 1200,
    now: () => currentTime,
    requestFrame(callback) {
      const frameId = nextFrameId;
      nextFrameId += 1;
      frames.set(frameId, callback);
      return frameId;
    },
    cancelFrame(frameId) {
      frames.delete(frameId);
    },
    keepActiveMarkerVisible() {
      revealCount += 1;
      return canKeepVisible;
    }
  });

  return {
    persistence,
    pendingFrameCount: () => frames.size,
    revealCount: () => revealCount,
    unrelatedFrameCount: () => unrelatedFrameCount,
    runNextFrame() {
      const entry = frames.entries().next().value;
      if (!entry) {
        return;
      }
      const [frameId, callback] = entry;
      frames.delete(frameId);
      callback();
    },
    setCanKeepVisible(value) {
      canKeepVisible = value;
    },
    scheduleUnrelatedFrame() {
      const frameId = nextFrameId;
      nextFrameId += 1;
      frames.set(frameId, () => {
        unrelatedFrameCount += 1;
      });
    },
    setTime(value) {
      currentTime = value;
    }
  };
}

test("手动滚动取消 Active Maker 持续定位并允许其离开列表可视区", () => {
  const harness = createHarness();

  harness.persistence.request();
  harness.runNextFrame();
  assert.equal(harness.revealCount(), 1);
  assert.equal(harness.pendingFrameCount(), 1);

  harness.scheduleUnrelatedFrame();
  harness.persistence.cancel();
  harness.runNextFrame();

  assert.equal(harness.revealCount(), 1);
  assert.equal(harness.unrelatedFrameCount(), 1);
  assert.equal(harness.pendingFrameCount(), 0);
});

test("没有手动输入时保留点击后的短暂 Active Maker 定位", () => {
  const harness = createHarness();

  harness.persistence.request();
  harness.runNextFrame();
  harness.setTime(600);
  harness.runNextFrame();

  assert.equal(harness.revealCount(), 2);
  assert.equal(harness.pendingFrameCount(), 1);

  harness.setTime(1200);
  harness.runNextFrame();

  assert.equal(harness.revealCount(), 2);
  assert.equal(harness.pendingFrameCount(), 0);
});

test("路由重置会清理待执行的 Active Maker 定位帧", () => {
  const harness = createHarness();

  harness.persistence.request();
  harness.persistence.reset();
  harness.runNextFrame();

  assert.equal(harness.revealCount(), 0);
  assert.equal(harness.pendingFrameCount(), 0);
});

test("Active Maker 已失效时停止后续定位", () => {
  const harness = createHarness();

  harness.persistence.request();
  harness.setCanKeepVisible(false);
  harness.runNextFrame();

  assert.equal(harness.revealCount(), 1);
  assert.equal(harness.pendingFrameCount(), 0);
});
