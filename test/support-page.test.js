import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const supportPage = await readFile(new URL("../support.html", import.meta.url), "utf8");
const supportConfig = await readFile(new URL("../support-config.js", import.meta.url), "utf8");

test("赞赏页保留已确认的文案、自动播放视频属性和配置入口", () => {
  assert.match(supportPage, /Thank you for installing Polaris!/);
  assert.match(supportPage, /Your long AI conversations just got easier to navigate\./);
  assert.match(supportPage, /autoplay muted loop playsinline preload="metadata"/);
  assert.match(supportConfig, /videoSource: "assets\/polaris-introduction\.mp4"/);
  assert.match(supportConfig, /paypalUrl: "https:\/\/paypal\.me\/jefferyhoHK"/);
});

test("赞赏页保留三个外链及安全的新标签页属性", () => {
  assert.match(supportPage, /chromewebstore\.google\.com\/detail\/polaris-ai-chat-navigator\/lkdbbnpcfkjdfnopecpbdaeegncdmajb/);
  assert.match(supportPage, /github\.com\/Jeffery-Ho\/Polaris-for-Web\/issues/);
  assert.match(supportPage, /x\.com\/JefferyHo_/);
  assert.match(supportPage, /target="_blank" rel="noreferrer"/);
  assert.doesNotMatch(supportPage, /<[^>]*>[^<]*X[^<]*<\/[^>]+>/);
});
