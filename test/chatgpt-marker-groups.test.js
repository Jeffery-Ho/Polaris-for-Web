import test from "node:test";
import assert from "node:assert/strict";

import {
  assignChatGPTAssistantIdentities,
  createChatGPTSourceIdentityIndex,
  recoverChatGPTMarkerGroups,
  resolveChatGPTUserMessageId
} from "../src/chatgpt-marker-groups.js";
import { createMakerPlatformAdapter } from "../src/maker-platform-adapter.js";

test("ChatGPT 活跃分支为同一用户的多条回复生成稳定派生身份并保留真实 ID 别名", () => {
  const index = createChatGPTSourceIdentityIndex({
    activeAssistantMessageIds: ["assistant-1", "assistant-2", "assistant-3"],
    assistantToUserMessageId: {
      "assistant-1": "user-1",
      "assistant-2": "user-1",
      "assistant-3": "user-2"
    }
  }, createMakerPlatformAdapter("chatgpt"));

  assert.deepEqual(index.authoritativeMessageKeys, [
    "chatgpt:assistant-derived:user-1:0",
    "chatgpt:assistant-derived:user-1:1",
    "chatgpt:assistant-derived:user-2:0"
  ]);
  assert.equal(
    index.sourceMessageKeyByAssistantId.get("assistant-2"),
    "chatgpt:assistant-derived:user-1:1"
  );
  assert.deepEqual(index.sourceMessageKeysByUserId.get("user-1"), [
    "chatgpt:assistant-derived:user-1:0",
    "chatgpt:assistant-derived:user-1:1"
  ]);
  assert.deepEqual(index.sourceMessageAliasesBySourceKey.get("chatgpt:assistant-derived:user-2:0"), [
    "assistant-3"
  ]);
  assert.deepEqual(index.sourceMessageAliases, {
    "chatgpt:assistant-derived:user-1:0": ["assistant-1"],
    "chatgpt:assistant-derived:user-1:1": ["assistant-2"],
    "chatgpt:assistant-derived:user-2:0": ["assistant-3"]
  });
});

test("ChatGPT 身份索引忽略无法确认用户归属的 assistant ID", () => {
  const index = createChatGPTSourceIdentityIndex({
    activeAssistantMessageIds: ["assistant-known", "assistant-ambiguous"],
    assistantToUserMessageId: { "assistant-known": "user-1" }
  }, createMakerPlatformAdapter("chatgpt"));

  assert.deepEqual(index.authoritativeMessageKeys, ["chatgpt:assistant-derived:user-1:0"]);
  assert.equal(index.sourceMessageKeyByAssistantId.has("assistant-ambiguous"), false);
});

test("ChatGPT DOM 暂缺 assistant ID 时按已确认用户分组和回复序号恢复派生身份", () => {
  const adapter = createMakerPlatformAdapter("chatgpt");
  const conversation = {
    activeAssistantMessageIds: ["assistant-1", "assistant-2"],
    assistantToUserMessageId: {
      "assistant-1": "user-1",
      "assistant-2": "user-1"
    },
    userMessages: [{ id: "user-1" }]
  };
  const index = createChatGPTSourceIdentityIndex(conversation, adapter);
  const user = { messageId: "user-1" };
  const firstAssistantWithoutId = {};
  const secondAssistant = { messageId: "assistant-2" };
  const identities = assignChatGPTAssistantIdentities({
    entries: [
      { type: "user", element: user },
      { type: "assistant", element: firstAssistantWithoutId },
      { type: "assistant", element: secondAssistant }
    ],
    conversation,
    sourceIdentityIndex: index,
    messageIdForElement: (element) => element.messageId || ""
  });

  assert.equal(
    identities.get(firstAssistantWithoutId).sourceMessageKey,
    "chatgpt:assistant-derived:user-1:0"
  );
  assert.equal(
    identities.get(secondAssistant).sourceMessageKey,
    "chatgpt:assistant-derived:user-1:1"
  );

  const replacementAssistantWithoutId = {};
  const singleReplyConversation = {
    activeAssistantMessageIds: ["assistant-1"],
    assistantToUserMessageId: { "assistant-1": "user-1" },
    userMessages: [{ id: "user-1" }]
  };
  const singleReplyIndex = createChatGPTSourceIdentityIndex(singleReplyConversation, adapter);
  const replacementIdentities = assignChatGPTAssistantIdentities({
    entries: [
      { type: "user", element: user },
      { type: "assistant", element: replacementAssistantWithoutId }
    ],
    conversation: singleReplyConversation,
    sourceIdentityIndex: singleReplyIndex,
    messageIdForElement: (element) => element.messageId || ""
  });
  assert.equal(
    replacementIdentities.get(replacementAssistantWithoutId).sourceMessageKey,
    "chatgpt:assistant-derived:user-1:0"
  );
});

test("ChatGPT 同组多回复只挂载一个无 ID 节点时保持内存身份", () => {
  const adapter = createMakerPlatformAdapter("chatgpt");
  const conversation = {
    activeAssistantMessageIds: ["assistant-1", "assistant-2"],
    assistantToUserMessageId: {
      "assistant-1": "user-1",
      "assistant-2": "user-1"
    },
    userMessages: [{ id: "user-1" }]
  };
  const sourceIdentityIndex = createChatGPTSourceIdentityIndex(conversation, adapter);
  const user = { messageId: "user-1" };
  const ambiguousAssistant = {};
  const identities = assignChatGPTAssistantIdentities({
    entries: [
      { type: "user", element: user },
      { type: "assistant", element: ambiguousAssistant }
    ],
    conversation,
    sourceIdentityIndex,
    messageIdForElement: (element) => element.messageId || ""
  });

  assert.equal(identities.get(ambiguousAssistant).sourceMessageKey, "");
  assert.deepEqual(identities.get(ambiguousAssistant).sourceMessageAliases, []);
});

test("ChatGPT DOM 无法确认用户分组时不派生持久身份", () => {
  const adapter = createMakerPlatformAdapter("chatgpt");
  const conversation = {
    activeAssistantMessageIds: ["assistant-1"],
    assistantToUserMessageId: { "assistant-1": "user-1" },
    userMessages: [{ id: "user-1" }]
  };
  const sourceIdentityIndex = createChatGPTSourceIdentityIndex(conversation, adapter);
  const unknownUser = {};
  const assistantWithoutId = {};
  const identities = assignChatGPTAssistantIdentities({
    entries: [
      { type: "user", element: unknownUser },
      { type: "assistant", element: assistantWithoutId }
    ],
    conversation,
    sourceIdentityIndex,
    messageIdForElement: (element) => element.messageId || ""
  });

  assert.equal(identities.get(assistantWithoutId).sourceMessageKey, "");
  assert.equal(identities.get(assistantWithoutId).userMessageId, "");
});

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
