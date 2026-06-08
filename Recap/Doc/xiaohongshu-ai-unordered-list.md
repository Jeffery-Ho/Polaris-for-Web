# 小红书 AI 与无序列表 Marker 支持

## 需求

- 支持小红书网页版 AI，入口包括 `https://diandian.xiaohongshu.com` 和 `https://www.xiaohongshu.com/ai_chat`。
- 小红书点点 assistant Markdown 正文支持 H1/H2/H3/H4 marker。
- 全平台支持无序列表里的标题项 marker。

## 实现

- Manifest 新增点点域名注入范围和图标资源匹配。
- 内容脚本新增 `xiaohongshu` 平台 key，并优先识别点点页面的 Markdown 正文容器。
- 点点线上同一套页面可落在 `diandian.xiaohongshu.com`、`www.xiaohongshu.com/ai_chat`、`www.askdiandian.com` 和 `www.diandianlife.top`，Manifest 必须同时覆盖这些入口，否则内容脚本不会注入。
- `www.xiaohongshu.com` 需要整站注入以覆盖从侧边栏进入 `/ai_chat` 的 SPA 路由；代码只在 `/ai_chat` 路径启用点点容器，普通小红书页面不收集 marker。
- 小红书主站 AI 页使用 `xhs-ai-chat-page` 页面壳，聊天正文候选容器包括 `round-item`、`scroll-container` 和 `chat-container`。
- 点点深度研究页使用 `markdown-styles-deep-research` 容器，需要和常规点点 Markdown 容器一起识别。
- 点点平台可识别 Markdown H4，并在设置里展示 H4 marker 开关；其他平台保留原有层级上限。
- 旧同步配置会通过 `configVersion` 迁移为小红书点点补启 H4；迁移后用户仍可手动关闭 H4。
- 无序列表标题使用独立 `unordered-list` 来源类型，设置里由“无序列表”开关控制，不再受 H3 开关影响。
- 旧同步配置缺少无序列表开关时默认全平台启用；用户可按平台关闭。
- 无序列表只识别明确标题项：首个加粗标题、`标题：正文` 格式标题、短独立标题。
- 无序列表会忽略嵌套列表、表格、代码块、引用和长正文列表项，避免普通项目符号正文过度生成 marker。

## 验证

- `node --check src/content.js`
- `node -e 'JSON.parse(require("fs").readFileSync("manifest.json","utf8"))'`
- 手动打开 `https://diandian.xiaohongshu.com`、`https://www.xiaohongshu.com/ai_chat`、`https://www.askdiandian.com` 或 `https://www.diandianlife.top` 上的点点分享/聊天页面，确认扩展注入后 assistant Markdown H1-H4 可生成 marker。
- 从 build 41 升级时确认点点平台设置默认包含 H4，且手动关闭 H4 后不会再次自动打开。
- 在任一已支持平台确认普通 H1-H3 marker 仍正常。
- 使用无序列表样例验证 `- **标题**：说明内容`、`- 标题：说明内容` 可生成无序列表 marker，关闭 H3 仍可显示，关闭“无序列表”后隐藏；嵌套列表和长正文列表项不会生成 marker。
