import test from "node:test";
import assert from "node:assert/strict";
import {
  buildWindowChapterOutline,
  chapterSelectionIdentity,
  chapterParentPath,
  resolveSelectedChapterKey
} from "../src/window-chapter-outline.js";

test("父章节延伸到下一个同级标题并包含所有子项", () => {
  const outline = buildWindowChapterOutline([
    { markerKey: "diet", title: "减脂适合吃的食物", level: 1, containerKey: "reply-1" },
    { markerKey: "protein", title: "一、优质蛋白质", level: 2, containerKey: "reply-1" },
    { markerKey: "meat", title: "肉类", level: 3, containerKey: "reply-1" },
    { markerKey: "fish", title: "水产", level: 3, containerKey: "reply-1" },
    { markerKey: "staple", title: "二、主食", level: 2, containerKey: "reply-1" }
  ]);

  assert.deepEqual(outline.map(({ depth, parentKey, endIndex }) => ({ depth, parentKey, endIndex })), [
    { depth: 0, parentKey: "", endIndex: 5 },
    { depth: 1, parentKey: "diet", endIndex: 4 },
    { depth: 2, parentKey: "protein", endIndex: 3 },
    { depth: 2, parentKey: "protein", endIndex: 4 },
    { depth: 1, parentKey: "diet", endIndex: 5 }
  ]);
});

test("章节范围不会跨越另一条 AI 回复", () => {
  const outline = buildWindowChapterOutline([
    { markerKey: "first", title: "第一条回复", level: 1, containerKey: "reply-1" },
    { markerKey: "child", title: "子项", level: 2, containerKey: "reply-1" },
    { markerKey: "second", title: "第二条回复", level: 2, containerKey: "reply-2" }
  ]);

  assert.equal(outline[0].endIndex, 2);
  assert.equal(outline[1].endIndex, 2);
  assert.equal(outline[2].depth, 0);
  assert.equal(outline[2].parentKey, "");
});

test("跳级标题按实际父子关系生成稳定层级", () => {
  const outline = buildWindowChapterOutline([
    { markerKey: "root", title: "根章节", level: 1, containerKey: "reply" },
    { markerKey: "deep", title: "跳级子章节", level: 4, containerKey: "reply" },
    { markerKey: "peer", title: "同级章节", level: 4, containerKey: "reply" }
  ]);

  assert.deepEqual(outline.map(({ depth, parentKey }) => ({ depth, parentKey })), [
    { depth: 0, parentKey: "" },
    { depth: 1, parentKey: "root" },
    { depth: 1, parentKey: "root" }
  ]);
});

test("与标题同级的列表 Maker 仍作为该标题的子项", () => {
  const outline = buildWindowChapterOutline([
    { markerKey: "section", title: "二、AI 范式转移", level: 3, containerKey: "reply" },
    { markerKey: "agent", title: "硬件服务于智能体", level: 3, isListItem: true, containerKey: "reply" },
    { markerKey: "next", title: "三、供应链", level: 3, containerKey: "reply" }
  ]);

  assert.deepEqual(outline.map(({ depth, parentKey, endIndex }) => ({ depth, parentKey, endIndex })), [
    { depth: 0, parentKey: "", endIndex: 2 },
    { depth: 1, parentKey: "section", endIndex: 2 },
    { depth: 0, parentKey: "", endIndex: 3 }
  ]);
});

test("内容更新后按 markerKey 保持当前章节", () => {
  const chapters = [
    { markerKey: "new", title: "新增章节" },
    { markerKey: "kept", title: "当前章节" }
  ];
  assert.equal(resolveSelectedChapterKey(chapters, "kept"), "kept");
  assert.equal(resolveSelectedChapterKey(chapters, "removed"), "new");
});

test("跳转来源后 markerKey 变化时按标题和父级路径保持章节", () => {
  const before = [
    { markerKey: "root-old", parentKey: "", title: "二、市场分析" },
    { markerKey: "low-old", parentKey: "root-old", title: "低价" }
  ];
  const selection = chapterSelectionIdentity(before, before[1]);
  const after = [
    { markerKey: "root-new", parentKey: "", title: "二、市场分析" },
    { markerKey: "low-new", parentKey: "root-new", title: "低价" }
  ];

  assert.equal(resolveSelectedChapterKey(after, selection.markerKey, selection), "low-new");
});

test("重复章节标题用父级路径确定跳转前的选择", () => {
  const chapters = [
    { markerKey: "first-root", parentKey: "", title: "第一部分" },
    { markerKey: "first-item", parentKey: "first-root", title: "总结" },
    { markerKey: "second-root", parentKey: "", title: "第二部分" },
    { markerKey: "second-item", parentKey: "second-root", title: "总结" }
  ];

  assert.equal(resolveSelectedChapterKey(chapters, "missing", {
    title: "总结",
    parentPath: "第二部分"
  }), "second-item");
});

test("搜索子项时可以显示完整上级路径", () => {
  const chapters = [
    { markerKey: "root", parentKey: "", title: "减脂适合吃的食物" },
    { markerKey: "protein", parentKey: "root", title: "一、优质蛋白质" },
    { markerKey: "meat", parentKey: "protein", title: "肉类" }
  ];
  assert.equal(chapterParentPath(chapters, chapters[2]), "减脂适合吃的食物 / 一、优质蛋白质");
});
