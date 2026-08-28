import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const contentSource = readFileSync(new URL("../src/content.js", import.meta.url), "utf8");

function functionSource(name, nextName) {
  const start = contentSource.indexOf(`function ${name}(`);
  const end = contentSource.indexOf(`function ${nextName}(`, start);
  return contentSource.slice(start, end);
}

test("Maker 列表始终把主动历史获取卡片放在本地更早分组之前", () => {
  const renderItems = functionSource("markerRenderItems", "collectMarkerRenderSnapshot");
  assert.match(renderItems, /historicalMakerRenderItem/);
  assert.match(renderItems, /const items = \[historicalMakerRenderItem\(\)\]/);
  assert.match(renderItems, /earlierUserGroupsRenderItem/);
});

test("历史卡片在扫描中只执行取消，其他状态启动扫描", () => {
  const click = functionSource("handleMarkerListClick", "displayedHeadingCount");
  assert.match(click, /marker\.dataset\.markerItemType === "history"/);
  assert.match(click, /historicalMakerLoader\.cancel/);
  assert.match(click, /startHistoricalMakerScan/);
  assert.match(click, /isHistoricalMakerInteractionLocked/);
});

test("ChatGPT 完整分支失败标记在非完成状态下仍会显示", () => {
  const item = functionSource("historicalMakerRenderItem", "createMarkerRenderRow");
  assert.match(item, /scan\.partial && scan\.status !== "complete"/);
  assert.match(item, /history\.partialIndicator/);
});

test("路由重置取消旧扫描并使旧作用域回调失效", () => {
  const reset = functionSource("resetRouteState", "removeNavigationRoot");
  const cancel = functionSource("cancelHistoricalMakerScan", "cacheExtensionMetadata");
  assert.match(reset, /cancelHistoricalMakerScan\("route", \{ reset: true \}\)/);
  assert.match(cancel, /historicalMakerActivationToken \+= 1/);
  assert.match(cancel, /historicalMakerLoader\.cancel\(reason\)/);
});

test("扩展上下文失效时也会取消扫描并解除会话交互锁", () => {
  const dispose = functionSource("disposeInvalidExtensionContext", "getRoot");
  const release = functionSource("releaseHistoricalMakerInteraction", "cancelHistoricalMakerScan");
  assert.match(dispose, /cancelHistoricalMakerScan\("dispose"\)/);
  assert.match(release, /unlockHistoricalMakerInteraction/);
  assert.match(release, /historicalMakerInteractionLocked = false/);
});

test("ChatGPT 扫描先等待完整分支，其他平台直接进行 DOM 扫描", () => {
  const source = functionSource("createHistoricalMakerSource", "startHistoricalMakerScan");
  assert.match(source, /isChatGPTPage\(\)/);
  assert.match(source, /requestImmediateChatGPTConversationRefresh/);
  assert.match(source, /scrollEarlier/);
  assert.match(source, /waitForChange/);
});

test("扫描步进等待最后一次宿主 DOM 变化稳定 250ms", () => {
  const wait = functionSource("waitForHistoricalMakerChange", "postponeHistoricalMakerSettledWait");
  const postpone = functionSource("postponeHistoricalMakerSettledWait", "createHistoricalMakerSource");
  const mutations = functionSource("handleDocumentMutations", "getSelectedHeading");
  assert.match(wait, /HISTORICAL_MAKER_SETTLE_MS/);
  assert.match(postpone, /clearTimeout/);
  assert.match(postpone, /HISTORICAL_MAKER_SETTLE_MS/);
  assert.match(mutations, /postponeHistoricalMakerSettledWait/);
});

test("扫描期间锁定正文和 Maker 导航但保留历史卡片取消操作", () => {
  const interaction = functionSource("handleHistoricalMakerInteraction", "suppressNextClick");
  const keyboard = functionSource("handleKeydown", "handleDocumentClick");
  const search = functionSource("getMarkerSearchInput", "getFloatingActive");
  const tabs = functionSource("syncControlTabs", "activateControlTab");
  assert.match(interaction, /isHistoricalMakerCancelTarget/);
  assert.match(interaction, /event\.preventDefault\(\)/);
  assert.match(interaction, /event\.stopImmediatePropagation\(\)/);
  assert.match(search, /input\.disabled = isHistoricalMakerInteractionLocked\(\)/);
  assert.match(tabs, /tab\.disabled = isHistoricalMakerInteractionLocked\(\)/);
  assert.match(keyboard, /isInsideConversation/);
  assert.match(keyboard, /!isInteractiveTarget/);
  assert.match(keyboard, /isHistoricalMakerCancelTarget\(event\.target\)/);
});

test("扫描完成后先校验作用域，再恢复阅读位置并释放交互锁", () => {
  const start = functionSource("startHistoricalMakerScan", "jumpToHeadingWithRecovery");
  const scopeCheck = start.indexOf("routeKey !== currentRouteKey()");
  const restore = start.indexOf("restoreHistoricalScrollPosition");
  const unlock = start.indexOf("releaseHistoricalMakerInteraction");
  assert.ok(scopeCheck >= 0 && scopeCheck < restore);
  assert.ok(restore >= 0 && restore < unlock);
  assert.match(start, /finally/);
});
