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
