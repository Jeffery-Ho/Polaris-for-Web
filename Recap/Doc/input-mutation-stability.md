# Mutation 稳定性与 Maker 渐进渲染

## 问题

- 用户在网页版 AI 对话框输入时，输入框 DOM 会持续变化。
- 内容脚本此前监听整个 `body`，输入区变化会触发 marker 重新扫描。
- 部分平台输入框使用 `contenteditable`、`role="textbox"` 或 ProseMirror，草稿内容可能被通用 Markdown fallback 误纳入扫描范围。
- 流式回复会高频更新 DOM；此前 trailing debounce 每次都重置 120ms 计时器，持续输出时 Maker 可能直到回答暂停或结束才出现。

## 实现

- 新增 `USER_INPUT_SELECTOR`，覆盖 `textarea`、`input`、`contenteditable`、`role="textbox"` 和 `.ProseMirror`。
- `MutationObserver` 改为 `handleDocumentMutations`，忽略用户输入编辑器和扩展自身导航 root 内部的 DOM 变化。
- `getAssistantContainers()` 排除用户输入上下文和扩展自身 DOM，避免输入草稿影响 marker。
- assistant 回复区、页面新增回复和滚动/resize 仍按原逻辑触发重新计算。
- MutationObserver 的 Maker 输出改为“等待起点 / 渐进渲染”状态机。首个请求锁定 120ms 窗口，后续变更不再推迟该窗口。
- 等待阶段复用 `collectHeadings()` 的平台规则；仅发现非空标题、列表标题、有效表格或视频标题后进入渐进渲染，不显示空标题占位 Maker。
- 渐进阶段每个固定 120ms 窗口最多提交一次最新快照，不检测回答终点；路由切换和扩展失效会取消待执行任务并重新等待起点。
- 用户分组同步记录全部已见 key；流式阶段首次观察到新的最新分组时立即默认展开，不依赖 AI Maker 是否 ready，同一 key 后续更新不覆盖用户操作。
- 首次快照仍只展开最新分组；初始化后若直接上一组较晚首次出现且会话已确认存在 assistant 消息，则补充展开一次。该组之后的手动折叠、暂时消失与重现均不再被覆盖。
- ChatGPT 标题归属优先使用当前 assistant 消息 ID 映射；映射短暂缺失时仅回退相同 ID 的已知归属，仍连接且当前落入 orphan 的标题可按 DOM 身份恢复到上一帧分组。当前权威归属优先，不按标题文本猜测，路由切换和扩展失效会清空缓存。
- ChatGPT 历史空分组的点击状态依据当前会话分支是否存在关联 assistant 消息判断；没有可见 Maker 不再等同于回复未加载。
- MutationObserver 渐进渲染和 ChatGPT 会话刷新在重建 Marker 列表前临时禁用悬停过渡，并在首个绘制帧后恢复；连续重绘不得由旧帧回调提前恢复动效。

## 验证

- `node --check src/content.js`
- `node -e 'JSON.parse(require("fs").readFileSync("manifest.json","utf8"))'`
- 在任一支持平台的输入框中输入普通文本和 Markdown 标题草稿，确认右侧 marker 不随输入内容变化。
- 在 assistant 生成新回复后，确认正文标题 marker 仍会更新。
- 让 AI 生成包含多个标题的长回答，确认首个有效 Maker 在回答结束前出现，后续 Maker 持续追加且单个窗口不会重复渲染。
- 路由切换后确认旧任务不会输出；新页面在首个有效 Maker 出现前保持等待。
- 新用户分组刚出现但尚无 AI Maker 时确认其默认展开；手动收起后继续流式输出，确认不会被重新展开。
- 模拟最新分组先出现、直接上一组稍后带 assistant 消息补入，确认上一组仅补充展开一次；再手动收起并让它消失、重现，确认不会重开。
- 模拟 ChatGPT 当前映射暂时缺少上一组 assistant ID 或标题暂时落入 orphan，确认同 ID 和仍连接 DOM 可恢复原分组、重复标题不被猜测、断开节点不产生陈旧 Maker。
- 对已有 AI 消息但没有可见 Maker 的历史分组确认可自由展开或收起；仅无关联 AI 消息的历史分组显示回复尚未加载提示。
- 鼠标保持在用户分组、AI Maker 或折叠卡片上并触发连续流式更新，确认缩放、颜色、标题浮层和箭头不反复进场；停止刷新后重新移入，确认既有 hover 动效恢复。
