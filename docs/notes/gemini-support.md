# Google Gemini 支持

## 范围

Polaris 支持 `https://gemini.google.com/*` 上已挂载的 Gemini 对话内容，不请求或支持其他 Google 域名。

## DOM 接入

- 助手回答：`model-response message-content`
- 用户消息容器：`user-query`
- 用户正文：`user-query .query-content`，并按 `.query-text-line`、`.query-text` 顺序回退

实现依赖 Gemini 的语义自定义元素和标准 Markdown 子节点，不依赖运行时生成的哈希样式类名。现有 Maker 管线因此继续处理 H1/H2/H3、无序列表、表格、用户分组、流式更新、搜索、跳转和 Chapter View。

## 默认筛选

Gemini 默认启用 H1、H2、H3、无序列表和加粗文本 Marker；有序列表与其他平台一致，默认关闭，并可在设置中单独启用。

## 验证边界

自动检查验证 Manifest 权限、平台配置和选择器接入。最终交互验收仍需在已登录的 Gemini 长对话中检查消息分组、流式更新、搜索和跳转行为。
