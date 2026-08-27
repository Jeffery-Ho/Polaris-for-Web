import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const supportPage = await readFile(new URL("../support.html", import.meta.url), "utf8");
const supportConfig = await readFile(new URL("../support-config.js", import.meta.url), "utf8");

test("赞赏页保留加载提示、自动播放视频属性和配置入口", () => {
  assert.match(supportPage, /<title>Support Polaris<\/title>/);
  assert.match(supportPage, /<link rel="icon" type="image\/png" sizes="32x32" href="icons\/gpt-voyager-icon-32\.png">/);
  assert.match(supportPage, /<span>Polaris<\/span>/);
  assert.doesNotMatch(supportPage, /Polaris for Web/);
  assert.match(supportPage, /Thank you for installing Polaris!/);
  assert.match(supportPage, /Your long AI conversations just got easier to navigate\./);
  assert.match(supportPage, /\.video-frame \{[\s\S]*width: min\(100%, 960px\)/);
  assert.match(supportPage, /autoplay muted loop playsinline preload="auto"/);
  assert.match(supportPage, /data-video-thumbnail src="assets\/polaris-introduction-thumbnail\.jpg"/);
  assert.match(supportPage, /Preparing full video…/);
  assert.match(supportPage, /Buffering video…/);
  assert.match(supportPage, /video\.play\(\)/);
  assert.match(supportPage, /video\.muted = true/);
  assert.match(supportPage, /addEventListener\("canplaythrough"/);
  assert.match(supportPage, /addEventListener\("progress"/);
  assert.match(supportPage, /function isVideoFullyBuffered\(\)/);
  assert.match(supportPage, /bufferedEnd >= video\.duration - 0\.1/);
  assert.match(supportPage, /videoThumbnail\.hidden = true/);
  assert.match(supportPage, /addEventListener\("playing"/);
  assert.match(supportPage, /addEventListener\("waiting"/);
  assert.match(supportPage, /video\.controls = true/);
  assert.match(supportPage, /Video is ready\. Tap to play\./);
  assert.match(supportPage, /background: rgba\(0, 122, 255, 0\.82\)/);
  assert.match(supportPage, /backdrop-filter: blur\(20px\) saturate\(155%\)/);
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
