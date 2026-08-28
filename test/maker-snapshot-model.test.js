import test from "node:test";
import assert from "node:assert/strict";

import { createMakerSnapshotModel } from "../src/maker-snapshot-model.js";

function createMemoryStorage() {
  const values = {};
  return {
    values,
    async get(keys) {
      const requestedKeys = Array.isArray(keys) ? keys : [keys];
      return Object.fromEntries(requestedKeys
        .filter((key) => Object.prototype.hasOwnProperty.call(values, key))
        .map((key) => [key, structuredClone(values[key])]));
    },
    async set(items) {
      Object.entries(items).forEach(([key, value]) => {
        values[key] = structuredClone(value);
      });
    },
    async remove(keys) {
      (Array.isArray(keys) ? keys : [keys]).forEach((key) => delete values[key]);
    }
  };
}

function chatGPTScope(conversationKey) {
  return { platformKey: "chatgpt", conversationKey, persistence: true };
}

function observation(element, title = "第一节") {
  return {
    coverage: "complete",
    authoritativeMessageKeys: ["assistant-1"],
    groups: [{
      groupKey: "chatgpt-user-user-1",
      userMessageId: "user-1",
      previewTitle: "请总结",
      title: "请总结这篇文章",
      order: 0,
      hasAssistantMessage: true
    }],
    mountedMessageKeys: ["assistant-1"],
    makers: [{
      sourceMessageKey: "assistant-1",
      groupKey: "chatgpt-user-user-1",
      canonicalKind: "text",
      ordinalWithinKind: 0,
      titleFingerprint: title,
      title,
      level: 2,
      sourceType: "heading",
      order: 0,
      lastKnownScrollRatio: 0.25,
      element
    }]
  };
}

test("DOM 节点替换后沿用 Maker key 且持久快照不包含 DOM", async () => {
  const storage = createMemoryStorage();
  let nextKey = 1;
  const model = createMakerSnapshotModel({
    storage,
    createKey: () => `maker-${nextKey++}`,
    now: () => 1_000
  });
  await model.open(chatGPTScope("chatgpt:conversation-1"));

  const firstElement = { isConnected: true };
  const firstView = model.reconcile(observation(firstElement));
  const firstMaker = firstView.groups[0].headings[0];

  const replacementElement = { isConnected: true };
  const secondView = model.reconcile(observation(replacementElement));
  const secondMaker = secondView.groups[0].headings[0];
  const firstMakerKey = Object.getOwnPropertyDescriptor(firstMaker, "makerKey")?.value;

  if (firstMakerKey !== "maker-1") {
    throw new Error(`unexpected key ${String(firstMakerKey)} ${JSON.stringify(firstMaker)}`);
  }
  assert.equal(Reflect.get(secondMaker, "makerKey"), firstMakerKey, JSON.stringify(secondMaker));
  assert.equal(model.resolveElement(firstMakerKey), replacementElement);

  await new Promise((resolve) => setTimeout(resolve, 0));
  const snapshot = Object.values(storage.values)
    .find((value) => value && value.conversationKey === "chatgpt:conversation-1");
  assert.equal(snapshot.makers[0].makerKey, "maker-1");
  assert.equal("element" in snapshot.makers[0], false);
});

test("流式 Maker 补齐 assistant ID 后沿用内存 key 并开始持久化", async () => {
  const storage = createMemoryStorage();
  let nextKey = 1;
  const model = createMakerSnapshotModel({
    storage,
    createKey: () => `maker-${nextKey++}`,
    now: () => 2_000
  });
  await model.open(chatGPTScope("chatgpt:conversation-2"));

  const pendingObservation = observation({ isConnected: true });
  pendingObservation.authoritativeMessageKeys = [];
  pendingObservation.mountedMessageKeys = [];
  pendingObservation.makers[0].sourceMessageKey = "";
  const pendingMaker = model.reconcile(pendingObservation).groups[0].headings[0];

  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(Object.values(storage.values).some((value) => value?.conversationKey === "chatgpt:conversation-2"), false);

  const identifiedMaker = model.reconcile(observation({ isConnected: true })).groups[0].headings[0];
  assert.equal(Reflect.get(identifiedMaker, "makerKey"), Reflect.get(pendingMaker, "makerKey"));

  await new Promise((resolve) => setTimeout(resolve, 0));
  const snapshot = Object.values(storage.values)
    .find((value) => value?.conversationKey === "chatgpt:conversation-2");
  assert.equal(snapshot.makers[0].makerKey, "maker-1");
});

