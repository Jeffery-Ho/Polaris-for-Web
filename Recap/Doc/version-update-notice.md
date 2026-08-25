# 版本更新通知

- Polaris 在支持页面的顶层框架启动时，读取 Manifest 当前版本和 `chrome.storage.local` 中的 `polaris-release-notice-version`。
- 首次安装或版本不同会展示更新弹窗；关闭按钮、遮罩点击和 Escape 都会记录当前版本，因此同一设备的同一版本不再重复提示。
- 弹窗最多显示最近三个遗漏版本，并按版本倒序展示；更新说明来自 `src/release-notes.js` 的中英文内置记录，不依赖网络请求。
- 弹窗使用邮件和 GitHub 图标提供 `mailto:jefferyho.build@gmail.com` 与 GitHub Issue 两种反馈入口；图标保留本地化悬停提示与 ARIA 标签。点击反馈入口不会自动关闭弹窗，用户仍可选择“知道了”完成确认。
- 标题左侧使用 Polaris 应用小图标，反馈文案使用 `💬` 提示；关闭按钮使用两条居中的 CSS 线条绘制 xmark，避免文本字形偏移。
- 每次发版必须同步新增当前版本的内置更新说明，并更新 Manifest、README、`builds.md` 与 `changelog.md`。
