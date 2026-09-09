import test from "node:test";
import assert from "node:assert/strict";

import { pointerCaptureTargetForEvent } from "../src/pointer-capture-target.js";

test("主导航按钮按下时保留交互元素作为指针捕获目标，确保 click 仍能触发按钮", () => {
  const capsule = {
    contains(element) {
      return element === button;
    }
  };
  const button = {
    closest(selector) {
      assert.equal(selector, "button, a, [role=\"button\"]");
      return button;
    }
  };

  assert.equal(pointerCaptureTargetForEvent({ target: button, capsule }), button);
});

test("点击胶囊空白区域时仍捕获到胶囊本身", () => {
  const capsule = {
    contains() {
      return false;
    }
  };
  const blank = {
    closest() {
      return null;
    }
  };

  assert.equal(pointerCaptureTargetForEvent({ target: blank, capsule }), capsule);
});
