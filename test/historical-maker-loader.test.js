import test from "node:test";
import assert from "node:assert/strict";

import { createHistoricalMakerLoader } from "../src/historical-maker-loader.js";

function createSource(frames, { onPrepare = async () => {}, advanceTime = () => {} } = {}) {
  let index = 0;
  return {
    async prepare({ signal }) {
      await onPrepare(signal);
    },
    measure() {
      return { ...frames[index] };
    },
    scrollEarlier() {
      index = Math.min(index + 1, frames.length - 1);
    },
    async waitForChange({ signal }) {
      if (signal.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      advanceTime();
    }
  };
}

test("滚动到历史起点并连续三轮无新增后完成", async () => {
  let timestamp = 0;
  const progress = [];
  const loader = createHistoricalMakerLoader({ now: () => timestamp });
  const result = await loader.start({
    scope: { platformKey: "kimi", conversationKey: "conversation" },
    source: createSource([
      { scrollTop: 1_000, scrollHeight: 2_000, clientHeight: 500, groupCount: 2, makerCount: 4 },
      { scrollTop: 200, scrollHeight: 2_400, clientHeight: 500, groupCount: 3, makerCount: 7 },
      { scrollTop: 0, scrollHeight: 2_800, clientHeight: 500, groupCount: 4, makerCount: 9 }
    ], { advanceTime: () => { timestamp += 250; } }),
    timeoutMs: 10_000,
    onProgress: (state) => progress.push(state)
  });

  assert.deepEqual(result, {
    status: "complete",
    addedGroups: 2,
    addedMakers: 5,
    reachedStart: true,
    partial: false
  });
  assert.equal(progress.at(-1).status, "complete");
  assert.deepEqual(loader.current(), result);
});

test("达到十秒上限时保留已获取结果并允许后续继续", async () => {
  let timestamp = 0;
  const loader = createHistoricalMakerLoader({ now: () => timestamp });
  const result = await loader.start({
    scope: { platformKey: "doubao", conversationKey: "conversation" },
    source: createSource([
      { scrollTop: 1_600, scrollHeight: 3_000, clientHeight: 500, groupCount: 10, makerCount: 20 },
      { scrollTop: 1_200, scrollHeight: 3_400, clientHeight: 500, groupCount: 12, makerCount: 24 },
      { scrollTop: 800, scrollHeight: 3_800, clientHeight: 500, groupCount: 13, makerCount: 27 },
      { scrollTop: 400, scrollHeight: 4_200, clientHeight: 500, groupCount: 14, makerCount: 30 }
    ], { advanceTime: () => { timestamp += 4_000; } }),
    timeoutMs: 10_000
  });

  assert.deepEqual(result, {
    status: "timeout",
    addedGroups: 4,
    addedMakers: 10,
    reachedStart: false,
    partial: false
  });
});

test("主动取消会结束扫描并保留取消前的新增计数", async () => {
  const loader = createHistoricalMakerLoader({ now: () => 0 });
  const source = createSource([
    { scrollTop: 800, scrollHeight: 2_000, clientHeight: 500, groupCount: 2, makerCount: 3 },
    { scrollTop: 400, scrollHeight: 2_400, clientHeight: 500, groupCount: 4, makerCount: 8 }
  ]);

  const result = await loader.start({
    scope: { platformKey: "yuanbao", conversationKey: "conversation" },
    source,
    timeoutMs: 10_000,
    onProgress(state) {
      if (state.addedGroups === 2) {
        loader.cancel();
      }
    }
  });

  assert.deepEqual(result, {
    status: "cancelled",
    addedGroups: 2,
    addedMakers: 5,
    reachedStart: false,
    partial: false
  });
});

test("滚动位置和内容连续三轮无法推进时报告停滞", async () => {
  const loader = createHistoricalMakerLoader({ now: () => 0 });
  const result = await loader.start({
    scope: { platformKey: "xiaohongshu", conversationKey: "conversation" },
    source: createSource([
      { scrollTop: 600, scrollHeight: 2_000, clientHeight: 500, groupCount: 5, makerCount: 10 }
    ]),
    timeoutMs: 10_000
  });

  assert.equal(result.status, "stalled");
  assert.equal(result.reachedStart, false);
});

test("ChatGPT 历史准备失败后继续 DOM 扫描并标记部分结果", async () => {
  const loader = createHistoricalMakerLoader({ now: () => 0 });
  const result = await loader.start({
    scope: { platformKey: "chatgpt", conversationKey: "conversation" },
    source: createSource([
      { scrollTop: 0, scrollHeight: 2_000, clientHeight: 500, groupCount: 1, makerCount: 1 }
    ], {
      onPrepare: async () => { throw new Error("Conversation request failed"); }
    }),
    timeoutMs: 10_000
  });

  assert.equal(result.status, "complete");
  assert.equal(result.partial, true);
});

test("无法测量会话滚动容器时返回 unavailable", async () => {
  const loader = createHistoricalMakerLoader({ now: () => 0 });
  const result = await loader.start({
    scope: { platformKey: "qianwen", conversationKey: "conversation" },
    source: {
      measure() { throw new Error("missing scroll container"); },
      async prepare() {},
      scrollEarlier() {},
      async waitForChange() {}
    }
  });

  assert.equal(result.status, "unavailable");
});

test("历史准备请求悬挂时也会在十秒上限终止", async () => {
  let fireTimeout = null;
  const loader = createHistoricalMakerLoader({
    now: () => 0,
    setTimer(callback) {
      fireTimeout = callback;
      return 1;
    },
    clearTimer() {}
  });
  const pending = loader.start({
    scope: { platformKey: "chatgpt", conversationKey: "conversation" },
    source: {
      measure() {
        return { scrollTop: 500, scrollHeight: 2_000, clientHeight: 500, groupCount: 4, makerCount: 8 };
      },
      prepare({ signal }) {
        return new Promise((resolve, reject) => {
          signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
        });
      },
      scrollEarlier() {},
      async waitForChange() {}
    },
    timeoutMs: 10_000
  });
  await Promise.resolve();
  fireTimeout();

  assert.equal((await pending).status, "timeout");
});

test("新会话作用域会终止旧扫描且旧进度不能覆盖新会话", async () => {
  const loader = createHistoricalMakerLoader({ now: () => 0 });
  const oldProgress = [];
  const oldRun = loader.start({
    scope: { platformKey: "chatgpt", conversationKey: "old", persistence: true },
    source: {
      measure() {
        return { scrollTop: 500, scrollHeight: 2_000, clientHeight: 500, groupCount: 2, makerCount: 4 };
      },
      async prepare() {},
      scrollEarlier() {},
      waitForChange({ signal }) {
        return new Promise((resolve, reject) => {
          signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
        });
      }
    },
    onProgress: (progress) => oldProgress.push(progress)
  });
  await Promise.resolve();

  const newRun = loader.start({
    scope: { platformKey: "chatgpt", conversationKey: "new", persistence: true },
    source: createSource([
      { scrollTop: 0, scrollHeight: 1_000, clientHeight: 500, groupCount: 1, makerCount: 2 }
    ])
  });

  assert.equal((await oldRun).status, "cancelled");
  assert.equal((await newRun).status, "complete");
  assert.equal(loader.current().status, "complete");
  assert.equal(oldProgress.at(-1).status, "loading");
});
