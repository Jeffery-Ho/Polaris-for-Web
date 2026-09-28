import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [readme, rootPrivacy, policy] = await Promise.all([
  readFile(new URL("../README.md", import.meta.url), "utf8"),
  readFile(new URL("../privacy-policy.html", import.meta.url), "utf8"),
  readFile(new URL("../pages/privacy-policy.html", import.meta.url), "utf8")
]);

test("GitHub Pages privacy URL keeps serving the policy", () => {
  assert.match(readme, /https:\/\/jeffery-ho\.github\.io\/Polaris-for-Web\/privacy-policy\.html/);
  assert.match(rootPrivacy, /<meta http-equiv="refresh" content="0; url=pages\/privacy-policy\.html">/);
  assert.match(rootPrivacy, /window\.location\.replace\("pages\/privacy-policy\.html"\)/);
  assert.match(rootPrivacy, /<a href="pages\/privacy-policy\.html">Privacy Policy<\/a>/);
  assert.match(policy, /<h1>Privacy Policy<\/h1>/);
  assert.doesNotMatch(policy, /http-equiv="refresh"/);
});
