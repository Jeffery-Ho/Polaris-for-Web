import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const supportPage = await readFile(new URL("../support.html", import.meta.url), "utf8");
const landingUrl = "https://jeffery-ho.github.io/polaris-landing/";

test("旧赞赏页立即跳转至独立 landing 页面", () => {
  assert.match(supportPage, new RegExp(`<meta http-equiv="refresh" content="0; url=${landingUrl}">`));
  assert.match(supportPage, new RegExp(`<link rel="canonical" href="${landingUrl}">`));
  assert.match(supportPage, new RegExp(`window\\.location\\.replace\\("${landingUrl}"\\)`));
  assert.match(supportPage, new RegExp(`<a href="${landingUrl}">Polaris Landing<\\/a>`));
});
