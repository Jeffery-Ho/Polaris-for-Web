import test from "node:test";
import assert from "node:assert/strict";

import {
  shouldShowUserMarkerNotLoadedNotice,
  syncLatestUserMarkerExpansion
} from "../src/user-marker-expansion.js";

function userGroup(key, headings = []) {
  return { key, user: { markerKey: key }, headings };
}

test("流式新增的最新用户分组未 ready 也默认展开且后续尊重手动折叠", () => {
  const expandedKeys = new Set();
  const seenKeys = new Set();

  let latestKey = syncLatestUserMarkerExpansion({
    groups: [userGroup("first"), userGroup("second", ["已有 Maker"])],
    expandedKeys,
    seenKeys
  });
  assert.equal(latestKey, "second");
  assert.deepEqual([...expandedKeys], ["second"]);
  assert.deepEqual([...seenKeys], ["first", "second"]);

  latestKey = syncLatestUserMarkerExpansion({
    groups: [userGroup("first"), userGroup("second"), userGroup("streaming")],
    expandedKeys,
    seenKeys
  });
  assert.equal(latestKey, "streaming");
  assert.deepEqual([...expandedKeys], ["second", "streaming"]);

  expandedKeys.delete("streaming");
  syncLatestUserMarkerExpansion({
    groups: [userGroup("first"), userGroup("second"), userGroup("streaming")],
    expandedKeys,
    seenKeys
  });
  assert.equal(expandedKeys.has("streaming"), false);

  syncLatestUserMarkerExpansion({
    groups: [userGroup("first"), userGroup("second")],
    expandedKeys,
    seenKeys
  });
  latestKey = syncLatestUserMarkerExpansion({
    groups: [userGroup("first"), userGroup("second"), userGroup("streaming")],
    expandedKeys,
    seenKeys
  });
  assert.equal(latestKey, "streaming");
  assert.equal(expandedKeys.has("streaming"), false);
});

test("历史空分组仅在没有 AI 消息时提示未加载", () => {
  assert.equal(shouldShowUserMarkerNotLoadedNotice({
    isChatGPT: true,
    hasAssistantMessage: false,
    groupKey: "latest",
    latestGroupKey: "latest"
  }), false);
  assert.equal(shouldShowUserMarkerNotLoadedNotice({
    isChatGPT: true,
    hasAssistantMessage: true,
    groupKey: "history",
    latestGroupKey: "latest"
  }), false);
  assert.equal(shouldShowUserMarkerNotLoadedNotice({
    isChatGPT: true,
    hasAssistantMessage: false,
    groupKey: "history",
    latestGroupKey: "latest"
  }), true);
  assert.equal(shouldShowUserMarkerNotLoadedNotice({
    isChatGPT: false,
    hasAssistantMessage: false,
    groupKey: "history",
    latestGroupKey: "latest"
  }), false);
});
