import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const contentSource = readFileSync(new URL("../src/content.js", import.meta.url), "utf8");

test("Maker 队列为 tips 阴影保留完整缓冲区", () => {
  assert.match(styles, /--gpt-marker-shadow-buffer: 32px;/);
  assert.match(
    styles,
    /max-height: calc\(var\(--queue-visible-count, 30\) \* 44px \+ var\(--gpt-marker-shadow-buffer\) \* 2\);/
  );
  assert.doesNotMatch(styles, /max\(0px, calc\(100% - 52px/);
  assert.match(
    styles,
    /\.gpt-paragraph-nav__list \{[\s\S]*?padding: var\(--gpt-marker-shadow-buffer\) var\(--gpt-marker-shadow-buffer\) var\(--gpt-marker-shadow-buffer\) 0;/
  );
});

test("Maker tips 使用贴近本体的轻量弥散阴影", () => {
  assert.match(
    styles,
    /\.gpt-paragraph-nav__label \{[\s\S]*?box-shadow: 0 0 12px rgba\(15, 23, 42, 0\.18\);/
  );
});

test("缩小模式为用户 Maker 的标题、内边距和折叠箭头分别预留宽度", () => {
  assert.match(
    styles,
    /gpt-paragraph-nav__marker\.gpt-paragraph-nav__marker--user \{\n  max-width: min\(190px, calc\(100vw - 28px\)\);/
  );
  assert.match(
    styles,
    /gpt-paragraph-nav__marker--user \.gpt-paragraph-nav__preview \{\n  max-width: 160px;/
  );
  assert.match(
    styles,
    /gpt-paragraph-nav__user-chevron \{[\s\S]*?flex: 0 0 8px;[\s\S]*?width: 8px;[\s\S]*?height: 8px;/
  );
});

test("用户 Maker 默认以单行末尾省略长标题，并保留折叠箭头", () => {
  assert.match(
    styles,
    /\.gpt-paragraph-nav__marker--user \.gpt-paragraph-nav__preview \{[\s\S]*?flex: 1 1 auto;[\s\S]*?min-width: 0;[\s\S]*?max-width: calc\(100% - 14px\);[\s\S]*?max-height: 1\.2em;[\s\S]*?font: 500 11px\/1\.2 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;[\s\S]*?white-space: nowrap !important;[\s\S]*?overflow-wrap: normal !important;[\s\S]*?word-break: normal !important;/
  );
});

test("用户 Maker 图片缩略图固定尺寸，纯图片消息不显示空标题", () => {
  assert.match(
    styles,
    /\.gpt-paragraph-nav__user-thumbnail \{[\s\S]*?flex: 0 0 24px;[\s\S]*?min-width: 24px !important;[\s\S]*?max-width: 24px !important;[\s\S]*?width: 24px !important;[\s\S]*?height: 24px !important;[\s\S]*?object-fit: cover !important;/
  );
  assert.match(styles, /\.gpt-paragraph-nav__marker--user\.is-image-only \.gpt-paragraph-nav__preview \{\n  display: none !important;/);
});

test("用户 Maker 提示条显示与消息缩略图同尺寸的大图", () => {
  assert.match(contentSource, /gpt-paragraph-nav__label-thumbnail/);
  assert.match(contentSource, /labelThumbnail\.src = item\.thumbnailSrc/);
  assert.match(styles, /\.gpt-paragraph-nav__label-thumbnail \{[\s\S]*?width: 112px !important;[\s\S]*?height: 112px !important;/);
  assert.match(styles, /\.gpt-paragraph-nav__label--user \{[\s\S]*?flex-direction: column;/);
});

test("用户 Maker 图片提示条定位在 Maker 左侧并垂直居中", () => {
  assert.match(styles, /\.gpt-paragraph-nav__label--user \{[\s\S]*?top: 50%;[\s\S]*?right: calc\(100% \+ 8px\);[\s\S]*?bottom: auto;[\s\S]*?left: auto;[\s\S]*?transform: translate\(6px, -50%\);/);
  assert.match(styles, /\.gpt-paragraph-nav__marker-shell:hover \.gpt-paragraph-nav__label--user \{[\s\S]*?transform: translate\(0, -50%\);/);
});

test("用户 Maker 图片提示条与 Maker 水平对齐，纯图片不显示图片说明文字", () => {
  assert.match(
    styles,
    /\.gpt-paragraph-nav__label--user \{[\s\S]*?top: 50%;[\s\S]*?right: calc\(100% \+ 8px\);[\s\S]*?bottom: auto;[\s\S]*?left: auto;[\s\S]*?transform: translate\(6px, -50%\);/
  );
  assert.match(
    styles,
    /\.gpt-paragraph-nav__marker-shell:hover \.gpt-paragraph-nav__label--user \{[\s\S]*?transform: translate\(0, -50%\);/
  );
  assert.match(contentSource, /label\.classList\.toggle\("is-image-only", item\.isImageOnly\)/);
  assert.match(
    styles,
    /\.gpt-paragraph-nav__label--user\.is-image-only \.gpt-paragraph-nav__label-text \{\n  display: none !important;/
  );
});

test("Maker 提示条和浮动提示条使用统一显示层级", () => {
  assert.match(styles, /--gpt-nav-tooltip-z-index: 3;/);
  assert.match(
    styles,
    /\.gpt-paragraph-nav__label \{[\s\S]*?z-index: var\(--gpt-nav-tooltip-z-index\);/
  );
  assert.match(
    styles,
    /\.gpt-paragraph-nav__floating-active \{[\s\S]*?z-index: var\(--gpt-nav-tooltip-z-index\);/
  );
});

test("当前 Maker 提示条所在行在 Maker 列表中保持最高层级", () => {
  assert.match(
    styles,
    /\.gpt-paragraph-nav__marker-row \{[\s\S]*?position: relative;[\s\S]*?z-index: 0;/
  );
  assert.match(
    styles,
    /\.gpt-paragraph-nav__marker-row:has\(\.gpt-paragraph-nav__marker-shell:hover\) \{[\s\S]*?z-index: var\(--gpt-nav-tooltip-z-index\);/
  );
});

test("提示条图片独立响应点击，并支持键盘打开页内画廊", () => {
  assert.match(contentSource, /gpt-paragraph-nav__marker-shell/);
  assert.match(contentSource, /labelThumbnail\.setAttribute\("role", "button"\)/);
  assert.match(contentSource, /labelThumbnail\.tabIndex = -1/);
  assert.match(contentSource, /openImagePreview\(userImagePreviewSources\.get\(labelThumbnail\) \|\| \[\], labelThumbnail\)/);
  assert.match(contentSource, /event\.stopPropagation\(\);[\s\S]*?openImagePreview/);
});

test("页内图片画廊提供计数、切换、关闭和失败回退", () => {
  assert.match(contentSource, /const IMAGE_PREVIEW_CLASS = "gpt-paragraph-nav__image-preview-overlay";/);
  assert.match(contentSource, /role", "dialog"/);
  assert.match(contentSource, /stepImagePreview\(-1\)/);
  assert.match(contentSource, /stepImagePreview\(1\)/);
  assert.match(contentSource, /closeImagePreviewOverlay\(\)/);
  assert.match(contentSource, /userMarker\.imagePreviewLoadFailure/);
  assert.match(styles, /--gpt-nav-image-preview-z-index: 2147483648;/);
  assert.match(styles, /\.gpt-paragraph-nav__image-preview-overlay \{[\s\S]*?z-index: var\(--gpt-nav-image-preview-z-index\);/);
  assert.match(styles, /\.gpt-paragraph-nav__image-preview-image \{[\s\S]*?object-fit: contain;/);
});

test("图片预览遮罩沿用 AI content 毛玻璃背景", () => {
  assert.match(
    styles,
    /\.gpt-paragraph-nav__image-preview-overlay \{[\s\S]*?background: var\(--gpt-ai-content-bg\);[\s\S]*?background: color-mix\(in srgb, var\(--gpt-ai-content-bg\) 76%, transparent\);[\s\S]*?-webkit-backdrop-filter: blur\(var\(--gpt-glass-blur\)\) saturate\(var\(--gpt-glass-saturate\)\);[\s\S]*?backdrop-filter: blur\(var\(--gpt-glass-blur\)\) saturate\(var\(--gpt-glass-saturate\)\);/
  );
  assert.match(styles, /--gpt-ai-content-bg: var\(--gpt-glass-bg\);/);
  assert.match(
    styles,
    /\.gpt-paragraph-nav__image-preview-content \{[\s\S]*?background: var\(--gpt-ai-content-bg\);[\s\S]*?background: color-mix\(in srgb, var\(--gpt-ai-content-bg\) 76%, transparent\);/
  );
  assert.match(contentSource, /function firstOpaqueBackgroundColor\(elements\)/);
  assert.match(contentSource, /root\.style\.setProperty\("--gpt-ai-content-bg", aiContentBackground\)/);
  assert.doesNotMatch(
    styles,
    /\.gpt-paragraph-nav__image-preview-overlay \{[\s\S]*?background: rgba\(2, 6, 23, 0\.62\);/
  );
});

test("图片预览关闭按钮复用章节弹窗的关闭按钮定义", () => {
  assert.match(
    contentSource,
    /closeButton\.className = "gpt-paragraph-nav__image-preview-close gpt-paragraph-nav__explosion-close";/
  );
  assert.match(
    styles,
    /\.gpt-paragraph-nav__image-preview-overlay \{[\s\S]*?--gpt-explosion-close-bg: rgba\(15, 23, 42, 0\.05\);/
  );
  assert.match(
    styles,
    /\.gpt-paragraph-nav__image-preview-close\.gpt-paragraph-nav__explosion-close \{[\s\S]*?position: absolute;[\s\S]*?top: 12px;[\s\S]*?right: 12px;/
  );
  assert.doesNotMatch(styles, /\.gpt-paragraph-nav__image-preview-close::before/);
  assert.doesNotMatch(styles, /\.gpt-paragraph-nav__image-preview-close:hover/);
});

test("图片预览翻页按钮复用浅灰默认背景并移除照片阴影", () => {
  assert.match(
    styles,
    /\.gpt-paragraph-nav__image-preview-overlay \{[\s\S]*?--gpt-explosion-action-bg: rgba\(15, 23, 42, 0\.05\);[\s\S]*?--gpt-explosion-action-text: var\(--gpt-arco-text-2\);/
  );
  assert.match(
    styles,
    /\.gpt-paragraph-nav__image-preview-nav \{[\s\S]*?border: 1px solid var\(--gpt-explosion-action-border\);[\s\S]*?background: var\(--gpt-explosion-action-bg\);[\s\S]*?color: var\(--gpt-explosion-action-text\);/
  );
  assert.match(
    styles,
    /\.gpt-paragraph-nav__image-preview-counter,[\s\S]*?color: var\(--gpt-arco-text-2\);/
  );
  assert.match(
    styles,
    /\.gpt-paragraph-nav__image-preview-image \{[\s\S]*?box-shadow: none;/
  );
});

test("缩小模式为折叠分组的标题、余量和箭头扩展宽度", () => {
  assert.match(
    styles,
    /is-control-minimized \.gpt-paragraph-nav__fold \{\n  max-width: min\(280px, calc\(100vw - 28px\)\);/
  );
});

test("折叠 Maker 分组仅保留后置余量和箭头", () => {
  assert.doesNotMatch(contentSource, /gpt-paragraph-nav__fold-count/);
  assert.doesNotMatch(styles, /gpt-paragraph-nav__fold-count/);
  assert.match(contentSource, /gpt-paragraph-nav__fold-remainder/);
  assert.match(contentSource, /gpt-paragraph-nav__fold-chevron/);
});

test("Maker 正文默认左对齐且不改变 AI 与用户分组的队列位置", () => {
  assert.match(
    styles,
    /\.gpt-paragraph-nav__marker \{[^}]*justify-content: flex-start;[^}]*text-align: left;/
  );
  assert.match(
    styles,
    /\.gpt-paragraph-nav__floating-active \{[^}]*justify-content: flex-start;[^}]*text-align: left;/
  );
  assert.match(
    styles,
    /\.gpt-paragraph-nav__fold-label \{[^}]*text-align: left;/
  );
  assert.match(
    styles,
    /\.gpt-paragraph-nav__marker-row--ai \{\n  justify-content: flex-start;\n\}[\s\S]*?\.gpt-paragraph-nav__marker-row--user \{\n  justify-content: flex-end;\n\}/
  );
});

test("搜索栏默认沿用主导航背景，悬停时显示输入背景", () => {
  assert.match(
    styles,
    /\.gpt-paragraph-nav__search-input \{[\s\S]*?background: var\(--gpt-glass-dark-button-bg\);/
  );
  assert.match(
    styles,
    /\.gpt-paragraph-nav__search-input:hover \{\n  background: var\(--gpt-glass-input-bg\);\n\}/
  );
  assert.match(
    styles,
    /\.gpt-paragraph-nav__search-input::placeholder \{\n  color: var\(--gpt-arco-text-2\);\n\}/
  );
});
