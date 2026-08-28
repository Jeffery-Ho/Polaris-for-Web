import test from "node:test";
import assert from "node:assert/strict";

import {
  createMakerPlatformAdapter,
  makerConversationScope
} from "../src/maker-platform-adapter.js";

const PLATFORM_URLS = [
  ["chatgpt", "https://chatgpt.com/c/chatgpt-conversation", "chatgpt-conversation"],
  ["doubao", "https://www.doubao.com/chat/doubao-conversation", "doubao-conversation"],
  ["kimi", "https://www.kimi.com/chat/kimi-conversation", "kimi-conversation"],
  ["qianwen", "https://www.qianwen.com/chat/qianwen-conversation", "qianwen-conversation"],
  ["yuanbao", "https://yuanbao.tencent.com/chat/yuanbao-conversation", "yuanbao-conversation"],
  ["xiaohongshu", "https://www.xiaohongshu.com/ai_chat?conversationId=xhs-conversation", "xhs-conversation"]
];

test("六个平台从明确的会话路由生成可持久化 scope", () => {
  PLATFORM_URLS.forEach(([platformKey, href, conversationId]) => {
    const location = new URL(href);
    assert.deepEqual(makerConversationScope({ platformKey, location }), {
      platformKey,
      conversationKey: `${location.origin}:${conversationId}`,
      persistence: true
    });
  });
});

test("无法确认稳定会话身份时使用当前路由的内存 scope", () => {
  const location = new URL("https://www.kimi.com/");
  assert.deepEqual(makerConversationScope({ platformKey: "kimi", location }), {
    platformKey: "kimi",
    conversationKey: "https://www.kimi.com/",
    persistence: false
  });
});

test("平台未允许的 query 参数不能开启持久化", () => {
  const location = new URL("https://www.kimi.com/?sessionId=unverified-session");
  assert.equal(makerConversationScope({ platformKey: "kimi", location }).persistence, false);
});

test("经过语义属性标记的聊天根节点可提供稳定会话身份", () => {
  const conversationElement = {
    closest() {
      return this;
    },
    querySelector() {
      return null;
    },
    getAttribute(name) {
      return name === "data-conversation-id" ? "dom-conversation-42" : null;
    }
  };
  const root = {
    querySelector() {
      return conversationElement;
    }
  };
  assert.deepEqual(makerConversationScope({
    platformKey: "yuanbao",
    location: new URL("https://yuanbao.tencent.com/"),
    root
  }), {
    platformKey: "yuanbao",
    conversationKey: "https://yuanbao.tencent.com:dom-conversation-42",
    persistence: true
  });
});

test("平台 Adapter 优先使用稳定消息属性并规范化身份", () => {
  const adapter = createMakerPlatformAdapter("doubao");
  const element = {
    closest() {
      return this;
    },
    querySelector() {
      return null;
    },
    getAttribute(name) {
      return name === "data-message-id" ? "message-123" : null;
    }
  };

  assert.deepEqual(adapter.groupIdentity(element, "runtime-user-1"), {
    groupKey: "doubao:user:message-123",
    persistent: true
  });
  assert.equal(
    adapter.sourceIdentity(element, "doubao:user:message-123", 0),
    "doubao:assistant:message-123"
  );
});

test("六个平台使用同一消息身份契约但保持平台命名空间隔离", () => {
  const element = {
    closest() {
      return this;
    },
    querySelector() {
      return null;
    },
    getAttribute(name) {
      return name === "data-message-id" ? "message-shared" : null;
    }
  };
  PLATFORM_URLS.forEach(([platformKey]) => {
    assert.equal(
      createMakerPlatformAdapter(platformKey).groupIdentity(element, "runtime").groupKey,
      `${platformKey}:user:message-shared`
    );
  });
});

test("重复用户首行按出现序号生成稳定但仅限内存的分组 key", () => {
  const adapter = createMakerPlatformAdapter("xiaohongshu");
  assert.equal(adapter.runtimeGroupKey("重复问题", 0), adapter.runtimeGroupKey("重复问题", 0));
  assert.notEqual(adapter.runtimeGroupKey("重复问题", 0), adapter.runtimeGroupKey("重复问题", 1));
});

test("缺少 assistant ID 时默认保持内存身份，仅经 Adapter 明确允许才派生", () => {
  const adapter = createMakerPlatformAdapter("qianwen");
  const element = {
    closest() {
      return null;
    },
    querySelector() {
      return null;
    }
  };

  assert.equal(adapter.sourceIdentity(element, "qianwen:user:user-42", 1), "");
  assert.equal(
    adapter.sourceIdentity(element, "qianwen:user:user-42", 1, { allowDerived: true }),
    "qianwen:assistant-derived:user-42:1"
  );
  assert.equal(adapter.sourceIdentity(element, "runtime-user-1", 1, { allowDerived: true }), "");
});

test("畸形的会话路径编码不会开启持久化", () => {
  const location = new URL("https://www.kimi.com/chat/%E0%A4%A");
  assert.equal(makerConversationScope({ platformKey: "kimi", location }).persistence, false);
});

test("非 ChatGPT Adapter 默认声明 partial coverage", () => {
  ["doubao", "kimi", "qianwen", "yuanbao", "xiaohongshu"].forEach((platformKey) => {
    assert.equal(createMakerPlatformAdapter(platformKey).coverage(), "partial");
  });
});
