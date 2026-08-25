import test from "node:test";
import assert from "node:assert/strict";

import { shouldStartMarkerListPointerDrag } from "../src/marker-list-drag.js";

test("Maker 按钮不会启动列表拖拽", () => {
  const marker = {};
  const target = { closest: (selector) => selector === ".gpt-paragraph-nav__marker" ? marker : null };

  assert.equal(shouldStartMarkerListPointerDrag(target), false);
});

test("列表空白区域仍可启动拖拽", () => {
  assert.equal(shouldStartMarkerListPointerDrag({ closest: () => null }), true);
  assert.equal(shouldStartMarkerListPointerDrag(null), true);
});
