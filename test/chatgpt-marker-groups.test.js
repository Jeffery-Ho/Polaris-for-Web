import test from "node:test";
import assert from "node:assert/strict";

import {
  recoverChatGPTMarkerGroups,
  resolveChatGPTUserMessageId
} from "../src/chatgpt-marker-groups.js";

test("ChatGPT Maker 归属优先使用当前映射并仅按相同 assistant ID 回退", () => {
  const rememberedAssignments = new Map([["assistant-1", "user-old"]]);

  assert.equal(resolveChatGPTUserMessageId({
    assistantMessageId: "assistant-1",
    currentAssignments: { "assistant-1": "user-current" },
    rememberedAssignments
  }), "user-current");
  assert.equal(rememberedAssignments.get("assistant-1"), "user-current");

  assert.equal(resolveChatGPTUserMessageId({
    assistantMessageId: "assistant-1",
    currentAssignments: {},
    rememberedAssignments
  }), "user-current");
  assert.equal(resolveChatGPTUserMessageId({
    assistantMessageId: "assistant-2",
    currentAssignments: {},
    rememberedAssignments
  }), "");
});

test("上一帧已关联的连接中标题从 orphan 恢复且不重复显示", () => {
  const recoveredElement = { isConnected: true };
  const duplicateTitleElement = { isConnected: true };
  const recoveredHeading = { element: recoveredElement, title: "重复标题" };
  const unrelatedHeading = { element: duplicateTitleElement, title: "重复标题" };
  const groups = [
    { key: "previous", user: {}, headings: [] },
    { key: "latest", user: {}, headings: [] },
    { key: "orphan", user: null, headings: [recoveredHeading, unrelatedHeading] }
  ];
  const previousGroups = [
    { key: "previous", user: {}, headings: [{ element: recoveredElement, title: "重复标题" }] },
    { key: "latest", user: {}, headings: [] }
  ];

  const recoveredGroups = recoverChatGPTMarkerGroups({
    groups,
    previousGroups,
    headings: [recoveredHeading, unrelatedHeading]
  });

  assert.deepEqual(recoveredGroups.find((group) => group.key === "previous").headings, [recoveredHeading]);
  assert.deepEqual(recoveredGroups.find((group) => group.key === "orphan").headings, [unrelatedHeading]);
});

test("当前权威分组优先于上一帧归属", () => {
  const movedElement = { isConnected: true };
  const currentHeading = { element: movedElement, title: "当前标题" };
  const recoveredGroups = recoverChatGPTMarkerGroups({
    groups: [
      { key: "previous", user: {}, headings: [] },
      { key: "latest", user: {}, headings: [currentHeading] }
    ],
    previousGroups: [
      { key: "previous", user: {}, headings: [{ element: movedElement, title: "旧标题" }] },
      { key: "latest", user: {}, headings: [] }
    ],
    headings: [currentHeading]
  });

  assert.deepEqual(recoveredGroups.find((group) => group.key === "previous").headings, []);
  assert.deepEqual(recoveredGroups.find((group) => group.key === "latest").headings, [currentHeading]);
});

test("断开连接的旧标题不恢复到用户分组", () => {
  const disconnectedElement = { isConnected: false };
  const currentHeading = { element: disconnectedElement, title: "旧标题" };
  const recoveredGroups = recoverChatGPTMarkerGroups({
    groups: [
      { key: "previous", user: {}, headings: [] },
      { key: "orphan", user: null, headings: [currentHeading] }
    ],
    previousGroups: [
      { key: "previous", user: {}, headings: [{ element: disconnectedElement, title: "旧标题" }] }
    ],
    headings: [currentHeading]
  });

  assert.deepEqual(recoveredGroups.find((group) => group.key === "previous").headings, []);
  assert.deepEqual(recoveredGroups.find((group) => group.key === "orphan").headings, [currentHeading]);
});
