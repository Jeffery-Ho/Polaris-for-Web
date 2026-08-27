import test from "node:test";
import assert from "node:assert/strict";

import { createMarkerListReconciler } from "../src/marker-list-reconciler.js";

function createFakeList() {
  const list = {
    children: [],
    clientHeight: 60,
    scrollTop: 0,
    getBoundingClientRect() {
      return { top: 0, bottom: this.clientHeight };
    },
    insertBefore(row, reference) {
      const currentIndex = this.children.indexOf(row);
      if (currentIndex >= 0) {
        this.children.splice(currentIndex, 1);
      }
      const referenceIndex = reference ? this.children.indexOf(reference) : -1;
      this.children.splice(referenceIndex >= 0 ? referenceIndex : this.children.length, 0, row);
      row.parentElement = this;
    },
    removeChild(row) {
      const index = this.children.indexOf(row);
      if (index >= 0) {
        this.children.splice(index, 1);
      }
      row.parentElement = null;
    }
  };

  Object.defineProperty(list, "scrollHeight", {
    get() {
      return this.children.length * 20;
    }
  });
  return list;
}

function createHarness() {
  const created = [];
  const updated = [];
  const list = createFakeList();
  const reconciler = createMarkerListReconciler({
    createRow(item) {
      const row = {
        key: item.key,
        item,
        parentElement: null,
        getBoundingClientRect() {
          const index = list.children.indexOf(this);
          const top = index * 20 - list.scrollTop;
          return { top, bottom: top + 20 };
        }
      };
      created.push(row);
      return row;
    },
    updateRow(row, item) {
      row.item = item;
      updated.push(row);
    }
  });
  return { created, list, reconciler, updated };
}

function item(key, signature = key) {
  return { key, signature };
}

test("相同 Maker 模型不会更新或替换现有行", () => {
  const { created, list, reconciler, updated } = createHarness();
  reconciler.reconcile(list, [item("a"), item("b")]);
  const originalRows = [...list.children];

  const result = reconciler.reconcile(list, [item("a"), item("b")]);

  assert.equal(result.changed, false);
  assert.equal(result.scrollDelta, 0);
  assert.deepEqual(list.children, originalRows);
  assert.equal(created.length, 2);
  assert.equal(updated.length, 0);
});

test("标题变化时原位更新同一 Maker 行", () => {
  const { list, reconciler, updated } = createHarness();
  reconciler.reconcile(list, [item("heading", "标题")]);
  const originalRow = list.children[0];

  const result = reconciler.reconcile(list, [item("heading", "完整标题")]);

  assert.equal(result.changed, true);
  assert.equal(list.children[0], originalRow);
  assert.equal(originalRow.item.signature, "完整标题");
  assert.deepEqual(updated, [originalRow]);
});

test("追加和排序仅移动必要行并保留已有节点身份", () => {
  const { list, reconciler } = createHarness();
  reconciler.reconcile(list, [item("a"), item("b")]);
  const [rowA, rowB] = list.children;

  reconciler.reconcile(list, [item("b"), item("a"), item("c")]);

  assert.equal(list.children[0], rowB);
  assert.equal(list.children[1], rowA);
  assert.equal(list.children[2].key, "c");
});

test("删除失效 Maker 后 reset 清空剩余缓存和列表", () => {
  const { list, reconciler } = createHarness();
  reconciler.reconcile(list, [item("a"), item("b")]);

  reconciler.reconcile(list, [item("b")]);
  assert.deepEqual(list.children.map((row) => row.key), ["b"]);

  reconciler.reset();
  assert.deepEqual(list.children, []);
});

test("在可视区上方插入 Maker 时保持原视觉锚点", () => {
  const { list, reconciler } = createHarness();
  reconciler.reconcile(list, [item("a"), item("b"), item("c"), item("d"), item("e")]);
  list.scrollTop = 40;
  const anchoredRow = list.children[2];
  const originalTop = anchoredRow.getBoundingClientRect().top;

  const result = reconciler.reconcile(list, [item("new"), item("a"), item("b"), item("c"), item("d"), item("e")]);

  assert.equal(anchoredRow.getBoundingClientRect().top, originalTop);
  assert.equal(list.scrollTop, 60);
  assert.equal(result.scrollDelta, 20);
});

test("可视区上方插入 Maker 时可同步修正活动滚动目标", () => {
  const { list, reconciler } = createHarness();
  reconciler.reconcile(list, [item("a"), item("b"), item("c"), item("d"), item("e")]);
  list.scrollTop = 40;
  let activeScrollTarget = 70;

  const result = reconciler.reconcile(list, [item("new"), item("a"), item("b"), item("c"), item("d"), item("e")]);
  activeScrollTarget += result.scrollDelta;

  assert.equal(activeScrollTarget, 90);
});
