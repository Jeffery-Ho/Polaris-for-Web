import test from "node:test";
import assert from "node:assert/strict";

import { createMarkerListNativeWheelHandler } from "../src/marker-list-native-scroll.js";

function createHarness(markerCount) {
  let cancelCount = 0;
  let preventDefaultCount = 0;
  let rectReadCount = 0;
  const card = { kind: "card" };
  const target = {
    closest() {
      return card;
    },
    getBoundingClientRect() {
      rectReadCount += 1;
      return {};
    }
  };
  const list = {
    markerCount,
    contains(candidate) {
      return candidate === card;
    },
    getBoundingClientRect() {
      rectReadCount += 1;
      return {};
    }
  };
  const handleWheel = createMarkerListNativeWheelHandler({
    list,
    cancelAutoPosition() {
      cancelCount += 1;
    }
  });

  return {
    event: {
      target,
      preventDefault() {
        preventDefaultCount += 1;
      }
    },
    handleWheel,
    result() {
      return { cancelCount, preventDefaultCount, rectReadCount };
    }
  };
}

test("Maker 卡片 wheel 使用原生滚动且开销不随列表长度增长", () => {
  [20, 100, 400, 800].forEach((markerCount) => {
    const harness = createHarness(markerCount);

    assert.equal(harness.handleWheel(harness.event), true);
    assert.deepEqual(harness.result(), {
      cancelCount: 1,
      preventDefaultCount: 0,
      rectReadCount: 0
    });
  });
});

test("非 Maker 卡片区域不接管 wheel", () => {
  const harness = createHarness(400);
  harness.event.target.closest = () => null;

  assert.equal(harness.handleWheel(harness.event), false);
  assert.deepEqual(harness.result(), {
    cancelCount: 0,
    preventDefaultCount: 0,
    rectReadCount: 0
  });
});
