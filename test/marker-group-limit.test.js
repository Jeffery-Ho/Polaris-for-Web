import test from "node:test";
import assert from "node:assert/strict";

import { limitMarkerGroups } from "../src/marker-group-limit.js";

function groups(count) {
  return Array.from({ length: count }, (_, index) => ({
    key: `group-${index}`,
    user: { markerKey: `group-${index}` },
    headings: []
  }));
}

[21, 25, 80].forEach((count) => {
  test(`${count} 个恢复分组默认保留 20 组并显示更早问题数量`, () => {
    const limited = limitMarkerGroups({
      groups: groups(count),
      maxVisibleUserGroups: 20,
      areEarlierUserGroupsExpanded: false,
      hasSearchQuery: false
    });

    assert.equal(limited.groups.length, 20);
    assert.equal(limited.groups[0].key, `group-${count - 20}`);
    assert.equal(limited.earlierUserGroupCount, count - 20);
  });
});

test("展开更早问题后显示全部恢复分组，搜索时也不裁剪", () => {
  const restoredGroups = groups(25);
  assert.equal(limitMarkerGroups({
    groups: restoredGroups,
    maxVisibleUserGroups: 20,
    areEarlierUserGroupsExpanded: true,
    hasSearchQuery: false
  }).groups.length, 25);
  assert.deepEqual(limitMarkerGroups({
    groups: restoredGroups,
    maxVisibleUserGroups: 20,
    areEarlierUserGroupsExpanded: false,
    hasSearchQuery: true
  }), {
    groups: restoredGroups,
    earlierUserGroupCount: 0
  });
});
