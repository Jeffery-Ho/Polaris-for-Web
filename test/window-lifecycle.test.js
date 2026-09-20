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
  const windowUrl = "chrome-extension://test/window.html";
  const sourceTab = { id: 42, windowId: 9, active: true, url: "https://chatgpt.com/c/test" };
  const local = {
    "polaris-window-id": storedWindow?.id ?? null,
    "polaris-window-tab-id": storedWindow?.tabs?.[0]?.id ?? null,
    "polaris-source-window-id": sourceTab.windowId,
    "polaris-source-tab-id": sourceTab.id
  };
  const action = createEvent();
  const calls = { creates: [], updates: [] };
  const noOpEvent = () => createEvent();
  const chrome = {
    action: { onClicked: action },
    runtime: {
      getURL(path) { return `chrome-extension://test/${path}`; },
      sendMessage: async () => {},
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
      async sendMessage() {},
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
      tabs: [{ id: 42, url: "chrome-extension://test/window.html" }]
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
      tabs: [{ id: 42, url: "chrome-extension://test/window.html" }]
    },
    updateError: new Error("window closed")
  });

  assert.equal(calls.updates.length, 1);
  assert.equal(calls.creates.length, 1);
  assert.equal(calls.creates[0].type, "popup");
});

test("缓存窗口已关闭时会清理状态并创建新的 Polaris popup", async () => {
  const calls = await runAction({
    storedWindow: { id: 9, type: "popup", tabs: [{ id: 42, url: "chrome-extension://test/window.html" }] },
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
      tabs: [{ id: 42, url: "chrome-extension://test/window.html" }]
    },
    syncGetError: new Error("temporary storage failure")
  });

  assert.equal(calls.updates.length, 1);
  assert.equal(calls.creates.length, 0);
});