test("流式 Maker 不会跨用户分组复用 key", async () => {
  const storage = createMemoryStorage();
  let nextKey = 1;
  const model = createMakerSnapshotModel({
    storage,
    createKey: () => `maker-pending-${nextKey++}`,
    now: () => 2_500
  });
  await model.open(chatGPTScope("chatgpt:conversation-pending-groups"));

  const firstPending = observation({ isConnected: true });
  firstPending.authoritativeMessageKeys = [];
  firstPending.mountedMessageKeys = [];
  firstPending.makers[0].sourceMessageKey = "";
  const firstKey = model.reconcile(firstPending).groups[0].headings[0].makerKey;

  const secondPending = structuredClone(firstPending);
  secondPending.groups[0].groupKey = "chatgpt-user-user-2";
  secondPending.groups[0].userMessageId = "user-2";
  secondPending.makers[0].groupKey = "chatgpt-user-user-2";
  secondPending.makers[0].element = { isConnected: true };
  const secondKey = model.reconcile(secondPending).groups[0].headings[0].makerKey;

  assert.equal(firstKey, "maker-pending-1");
  assert.equal(secondKey, "maker-pending-2");
});

test("保留活跃分支中未挂载的 Maker 并删除已退出分支的 Maker", async () => {
  const storage = createMemoryStorage();
  const model = createMakerSnapshotModel({
    storage,
    createKey: () => "maker-stable",
    now: () => 3_000
  });
  await model.open(chatGPTScope("chatgpt:conversation-3"));
  model.reconcile(observation({ isConnected: true }));

  const unmounted = observation(null);
  unmounted.mountedMessageKeys = [];
  unmounted.makers = [];
  const cachedView = model.reconcile(unmounted);
  assert.equal(Reflect.get(cachedView.groups[0].headings[0], "makerKey"), "maker-stable");
  assert.equal(model.resolveElement("maker-stable"), null);

  const inactive = { ...unmounted, authoritativeMessageKeys: [], groups: [] };
  assert.deepEqual(model.reconcile(inactive).groups, []);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(Object.values(storage.values).some((value) => value?.conversationKey === "chatgpt:conversation-3"), false);
});

test("页面刷新后从本地快照恢复相同 Maker key", async () => {
  const storage = createMemoryStorage();
  const firstModel = createMakerSnapshotModel({
    storage,
    createKey: () => "maker-restored",
    now: () => 4_000
  });
  await firstModel.open(chatGPTScope("chatgpt:conversation-4"));
  firstModel.reconcile(observation({ isConnected: true }));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const restoredModel = createMakerSnapshotModel({ storage, now: () => 5_000 });
  const restoredView = await restoredModel.open(chatGPTScope("chatgpt:conversation-4"));
  const restoredMaker = restoredView.groups[0].headings[0];

  assert.equal(Reflect.get(restoredMaker, "makerKey"), "maker-restored");
  assert.equal(restoredModel.resolveElement("maker-restored"), null);
  assert.equal(restoredView.groups[0].user.title, "请总结");
});

test("真实消息 ID 快照通过派生身份别名就地迁移并重新绑定原 Maker key", async () => {
  const storage = createMemoryStorage();
  const firstModel = createMakerSnapshotModel({
    storage,
    createKey: () => "maker-alias-migrated",
    now: () => 5_500
  });
  await firstModel.open(chatGPTScope("chatgpt:conversation-alias"));
  firstModel.reconcile(observation({ isConnected: true }));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const replacementElement = { isConnected: true };
  const restoredModel = createMakerSnapshotModel({
    storage,
    now: () => 6_000,
    setTimer: (callback) => setTimeout(callback, 0),
    clearTimer: (timer) => clearTimeout(timer)
  });
  await restoredModel.open(chatGPTScope("chatgpt:conversation-alias"));
  const derivedObservation = observation(replacementElement);
  derivedObservation.authoritativeMessageKeys = ["chatgpt:assistant-derived:user-1:0"];
  derivedObservation.mountedMessageKeys = ["chatgpt:assistant-derived:user-1:0"];
  derivedObservation.makers[0].sourceMessageKey = "chatgpt:assistant-derived:user-1:0";
  derivedObservation.makers[0].sourceMessageAliases = ["assistant-1"];

  const migrated = restoredModel.reconcile(derivedObservation).groups[0].headings[0];
  assert.equal(migrated.makerKey, "maker-alias-migrated");
  assert.equal(restoredModel.resolveElement("maker-alias-migrated"), replacementElement);
  await new Promise((resolve) => setTimeout(resolve, 0));
  const snapshot = Object.values(storage.values)
    .find((value) => value?.conversationKey === "chatgpt:conversation-alias");
  assert.deepEqual(snapshot.makers.map((maker) => maker.sourceMessageKey), [
    "chatgpt:assistant-derived:user-1:0"
  ]);
  assert.equal("sourceMessageAliases" in snapshot.makers[0], false);
});

