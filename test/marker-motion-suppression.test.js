import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  createMarkerMotionSuppressor,
  createMarkerStreamingIndicator
} from "../src/marker-motion-suppression.js";

const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

function createFrameHarness() {
  const frames = [];
  return {
    frames,
    requestFrame(callback) {
      const frame = { callback, cancelled: false };
      frames.push(frame);
      return frame;
    },
    cancelFrame(frame) {
      frame.cancelled = true;
    },
    run(frame) {
      if (!frame.cancelled) {
        frame.callback();
      }
    }
  };
}

test("流式重绘立即抑制 Marker 动效并在两个绘制帧后恢复", () => {
  const frameHarness = createFrameHarness();
  const changes = [];
  const suppressor = createMarkerMotionSuppressor({
    setSuppressed: (isSuppressed) => changes.push(isSuppressed),
    requestFrame: frameHarness.requestFrame,
    cancelFrame: frameHarness.cancelFrame
  });

  suppressor.suppress();
  assert.deepEqual(changes, [true]);

  frameHarness.run(frameHarness.frames[0]);
  assert.deepEqual(changes, [true]);

  frameHarness.run(frameHarness.frames[1]);
  assert.deepEqual(changes, [true, false]);
});

test("连续流式重绘不会被旧绘制帧提前恢复动效", () => {
  const frameHarness = createFrameHarness();
  const changes = [];
  const suppressor = createMarkerMotionSuppressor({
    setSuppressed: (isSuppressed) => changes.push(isSuppressed),
    requestFrame: frameHarness.requestFrame,
    cancelFrame: frameHarness.cancelFrame
  });

  suppressor.suppress();
  frameHarness.run(frameHarness.frames[0]);
  suppressor.suppress();

  frameHarness.run(frameHarness.frames[1]);
  assert.deepEqual(changes, [true, true]);

  frameHarness.run(frameHarness.frames[2]);
  frameHarness.run(frameHarness.frames[3]);
  assert.deepEqual(changes, [true, true, false]);
});

test("重置会取消待执行帧并立即恢复 Marker 动效", () => {
  const frameHarness = createFrameHarness();
  const changes = [];
  const suppressor = createMarkerMotionSuppressor({
    setSuppressed: (isSuppressed) => changes.push(isSuppressed),
    requestFrame: frameHarness.requestFrame,
    cancelFrame: frameHarness.cancelFrame
  });

  suppressor.suppress();
  frameHarness.run(frameHarness.frames[0]);
  suppressor.reset();

  assert.deepEqual(changes, [true, false]);
  assert.equal(frameHarness.frames[1].cancelled, true);
  frameHarness.run(frameHarness.frames[1]);
  assert.deepEqual(changes, [true, false]);
});

test("流式抑制样式覆盖 Marker、分组、折叠卡片、浮层与箭头", () => {
  assert.match(
    styles,
    /is-marker-motion-suppressed \.gpt-paragraph-nav__marker,[\s\S]*?is-marker-motion-suppressed \.gpt-paragraph-nav__fold,[\s\S]*?is-marker-motion-suppressed \.gpt-paragraph-nav__label,[\s\S]*?is-marker-motion-suppressed \.gpt-paragraph-nav__user-chevron,[\s\S]*?is-marker-motion-suppressed \.gpt-paragraph-nav__fold-chevron \{\n  transition: none;\n\}/
  );
});

test("只有正在更新的 AI Maker 显示 loading，并在静默后停止", () => {
  const timers = [];
  const changes = [];
  const indicator = createMarkerStreamingIndicator({
    setActive: (marker, isActive) => changes.push([marker, isActive]),
    setTimer(callback, delay) {
      const timer = { callback, delay, cancelled: false };
      timers.push(timer);
      return timer;
    },
    clearTimer(timer) {
      timer.cancelled = true;
    }
  });
  const first = { id: "first" };
  const second = { id: "second" };

  indicator.pulse(first);
  indicator.pulse(second);

  assert.deepEqual(changes, [
    [first, true],
    [first, false],
    [second, true]
  ]);
  assert.equal(timers[0].cancelled, true);
  assert.equal(timers[1].delay, 900);

  timers[1].callback();
  assert.deepEqual(changes.at(-1), [second, false]);
});
