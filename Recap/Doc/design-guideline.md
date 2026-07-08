# Design Guideline

## BoomBranch-like Glass Theme

- 全局扩展控件使用亮色/暗色自适应 glass 视觉。
- 暗色模式使用接近 BoomBranch 的深色半透明背景、`white/10` 级别细描边、柔和暗色阴影和轻内高光。
- 亮色模式沿用此前 Polaris 浅白玻璃背景，保留低对比描边和柔和阴影。
- marker、悬浮 active marker、设置按钮、收起按钮、设置菜单、输入框、选项和重置按钮必须优先继承共享 glass 变量。
- active marker 使用 cyan/blue 强调色；inactive 和 hover 状态保持安静的玻璃质感。

## Verification

- 检查暗色模式下 marker、设置菜单和按钮为深色玻璃，不再混用浅白玻璃和深色按钮。
- 检查亮色模式下控件仍保持清晰文字、轻描边和白色玻璃背景。
- 检查 tooltip 在暗色和亮色模式下均有足够对比。
- 检查 tooltip 文本在当前提示宽度内换行展示，长英文或连续字符不再显示省略号。
- 检查过滤后没有可见 marker 时，右侧仍保留“收起全部”和“设置”入口。

## Explosion Mode

- 爆炸模式使用带 mask 的中等大小弹窗，正文主宽度收口到约 `524pt`。
- 弹窗内部保持浅灰阅读底色，正文按 marker section 组织，顶部使用轻量横向 chips 做分区切换。
- 顶部操作区保持极简，只保留“复制选中”“关闭”和 section chips，但关闭按钮要比普通按钮更易辨识。
- 爆炸模式需要适配系统深色模式：mask、弹窗底色、正文文字、chips 和按钮都要切到深色语义，不保留亮色硬编码。
