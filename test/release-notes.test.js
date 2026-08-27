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

test("缺失当前功能版本说明时按 0.xx 粒度安全降级", () => {
  const note = releaseNotesForUpdate("0.38.0", "0.39.2")
    .find((candidate) => candidate.isFallback);
  assert.ok(note);
  assert.equal(note.version, "0.39");
  assert.equal(note.isFallback, true);
  assert.match(note.zh.title, /更新说明/);
});
