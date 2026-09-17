import test from "node:test";
import assert from "node:assert/strict";

import { nextControlTabIndex } from "../src/control-tab-keyboard.js";
import { readFileSync } from "node:fs";

const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

test("主导航 Tab 的默认最小宽度以英文文案为基准", () => {
  assert.match(
    styles,
    /\.gpt-paragraph-nav__control-tab\[data-control-tab="navigation"\] \{\n  min-width: 116px;\n\}/
  );
  assert.match(
    styles,
    /\.gpt-paragraph-nav__control-tab\[data-control-tab="chapters"\] \{\n  min-width: 76px;\n\}/
  );
  assert.match(
    styles,
    /\.gpt-paragraph-nav__control-tab\[data-control-tab="settings"\] \{\n  min-width: 116px;\n\}/
  );
});

test("章节弹窗打开时屏蔽底层主 Tab 键盘导航", () => {
  for (const key of ["ArrowLeft", "ArrowRight", "Home", "End"]) {
    assert.equal(nextControlTabIndex({
      key,
      currentIndex: 1,
      tabCount: 3,
      isChapterModalOpen: true
    }), null);
  }
});

test("章节弹窗关闭时保留主 Tab 的循环与首尾键盘导航", () => {
  const nextIndexFor = (key, currentIndex) => nextControlTabIndex({
    key,
    currentIndex,
    tabCount: 3,
    isChapterModalOpen: false
  });

  assert.equal(nextIndexFor("ArrowRight", 2), 0);
  assert.equal(nextIndexFor("ArrowLeft", 0), 2);
  assert.equal(nextIndexFor("Home", 1), 0);
  assert.equal(nextIndexFor("End", 1), 2);
});

test("无关按键不触发主 Tab 导航", () => {
  assert.equal(nextControlTabIndex({
    key: "Enter",
    currentIndex: 1,
    tabCount: 3,
    isChapterModalOpen: false
  }), null);
});
