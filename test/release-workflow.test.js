import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const workflowSource = await readFile(
  new URL("../.github/workflows/release.yml", import.meta.url),
  "utf8"
);

test("发布 workflow 在 main 提交后运行并支持手动触发", () => {
  assert.match(workflowSource, /^name: Build extension release$/m);
  assert.match(workflowSource, /on:\n  push:\n    branches:\n      - main/);
  assert.match(workflowSource, /workflow_dispatch:/);
  assert.match(workflowSource, /permissions:\n  contents: write/);
});

test("发布 workflow 校验、构建并打包当前 dist", () => {
  assert.match(workflowSource, /pnpm install --frozen-lockfile/);
  assert.match(workflowSource, /pnpm check/);
  assert.match(workflowSource, /pnpm test/);
  assert.match(workflowSource, /pnpm build/);
  assert.match(workflowSource, /manifest\.json/);
  assert.match(workflowSource, /manifest\.build\.json/);
  assert.match(workflowSource, /dist\/manifest\.json/);
  assert.match(workflowSource, /zip -qr/);
  assert.match(workflowSource, /-x '\*\.DS_Store'/);
  assert.match(workflowSource, /Polaris-AI-\$\{VERSION\}-build-\$\{BUILD\}\.zip/);
  assert.doesNotMatch(workflowSource, /cp .*Polaris-AI\.zip/);
  assert.doesNotMatch(workflowSource, /gh release upload[\s\S]*Polaris-AI\.zip/);
});

test("发布 workflow 使用版本和 build 生成幂等 Release 标签", () => {
  assert.match(
    workflowSource,
    /TAG: v\$\{\{ steps\.metadata\.outputs\.version \}\}-build\.\$\{\{ steps\.metadata\.outputs\.build \}\}/
  );
  assert.match(workflowSource, /gh release view/);
  assert.match(workflowSource, /gh release delete-asset/);
  assert.match(workflowSource, /gh release upload[\s\S]*?--clobber/);
  assert.match(workflowSource, /gh release create/);
});
