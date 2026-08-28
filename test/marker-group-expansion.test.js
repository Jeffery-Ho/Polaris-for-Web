import test from "node:test";
import assert from "node:assert/strict";

import {
  shouldAutoExpandActiveFoldGroup,
  toggleFoldGroupExpansion
} from "../src/marker-group-expansion.js";

test("手动收起活动 Maker 所在折叠组后不会被自动重新展开", () => {
  const expandedKeys = new Set(["group:0"]);
  const manuallyCollapsedKeys = new Set();

  toggleFoldGroupExpansion({
    foldKey: "group:0",
    expandedKeys,
    manuallyCollapsedKeys
  });

  assert.equal(expandedKeys.has("group:0"), false);
  assert.equal(manuallyCollapsedKeys.has("group:0"), true);
  assert.equal(shouldAutoExpandActiveFoldGroup({
    foldKey: "group:0",
    isParentExpanded: true,
    manuallyCollapsedKeys
  }), false);
});

test("用户重新展开折叠组后解除手动收起状态", () => {
  const expandedKeys = new Set();
  const manuallyCollapsedKeys = new Set(["group:0"]);

  toggleFoldGroupExpansion({
    foldKey: "group:0",
    expandedKeys,
    manuallyCollapsedKeys
  });

  assert.equal(expandedKeys.has("group:0"), true);
  assert.equal(manuallyCollapsedKeys.has("group:0"), false);
  assert.equal(shouldAutoExpandActiveFoldGroup({
    foldKey: "group:0",
    isParentExpanded: true,
    manuallyCollapsedKeys
  }), true);
});

test("父用户分组已收起时不自动展开内部折叠组", () => {
  assert.equal(shouldAutoExpandActiveFoldGroup({
    foldKey: "group:0",
    isParentExpanded: false,
    manuallyCollapsedKeys: new Set()
  }), false);
});
