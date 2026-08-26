import test from "node:test";
import assert from "node:assert/strict";

import { createMarkerRenderStateMachine } from "../src/marker-render-state-machine.js";

function createTimerHarness() {
  const timers = [];

  return {
    timers,
    setTimer(callback, delay) {
      const timer = { callback, delay, cancelled: false };
      timers.push(timer);
      return timer;
    },
    clearTimer(timer) {
      timer.cancelled = true;
    },
    run(timer) {
      if (!timer.cancelled) {
        timer.callback();
      }
    }
  };
}

test("未出现有效 Maker 时保持等待且不输出", () => {
  const timerHarness = createTimerHarness();
  const renderedSnapshots = [];
  const stateMachine = createMarkerRenderStateMachine({
    readSnapshot: () => ({ headings: [] }),
    hasStartPoint: (snapshot) => snapshot.headings.length > 0,
    renderSnapshot: (snapshot) => renderedSnapshots.push(snapshot),
    setTimer: timerHarness.setTimer,
    clearTimer: timerHarness.clearTimer
  });

  stateMachine.request();
  timerHarness.run(timerHarness.timers[0]);

  assert.deepEqual(renderedSnapshots, []);
});

test("连续变更不会推迟首个窗口且起点出现后立即输出最新内容", () => {
  const timerHarness = createTimerHarness();
  const renderedSnapshots = [];
  let snapshot = { headings: [] };
  const stateMachine = createMarkerRenderStateMachine({
    readSnapshot: () => snapshot,
    hasStartPoint: (current) => current.headings.length > 0,
    renderSnapshot: (current) => renderedSnapshots.push(current),
    setTimer: timerHarness.setTimer,
    clearTimer: timerHarness.clearTimer
  });

  stateMachine.request();
  stateMachine.request();
  snapshot = { headings: ["第一节"], body: "最新内容" };
  stateMachine.request();

  assert.equal(timerHarness.timers.length, 1);
  assert.equal(timerHarness.timers[0].delay, 120);
  timerHarness.run(timerHarness.timers[0]);
  assert.deepEqual(renderedSnapshots, [snapshot]);
});

test("渐进状态下每个窗口只输出一次并读取最新快照", () => {
  const timerHarness = createTimerHarness();
  const renderedSnapshots = [];
  let snapshot = { headings: ["第一节"], body: "起始" };
  const stateMachine = createMarkerRenderStateMachine({
    readSnapshot: () => snapshot,
    hasStartPoint: (current) => current.headings.length > 0,
    renderSnapshot: (current) => renderedSnapshots.push(current),
    setTimer: timerHarness.setTimer,
    clearTimer: timerHarness.clearTimer
  });

  stateMachine.request();
  timerHarness.run(timerHarness.timers[0]);

  snapshot = { headings: ["第一节", "第二节"], body: "中间内容" };
  stateMachine.request();
  snapshot = { headings: ["第一节", "第二节"], body: "窗口内最新内容" };
  stateMachine.request();

  assert.equal(timerHarness.timers.length, 2);
  timerHarness.run(timerHarness.timers[1]);
  assert.deepEqual(renderedSnapshots, [
    { headings: ["第一节"], body: "起始" },
    snapshot
  ]);
});

test("重置会取消待执行任务并重新等待起点", () => {
  const timerHarness = createTimerHarness();
  const renderedSnapshots = [];
  let snapshot = { headings: ["旧路由标题"] };
  const stateMachine = createMarkerRenderStateMachine({
    readSnapshot: () => snapshot,
    hasStartPoint: (current) => current.headings.length > 0,
    renderSnapshot: (current) => renderedSnapshots.push(current),
    setTimer: timerHarness.setTimer,
    clearTimer: timerHarness.clearTimer
  });

  stateMachine.request();
  stateMachine.reset();
  timerHarness.run(timerHarness.timers[0]);

  snapshot = { headings: [] };
  stateMachine.request();
  timerHarness.run(timerHarness.timers[1]);

  snapshot = { headings: ["新路由标题"] };
  stateMachine.request();
  timerHarness.run(timerHarness.timers[2]);

  assert.deepEqual(renderedSnapshots, [{ headings: ["新路由标题"] }]);
});
