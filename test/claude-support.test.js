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
  return contentSource.slice(start, end);
}

test("Claude.ai 使用语义消息选择器和独立平台配置", () => {
  const platform = functionSource("currentPlatformKey", "getAssistantContainerSelectors");
  const assistantSelectors = functionSource("getAssistantContainerSelectors", "getAssistantContainers");
  const userSelectors = functionSource("getUserContainerSelectors", "doubaoMessageRoleForContainer");

  assert.match(contentSource, /function isClaudePage\(\) \{\s*return window\.location\.hostname === "claude\.ai";/);
  assert.match(contentSource, /\["chatgpt", "claude", "doubao"/);
  assert.match(contentSource, /claude: \[1, 2, 3\]/);
  assert.match(contentSource, /claude: true/);
  assert.match(platform, /isClaudePage\(\).*?return "claude"/s);
  assert.match(contentSource, /const CLAUDE_ASSISTANT_MESSAGE_SELECTOR = 'div\[data-cds="Prose"\]\.prose';/);
  assert.match(contentSource, /const CLAUDE_USER_MESSAGE_SELECTOR = '\[data-cds="UserMessage"\] \[data-testid="user-message"\]';/);
  assert.match(assistantSelectors, /isClaudePage\(\).*?CLAUDE_ASSISTANT_MESSAGE_SELECTOR/s);
  assert.match(userSelectors, /isClaudePage\(\).*?CLAUDE_USER_MESSAGE_SELECTOR/s);
});

test("两个源 manifest 都会向 Claude.ai 注入内容脚本与路由桥", () => {
  manifests.forEach((manifest) => {
    assert.equal(manifest.version, "0.45.0");
    assert.equal(manifest.version_name, "0.45.0(189)");
    assert.ok(manifest.host_permissions.includes("https://claude.ai/*"));
    assert.ok(manifest.web_accessible_resources[0].matches.includes("https://claude.ai/*"));
    assert.ok(manifest.content_scripts[0].matches.includes("https://claude.ai/*"));
  });
});