test("未挂载的活跃消息也通过 observation 别名迁移并保留缓存 Maker", async () => {
  const storage = createMemoryStorage();
  const firstModel = createMakerSnapshotModel({
    storage,
    createKey: () => "maker-unmounted-alias",
    now: () => 6_250
  });
  await firstModel.open(chatGPTScope("chatgpt:conversation-unmounted-alias"));
  firstModel.reconcile(observation({ isConnected: true }));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const restoredModel = createMakerSnapshotModel({ storage, now: () => 6_300 });
  await restoredModel.open(chatGPTScope("chatgpt:conversation-unmounted-alias"));
  const unmounted = observation(null);
  unmounted.authoritativeMessageKeys = ["chatgpt:assistant-derived:user-1:0"];
  unmounted.sourceMessageAliases = {
    "chatgpt:assistant-derived:user-1:0": ["assistant-1"]
  };
  unmounted.mountedMessageKeys = [];
  unmounted.makers = [];

  const cached = restoredModel.reconcile(unmounted).groups[0].headings[0];
  assert.equal(cached.makerKey, "maker-unmounted-alias");
  assert.equal(cached.sourceMessageKey, "chatgpt:assistant-derived:user-1:0");
  assert.equal(restoredModel.resolveElement("maker-unmounted-alias"), null);
});

test("25 个稳定用户分组在无 assistant ID 时仍持久化并恢复原 Maker key", async () => {
  const storage = createMemoryStorage();
  let nextKey = 1;
  const firstModel = createMakerSnapshotModel({
    storage,
    createKey: () => `maker-history-${nextKey++}`,
    now: () => 6_500
  });
  const scope = { platformKey: "kimi", conversationKey: "https://www.kimi.com:history-25", persistence: true };
  await firstModel.open(scope);
  const groups = Array.from({ length: 25 }, (_, index) => ({
    groupKey: `kimi:user:user-${index}`,
    userMessageKey: `kimi:user:user-${index}`,
    previewTitle: `问题 ${index}`,
    title: `问题 ${index}`,
    order: index,
    hasAssistantMessage: true
  }));
  const makers = groups.map((group, index) => ({
    sourceMessageKey: `kimi:assistant-derived:user-${index}:0`,
    sourceMessageAliases: [],
    groupKey: group.groupKey,
    canonicalKind: "text",
    ordinalWithinKind: 0,
    titleFingerprint: `回答 ${index}`,
    title: `回答 ${index}`,
    level: 2,
    sourceType: "heading",
    order: index,
    lastKnownScrollRatio: index / 25,
    element: { isConnected: true }
  }));
  firstModel.reconcile({
    coverage: "partial",
    authoritativeMessageKeys: null,
    groups,
    mountedMessageKeys: makers.map((maker) => maker.sourceMessageKey),
    makers
  });
  await new Promise((resolve) => setTimeout(resolve, 0));

  const restoredModel = createMakerSnapshotModel({ storage, now: () => 7_000 });
  const restored = await restoredModel.open(scope);
  assert.equal(restored.groups.length, 25);
  assert.deepEqual(
    restored.groups.map((group) => group.headings[0].makerKey),
    Array.from({ length: 25 }, (_, index) => `maker-history-${index + 1}`)
  );
});

