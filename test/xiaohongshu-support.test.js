import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const contentSource = await readFile(new URL("../src/content.js", import.meta.url), "utf8");
const i18nSource = await readFile(new URL("../src/i18n.js", import.meta.url), "utf8");
const readmeSource = await readFile(new URL("../README.md", import.meta.url), "utf8");

function functionSource(name, nextName) {
  const start = contentSource.indexOf(`  function ${name}(`);
  const end = nextName ? contentSource.indexOf(`  function ${nextName}(`, start) : contentSource.length;
  return contentSource.slice(start, end);
}

test("小红书点点 AI 平台覆盖生产域名和主站 AI 对话路由", () => {
  const platform = functionSource("isXiaohongshuPage", "isXiaohongshuMainChatPage");
  assert.match(platform, /diandian\.xiaohongshu\.com/);
  assert.match(platform, /www\.xiaohongshu\.com.*ai_chat/s);
  assert.match(platform, /www\.askdiandian\.com/);
  assert.match(platform, /www\.diandianlife\.top/);
  assert.match(functionSource("isUnsupportedXiaohongshuMainPage", "isSupportedRoute"), /!window\.location\.pathname\.startsWith\("\/ai_chat"\)/);
});

test("小红书点点 AI 使用专用 assistant、用户消息和无 Markdown 回退选择器", () => {
  const assistants = functionSource("getAssistantContainerSelectors", "getAssistantContainers");
  const users = functionSource("getUserContainerSelectors", "doubaoMessageRoleForContainer");
  const fallback = functionSource("getXiaohongshuUserFallbackContainers", "normalizeTitle");

  assert.match(assistants, /isXiaohongshuPage\(\)/);
  assert.match(assistants, /XIAOHONGSHU_ASSISTANT_MARKDOWN_SELECTOR/);
  assert.match(users, /XIAOHONGSHU_USER_MESSAGE_ROOT_SELECTOR/);
  assert.match(users, /XIAOHONGSHU_USER_MESSAGE_SELECTOR/);
  assert.match(fallback, /XIAOHONGSHU_MESSAGE_ITEM_SELECTOR/);
  assert.match(fallback, /!node\.querySelector\(XIAOHONGSHU_ASSISTANT_MARKDOWN_SELECTOR\)/);
});

test("小红书点点 AI 默认显示 H1-H4 并出现在支持平台说明中", () => {
  assert.match(contentSource, /return platformKey === "xiaohongshu" \? 4 : 3/);
  assert.match(i18nSource, /Xiaohongshu Diandian AI/);
  assert.match(i18nSource, /小红书点点 AI/);
  assert.match(readmeSource, /Xiaohongshu Diandian AI/);
});
