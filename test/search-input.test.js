import test from "node:test";
import assert from "node:assert/strict";

import { bindSearchInput } from "../src/search-input.js";

class FakeInput {
  value = "";
  listeners = new Map();

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  dispatch(type, event = {}) {
    this.listeners.get(type)?.({ type, ...event });
  }
}

test("输入法组合态期间不提交搜索，中文提交后只刷新一次", async () => {
  const input = new FakeInput();
  const values = [];
  let commits = 0;
  bindSearchInput(input, {
    onInput: (value) => values.push(value),
    onCommit: () => { commits += 1; }
  });

  input.dispatch("compositionstart");
  input.value = "pinyin";
  input.dispatch("input", { isComposing: true });
  input.value = "拼音";
  input.dispatch("input", { isComposing: true });
  assert.equal(commits, 0);
  assert.deepEqual(values, ["pinyin", "拼音"]);

  input.dispatch("compositionend");
  input.dispatch("input");
  assert.equal(commits, 1);
  await Promise.resolve();
  assert.equal(commits, 1);

  input.value = "中文 search";
  input.dispatch("input");
  assert.equal(commits, 2);
});
