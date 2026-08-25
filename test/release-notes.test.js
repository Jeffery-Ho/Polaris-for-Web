import test from "node:test";
import assert from "node:assert/strict";

import { releaseNotesForUpdate } from "../src/release-notes.js";

test("首次安装展示最近三个版本的更新说明", () => {
  assert.deepEqual(
    releaseNotesForUpdate(null, "0.29.0").map((note) => note.version),
    ["0.28.5", "0.28.6", "0.29.0"]
  );
});

test("已读当前版本时不展示更新说明", () => {
  assert.deepEqual(releaseNotesForUpdate("0.29.0", "0.29.0"), []);
});

test("单次版本升级只展示遗漏版本的更新说明", () => {
  assert.deepEqual(
    releaseNotesForUpdate("0.28.5", "0.28.6").map((note) => note.version),
    ["0.28.6"]
  );
});

test("跨多个版本升级最多展示最近三个遗漏版本", () => {
  assert.deepEqual(
    releaseNotesForUpdate("0.28.4", "0.29.0").map((note) => note.version),
    ["0.28.5", "0.28.6", "0.29.0"]
  );
});

test("缺失当前版本说明时提供安全降级内容", () => {
  const note = releaseNotesForUpdate("0.29.0", "0.30.0")
    .find((candidate) => candidate.isFallback);
  assert.ok(note);
  assert.equal(note.version, "0.30.0");
  assert.equal(note.isFallback, true);
  assert.match(note.zh.title, /更新说明/);
});
