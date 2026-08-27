import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const contentSource = readFileSync(new URL("../src/content.js", import.meta.url), "utf8");
const renderStart = contentSource.indexOf("  function render(snapshot = null");
const renderEnd = contentSource.indexOf("  function scheduleRender(", renderStart);
const renderSource = contentSource.slice(renderStart, renderEnd);
const wheelStart = contentSource.indexOf("  function handleMarkerListWheel(");
const wheelEnd = contentSource.indexOf("  function isPrimaryPointer(", wheelStart);
const wheelSource = contentSource.slice(wheelStart, wheelEnd);
const pointerMoveStart = contentSource.indexOf("  function handlePointerMove(");
const pointerMoveEnd = contentSource.indexOf("  function finishPointerDrag(", pointerMoveStart);
const pointerMoveSource = contentSource.slice(pointerMoveStart, pointerMoveEnd);
const routeResetStart = contentSource.indexOf("  function resetRouteState(");
const routeResetEnd = contentSource.indexOf("  function removeNavigationRoot(", routeResetStart);
const routeResetSource = contentSource.slice(routeResetStart, routeResetEnd);

test("整体折叠期间缓存最新快照且跳过列表协调", () => {
  const stateUpdate = renderSource.indexOf("state.markerGroups = markerGroups;");
  const collapsedReturn = renderSource.indexOf("if (state.isCollapsed)");
  const reconciliation = renderSource.indexOf("markerListReconciler.reconcile(");

  assert.ok(stateUpdate >= 0);
  assert.ok(collapsedReturn > stateUpdate);
  assert.ok(reconciliation > collapsedReturn);
});

test("流式渲染不再清空列表或取消进行中的滚动", () => {
  assert.doesNotMatch(renderSource, /list\.textContent\s*=\s*["']{2}/);
  assert.doesNotMatch(renderSource, /stopMarkerListScrollAnimation/);
});

test("滚轮和触摸板命中 Maker 列表时让手动滚动接管", () => {
  const targetResolution = wheelSource.indexOf("markerListInteractionTarget(event)");
  const cancellation = wheelSource.indexOf("markerListScrollPersistence.cancel()");
  const nativeListReturn = wheelSource.indexOf("list.contains(event.target)");

  assert.ok(targetResolution >= 0);
  assert.ok(cancellation > targetResolution);
  assert.ok(nativeListReturn > cancellation);
});

test("外扩命中区取消自动定位后继续执行用户滚动动画", () => {
  const cancellation = wheelSource.indexOf("markerListScrollPersistence.cancel()");
  const preventDefault = wheelSource.indexOf("event.preventDefault()", cancellation);
  const targetUpdate = wheelSource.indexOf("state.markerListScrollTarget = nextScrollTop", cancellation);
  const animation = wheelSource.indexOf("animateMarkerListScroll(list)", cancellation);

  assert.ok(preventDefault > cancellation);
  assert.ok(targetUpdate > preventDefault);
  assert.ok(animation > targetUpdate);
  assert.doesNotMatch(wheelSource, /cancelAnimationFrame|markerListScrollAnimation\s*=\s*0/);
});

test("Maker 列表拖动超过阈值后让手动滚动接管", () => {
  assert.match(pointerMoveSource, /drag\.kind === "list"[\s\S]*markerListScrollPersistence\.cancel\(\)/);
});

test("流式快照和路由重置不会恢复已取消的 Active Maker 定位", () => {
  assert.doesNotMatch(renderSource, /markerListScrollPersistence\.request\(\)/);
  assert.match(routeResetSource, /markerListScrollPersistence\.reset\(\)/);
});
