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
- ChatGPT 历史分组的点击状态同时依据关联 assistant 消息与已生成 Maker 判断；任一证据存在都允许展开或收起，只有两者都不存在且不是最新分组时才提示回复未加载。
- MutationObserver 渐进渲染和 ChatGPT 会话刷新在重建 Marker 列表前临时禁用悬停过渡，并在首个绘制帧后恢复；连续重绘不得由旧帧回调提前恢复动效。
- 渐进快照先转换为带稳定 key 和视觉签名的 Maker 模型；模型未变化时只刷新跳转数据，不操作列表 DOM。标题继续生成时原位更新同一节点，新增、删除和排序才执行增量协调。
- 列表更新不再清空容器或取消滚动动画；协调前后以首个可见 Maker 为视觉锚点，并以相同位移修正活动动画目标与拖动起点/范围，生成期间保留滚动、焦点与 hover。整体折叠期间仅刷新内存快照，重新展开后一次同步最新模型。
- 路由切换、扩展失效和会话消失会清空协调缓存；缓存不写入 Chrome Storage，也不会跨刷新或跨对话恢复。

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
- 对已有 AI 消息但没有可见 Maker，以及已有 Maker 但 assistant 元数据暂时滞后的历史分组，确认均可自由展开或收起；仅两种证据都不存在的历史分组显示回复尚未加载提示。
- 鼠标保持在用户分组、AI Maker 或折叠卡片上并触发连续流式更新，确认缩放、颜色、标题浮层和箭头不反复进场；停止刷新后重新移入，确认既有 hover 动效恢复。
- 生成长回复时连续滚动或拖动 Maker 列表，确认已有节点不被替换、滚动位置不跳回顶部、新 Maker 不自动拉到底部；同时验证整体折叠和用户分组折叠不会被后续快照覆盖。
