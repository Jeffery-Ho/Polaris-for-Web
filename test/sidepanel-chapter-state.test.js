import test from "node:test";
import assert from "node:assert/strict";
import { createChapterReaderState, updateChapterReader, enterChapter, searchChapterReader, chapterReaderVisibility, chapterTreeText } from "../src/sidepanel-chapter-state.js";
const nodes = [
  { markerKey: "a", parentKey: "", title: "甲", contents: [{ type: "block", text: "引言" }, { type: "child", key: "b" }] },
  { markerKey: "b", parentKey: "a", title: "子章", contents: [{ type: "block", text: "正文" }] },
  { markerKey: "c", parentKey: "", title: "乙", contents: [] }
];
test("initially expands selected path once, updates do not open new nodes", () => {
  const state = createChapterReaderState();
  updateChapterReader(state, nodes, "b");
  assert.deepEqual([...state.expanded], ["a", "b"]);
  state.expanded.delete("a");
  updateChapterReader(state, [...nodes, { markerKey: "d", parentKey: "", title: "新", contents: [] }], "c");
  assert.deepEqual([...state.expanded], ["b"]);
});
test("focus and return restore scope, expansion and reading position", () => {
  const state = createChapterReaderState(); updateChapterReader(state, nodes, "a");
  enterChapter(state, "b", 420);
  assert.equal(state.focus, "b"); assert.equal(state.scrollY, 0);
  enterChapter(state, "", 60);
  assert.equal(state.scrollY, 420); assert.deepEqual([...state.expanded], ["a"]);
});
test("search reveals ancestor path without mutating expansion and clearing restores scroll", () => {
  const state = createChapterReaderState(); updateChapterReader(state, nodes, "c");
  searchChapterReader(state, "子章", 300);
  const result = chapterReaderVisibility(state);
  assert.deepEqual([...result.visible], ["a", "b"]);
  assert.deepEqual([...result.ancestors], ["a"]);
  state.expanded.add("b"); searchChapterReader(state, "", 0);
  assert.deepEqual([...state.expanded], ["c"]); assert.equal(state.scrollY, 300);
});
test("search stays inside focus, deleting focused node falls back to existing ancestor and closes menu", () => {
  const state = createChapterReaderState(); updateChapterReader(state, nodes, "a");
  enterChapter(state, "b", 0); searchChapterReader(state, "乙", 0);
  assert.equal(chapterReaderVisibility(state).visible.size, 0);
  state.menu = "b"; updateChapterReader(state, nodes.filter((node) => node.markerKey !== "b"), "");
  assert.equal(state.focus, "a"); assert.equal(state.menu, "");
});
test("full copy ignores focus, search and expansion and visits child content only once", () => {
  assert.equal(chapterTreeText(nodes), "甲\n\n引言\n\n子章\n\n正文\n\n乙");
  assert.equal(chapterTreeText(nodes, "b"), "子章\n\n正文");
});
test("returning through a focused search result preserves the pre-search restoration snapshot", () => {
  const state = createChapterReaderState(); updateChapterReader(state, nodes, "a");
  searchChapterReader(state, "子章", 240); state.expanded.add("b");
  enterChapter(state, "b", 0); enterChapter(state, "", 0);
  assert.equal(state.query, "子章"); searchChapterReader(state, "", 0);
  assert.deepEqual([...state.expanded], ["a"]); assert.equal(state.scrollY, 240);
});
