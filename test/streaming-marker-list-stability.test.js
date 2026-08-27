import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const contentSource = readFileSync(new URL("../src/content.js", import.meta.url), "utf8");
const renderStart = contentSource.indexOf("  function render(snapshot = null");
const renderEnd = contentSource.indexOf("  function scheduleRender(", renderStart);
const renderSource = contentSource.slice(renderStart, renderEnd);

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
