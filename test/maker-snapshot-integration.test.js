import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const contentSource = readFileSync(new URL("../src/content.js", import.meta.url), "utf8");

function functionSource(name, nextName) {
  const start = contentSource.indexOf(`function ${name}(`);
  const end = contentSource.indexOf(`function ${nextName}(`, start);
  return contentSource.slice(start, end);
}

test("所有平台共用 MakerSnapshotModel 与平台 Adapter", () => {
  assert.match(contentSource, /createMakerPlatformAdapter/);
  assert.match(contentSource, /const makerSnapshotModel = createMakerSnapshotModel/);
  assert.doesNotMatch(contentSource, /chatGPTMakerSnapshotModel|chatGPTMakerSnapshotView/);
});

test("非 ChatGPT DOM 观察结果也进入统一 reconcile", () => {
  const collection = functionSource("collectMarkerGroups", "syncUserMarkerExpansion");
  assert.match(collection, /currentMakerPlatformAdapter\(\)/);
  assert.match(collection, /coverage: adapter\.coverage\(\)/);
  assert.match(collection, /authoritativeMessageKeys: null/);
  assert.match(collection, /makerSnapshotModel\.reconcile/);
  assert.match(collection, /allowDerived: true/);
  assert.match(collection, /sourceMessageAliases/);
});

test("ChatGPT 活跃分支以派生身份协调并把真实 ID 作为运行时别名", () => {
  const collection = functionSource("collectChatGPTMarkerGroups", "collectMarkerGroups");
  assert.match(collection, /createChatGPTSourceIdentityIndex/);
  assert.match(collection, /authoritativeMessageKeys: sourceIdentityIndex\.authoritativeMessageKeys/);
  assert.match(collection, /sourceMessageAliases: sourceIdentityIndex\.sourceMessageAliases/);
  assert.match(collection, /assignChatGPTAssistantIdentities/);
});

test("Maker DOM 映射与两秒恢复不再受 ChatGPT 平台限制", () => {
  const markerKey = functionSource("markerKeyForHeading", "nearestVerticalScrollContainer");
  const elementResolution = functionSource("currentElementForHeading", "jumpToHeading");
  const recovery = functionSource("jumpToHeadingWithRecovery", "scrollMarkerIntoListView");
  assert.match(markerKey, /heading\.makerKey/);
  assert.match(elementResolution, /makerSnapshotModel\.resolveElement/);
  assert.doesNotMatch(elementResolution, /isChatGPTPage/);
  assert.match(recovery, /recoverMakerElement/);
  assert.doesNotMatch(recovery, /isChatGPTPage/);
});

test("Chapter View 只为当前可解析 DOM 的 Maker 创建章节", () => {
  const chapters = functionSource("collectExplosionSections", "activeExplosionSectionIndexFromState");
  assert.match(chapters, /currentElementForHeading\(heading\)/);
  assert.match(chapters, /\.filter\(Boolean\)/);
});

test("路由打开统一平台 scope 并使用异步激活校验", () => {
  const open = functionSource("openCurrentMakerSnapshot", "handleRouteChange");
  assert.match(open, /currentMakerConversationScope\(\)/);
  assert.match(open, /makerSnapshotModel\.open\(conversationScope\)/);
  assert.match(open, /makerConversationScopesEqual/);
});
