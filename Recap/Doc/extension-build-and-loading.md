# 扩展构建与本地加载

设置面板引入 React 与 HeroUI 后，内容脚本需要由 Vite 打包为浏览器可执行文件。

- `manifest.build.json` 仅用于 CRXJS 构建，产物输出到 `dist/`。
- `dist/manifest.json` 是正式的未打包扩展入口，应优先用于本地加载与发布验证。
- 根目录 `manifest.json` 是开发期兼容入口；运行 `pnpm build` 后，它加载稳定命名的 `dist/assets` bundle，避免浏览器直接执行含 ES Module 导入的源码。
- 修改源码后先运行 `pnpm build`，再在扩展管理页重新加载并刷新目标页面。
