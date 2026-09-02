import test from "node:test";
import assert from "node:assert/strict";

import { dedupeAdjacentTextHeadings } from "../src/adjacent-heading-deduplication.js";

function heading(key, scope, { level = 1, sourceType = "heading", title = "重复标题" } = {}) {
  return { key, level, scope, sourceType, title };
}

function dedupe(headings) {
  return dedupeAdjacentTextHeadings(headings, (item) => item.scope);
}

test("同一用户回复组内连续的相同 H1 只保留首个节点", () => {
  const group = {};
  const headings = [heading("first", group), heading("duplicate", group)];

  assert.deepEqual(dedupe(headings).map((item) => item.key), ["first"]);
});

test("七个平台的同一用户回复组均应用相邻标题去重", () => {
  ["chatgpt", "claude", "doubao", "kimi", "qianwen", "yuanbao", "xiaohongshu"].forEach((platform) => {
    const group = { platform };
    const headings = [heading(`${platform}-first`, group), heading(`${platform}-duplicate`, group)];

    assert.deepEqual(dedupe(headings).map((item) => item.key), [`${platform}-first`]);
  });
});

test("同一用户回复组中来自不同兄弟容器的重复 H1 仍会合并", () => {
  const group = {};
  const headings = [
    heading("streaming-copy", group),
    heading("merged-copy", group)
  ];

  assert.deepEqual(dedupe(headings).map((item) => item.key), ["streaming-copy"]);
});

test("不同用户回复组中的同名 H1 均保留", () => {
  const headings = [heading("first", {}), heading("second", {})];

  assert.deepEqual(dedupe(headings).map((item) => item.key), ["first", "second"]);
});

test("同标题的相邻 H1 和 H2 只保留首个节点", () => {
  const group = {};
  const headings = [
    heading("h1", group),
    heading("h2", group, { level: 2 })
  ];

  assert.deepEqual(dedupe(headings).map((item) => item.key), ["h1"]);
});

test("标题不同的相邻文本标题均保留", () => {
  const group = {};
  const headings = [
    heading("h1", group),
    heading("other-title", group, { level: 2, title: "另一个标题" })
  ];

  assert.deepEqual(dedupe(headings).map((item) => item.key), ["h1", "other-title"]);
});

test("被其他标题分隔的同名 H1 保留", () => {
  const group = {};
  const headings = [
    heading("first", group),
    heading("separator", group, { level: 2, title: "中间标题" }),
    heading("later", group)
  ];

  assert.deepEqual(dedupe(headings).map((item) => item.key), ["first", "separator", "later"]);
});

test("表格和视频 Maker 不参与去重", () => {
  const group = {};
  const headings = [
    heading("table-first", group, { sourceType: "table" }),
    heading("table-second", group, { sourceType: "table" }),
    heading("video-first", group, { sourceType: "video" }),
    heading("video-second", group, { sourceType: "video" })
  ];

  assert.deepEqual(dedupe(headings).map((item) => item.key), ["table-first", "table-second", "video-first", "video-second"]);
});