test("同一真实 ID 别名同时指向多个观察结果时不误复用缓存 key", async () => {
  const storage = createMemoryStorage();
  let nextKey = 1;
  const model = createMakerSnapshotModel({
    storage,
    createKey: () => `maker-conflict-${nextKey++}`,
    now: () => 7_500
  });
  await model.open(chatGPTScope("chatgpt:conversation-alias-conflict"));
  model.reconcile(observation({ isConnected: true }));

  const conflicting = observation({ isConnected: true });
  conflicting.authoritativeMessageKeys = ["derived-1", "derived-2"];
  conflicting.mountedMessageKeys = ["derived-1", "derived-2"];
  conflicting.makers = [
    {
      ...conflicting.makers[0],
      sourceMessageKey: "derived-1",
      sourceMessageAliases: ["assistant-1"]
    },
    {
      ...conflicting.makers[0],
      sourceMessageKey: "derived-2",
      sourceMessageAliases: ["assistant-1"],
      element: { isConnected: true }
    }
  ];
  const result = model.reconcile(conflicting).groups[0].headings;

  assert.deepEqual(result.map((maker) => maker.makerKey), ["maker-conflict-2", "maker-conflict-3"]);
});

test("同一消息的多个 Maker 可共享真实 ID 别名并分别迁移原 key", async () => {
  const storage = createMemoryStorage();
  let nextKey = 1;
  const model = createMakerSnapshotModel({
    storage,
    createKey: () => `maker-shared-alias-${nextKey++}`,
    now: () => 8_000
  });
  await model.open(chatGPTScope("chatgpt:conversation-shared-alias"));
  const original = observation({ isConnected: true });
  original.makers.push({
    ...original.makers[0],
    ordinalWithinKind: 1,
    order: 1,
    element: { isConnected: true }
  });
  model.reconcile(original);

  const migrated = structuredClone(original);
  migrated.authoritativeMessageKeys = ["derived-1"];
  migrated.mountedMessageKeys = ["derived-1"];
  migrated.makers = original.makers.map((maker) => ({
    ...maker,
    sourceMessageKey: "derived-1",
    sourceMessageAliases: ["assistant-1"],
    element: { isConnected: true }
  }));
  const result = model.reconcile(migrated).groups[0].headings;

  assert.deepEqual(result.map((maker) => maker.makerKey), [
    "maker-shared-alias-1",
    "maker-shared-alias-2"
  ]);
});

test("七天过期快照不会恢复", async () => {
  const storage = createMemoryStorage();
  let timestamp = 0;
  const firstModel = createMakerSnapshotModel({
    storage,
    createKey: () => "maker-expiring",
    now: () => timestamp,
    ttlMs: 1_000
  });
  await firstModel.open(chatGPTScope("chatgpt:conversation-expiring"));
  firstModel.reconcile(observation({ isConnected: true }));
  await new Promise((resolve) => setTimeout(resolve, 0));

  timestamp = 1_001;
  const expiredModel = createMakerSnapshotModel({ storage, now: () => timestamp, ttlMs: 1_000 });
  const expiredView = await expiredModel.open(chatGPTScope("chatgpt:conversation-expiring"));

  assert.deepEqual(expiredView.groups, []);
  assert.equal(Object.values(storage.values).some((value) => value?.conversationKey === "chatgpt:conversation-expiring"), false);
});

