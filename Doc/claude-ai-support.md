# Claude.ai 支持

## 范围

Polaris `0.45.0(189)` 支持 `https://claude.ai/*` 上已挂载的聊天内容，不请求或支持 `claude.com`。

## DOM 接入

- 助手回答：`div[data-cds="Prose"].prose`
- 用户消息：`[data-cds="UserMessage"] [data-testid="user-message"]`

实现只依赖上述语义属性和标准 Markdown 子节点，不依赖 Claude 的哈希样式类名。现有 Maker 管线因此继续处理 H1/H2/H3、无序列表和表格，并提供用户分组、流式更新、搜索、跳转和 Chapter View。

## 验证边界

自动检查验证清单权限、平台配置和选择器接入。最终交互验收仍需在已登录的 Claude.ai 长对话中检查消息分组、流式更新和跳转行为；当前执行环境受地区限制，无法完成该实时页面验证。
