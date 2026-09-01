import test from "node:test";
import assert from "node:assert/strict";

import {
  isFoldGroupExpanded,
  toggleFoldGroupExpansion
} from "../src/marker-group-expansion.js";

test("Maker 堆叠默认展开，手动收起后保持收起", () => {
  const collapsedKeys = new Set();

  toggleFoldGroupExpansion({
    foldKey: "group:0",
    collapsedKeys
  });

  assert.equal(isFoldGroupExpanded({ foldKey: "group:0", collapsedKeys }), false);
  assert.equal(collapsedKeys.has("group:0"), true);
});

test("用户重新展开 Maker 堆叠后解除手动收起状态", () => {
  const collapsedKeys = new Set(["group:0"]);

  toggleFoldGroupExpansion({
    foldKey: "group:0",
    collapsedKeys
  });

  assert.equal(isFoldGroupExpanded({ foldKey: "group:0", collapsedKeys }), true);
  assert.equal(collapsedKeys.has("group:0"), false);
});
