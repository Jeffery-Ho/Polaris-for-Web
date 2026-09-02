import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const contentSource = await readFile(new URL("../src/content.js", import.meta.url), "utf8");

test("更新说明在邮件入口旁提供赞赏按钮", () => {
  assert.match(contentSource, /const support = document\.createElement\("a"\);/);
  assert.match(contentSource, /support\.className = "gpt-paragraph-nav__release-notice-action is-icon";/);
  assert.match(contentSource, /support\.setAttribute\("aria-label", t\("support\.aria"\)\);/);
  assert.match(contentSource, /support\.href = SUPPORT_URL;/);
  assert.match(contentSource, /support\.target = "_blank";/);
  assert.match(contentSource, /support\.rel = "noreferrer";/);
  assert.match(contentSource, /actions\.append\(email, support, issue, acknowledge\);/);
});
