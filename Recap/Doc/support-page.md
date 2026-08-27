# Polaris 赞赏页

## 页面与链接

- GitHub Pages 页面路径为 `/support.html`，使用现有 Polaris 图标与浅色玻璃布局；浏览器标签图标使用 `icons/gpt-voyager-icon-32.png`。
- 顶部右侧保留带图标的 Chrome Web Store 与 GitHub Issues 链接；底部只让 `JEFFERY HO` 跳转到 X，不显示单独的 X 图标。
- 页面文案为 `Thank you for installing Polaris!` 与 `Your long AI conversations just got easier to navigate.`。

## 外部内容配置

- `support-config.js` 是视频与 PayPal 地址的唯一配置位置：`videoSource` 已指向 `assets/polaris-introduction.mp4`。页面在视频开始前显示加载提示，在缓冲时显示缓冲提示，并在 `canplay` 后显式发起 `autoplay muted loop playsinline` 播放；赞赏按钮以 Apple Blue 液态玻璃主 CTA 的形式在新标签页直达 `https://paypal.me/jefferyhoHK`。
- 当前 MP4 约 68 MB、56 秒。部署前应保留其文件名与相对路径；若要降低首次加载量，可在不改变画面比例的前提下另行压缩替换。

## 验证

- 检查桌面与移动端的页头换行、视频比例、按钮与底部昵称链接。
- 视频文件与真实 PayPal 直达地址提供后，分别验证自动静音播放和付款页跳转。
