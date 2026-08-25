import test from "node:test";
import assert from "node:assert/strict";

import {
  tableMarkerEntries,
  tableMarkerScrollTop,
  tableMarkerTitleFromCells,
  scrollTableMarkerIntoView
} from "../src/table-marker.js";

test("以首行的 th 或 td 文本生成单个表格 maker 标题", () => {
  assert.equal(
    tableMarkerTitleFromCells(["状态", "产品形态", "核心价值"]),
    "状态 / 产品形态 / 核心价值"
  );
  assert.equal(
    tableMarkerTitleFromCells(["场景", "用户问题", "Camera Core", "云台", "移动"]),
    "场景 / 用户问题 / Camera Core / 云台 / 移动"
  );
});

test("忽略空单元格，拒绝单列、空白和过长表格标题", () => {
  assert.equal(tableMarkerTitleFromCells(["优先级", "", "验证目标"]), "优先级 / 验证目标");
  assert.equal(tableMarkerTitleFromCells(["只有一列"]), "");
  assert.equal(tableMarkerTitleFromCells(["", "  "]), "");
  assert.equal(tableMarkerTitleFromCells(["标题", "x".repeat(160)]), "");
});

test("去重重复表格并保留 assistant 容器提供的候选顺序", () => {
  const firstTable = {};
  const secondTable = {};
  const entries = tableMarkerEntries([
    { element: firstTable, cells: ["状态", "产品形态"] },
    { element: firstTable, cells: ["状态", "产品形态"] },
    { element: secondTable, cells: ["场景", "用户问题"] },
    { element: {}, cells: ["单列"] }
  ]);

  assert.deepEqual(entries, [
    { element: firstTable, title: "状态 / 产品形态" },
    { element: secondTable, title: "场景 / 用户问题" }
  ]);
});

test("按内部会话滚动容器、顶部栏与安全间距计算表格定位位置", () => {
  assert.equal(
    tableMarkerScrollTop({
      scrollTop: 600,
      targetTop: 420,
      scrollerTop: 100,
      headerHeight: 64,
      gap: 12
    }),
    844
  );
});

test("表格定位位置会钳制在滚动容器范围内", () => {
  assert.equal(
    tableMarkerScrollTop({
      scrollTop: 10,
      targetTop: 80,
      scrollerTop: 100,
      headerHeight: 64,
      gap: 12
    }),
    0
  );
  assert.equal(
    tableMarkerScrollTop({
      scrollTop: 900,
      targetTop: 600,
      scrollerTop: 0,
      headerHeight: 64,
      gap: 12,
      maxScrollTop: 1000
    }),
    1000
  );
});

test("缺少可用滚动容器坐标时返回回退信号", () => {
  assert.equal(tableMarkerScrollTop({}), null);
});

test("没有内部滚动容器时回退为表格自身的 scrollIntoView", () => {
  const calls = [];
  const table = {
    scrollIntoView: (options) => calls.push(options)
  };

  assert.equal(
    scrollTableMarkerIntoView({
      element: table,
      scrollContainer: null,
      headerHeight: 64,
      gap: 12,
      behavior: "smooth"
    }),
    true
  );
  assert.deepEqual(calls, [{ behavior: "smooth", block: "start" }]);
});

test("内部滚动容器会接收扣除顶部栏后的表格目标位置", () => {
  const tableCalls = [];
  const containerCalls = [];
  const table = {
    scrollIntoView: (options) => tableCalls.push(options),
    getBoundingClientRect: () => ({ top: 420 })
  };
  const scrollContainer = {
    scrollTop: 600,
    scrollHeight: 2000,
    clientHeight: 500,
    getBoundingClientRect: () => ({ top: 100 }),
    scrollTo: (options) => containerCalls.push(options)
  };

  assert.equal(
    scrollTableMarkerIntoView({
      element: table,
      scrollContainer,
      headerHeight: 64,
      gap: 12,
      behavior: "smooth"
    }),
    true
  );
  assert.deepEqual(containerCalls, [{ top: 844, behavior: "smooth" }]);
  assert.deepEqual(tableCalls, []);
});
