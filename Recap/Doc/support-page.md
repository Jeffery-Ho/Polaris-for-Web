# Polaris 赞赏页

## 页面与链接

- GitHub Pages 正式地址为 `https://jeffery-ho.github.io/polaris-landing/`，由独立的 `polaris-landing` 仓库发布；原仓库的 `/support.html` 仅保留为即时跳转入口，不再展示页面内容。页面使用现有 Polaris 图标与浅色玻璃布局，浏览器标签图标使用 `icons/gpt-voyager-icon-32.png`。
- 视频窗口使用响应式 16:9 比例，最大宽度为 `960px`，让桌面首屏保留 PayPal CTA 的可见空间。
- 扩展的“关于与设置”面板 Header 最右侧提供心形赞赏入口，点击后在新标签页打开正式赞赏页；入口不再出现在可拖动的主导航胶囊中。链接固定追加 `utm_source=polaris_extension`、`utm_medium=support_entry` 与 `utm_campaign=polaris_support`，用于落地页识别该入口来源。
- 顶部右侧保留带图标的 Chrome Web Store 与 GitHub Issues 链接；底部只让 `JEFFERY HO` 跳转到 X，不显示单独的 X 图标。
- 页面文案为 `Thank you for installing Polaris!` 与 `Your long AI conversations just got easier to navigate.`。

## 外部内容配置

- `support-config.js` 是视频、PayPal 地址与 GA4 Measurement ID 的唯一配置位置：`videoSource` 已指向 `assets/polaris-introduction.mp4`。页面加载时显示 `assets/polaris-introduction-thumbnail.jpg`，仅在浏览器缓冲区覆盖完整视频时才显式发起 `autoplay muted loop playsinline`；赞赏按钮以 Apple Blue 液态玻璃主 CTA 的形式在新标签页直达 `https://paypal.me/jefferyhoHK`。
- 页面在访客明确允许后才加载 GA4，并关闭自动 page view；仅记录扩展来源到访和视频加载播放按钮点击，不传输 AI 对话内容、扩展设置或 PayPal 付款信息。访客可从页脚重新打开分析设置，撤回后停止后续自定义事件。
- 当前 MP4 约 68 MB、56 秒。部署前应保留其文件名与相对路径；若要降低首次加载量，可在不改变画面比例的前提下另行压缩替换。

## 验证

- 检查桌面与移动端的页头换行、视频比例、按钮与底部昵称链接。
- 视频文件与真实 PayPal 直达地址提供后，分别验证自动静音播放和付款页跳转。
