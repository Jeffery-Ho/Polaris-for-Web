import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const [backgroundSource, lifecycleSource] = await Promise.all([
  readFile(new URL("../src/background.js", import.meta.url), "utf8"),
  readFile(new URL("../src/window-lifecycle.js", import.meta.url), "utf8")
]);
const executableBackgroundSource = backgroundSource.replace(
  'import { matchingPolarisTab, restorePopupWindowUpdate } from "./window-lifecycle.js";\n',
  lifecycleSource.replaceAll("export ", "")
);

function createEvent() {
  let listener = null;
  return {
    addListener(next) {
      listener = next;
    },
    emit(...args) {
      return listener?.(...args);
    }
  };
}

async function runAction({ storedWindow, getError = null, updateError = null, syncGetError = null }) {
  const windowUrl = "chrome-extension://test/polaris-home.html";
  const sourceTab = { id: 42, windowId: 9, active: true, url: "https://chatgpt.com/c/test" };
  const local = {
    "polaris-window-id": storedWindow?.id ?? null,
    "polaris-window-tab-id": storedWindow?.tabs?.[0]?.id ?? null,
    "polaris-source-window-id": sourceTab.windowId,
    "polaris-source-tab-id": sourceTab.id
  };
  const action = createEvent();
  const calls = { creates: [], updates: [], contentRequests: [], runtimeMessages: [] };
  const noOpEvent = () => createEvent();
  const chrome = {
    action: { onClicked: action },
    runtime: {
      getURL(path) { return `chrome-extension://test/${path}`; },
      async sendMessage(message) { calls.runtimeMessages.push(message); },
      onMessage: noOpEvent()
    },
    storage: {
      local: {
        async get(key) {
          if (typeof key === "string") return { [key]: local[key] };
          return { ...local };
        },
        async set(values) { Object.assign(local, values); },
        async remove(keys) {
          for (const key of [].concat(keys)) delete local[key];
        }
      },
      sync: {
        async get() {
          if (syncGetError) throw syncGetError;
          return {};
        },
        async set() {},
        async remove() {}
      }
    },
    windows: {
      WINDOW_ID_NONE: -1,
      async get() {
        if (getError) throw getError;
        return storedWindow;
      },
      async create(data) {
        calls.creates.push(data);
        return { id: 10, type: "popup", tabs: [{ id: 99, url: windowUrl }] };
      },
      async update(id, data) {
        calls.updates.push({ id, data });
        if (updateError) throw updateError;
        return { id, ...data };
      },
      onFocusChanged: noOpEvent(),
      onRemoved: noOpEvent()
    },
    tabs: {
      async query() { return [sourceTab]; },
      async sendMessage(tabId, message) { calls.contentRequests.push({ tabId, message }); },
      async update() {},
      async get() { return sourceTab; },
      onActivated: noOpEvent(),
      onUpdated: noOpEvent(),
      onRemoved: noOpEvent()
    }
  };

  vm.runInNewContext(executableBackgroundSource, { chrome, URL, Number, Date, Promise, console });
  action.emit(sourceTab);
  await new Promise((resolve) => setTimeout(resolve, 0));
  return calls;
}

