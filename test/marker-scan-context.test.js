import test from "node:test";
import assert from "node:assert/strict";

import { createMarkerScanContext } from "../src/marker-scan-context.js";

test("同一轮 Maker 扫描只读取一次节点布局和可见性样式", () => {
  let rectReadCount = 0;
  let styleReadCount = 0;
  const element = {
    getBoundingClientRect() {
      rectReadCount += 1;
      return { top: 100, bottom: 160, width: 80, height: 60 };
    }
  };
  const context = createMarkerScanContext({
    getComputedStyle() {
      styleReadCount += 1;
      return { display: "block", visibility: "visible" };
    },
    scrollY: 20
  });

  assert.equal(context.isVisible(element), true);
  assert.equal(context.isVisible(element), true);
  assert.deepEqual(context.rectFor(element), { top: 100, bottom: 160, width: 80, height: 60 });
  assert.equal(context.topFor(element), 120);
  assert.equal(rectReadCount, 1);
  assert.equal(styleReadCount, 1);
});

test("display:contents message wrappers remain visible when a child has a box", () => {
  const child = {
    getBoundingClientRect() {
      return { top: 10, bottom: 30, width: 120, height: 20 };
    }
  };
  const hiddenChild = {
    getBoundingClientRect() {
      return { top: 0, bottom: 0, width: 0, height: 0 };
    }
  };
  const parent = {
    children: [child],
    getBoundingClientRect() {
      throw new Error("display:contents has no box");
    }
  };
  const emptyParent = {
    children: [hiddenChild],
    getBoundingClientRect() {
      throw new Error("display:contents has no box");
    }
  };
  const context = createMarkerScanContext({
    getComputedStyle(element) {
      if (element === parent || element === emptyParent) {
        return { display: "contents", visibility: "visible" };
      }
      return { display: "block", visibility: "visible" };
    }
  });

  assert.equal(context.isVisible(parent), true);
  assert.equal(context.isVisible(emptyParent), false);
});

test("display:contents message wrappers remain visible when text is a direct child", () => {
  const parent = {
    childNodes: [{ nodeType: 3, nodeValue: "Show this user message" }],
    getBoundingClientRect() {
      throw new Error("display:contents has no box");
    }
  };
  const emptyParent = {
    childNodes: [{ nodeType: 3, nodeValue: "   " }],
    getBoundingClientRect() {
      throw new Error("display:contents has no box");
    }
  };
  const context = createMarkerScanContext({
    getComputedStyle(element) {
      if (element === parent || element === emptyParent) {
        return { display: "contents", visibility: "visible" };
      }
      return { display: "block", visibility: "visible" };
    }
  });

  assert.equal(context.isVisible(parent), true);
  assert.equal(context.isVisible(emptyParent), false);
});
