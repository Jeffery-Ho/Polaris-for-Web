import test from "node:test";
import assert from "node:assert/strict";

import { recoverMakerElement } from "../src/maker-jump-recovery.js";

function createScrollContainer() {
  const calls = [];
  return {
    calls,
    clientHeight: 200,
    scrollHeight: 1_200,
    scrollTop: 300,
    scrollTo(options) {
      calls.push(options);
      this.scrollTop = options.top;
    }
  };
}

test("按缓存比例滚动并在 DOM 重新映射后返回元素", async () => {
  const scrollContainer = createScrollContainer();
  const element = { isConnected: true };

  const result = await recoverMakerElement({
    makerKey: "maker-1",
    scrollContainer,
    scrollRatio: 0.5,
    resolveElement: () => element
  });

  assert.equal(result, element);
  assert.deepEqual(scrollContainer.calls, [{ top: 500, behavior: "auto" }]);
});

test("等待超时后恢复点击前的滚动位置", async () => {
  const scrollContainer = createScrollContainer();
  let timestamp = 0;

  const result = await recoverMakerElement({
    makerKey: "missing-maker",
    scrollContainer,
    scrollRatio: 0.8,
    resolveElement: () => null,
    now: () => {
      const value = timestamp;
      timestamp += 3_000;
      return value;
    },
    setTimer: (callback) => queueMicrotask(callback)
  });

  assert.equal(result, null);
  assert.deepEqual(scrollContainer.calls, [
    { top: 800, behavior: "auto" },
    { top: 300, behavior: "auto" }
  ]);
});
