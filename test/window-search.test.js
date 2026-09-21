import test from "node:test";
import assert from "node:assert/strict";

import { matchesSearch, normalizeSearchText } from "../src/window-search.js";

test("搜索支持中文、标点和任意 Unicode 字符", () => {
  assert.equal(matchesSearch("重点考虑", "我会重点考虑 3 种硬件形态"), true);
  assert.equal(matchesSearch("AI 音箱", "这也解释了为什么我不建议做“Today AI 音箱”"), true);
  assert.equal(matchesSearch("Creator", "创业者 / Freelancer / Creator"), true);
  assert.equal(matchesSearch("🔍", "搜索 🔍"), true);
});

test("搜索匹配标题并保留 Unicode 子序列规则", () => {
  assert.equal(matchesSearch("硬件形态", "我会重点考虑 3 种硬件形态"), true);
  assert.equal(matchesSearch("重形", "我会重点考虑 3 种硬件形态"), true);
  assert.equal(matchesSearch("不存在", "标题"), false);
  assert.equal(matchesSearch("   ", "任意内容"), true);
});

test("搜索统一全角字符和大小写而不限制输入格式", () => {
  assert.equal(normalizeSearchText("ＡＩ"), "ai");
  assert.equal(matchesSearch("ＡＩ", "Today AI 音箱"), true);
  assert.equal(matchesSearch("标题。", "标题。"), true);
});
