import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [viteConfig, distManifest] = await Promise.all([
  readFile(new URL("../vite.config.js", import.meta.url), "utf8"),
  readFile(new URL("../dist/manifest.json", import.meta.url), "utf8").then(JSON.parse)
]);

test("扩展模块 chunk 使用 JavaScript 文件扩展名", () => {
  assert.match(viteConfig, /chunkFileNames:\s*\(chunkInfo\)\s*=>/);
  assert.match(viteConfig, /chunkInfo\.name\.endsWith\("\.js"\)/);
  assert.match(viteConfig, /return `assets\/\$\{name\}`/);
});

test("内容脚本使用稳定的自包含文件，不生成易失效的 loader", () => {
  const scripts = distManifest.content_scripts?.flatMap((entry) => entry.js || []) || [];
  assert.match(viteConfig, /standaloneFiles:\s*\["src\/content\.js"\]/);
  assert.ok(scripts.includes("src/content.js"));
  assert.equal(scripts.some((file) => file.includes("-loader-")), false);
});
