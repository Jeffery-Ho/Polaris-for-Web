import test from "node:test";
import assert from "node:assert/strict";

import { chatGPTConversationIdFromPath, parseChatGPTConversation } from "../src/chatgpt-conversation.js";

function node({ id, parent = null, role, text = "" }) {
  return {
    parent,
    message: {
      id,
      author: { role },
      content: { parts: [text] }
    }
  };
}

test("reads only the current ChatGPT branch and maps assistants to their user turn", () => {
  const conversation = {
    current_node: "user-third",
    mapping: {
      root: node({ id: "root", role: "system" }),
      "user-first": node({ id: "user-first", parent: "root", role: "user", text: "First question" }),
      "assistant-old": node({ id: "assistant-old", parent: "user-first", role: "assistant", text: "Old answer" }),
      "assistant-current": node({ id: "assistant-current", parent: "user-first", role: "assistant", text: "Current answer" }),
      "user-second": node({ id: "user-second", parent: "assistant-current", role: "user", text: "Second question" }),
      "assistant-second": node({ id: "assistant-second", parent: "user-second", role: "assistant", text: "Second answer" }),
      "user-third": node({ id: "user-third", parent: "assistant-second", role: "user", text: "Third question" }),
      tool: node({ id: "tool", parent: "assistant-second", role: "tool", text: "Ignored tool" })
    }
  };

  const result = parseChatGPTConversation(conversation);
  assert.deepEqual(result.userMessages, [
    { id: "user-first", text: "First question", order: 0, hasAssistantMessage: true },
    { id: "user-second", text: "Second question", order: 1, hasAssistantMessage: true },
    { id: "user-third", text: "Third question", order: 2, hasAssistantMessage: false }
  ]);
  assert.deepEqual(result.assistantToUserMessageId, {
    "assistant-current": "user-first",
    "assistant-second": "user-second"
  });
});

test("reads a project conversation ID from the current route", () => {
  assert.equal(chatGPTConversationIdFromPath("/g/g-example/c/conversation-id"), "conversation-id");
  assert.equal(chatGPTConversationIdFromPath("/share/conversation-id"), "");
});

test("falls back to an empty structure when the conversation payload is unavailable", () => {
  assert.deepEqual(parseChatGPTConversation(null), {
    assistantToUserMessageId: {},
    userMessages: []
  });
});
