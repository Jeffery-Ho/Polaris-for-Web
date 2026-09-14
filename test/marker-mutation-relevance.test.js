import test from "node:test";
import assert from "node:assert/strict";

import { hasRelevantMarkerMutation } from "../src/marker-mutation-relevance.js";

function node({ matches = [], descendants = [] } = {}) {
  return {
    parentElement: null,
    matches(selector) {
      return matches.includes(selector);
    },
    querySelector(selector) {
      return descendants.includes(selector) ? {} : null;
    }
  };
}

function mutation({ type = "childList", target, addedNodes = [], removedNodes = [], attributeName = null }) {
  return { type, target, addedNodes, removedNodes, attributeName };
}

test("无关宿主 DOM 变化不会触发 Maker 扫描", () => {
  const knownAssistant = node();
  const unrelated = node();
  knownAssistant.contains = () => false;

  assert.equal(hasRelevantMarkerMutation({
    mutations: [mutation({ target: unrelated })],
    knownContainers: [knownAssistant],
    sourceSelectors: [".assistant"]
  }), false);
});

test("已知会话容器内变化会触发 Maker 扫描", () => {
  const knownAssistant = node();
  const changedTextParent = node();
  knownAssistant.contains = (candidate) => candidate === changedTextParent;

  assert.equal(hasRelevantMarkerMutation({
    mutations: [mutation({ target: changedTextParent })],
    knownContainers: [knownAssistant],
    sourceSelectors: [".assistant"]
  }), true);
});

test("已知会话容器内图片地址变化会触发 Maker 扫描", () => {
  const knownUser = node();
  const changedImage = node();
  knownUser.contains = (candidate) => candidate === changedImage;

  assert.equal(hasRelevantMarkerMutation({
    mutations: [mutation({ type: "attributes", target: changedImage, attributeName: "src" })],
    knownContainers: [knownUser],
    sourceSelectors: ["user-query"]
  }), true);
});

test("新增或移除会话容器会触发 Maker 扫描", () => {
  const unrelated = node();
  const addedAssistant = node({ matches: [".assistant"] });
  const removedAssistant = node({ matches: [".assistant"] });
  const options = {
    knownContainers: [],
    sourceSelectors: [".assistant"]
  };

  assert.equal(hasRelevantMarkerMutation({
    ...options,
    mutations: [mutation({ target: unrelated, addedNodes: [addedAssistant] })]
  }), true);
  assert.equal(hasRelevantMarkerMutation({
    ...options,
    mutations: [mutation({ target: unrelated, removedNodes: [removedAssistant] })]
  }), true);
});
