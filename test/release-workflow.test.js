import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const workflow = await readFile(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");

test("发布工作流保留扩展构建与发布门槛", () => {
  assert.match(workflow, /push:\s+branches:\s+- main/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /permissions:\s+contents: write/);
  assert.match(workflow, /pnpm install --frozen-lockfile/);
  assert.match(workflow, /run: pnpm check/);
  assert.match(workflow, /run: pnpm test/);
  assert.match(workflow, /run: pnpm build/);
  assert.match(workflow, /files = \["manifest\.json", "manifest\.build\.json", "dist\/manifest\.json"\]/);
  assert.match(workflow, /manifest\.version !== first\.version/);
  assert.match(workflow, /-x '\*\.DS_Store'/);
});

test("发布工作流为最新版本提供经过校验的稳定 ZIP 资产", () => {
  assert.match(workflow, /stable_archive="release\/Polaris-AI\.zip"/);
  assert.match(workflow, /cp "release\/\$\{archive\}" "\$stable_archive"/);
  assert.match(workflow, /gh release create "\$TAG" \\\s+--draft/);
  assert.match(workflow, /gh release upload "\$TAG" "\$archive" "\$stable_archive" --clobber/);
  assert.match(workflow, /gh release download "\$TAG"/);
  assert.match(workflow, /EXPECTED_VERSION_NAME="\$\{VERSION\}\(\$\{BUILD\}\)"/);
  assert.match(workflow, /archive_fingerprint\(\)/);
  assert.match(workflow, /verify_latest_release\(\)/);
  assert.match(workflow, /download_release_assets\(\)/);
  assert.match(workflow, /Release \$TAG is already published with different assets; increment the version or build/);
  assert.match(workflow, /gh release edit "\$TAG" --draft=false/);
  assert.match(workflow, /releases\/latest\/download\/Polaris-AI\.zip/);
  assert.match(workflow, /curl --fail --silent --show-error --location/);
  assert.match(workflow, /--retry-all-errors/);
  assert.match(workflow, /unzip -t/);
  assert.doesNotMatch(workflow, /gh release delete-asset/);

  const publishIndex = workflow.indexOf('gh release edit "$TAG" --draft=false');
  const assetCalls = [...workflow.matchAll(/^[ \t]+download_release_assets$/gm)].map((match) => match.index);
  const latestCalls = [...workflow.matchAll(/^[ \t]+verify_latest_release$/gm)].map((match) => match.index);
  assert.equal(assetCalls.length, 2);
  assert.equal(latestCalls.length, 2);
  assert.ok(assetCalls.at(-1) < publishIndex);
  assert.ok(latestCalls[0] < publishIndex);
  assert.ok(latestCalls.at(-1) > publishIndex);
});
