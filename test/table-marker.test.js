import test from "node:test";
import assert from "node:assert/strict";

import { tableMarkerEntries, tableMarkerTitleFromCells } from "../src/table-marker.js";

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
