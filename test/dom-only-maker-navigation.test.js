import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const contentSource = readFileSync(new URL("../src/content.js", import.meta.url), "utf8");
const routeBridgeSource = readFileSync(new URL("../src/route-bridge.js", import.meta.url), "utf8");

function functionSource(name, nextName) {
  const start = contentSource.indexOf(`function ${name}(`);
  const end = contentSource.indexOf(`function ${nextName}(`, start);
  return contentSource.slice(start, end);
}

test("路由切换立即清空旧列表，并等待宿主 DOM 变更后才扫描", () => {
  const routeChange = functionSource("handleRouteChange", "watchRouteChanges");
  const mutations = functionSource("handleDocumentMutations", "getSelectedHeading");
  const renderSnapshot = functionSource("collectMarkerRenderSnapshot", "render");

  assert.match(routeChange, /resetRouteState\(\)/);
  assert.match(routeChange, /state\.awaitingRouteDom = true/);
  assert.match(routeChange, /removeNavigationRoot\(\)/);
  assert.doesNotMatch(routeChange, /scheduleRender/);
  assert.match(contentSource, /function isPolarisOwnedMutationNode/);
  assert.match(contentSource, /changedNodes\.every\(isPolarisOwnedMutationNode\)/);
  assert.match(mutations, /state\.awaitingRouteDom = false/);
  assert.match(renderSnapshot, /if \(state\.awaitingRouteDom\)/);
});

test("Maker 分组只使用当前挂载 DOM，AI 标题跟随当前用户容器", () => {
  const collection = functionSource("collectMarkerGroups", "syncUserMarkerExpansion");

  assert.match(collection, /userContainers/);
  assert.match(collection, /assistantContainers/);
  assert.match(collection, /assistantToUser\.set\(entry\.element, currentUser\)/);
  assert.match(collection, /group\.headings\.push\(heading\)/);
  assert.doesNotMatch(collection, /snapshot|sourceMessageKey|conversation/);
});

test("未挂载目标只显示既有提示，不再尝试恢复滚动", () => {
  const target = functionSource("currentElementForHeading", "jumpToHeading");
  const click = functionSource("handleMarkerListClick", "displayedHeadingCount");

  assert.doesNotMatch(target, /resolveElement|recover/);
  assert.match(click, /jumpToHeading\(heading\)/);
  assert.match(click, /replyNotLoaded/);
  assert.doesNotMatch(contentSource, /recoverMakerElement|makerSnapshotModel|fetch\(.*conversation/);
});

test("路由桥只发布 SPA 路由变化，不读取 ChatGPT 会话 API", () => {
  assert.match(routeBridgeSource, /pushState/);
  assert.match(routeBridgeSource, /ROUTE_CHANGE_EVENT/);
  assert.doesNotMatch(routeBridgeSource, /backend-api\/conversation|window\.fetch|message/);
});