test("超过会话数量上限时按最近访问顺序淘汰", async () => {
  const storage = createMemoryStorage();
  let timestamp = 10_000;
  let nextKey = 1;
  const model = createMakerSnapshotModel({
    storage,
    createKey: () => `maker-lru-${nextKey++}`,
    now: () => timestamp,
    maxConversations: 2
  });

  for (const conversationKey of ["conversation-a", "conversation-b", "conversation-c"]) {
    await model.open(chatGPTScope(`chatgpt:${conversationKey}`));
    model.reconcile(observation({ isConnected: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    timestamp += 1_000;
  }

  const storedConversations = Object.values(storage.values)
    .filter((value) => value?.conversationKey)
    .map((value) => value.conversationKey)
    .sort();
  assert.deepEqual(storedConversations, ["chatgpt:conversation-b", "chatgpt:conversation-c"]);
});

test("超过快照软容量时仅保留内存模型", async () => {
  const storage = createMemoryStorage();
  const model = createMakerSnapshotModel({
    storage,
    createKey: () => "maker-too-large",
    now: () => 20_000,
    maxBytes: 1
  });
  await model.open(chatGPTScope("chatgpt:conversation-large"));
  const view = model.reconcile(observation({ isConnected: true }));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(Reflect.get(view.groups[0].headings[0], "makerKey"), "maker-too-large");
  assert.equal(Object.values(storage.values).some((value) => value?.conversationKey === "chatgpt:conversation-large"), false);
});

test("重复标题按序号获得不同 key 且流式改标题不换 key", async () => {
  const storage = createMemoryStorage();
  let nextKey = 1;
  const model = createMakerSnapshotModel({
    storage,
    createKey: () => `maker-duplicate-${nextKey++}`,
    now: () => 30_000
  });
  await model.open(chatGPTScope("chatgpt:conversation-duplicates"));

  const duplicateObservation = observation({ isConnected: true }, "重复标题");
  duplicateObservation.makers.push({
    ...duplicateObservation.makers[0],
    ordinalWithinKind: 1,
    order: 1,
    element: { isConnected: true }
  });
  const firstView = model.reconcile(duplicateObservation);
  assert.deepEqual(firstView.groups[0].headings.map((heading) => Reflect.get(heading, "makerKey")), [
    "maker-duplicate-1",
    "maker-duplicate-2"
  ]);

  const changedTitleObservation = observation({ isConnected: true }, "完整标题");
  const changedView = model.reconcile(changedTitleObservation);
  assert.equal(Reflect.get(changedView.groups[0].headings[0], "makerKey"), "maker-duplicate-1");
});

test("损坏快照被忽略并从命名空间中移除", async () => {
  const storage = createMemoryStorage();
  const conversationKey = "chatgpt:conversation-corrupt";
  const snapshotKey = `polaris.makerSnapshot.v1:${encodeURIComponent(conversationKey)}`;
  storage.values[snapshotKey] = {
    schemaVersion: 99,
    conversationKey,
    expiresAt: 100_000,
    groups: [],
    makers: []
  };
  storage.values["polaris.makerSnapshotIndex.v1"] = [{
    conversationKey,
    storageKey: snapshotKey,
    updatedAt: 1,
    lastAccessedAt: 1,
    expiresAt: 100_000,
    bytes: 10
  }];

  const model = createMakerSnapshotModel({ storage, now: () => 40_000 });
  assert.deepEqual((await model.open(chatGPTScope(conversationKey))).groups, []);
  assert.equal(Object.prototype.hasOwnProperty.call(storage.values, snapshotKey), false);
});

test("Storage 失败时降级为页面内存模型", async () => {
  let reportedError = null;
  const storage = {
    async get() {
      throw new Error("storage unavailable");
    },
    async set() {},
    async remove() {}
  };
  const model = createMakerSnapshotModel({
    storage,
    createKey: () => "maker-memory-only",
    now: () => 50_000,
    onError: (error) => {
      reportedError = error;
    }
  });
  await model.open(chatGPTScope("chatgpt:conversation-memory-only"));
  const view = model.reconcile(observation({ isConnected: true }));

  assert.equal(reportedError.message, "storage unavailable");
  assert.equal(Reflect.get(view.groups[0].headings[0], "makerKey"), "maker-memory-only");
});

test("持久化时截断用户首行预览且保留列表与表格类型", async () => {
  const storage = createMemoryStorage();
  let nextKey = 1;
  const model = createMakerSnapshotModel({
    storage,
    createKey: () => `maker-kind-${nextKey++}`,
    now: () => 60_000
  });
  await model.open(chatGPTScope("chatgpt:conversation-kinds"));

  const kindsObservation = observation({ isConnected: true });
  kindsObservation.groups[0].previewTitle = "问".repeat(300);
  kindsObservation.makers = [
    { ...kindsObservation.makers[0], canonicalKind: "list", sourceType: "unordered-list" },
    {
      ...kindsObservation.makers[0],
      canonicalKind: "table",
      sourceType: "table",
      ordinalWithinKind: 0,
      order: 1,
      element: { isConnected: true }
    }
  ];
  model.reconcile(kindsObservation);
  await new Promise((resolve) => setTimeout(resolve, 0));

  const snapshot = Object.values(storage.values)
    .find((value) => value?.conversationKey === "chatgpt:conversation-kinds");
  assert.equal(snapshot.groups[0].previewTitle.length, 160);
  assert.deepEqual(snapshot.makers.map((maker) => maker.canonicalKind), ["list", "table"]);
});

test("close 会取消尚未执行的持久化任务", async () => {
  const storage = createMemoryStorage();
  const model = createMakerSnapshotModel({
    storage,
    createKey: () => "maker-cancelled",
    now: () => 70_000
  });
  await model.open(chatGPTScope("chatgpt:conversation-close"));

  model.reconcile(observation({ isConnected: true }));
  model.close();
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(Object.values(storage.values).some((value) => value?.conversationKey === "chatgpt:conversation-close"), false);
});

test("较早会话的异步加载不会覆盖新会话", async () => {
  const values = {};
  let releaseFirstSnapshotRead;
  const firstSnapshotRead = new Promise((resolve) => {
    releaseFirstSnapshotRead = resolve;
  });
  const firstStorageKey = `polaris.makerSnapshot.v2:chatgpt:${encodeURIComponent("chatgpt:conversation-old")}`;
  const storage = {
    values,
    async get(keys) {
      if (keys === firstStorageKey) {
        await firstSnapshotRead;
      }
      return {};
    },
    async set(items) {
      Object.assign(values, structuredClone(items));
    },
    async remove() {}
  };
  const model = createMakerSnapshotModel({ storage, now: () => 80_000 });

  const oldOpen = model.open(chatGPTScope("chatgpt:conversation-old"));
  await new Promise((resolve) => setTimeout(resolve, 0));
  const newView = await model.open(chatGPTScope("chatgpt:conversation-new"));
  releaseFirstSnapshotRead();
  const staleView = await oldOpen;

  assert.equal(newView.conversationKey, "chatgpt:conversation-new");
  assert.equal(staleView.conversationKey, "chatgpt:conversation-new");
});

test("首个 Maker 立即入队，后续变化使用 trailing debounce", async () => {
  const storage = createMemoryStorage();
  const timers = [];
  const model = createMakerSnapshotModel({
    storage,
    createKey: () => "maker-debounce",
    now: () => 90_000,
    setTimer: (callback, delay) => {
      timers.push({ callback, delay });
      return timers.length;
    },
    clearTimer: () => {}
  });
  await model.open(chatGPTScope("chatgpt:conversation-debounce"));

  model.reconcile(observation({ isConnected: true }, "初始标题"));
  await new Promise((resolve) => setTimeout(resolve, 0));
  const snapshot = () => Object.values(storage.values)
    .find((value) => value?.conversationKey === "chatgpt:conversation-debounce");
  assert.equal(snapshot().makers[0].title, "初始标题");

  model.reconcile(observation({ isConnected: true }, "更新标题"));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(snapshot().makers[0].title, "初始标题");
  assert.equal(timers[0].delay, 1_000);

  timers[0].callback();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(snapshot().makers[0].title, "更新标题");
});

test("v2 partial observation 保留未挂载消息，complete observation 删除已退出消息", async () => {
  const storage = createMemoryStorage();
  let nextKey = 1;
  const model = createMakerSnapshotModel({
    storage,
    createKey: () => `maker-v2-${nextKey++}`,
    now: () => 100_000
  });
  await model.open({ platformKey: "kimi", conversationKey: "https://www.kimi.com:conversation-1", persistence: true });

  const first = observation({ isConnected: true });
  first.coverage = "partial";
  first.authoritativeMessageKeys = null;
  first.mountedMessageKeys = ["kimi:assistant:1"];
  first.makers[0].sourceMessageKey = "kimi:assistant:1";
  model.reconcile(first);

  const partial = {
    coverage: "partial",
    authoritativeMessageKeys: null,
    groups: first.groups,
    mountedMessageKeys: [],
    makers: []
  };
  assert.equal(model.reconcile(partial).groups[0].headings.length, 1);

  const complete = {
    ...partial,
    coverage: "complete",
    authoritativeMessageKeys: [],
    groups: []
  };
  assert.deepEqual(model.reconcile(complete).groups, []);
});

test("v2 为每个平台维护独立索引和 LRU", async () => {
  const storage = createMemoryStorage();
  let timestamp = 110_000;
  let nextKey = 1;
  const model = createMakerSnapshotModel({
    storage,
    createKey: () => `maker-platform-${nextKey++}`,
    maxConversations: 1,
    now: () => timestamp
  });

  for (const [platformKey, conversationKey] of [
    ["chatgpt", "https://chatgpt.com:one"],
    ["doubao", "https://www.doubao.com:one"],
    ["chatgpt", "https://chatgpt.com:two"]
  ]) {
    await model.open({ platformKey, conversationKey, persistence: true });
    const nextObservation = observation({ isConnected: true });
    nextObservation.coverage = "complete";
    nextObservation.authoritativeMessageKeys = [`${platformKey}:assistant:1`];
    nextObservation.mountedMessageKeys = [`${platformKey}:assistant:1`];
    nextObservation.makers[0].sourceMessageKey = `${platformKey}:assistant:1`;
    model.reconcile(nextObservation);
    await new Promise((resolve) => setTimeout(resolve, 0));
    timestamp += 1_000;
  }

  assert.equal(storage.values["polaris.makerSnapshotIndex.v2:chatgpt"].length, 1);
  assert.equal(storage.values["polaris.makerSnapshotIndex.v2:doubao"].length, 1);
  assert.equal(Object.values(storage.values).some((value) => value?.conversationKey === "https://www.doubao.com:one"), true);
});

test("首次打开 ChatGPT 会话时惰性迁移 v1 并保留 makerKey", async () => {
  const storage = createMemoryStorage();
  const conversationKey = "https://chatgpt.com:legacy";
  const legacyConversationKey = `chatgpt:${conversationKey}`;
  const legacyStorageKey = `polaris.makerSnapshot.v1:${encodeURIComponent(legacyConversationKey)}`;
  storage.values[legacyStorageKey] = {
    schemaVersion: 1,
    conversationKey: legacyConversationKey,
    updatedAt: 120_000,
    expiresAt: 130_000,
    groups: [{ groupKey: "chatgpt-user-user-1", previewTitle: "旧问题", order: 0 }],
    makers: [{
      makerKey: "maker-legacy",
      groupKey: "chatgpt-user-user-1",
      assistantMessageId: "assistant-legacy",
      canonicalKind: "text",
      ordinalWithinKind: 0,
      titleFingerprint: "旧标题",
      title: "旧标题",
      level: 2,
      sourceType: "heading",
      order: 0,
      lastKnownScrollRatio: 0.2,
      lastSeenAt: 120_000
    }]
  };
  storage.values["polaris.makerSnapshotIndex.v1"] = [{
    conversationKey: legacyConversationKey,
    storageKey: legacyStorageKey,
    updatedAt: 120_000,
    lastAccessedAt: 120_000,
    expiresAt: 130_000,
    bytes: 100
  }];

  const model = createMakerSnapshotModel({ storage, now: () => 125_000 });
  const view = await model.open({ platformKey: "chatgpt", conversationKey, persistence: true });

  assert.equal(view.groups[0].headings[0].makerKey, "maker-legacy");
  assert.equal(Object.prototype.hasOwnProperty.call(storage.values, legacyStorageKey), false);
  const migrated = Object.values(storage.values).find((value) => value?.schemaVersion === 2);
  assert.equal(migrated.makers[0].sourceMessageKey, "assistant-legacy");
});

test("persistence false 的会话完全不访问 Storage", async () => {
  let storageCalls = 0;
  const storage = {
    async get() {
      storageCalls += 1;
      return {};
    },
    async set() {
      storageCalls += 1;
    },
    async remove() {
      storageCalls += 1;
    }
  };
  const model = createMakerSnapshotModel({ storage, createKey: () => "maker-memory-scope", now: () => 130_000 });
  await model.open({ platformKey: "xiaohongshu", conversationKey: "https://www.xiaohongshu.com/ai_chat", persistence: false });
  const nextObservation = observation({ isConnected: true });
  nextObservation.coverage = "partial";
  nextObservation.authoritativeMessageKeys = null;
  nextObservation.mountedMessageKeys = [];
  nextObservation.makers[0].sourceMessageKey = "";
  assert.equal(model.reconcile(nextObservation).groups[0].headings[0].makerKey, "maker-memory-scope");
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(storageCalls, 0);
});

test("partial observation 中已挂载消息以空 Maker 集合替换旧缓存", async () => {
  const model = createMakerSnapshotModel({ storage: createMemoryStorage(), createKey: () => "maker-mounted", now: () => 140_000 });
  await model.open({ platformKey: "doubao", conversationKey: "https://www.doubao.com:mounted", persistence: true });
  const first = observation({ isConnected: true });
  first.coverage = "partial";
  first.authoritativeMessageKeys = null;
  first.mountedMessageKeys = ["doubao:assistant:1"];
  first.makers[0].sourceMessageKey = "doubao:assistant:1";
  model.reconcile(first);

  const emptyMounted = {
    coverage: "partial",
    authoritativeMessageKeys: null,
    groups: first.groups,
    mountedMessageKeys: ["doubao:assistant:1"],
    makers: []
  };
  assert.equal(model.reconcile(emptyMounted).groups[0].headings.length, 0);
});

test("一个平台 Storage 失败不会阻止另一平台持久化", async () => {
  const storage = createMemoryStorage();
  const originalSet = storage.set;
  storage.set = async (items) => {
    if (Object.keys(items).some((key) => key.includes("qianwen"))) {
      throw new Error("qianwen quota");
    }
    return originalSet(items);
  };
  const errors = [];
  let nextKey = 1;
  const model = createMakerSnapshotModel({
    storage,
    createKey: () => `maker-isolated-${nextKey++}`,
    now: () => 150_000,
    onError: (error) => errors.push(error.message)
  });

  await model.open({ platformKey: "qianwen", conversationKey: "https://www.qianwen.com:one", persistence: true });
  await model.open({ platformKey: "chatgpt", conversationKey: "https://chatgpt.com:healthy", persistence: true });
  const nextObservation = observation({ isConnected: true });
  nextObservation.coverage = "complete";
  nextObservation.authoritativeMessageKeys = ["assistant-1"];
  nextObservation.mountedMessageKeys = ["assistant-1"];
  nextObservation.makers[0].sourceMessageKey = "assistant-1";
  model.reconcile(nextObservation);
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.deepEqual(errors, ["qianwen quota"]);
  assert.equal(Object.values(storage.values).some((value) => value?.conversationKey === "https://chatgpt.com:healthy"), true);
});

test("v2 写入失败时保留 ChatGPT v1 快照", async () => {
  const storage = createMemoryStorage();
  const conversationKey = "https://chatgpt.com:migration-fails";
  const legacyConversationKey = `chatgpt:${conversationKey}`;
  const legacyStorageKey = `polaris.makerSnapshot.v1:${encodeURIComponent(legacyConversationKey)}`;
  storage.values[legacyStorageKey] = {
    schemaVersion: 1,
    conversationKey: legacyConversationKey,
    updatedAt: 155_000,
    expiresAt: 170_000,
    groups: [],
    makers: [{ makerKey: "maker-legacy-safe", assistantMessageId: "assistant-safe", groupKey: "orphan" }]
  };
  const originalSet = storage.set;
  storage.set = async (items) => {
    if (Object.keys(items).some((key) => key.startsWith("polaris.makerSnapshot.v2:"))) {
      throw new Error("write failed");
    }
    return originalSet(items);
  };

  const model = createMakerSnapshotModel({ storage, now: () => 160_000 });
  await model.open({ platformKey: "chatgpt", conversationKey, persistence: true });

  assert.equal(Object.prototype.hasOwnProperty.call(storage.values, legacyStorageKey), true);
});

test("旧平台异步读取失败不会禁用随后打开的平台", async () => {
  const memoryStorage = createMemoryStorage();
  let rejectQianwenRead;
  const qianwenRead = new Promise((resolve, reject) => {
    rejectQianwenRead = reject;
  });
  const storage = {
    ...memoryStorage,
    async get(keys) {
      if (keys === "polaris.makerSnapshotIndex.v2:qianwen") {
        return qianwenRead;
      }
      return memoryStorage.get(keys);
    }
  };
  const model = createMakerSnapshotModel({
    storage,
    createKey: () => "maker-current-platform",
    now: () => 170_000
  });

  const staleOpen = model.open({
    platformKey: "qianwen",
    conversationKey: "https://www.qianwen.com:stale",
    persistence: true
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  await model.open({
    platformKey: "chatgpt",
    conversationKey: "https://chatgpt.com:current",
    persistence: true
  });
  rejectQianwenRead(new Error("stale qianwen read failed"));
  await staleOpen;

  model.reconcile(observation({ isConnected: true }));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(
    Object.values(memoryStorage.values).some((value) => value?.conversationKey === "https://chatgpt.com:current"),
    true
  );
});
