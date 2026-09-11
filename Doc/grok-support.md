# Grok 支持

## 范围

Polaris 支持 `https://grok.com/*` 上已挂载的 Grok 对话内容，覆盖 `/c/` 和 `/share/` 路由，不请求或支持其他域名。

## DOM 接入

- 助手正文：`main [data-testid="assistant-message"] .response-content-markdown.markdown`
- 用户消息：`main [data-testid="user-message"]`
- 消息顺序容器：`[data-scroll-anchor-root="true"]`

实现依赖 Grok 的语义 `data-testid` 属性和标准 Markdown 子节点，不依赖运行时生成的 Tailwind 样式类名。现有 Maker 管线因此继续处理 H1/H2/H3、无序列表、表格、用户分组、流式更新、搜索、跳转和 Chapter View。

## 默认筛选

Grok 默认启用 H1、H2、H3、无序列表和加粗文本 Marker；有序列表与其他平台一致，默认关闭，并可在设置中单独启用。

## 验证边界

自动检查验证 Manifest 权限、平台配置和选择器接入。分享页 DOM 已完成结构验证；最终流式更新、新建对话、路由切换和前进后退验收仍需在已登录的 Grok `/c/...` 长对话中完成。
