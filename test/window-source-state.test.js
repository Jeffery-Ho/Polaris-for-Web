import test from "node:test";
import assert from "node:assert/strict";
import { didWindowConversationChange } from "../src/window-source-state.js";

test("跳转来源时同一标签页的加载快照不会清空当前章节", () => {
  const changed = didWindowConversationChange(
    { sourceTabId: 42, routeKey: "https://chatgpt.com/c/conversation" },
    {
      tabId: 42,
      snapshot: {
        loading: true,
        routeKey: "",
        supportedRoute: true
      }
    }
  );

  assert.equal(changed, false);
});

test("同一标签页完成导航后仍识别为新会话", () => {
  const changed = didWindowConversationChange(
    { sourceTabId: 42, routeKey: "https://chatgpt.com/c/old" },
    {
      tabId: 42,
      snapshot: {
        loading: false,
        routeKey: "https://chatgpt.com/c/new",
        supportedRoute: true
      }
    }
  );

  assert.equal(changed, true);
});

test("切换来源标签页会识别为新会话", () => {
  const changed = didWindowConversationChange(
    { sourceTabId: 42, routeKey: "https://chatgpt.com/c/conversation" },
    {
      tabId: 84,
      snapshot: {
        loading: true,
        routeKey: "",
        supportedRoute: true
      }
    }
  );

  assert.equal(changed, true);
});

test("同一标签页进入不支持页面时会清空旧会话", () => {
  const changed = didWindowConversationChange(
    { sourceTabId: 42, routeKey: "https://chatgpt.com/c/conversation" },
    {
      tabId: 42,
      snapshot: {
        loading: false,
        routeKey: "",
        supportedRoute: false
      }
    }
  );

  assert.equal(changed, true);
});
