# ChatGPT Header 工具栏导航

Polaris 默认仍显示在页面右侧。可直接将完整的 Navigation、Chapters 和 About&Settings 胶囊拖入 ChatGPT 会话 Header 右侧工具栏；ChatGPT 的“关于与设置”面板也可开启“放入 ChatGPT Header 工具栏”。

Header 模式下，Marker 队列、搜索框和设置面板仍固定在胶囊下方。胶囊左上角原本的最小化按钮会变为拖动把手：拖动超过 4px 后，可在 ChatGPT 原生工具栏按钮之间重新停靠。该操作只移动 Polaris，不会调整 Share 或更多等宿主按钮的顺序。

停靠位置通过 `chrome.storage.sync` 保存，适用于所有 ChatGPT 会话和同步设备。ChatGPT 重绘 Header、工具栏空间不足或找不到可用动作组时，Polaris 会临时回退至右侧悬浮布局，并在下次可挂载时恢复。Claude 和其他支持的网站不受影响。
