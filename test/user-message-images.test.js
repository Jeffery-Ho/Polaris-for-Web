import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  safeUserMessageImageUrl,
  userMessageThumbnailForSources
} from "../src/user-message-images.js";

const contentSource = await readFile(new URL("../src/content.js", import.meta.url), "utf8");

test("用户消息缩略图只接受 HTTPS 或同源 blob 地址", () => {
  const baseUrl = "https://chatgpt.com/c/example";
  assert.equal(safeUserMessageImageUrl("/images/example.png", baseUrl), "https://chatgpt.com/images/example.png");
  assert.equal(safeUserMessageImageUrl("blob:https://chatgpt.com/asset", baseUrl), "blob:https://chatgpt.com/asset");
  assert.equal(safeUserMessageImageUrl("blob:https://gemini.google.com/asset", baseUrl), "");
  assert.equal(safeUserMessageImageUrl("http://example.com/image.png", baseUrl), "");
  assert.equal(safeUserMessageImageUrl("data:image/png;base64,unsafe", baseUrl), "");
  assert.equal(safeUserMessageImageUrl("javascript:alert(1)", baseUrl), "");
});

test("用户消息缩略图保留首图、统计去重后的图片数", () => {
  const result = userMessageThumbnailForSources([
    "https://images.example/first.png",
    "https://images.example/first.png",
    "blob:https://chatgpt.com/second"
  ], "https://chatgpt.com/c/example");
  assert.deepEqual(result, {
    imageUrls: [
      "https://images.example/first.png",
      "blob:https://chatgpt.com/second"
    ],
    thumbnailSrc: "https://images.example/first.png",
    imageCount: 2
  });
});

test("全平台用户 Maker 使用语义 Gemini 附件选择器和通用用户消息图片回退", () => {
  assert.match(contentSource, /const GEMINI_USER_IMAGE_SELECTOR = "user-query-file-preview img, user-query-file-carousel img";/);
  assert.match(contentSource, /const USER_MESSAGE_IMAGE_SELECTOR = "img";/);
  assert.match(contentSource, /function userMessageImageSelector\(\) \{\s*return isGeminiPage\(\) \? GEMINI_USER_IMAGE_SELECTOR : USER_MESSAGE_IMAGE_SELECTOR;/);
  assert.match(contentSource, /function isUserMessageImage\(image, messageElement\) \{[\s\S]*?isInsideNavigationRoot\(image\)[\s\S]*?node !== messageElement[\s\S]*?USER_MESSAGE_AVATAR_SELECTOR/);
  assert.match(contentSource, /imageUrls,\s*thumbnailSrc,\s*imageCount,\s*isImageOnly,/);
  assert.match(contentSource, /signature: markerRenderSignature\(\["user",[\s\S]*?user\.imageUrls,[\s\S]*?user\.thumbnailSrc, user\.imageCount, user\.isImageOnly\]\)/);
});

test("图片地址属性变化会触发用户 Maker 刷新", () => {
  assert.match(contentSource, /const USER_MESSAGE_IMAGE_ATTRIBUTE_FILTER = \["src", "srcset", "data-src", "data-original", "data-url"\];/);
  assert.match(contentSource, /state\.observer\.observe\(document\.body, \{[\s\S]*?attributes: true,[\s\S]*?attributeFilter: USER_MESSAGE_IMAGE_ATTRIBUTE_FILTER,[\s\S]*?childList: true,/);
  assert.match(contentSource, /function syncOpenImagePreviewForThumbnail\(labelThumbnail\) \{[\s\S]*?state\.imagePreviewUrls = urls;[\s\S]*?syncImagePreviewOverlay\(overlay\)/);
});

test("用户图片可从延迟加载属性读取地址并避免失败图重复显示", () => {
  assert.match(contentSource, /function firstImageSrcsetUrl\(image\)/);
  assert.match(contentSource, /function userMessageImageSource\(image\) \{[\s\S]*?const candidates = \[[\s\S]*?getAttribute\("data-src"\)[\s\S]*?getAttribute\("data-original"\)[\s\S]*?getAttribute\("data-url"\)[\s\S]*?candidates\.find\(\(candidate\) => safeUserMessageImageUrl\(candidate, window\.location\.href\)\)/);
  assert.match(contentSource, /thumbnail\.dataset\.failedSrc/);
  assert.match(contentSource, /labelThumbnail\.removeAttribute\("src"\)/);
  assert.match(contentSource, /thumbnail\.removeAttribute\("src"\)/);
});
