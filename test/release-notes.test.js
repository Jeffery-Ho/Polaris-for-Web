import test from "node:test";
import assert from "node:assert/strict";

import { isFeatureVersion, releaseNotesForUpdate } from "../src/release-notes.js";

test("只接受精确的 x.y.0 功能版本", () => {
  assert.equal(isFeatureVersion("0.29.0"), true);
  assert.equal(isFeatureVersion("0.29.0.1"), false);
  assert.equal(isFeatureVersion("0.xx.0"), false);
});

test("首次安装只展示当前功能版本的更新说明", () => {
  assert.deepEqual(
    releaseNotesForUpdate(null, "0.29.3").map((note) => note.version),
    ["0.29"]
  );
});

test("补丁版本更新不会单独展示更新说明", () => {
  assert.deepEqual(releaseNotesForUpdate("0.29.2", "0.29.3"), []);
});

test("跨功能版本升级只展示新的 0.xx 说明", () => {
  assert.deepEqual(
    releaseNotesForUpdate("0.28.6", "0.29.3").map((note) => note.version),
    ["0.29"]
  );
});

test("跨多个功能版本升级仅展示当前已内置的说明", () => {
  assert.deepEqual(
    releaseNotesForUpdate("0.26.13", "0.29.3").map((note) => note.version),
    ["0.29"]
  );
});

test("内置功能版本按倒序展示", () => {
  assert.deepEqual(
    releaseNotesForUpdate("0.28.9", "0.30.0").map((note) => note.version),
    ["0.30", "0.29"]
  );
});

test("章节 Markdown 功能版本提供内置更新说明", () => {
  const note = releaseNotesForUpdate("0.30.1", "0.31.0")[0];
  assert.equal(note.version, "0.31");
  assert.equal(note.isFallback, undefined);
  assert.match(note.zh.changes[0], /任务列表/);
});

test("章节空内容跳转功能提供内置更新说明", () => {
  const note = releaseNotesForUpdate("0.31.0", "0.32.0")[0];
  assert.equal(note.version, "0.32");
  assert.equal(note.isFallback, undefined);
  assert.match(note.zh.changes[0], /跳转/);
});

test("原始 Markdown 表格功能提供内置更新说明", () => {
  const note = releaseNotesForUpdate("0.32.0", "0.33.0")[0];
  assert.equal(note.version, "0.33");
  assert.equal(note.isFallback, undefined);
  assert.match(note.zh.changes[0], /表格/);
});

test("混排 Markdown 与特殊字符功能提供内置更新说明", () => {
  const note = releaseNotesForUpdate("0.33.1", "0.34.0")[0];
  assert.equal(note.version, "0.34");
  assert.equal(note.isFallback, undefined);
  assert.match(note.zh.changes[0], /特殊字符/);
});

test("全平台表格 Maker 功能提供内置更新说明", () => {
  const note = releaseNotesForUpdate("0.34.0", "0.35.0")[0];
  assert.equal(note.version, "0.35");
  assert.equal(note.isFallback, undefined);
  assert.match(note.zh.changes[0], /表格/);
});

test("Maker 流式渐进渲染功能提供内置更新说明", () => {
  const note = releaseNotesForUpdate("0.35.8", "0.36.0")[0];
  assert.equal(note.version, "0.36");
  assert.equal(note.isFallback, undefined);
  assert.match(note.zh.changes[0], /流式输出/);
});

test("Maker 列表流式稳定化功能提供内置更新说明", () => {
  const note = releaseNotesForUpdate("0.36.6", "0.37.0")[0];
  assert.equal(note.version, "0.37");
  assert.equal(note.isFallback, undefined);
  assert.match(note.zh.changes[0], /滚动/);
  assert.match(note.zh.changes[0], /折叠/);
});

test("赞赏页功能提供内置更新说明", () => {
  const note = releaseNotesForUpdate("0.37.6", "0.38.0")[0];
  assert.equal(note.version, "0.38");
  assert.match(note.zh.changes[0], /赞赏页/);
});

test("设置面板 Header 赞赏入口提供内置更新说明", () => {
  const note = releaseNotesForUpdate("0.38.8", "0.39.0")[0];
  assert.equal(note.version, "0.39");
  assert.match(note.zh.changes[0], /心形入口/);
  assert.match(note.zh.changes[0], /设置面板 Header/);
});

test("可选赞赏页分析提供内置更新说明", () => {
  const note = releaseNotesForUpdate("0.39.1", "0.40.0")[0];
  assert.equal(note.version, "0.40");
  assert.match(note.zh.changes[0], /同意分析/);
  assert.match(note.en.changes[0], /allow analytics/);
});

test("Maker 分组默认展开提供内置更新说明", () => {
  const note = releaseNotesForUpdate("0.43.3", "0.44.0")[0];
  assert.equal(note.version, "0.44");
  assert.equal(note.isFallback, undefined);
  assert.match(note.zh.changes[0], /默认展开/);
  assert.match(note.en.changes[0], /expanded by default/);
});

test("Claude.ai 支持提供内置更新说明", () => {
  const note = releaseNotesForUpdate("0.44.4", "0.45.0")[0];
  assert.equal(note.version, "0.45");
  assert.equal(note.isFallback, undefined);
  assert.match(note.zh.changes[0], /Claude\.ai/);
  assert.match(note.en.changes[0], /Claude\.ai/);
});

test("加粗文本筛选提供内置更新说明", () => {
  const note = releaseNotesForUpdate("0.45.0", "0.46.0")[0];
  assert.equal(note.version, "0.46");
  assert.equal(note.isFallback, undefined);
  assert.match(note.zh.changes[0], /加粗文本/);
  assert.match(note.en.changes[0], /Bold text/);
});

test("缺失当前功能版本说明时按 0.xx 粒度安全降级", () => {
  const note = releaseNotesForUpdate("0.46.0", "0.47.2")
    .find((candidate) => candidate.isFallback);
  assert.ok(note);
  assert.equal(note.version, "0.47");
  assert.equal(note.isFallback, true);
  assert.match(note.zh.title, /更新说明/);
});
