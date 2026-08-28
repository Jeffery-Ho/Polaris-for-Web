import test from "node:test";
import assert from "node:assert/strict";

import { createRuntimeMarkerKeySequence } from "../src/runtime-marker-key-sequence.js";

test("路由或刷新作用域重置后临时 Marker 从 marker-1 重新开始", () => {
  const sequence = createRuntimeMarkerKeySequence();
  const firstElement = {};
  const secondElement = {};

  assert.equal(sequence.keyFor(firstElement), "marker-1");
  assert.equal(sequence.keyFor(firstElement), "marker-1");
  assert.equal(sequence.keyFor(secondElement), "marker-2");

  sequence.reset();
  assert.equal(sequence.keyFor(secondElement), "marker-1");
});
