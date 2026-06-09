# 输入框 Mutation 稳定性修复

## 问题

- 用户在网页版 AI 对话框输入时，输入框 DOM 会持续变化。
- 内容脚本此前监听整个 `body`，输入区变化会触发 marker 重新扫描。
- 部分平台输入框使用 `contenteditable`、`role="textbox"` 或 ProseMirror，草稿内容可能被通用 Markdown fallback 误纳入扫描范围。

## 实现

- 新增 `USER_INPUT_SELECTOR`，覆盖 `textarea`、`input`、`contenteditable`、`role="textbox"` 和 `.ProseMirror`。
- `MutationObserver` 改为 `handleDocumentMutations`，忽略用户输入编辑器和扩展自身导航 root 内部的 DOM 变化。
- `getAssistantContainers()` 排除用户输入上下文和扩展自身 DOM，避免输入草稿影响 marker。
- assistant 回复区、页面新增回复和滚动/resize 仍按原逻辑触发重新计算。

## 验证

- `node --check src/content.js`
- `node -e 'JSON.parse(require("fs").readFileSync("manifest.json","utf8"))'`
- 在任一支持平台的输入框中输入普通文本和 Markdown 标题草稿，确认右侧 marker 不随输入内容变化。
- 在 assistant 生成新回复后，确认正文标题 marker 仍会更新。
