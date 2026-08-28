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

function observation(element, title = "第一节") {
  return {
    activeAssistantMessageIds: ["assistant-1"],
    groups: [{
      groupKey: "chatgpt-user-user-1",
      userMessageId: "user-1",
      previewTitle: "请总结",
      title: "请总结这篇文章",
      order: 0,
      hasAssistantMessage: true
    }],
    mountedAssistantMessageIds: ["assistant-1"],
    makers: [{
      assistantMessageId: "assistant-1",
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
  await model.open("chatgpt:conversation-1");

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
  await model.open("chatgpt:conversation-2");

  const pendingObservation = observation({ isConnected: true });
  pendingObservation.activeAssistantMessageIds = [];
  pendingObservation.mountedAssistantMessageIds = [];
  pendingObservation.makers[0].assistantMessageId = "";
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
  await model.open("chatgpt:conversation-pending-groups");

  const firstPending = observation({ isConnected: true });
  firstPending.activeAssistantMessageIds = [];
  firstPending.mountedAssistantMessageIds = [];
  firstPending.makers[0].assistantMessageId = "";
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
  await model.open("chatgpt:conversation-3");
  model.reconcile(observation({ isConnected: true }));

  const unmounted = observation(null);
  unmounted.mountedAssistantMessageIds = [];
  unmounted.makers = [];
  const cachedView = model.reconcile(unmounted);
  assert.equal(Reflect.get(cachedView.groups[0].headings[0], "makerKey"), "maker-stable");
  assert.equal(model.resolveElement("maker-stable"), null);

  const inactive = { ...unmounted, activeAssistantMessageIds: [], groups: [] };
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
  await firstModel.open("chatgpt:conversation-4");
  firstModel.reconcile(observation({ isConnected: true }));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const restoredModel = createMakerSnapshotModel({ storage, now: () => 5_000 });
  const restoredView = await restoredModel.open("chatgpt:conversation-4");
  const restoredMaker = restoredView.groups[0].headings[0];

  assert.equal(Reflect.get(restoredMaker, "makerKey"), "maker-restored");
  assert.equal(restoredModel.resolveElement("maker-restored"), null);
  assert.equal(restoredView.groups[0].user.title, "请总结");
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
  await firstModel.open("chatgpt:conversation-expiring");
  firstModel.reconcile(observation({ isConnected: true }));
  await new Promise((resolve) => setTimeout(resolve, 0));

  timestamp = 1_001;
  const expiredModel = createMakerSnapshotModel({ storage, now: () => timestamp, ttlMs: 1_000 });
  const expiredView = await expiredModel.open("chatgpt:conversation-expiring");

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
    await model.open(`chatgpt:${conversationKey}`);
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
  await model.open("chatgpt:conversation-large");
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
  await model.open("chatgpt:conversation-duplicates");

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
  assert.deepEqual((await model.open(conversationKey)).groups, []);
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
  await model.open("chatgpt:conversation-memory-only");
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
  await model.open("chatgpt:conversation-kinds");

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
  await model.open("chatgpt:conversation-close");

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
  const firstStorageKey = `polaris.makerSnapshot.v1:${encodeURIComponent("chatgpt:conversation-old")}`;
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

  const oldOpen = model.open("chatgpt:conversation-old");
  await new Promise((resolve) => setTimeout(resolve, 0));
  const newView = await model.open("chatgpt:conversation-new");
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
  await model.open("chatgpt:conversation-debounce");

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
