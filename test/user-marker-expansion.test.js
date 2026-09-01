import test from "node:test";
import assert from "node:assert/strict";

import {
  isUserMarkerExpanded,
  latestUserMarkerKey,
  shouldShowUserMarkerNotLoadedNotice
} from "../src/user-marker-expansion.js";

function userGroup(key, headings = [], hasAssistantMessage = false) {
  return { key, user: { markerKey: key }, headings, hasAssistantMessage };
}

test("最新组、上一组和流式新增组默认展开", () => {
  const collapsedKeys = new Set();
  const isExpanded = (groupKey) => isUserMarkerExpanded({
    groupKey,
    hasUser: true,
    isSearchActive: false,
    collapsedKeys
  });
  assert.equal(latestUserMarkerKey([
    userGroup("first"),
    userGroup("previous", ["已有 Maker"], true),
    userGroup("latest")
  ]), "latest");
  assert.equal(isExpanded("previous"), true);
  assert.equal(isExpanded("latest"), true);

  assert.equal(latestUserMarkerKey([
    userGroup("first"),
    userGroup("previous", ["已有 Maker"], true),
    userGroup("latest"),
    userGroup("streaming")
  ]), "streaming");
  assert.equal(isExpanded("streaming"), true);
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

test("历史分组已有 Maker 时即使消息元数据滞后也允许折叠", () => {
  assert.equal(shouldShowUserMarkerNotLoadedNotice({
    isChatGPT: true,
    hasAssistantMessage: false,
    hasMarkers: true,
    groupKey: "previous",
    latestGroupKey: "streaming"
  }), false);
});

test("没有用户分组时不存在最新分组 key", () => {
  assert.equal(latestUserMarkerKey([]), "");
});

test("用户分组默认展开，手动收起在搜索外保持生效", () => {
  const collapsedKeys = new Set(["manual"]);
  assert.equal(isUserMarkerExpanded({
    groupKey: "latest",
    hasUser: true,
    isSearchActive: false,
    collapsedKeys
  }), true);
  assert.equal(isUserMarkerExpanded({
    groupKey: "manual",
    hasUser: true,
    isSearchActive: false,
    collapsedKeys
  }), false);
  assert.equal(isUserMarkerExpanded({
    groupKey: "manual",
    hasUser: true,
    isSearchActive: true,
    collapsedKeys
  }), true);
});
