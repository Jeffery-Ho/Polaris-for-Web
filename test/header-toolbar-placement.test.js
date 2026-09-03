import test from "node:test";
import assert from "node:assert/strict";
import {
  CONTROL_PLACEMENTS,
  clampHeaderInsertIndex,
  headerInsertIndexForPointer,
  headerToolbarDropIndex,
  normalizeControlPlacement,
  normalizeHeaderInsertIndex
} from "../src/header-toolbar-placement.js";

test("Header 模式配置仅接受已支持的位置", () => {
  assert.equal(normalizeControlPlacement(CONTROL_PLACEMENTS.CHATGPT_HEADER), CONTROL_PLACEMENTS.CHATGPT_HEADER);
  assert.equal(normalizeControlPlacement("anything-else"), CONTROL_PLACEMENTS.FLOATING);
});

test("Header 插入序号会规范化并夹紧到现有动作间隙", () => {
  assert.equal(normalizeHeaderInsertIndex(-1), 0);
  assert.equal(normalizeHeaderInsertIndex("2.4"), 2);
  assert.equal(normalizeHeaderInsertIndex("invalid"), 0);
  assert.equal(clampHeaderInsertIndex(5, 3), 3);
});

test("指针位置按原生动作按钮中点映射为首端、中间与末端间隙", () => {
  const actions = [
    { left: 10, width: 20 },
    { left: 40, width: 20 },
    { left: 70, width: 20 }
  ];

  assert.equal(headerInsertIndexForPointer(actions, 12), 0);
  assert.equal(headerInsertIndexForPointer(actions, 45), 1);
  assert.equal(headerInsertIndexForPointer(actions, 88), 3);
});

test("拖动取消时恢复已保存间隙，完成时才采用当前落点", () => {
  const actions = [
    { left: 10, width: 20 },
    { left: 40, width: 20 },
    { left: 70, width: 20 }
  ];

  assert.equal(headerToolbarDropIndex({ actionRects: actions, clientX: 88, savedIndex: 1, wasCancelled: true }), 1);
  assert.equal(headerToolbarDropIndex({ actionRects: actions, clientX: 88, savedIndex: 1, wasCancelled: false }), 3);
});
