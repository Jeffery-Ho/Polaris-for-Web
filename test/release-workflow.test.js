import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const workflow = await readFile(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");

test("发布工作流为最新版本提供经过校验的稳定 ZIP 资产", () => {
  assert.match(workflow, /stable_archive="release\/Polaris-AI\.zip"/);
  assert.match(workflow, /cp "release\/\$\{archive\}" "\$stable_archive"/);
  assert.match(workflow, /gh release create "\$TAG" \\\s+--draft/);
  assert.match(workflow, /gh release upload "\$TAG" "\$archive" "\$stable_archive" --clobber/);
  assert.match(workflow, /gh release edit "\$TAG" --draft=false/);
  assert.match(workflow, /releases\/latest\/download\/Polaris-AI\.zip/);
  assert.match(workflow, /curl --fail --silent --show-error --location/);
  assert.match(workflow, /unzip -t/);
});
