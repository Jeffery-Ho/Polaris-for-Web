import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  createPageThemeWatcher,
  pageThemeFromColors
} from "../src/page-theme.js";

const contentSource = readFileSync(new URL("../src/content.js", import.meta.url), "utf8");
const settingsStyles = readFileSync(new URL("../src/settings-panel.css", import.meta.url), "utf8");

class FakeMediaQueryList {
  constructor() {
    this.listeners = new Set();
  }

  addEventListener(type, listener) {
    if (type === "change") {
      this.listeners.add(listener);
    }
  }

  removeEventListener(type, listener) {
    if (type === "change") {
      this.listeners.delete(listener);
    }
  }

  emitChange() {
    this.listeners.forEach((listener) => listener({ matches: true }));
  }
}

class FakeMutationObserver {
  static instances = [];

  constructor(callback) {
    this.callback = callback;
    this.observed = [];
    this.isDisconnected = false;
    FakeMutationObserver.instances.push(this);
  }

  observe(target, options) {
    this.observed.push({ target, options });
  }

  disconnect() {
    this.isDisconnected = true;
  }

  emit(mutations) {
    this.callback(mutations);
  }
}

function fakeThemeEnvironment() {
  let nextFrameId = 0;
  let frameCallback = null;
  const mediaQueryList = new FakeMediaQueryList();
  const surfaces = {
    documentElement: { className: "" },
    body: {},
    main: {},
    roleMain: {}
  };
  const document = {
    documentElement: surfaces.documentElement,
    body: surfaces.body,
    querySelector(selector) {
      if (selector === "main") {
        return surfaces.main;
      }
      if (selector === '[role="main"]') {
        return surfaces.roleMain;
      }
      return null;
    }
  };
  const window = {
    matchMedia() {
      return mediaQueryList;
    },
    requestAnimationFrame(callback) {
      frameCallback = callback;
      nextFrameId += 1;
      return nextFrameId;
    },
    cancelAnimationFrame() {
      frameCallback = null;
    }
  };

  return {
    document,
    mediaQueryList,
    runFrame() {
      const callback = frameCallback;
      frameCallback = null;
      callback?.();
    },
    surfaces,
    window
  };
}

test("uses the first opaque page surface to determine a light theme", () => {
  assert.equal(pageThemeFromColors([
    "rgba(20, 22, 30, 0.2)",
    "rgb(255, 255, 255)"
  ], "dark"), "light");
});

test("uses the first opaque page surface to determine a dark theme", () => {
  assert.equal(pageThemeFromColors(["rgb(20, 22, 30)"], "light"), "dark");
});

test("falls back when page surfaces are transparent or unavailable", () => {
  assert.equal(pageThemeFromColors(["transparent", "rgba(0, 0, 0, 0.2)"], "dark"), "dark");
});

test("updates on system theme changes on the next animation frame", () => {
  FakeMutationObserver.instances = [];
  const environment = fakeThemeEnvironment();
  let updateCount = 0;
  createPageThemeWatcher({
    document: environment.document,
    MutationObserver: FakeMutationObserver,
    onChange: () => {
      updateCount += 1;
    },
    window: environment.window
  });

  environment.mediaQueryList.emitChange();
  assert.equal(updateCount, 0);
  environment.runFrame();
  assert.equal(updateCount, 1);
});

test("coalesces page theme mutations and observes all page surfaces", () => {
  FakeMutationObserver.instances = [];
  const environment = fakeThemeEnvironment();
  let updateCount = 0;
  createPageThemeWatcher({
    document: environment.document,
    MutationObserver: FakeMutationObserver,
    onChange: () => {
      updateCount += 1;
    },
    window: environment.window
  });

  const observer = FakeMutationObserver.instances[0];
  const structureObserver = FakeMutationObserver.instances[1];
  assert.deepEqual(observer.observed.map(({ target }) => target), [
    environment.surfaces.documentElement,
    environment.surfaces.body,
    environment.surfaces.main,
    environment.surfaces.roleMain
  ]);
  assert.deepEqual(observer.observed[0].options.attributeFilter, [
    "class",
    "style",
    "data-theme",
    "data-color-mode",
    "data-color-scheme",
    "data-dark-mode"
  ]);
  observer.emit([{ type: "attributes", target: environment.surfaces.body }]);
  observer.emit([{ type: "attributes", target: environment.surfaces.main }]);
  environment.runFrame();
  assert.equal(updateCount, 1);

  environment.surfaces.main = {
    matches(selector) {
      return selector === "main, [role=\"main\"]";
    },
    querySelector() {
      return null;
    }
  };
  structureObserver.emit([{
    addedNodes: [environment.surfaces.main],
    removedNodes: [],
    target: environment.document.body,
    type: "childList"
  }]);
  environment.runFrame();
  assert.equal(updateCount, 2);
  assert.equal(observer.observed.some(({ target }) => target === environment.surfaces.main), true);
});

test("disposes system and page theme listeners before a pending update runs", () => {
  FakeMutationObserver.instances = [];
  const environment = fakeThemeEnvironment();
  let updateCount = 0;
  const watcher = createPageThemeWatcher({
    document: environment.document,
    MutationObserver: FakeMutationObserver,
    onChange: () => {
      updateCount += 1;
    },
    window: environment.window
  });

  environment.mediaQueryList.emitChange();
  watcher.dispose();
  environment.runFrame();

  assert.equal(updateCount, 0);
  assert.equal(environment.mediaQueryList.listeners.size, 0);
  assert.equal(FakeMutationObserver.instances[0].isDisconnected, true);
  assert.equal(FakeMutationObserver.instances[1].isDisconnected, true);
});

test("ignores the extension drag class on the document root", () => {
  FakeMutationObserver.instances = [];
  const environment = fakeThemeEnvironment();
  let updateCount = 0;
  createPageThemeWatcher({
    document: environment.document,
    MutationObserver: FakeMutationObserver,
    onChange: () => {
      updateCount += 1;
    },
    window: environment.window
  });

  environment.surfaces.documentElement.className = "gpt-paragraph-nav--dragging";
  FakeMutationObserver.instances[0].emit([{
    attributeName: "class",
    oldValue: "",
    target: environment.surfaces.documentElement,
    type: "attributes"
  }]);
  environment.runFrame();

  assert.equal(updateCount, 0);
});

test("content and settings surfaces use the live page theme", () => {
  assert.match(contentSource, /state\.pageThemeWatcher = createPageThemeWatcher\(/);
  assert.match(contentSource, /state\.pageThemeWatcher\?\.dispose\(\);/);
  assert.match(contentSource, /settings\.dataset\.pageTheme = root\.dataset\.pageTheme \|\| "dark";/);
  assert.match(settingsStyles, /:host\(\[data-page-theme="light"\]\)/);
  assert.doesNotMatch(settingsStyles, /@media \(prefers-color-scheme: light\)/);
});
