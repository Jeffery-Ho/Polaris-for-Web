import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [manifest, buildManifest, viteConfig, sidePanelHtml, windowSource] = await Promise.all([
  readFile(new URL("../manifest.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../manifest.build.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../vite.config.js", import.meta.url), "utf8"),
  readFile(new URL("../sidepanel.html", import.meta.url), "utf8"),
  readFile(new URL("../src/window.js", import.meta.url), "utf8")
]);

for (const [name, currentManifest] of [["source", manifest], ["build", buildManifest]]) {
  test(`${name} manifest declares Polaris side panel`, () => {
    assert.ok(currentManifest.permissions.includes("sidePanel"));
    assert.ok(currentManifest.permissions.includes("scripting"));
    assert.deepEqual(currentManifest.side_panel, { default_path: "sidepanel.html" });
  });
}

test("side panel reuses the Polaris window UI entry", () => {
  assert.match(sidePanelHtml, /data-window-type="sidepanel"/);
  assert.match(sidePanelHtml, /href="\/src\/window\.css"/);
  assert.match(sidePanelHtml, /src="\/src\/window\.js"/);
  assert.match(windowSource, /dataset\.windowType/);
  assert.match(windowSource, /windowType\s*===\s*"sidepanel"/);
});

test("Vite builds the side panel as an extension page", () => {
  assert.match(viteConfig, /sidepanel:\s*"sidepanel\.html"/);
});