async function runWindowReady() {
  const windowUrl = "chrome-extension://test/polaris-home.html";
  const sourceTab = { id: 42, windowId: 7, active: false, url: "https://chatgpt.com/c/test" };
  const extensionTab = { id: 99, windowId: 7, active: true, url: windowUrl };
  const local = {
    "polaris-source-window-id": sourceTab.windowId,
    "polaris-source-tab-id": sourceTab.id
  };
  const runtimeMessage = createEvent();
  const sends = [];
  const noOpEvent = () => createEvent();
  const chrome = {
    action: { onClicked: noOpEvent() },
    runtime: {
      getURL(path) { return `chrome-extension://test/${path}`; },
      async sendMessage() {},
      onMessage: runtimeMessage
    },
    storage: {
      local: {
        async get(key) {
          if (typeof key === "string") return { [key]: local[key] };
          return { ...local };
        },
        async set(values) { Object.assign(local, values); },
        async remove(keys) {
          for (const key of [].concat(keys)) delete local[key];
        }
      },
      sync: {
        async get() { return {}; },
        async set() {},
        async remove() {}
      }
    },
    windows: {
      WINDOW_ID_NONE: -1,
      onFocusChanged: noOpEvent(),
      onRemoved: noOpEvent()
    },
    tabs: {
      async query(query) {
        if (query?.active) return [extensionTab];
        return [sourceTab, extensionTab];
      },
      async get(tabId) {
        return tabId === sourceTab.id ? sourceTab : extensionTab;
      },
      async sendMessage(tabId) { sends.push(tabId); },
      onActivated: noOpEvent(),
      onUpdated: noOpEvent(),
      onRemoved: noOpEvent()
    }
  };

  vm.runInNewContext(executableBackgroundSource, { chrome, URL, Number, Date, Promise, console });
  runtimeMessage.emit({
    type: "POLARIS_WINDOW_READY",
    windowId: extensionTab.windowId,
    windowTabId: extensionTab.id,
    windowType: "normal"
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  return sends;
}

test("缓存 ID 指向普通窗口时，点击扩展图标会创建新的 Polaris popup", async () => {
  const calls = await runAction({
    storedWindow: {
      id: 9,
      type: "normal",
      focused: true,
      tabs: [{ id: 42, url: "https://chatgpt.com/c/test" }]
    }
  });

  assert.equal(calls.creates.length, 1);
  assert.equal(calls.creates[0].type, "popup");
  assert.equal(calls.updates.length, 0);
});

test("有效的 Polaris popup 会恢复为正常状态并聚焦，不会重复创建", async () => {
  const calls = await runAction({
    storedWindow: {
      id: 9,
      type: "popup",
      state: "minimized",
      focused: false,
      tabs: [{ id: 42, url: "chrome-extension://test/polaris-home.html" }]
    }
  });

  assert.equal(calls.creates.length, 0);
  assert.equal(calls.updates.length, 1);
  assert.equal(calls.updates[0].id, 9);
  assert.equal(calls.updates[0].data.state, "normal");
  assert.equal(calls.updates[0].data.focused, true);
});

test("有效窗口在聚焦竞态失败后会清理并重建", async () => {
  const calls = await runAction({
    storedWindow: {
      id: 9,
      type: "popup",
      focused: true,
      tabs: [{ id: 42, url: "chrome-extension://test/polaris-home.html" }]
    },
    updateError: new Error("window closed")
  });

  assert.equal(calls.updates.length, 1);
  assert.equal(calls.creates.length, 1);
  assert.equal(calls.creates[0].type, "popup");
});

test("缓存窗口已关闭时会清理状态并创建新的 Polaris popup", async () => {
  const calls = await runAction({
    storedWindow: { id: 9, type: "popup", tabs: [{ id: 42, url: "chrome-extension://test/polaris-home.html" }] },
    getError: new Error("window closed")
  });

  assert.equal(calls.updates.length, 0);
  assert.equal(calls.creates.length, 1);
  assert.equal(calls.creates[0].type, "popup");
});

test("复用窗口后的状态请求失败不会重复创建 popup", async () => {
  const calls = await runAction({
    storedWindow: {
      id: 9,
      type: "popup",
      tabs: [{ id: 42, url: "chrome-extension://test/polaris-home.html" }]
    },
    syncGetError: new Error("temporary storage failure")
  });

  assert.equal(calls.updates.length, 1);
  assert.equal(calls.creates.length, 0);
});

test("启动时支持会话先请求内容状态，不先显示无会话空快照", async () => {
  const calls = await runAction({ storedWindow: null });

  assert.equal(calls.contentRequests.length, 1);
  assert.equal(calls.contentRequests[0].tabId, 42);
  assert.equal(calls.contentRequests[0].message.type, "POLARIS_WINDOW_REQUEST_STATE");
  const stateMessage = calls.runtimeMessages.find((message) => message.type === "POLARIS_WINDOW_STATE");
  assert.ok(stateMessage);
  assert.equal(stateMessage.snapshot.loading, true);
});

test("直接打开普通浏览器标签中的插件页面时仍请求已生成会话", async () => {
  const sends = await runWindowReady();
  assert.deepEqual(sends, [42]);
});
