import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const contentSource = await readFile(new URL("../src/content.js", import.meta.url), "utf8");
const manifests = await Promise.all([
  "../manifest.json",
  "../manifest.build.json"
].map(async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"))));

function functionSource(name, nextName) {
  const start = contentSource.indexOf(`function ${name}(`);
  const end = contentSource.indexOf(`function ${nextName}(`, start);
  assert.ok(start >= 0, `missing function ${name}`);
  assert.ok(end > start, `missing function boundary ${nextName}`);
  return contentSource.slice(start, end);
}

test("Grok 使用语义消息选择器和独立平台配置", () => {
  const platform = functionSource("currentPlatformKey", "getAssistantContainerSelectors");
  const assistantSelectors = functionSource("getAssistantContainerSelectors", "getAssistantContainers");
  const userSelectors = functionSource("getUserContainerSelectors", "doubaoMessageRoleForContainer");

  assert.match(contentSource, /function isGrokPage\(\) \{\s*return window\.location\.hostname === "grok\.com";/);
  assert.match(contentSource, /\["chatgpt", "claude", "gemini", "grok", "doubao"/);
  assert.match(contentSource, /grok: \[1, 2, 3\]/);
  assert.match(contentSource, /const GROK_ASSISTANT_MESSAGE_SELECTOR = "main \[data-testid=\\"assistant-message\\"\] \.response-content-markdown\.markdown";/);
  assert.match(contentSource, /const GROK_USER_MESSAGE_SELECTOR = "main \[data-testid=\\"user-message\\"\]";/);
  assert.match(platform, /isGrokPage\(\).*?return "grok"/s);
  assert.match(assistantSelectors, /isGrokPage\(\).*?GROK_ASSISTANT_MESSAGE_SELECTOR/s);
  assert.match(userSelectors, /isGrokPage\(\).*?GROK_USER_MESSAGE_SELECTOR/s);
});

test("Grok 默认启用 H1-H3、无序列表和加粗标题，仅默认关闭有序列表", () => {
  assert.match(contentSource, /DEFAULT_UNORDERED_LIST_BY_PLATFORM[\s\S]*?grok: true/);
  assert.match(contentSource, /DEFAULT_ENABLED_ORDERED_LIST_BY_PLATFORM[\s\S]*?grok: false/);
  assert.match(contentSource, /DEFAULT_ENABLED_STRONG_BY_PLATFORM[\s\S]*?grok: true/);
});

test("两个源 manifest 都会向 Grok 注入内容脚本与路由桥", () => {
  manifests.forEach((manifest) => {
    assert.equal(manifest.version, "0.53.3");
    assert.equal(manifest.version_name, "0.53.3(212)");
    assert.ok(manifest.host_permissions.includes("https://grok.com/*"));
    assert.ok(manifest.web_accessible_resources[0].matches.includes("https://grok.com/*"));
    assert.ok(manifest.content_scripts[0].matches.includes("https://grok.com/*"));
  });
});
