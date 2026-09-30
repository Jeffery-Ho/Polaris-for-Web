import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  HASHED_HEADING_SELECTOR,
  HASHED_MARKDOWN_ROOT_SELECTOR,
  collectHashedMarkdownSections
} from "../src/hashed-markdown.js";
import {
  routeFallbackDiagnosticDecision,
  routeFallbackLogLevel,
  routeFallbackLogMessage,
  snapshotDeliveryResult
} from "../src/snapshot-delivery.js";

const contentSource = readFileSync(new URL("../src/content.js", import.meta.url), "utf8");

function el(tag, className, children = [], text = "", attrs = {}) {
  return { tag, className, children, text, attrs };
}

test("hashed CSS-module markdown markup yields message nodes and h1-h6 sections", () => {
  const fixture = el("div", "page", [
    el("div", "MarkdownRoot-rZKhxa", [
      el("h2", "Heading-Ro3lZr", [], "Light"),
      el("p", "Paragraph-kKnbIo", [], "Photosynthesis", { "data-markdown-han-text": "true" }),
      el("blockquote", "Blockquote-EqEEot", [
        el("p", "Paragraph-kKnbIo", [], "Quoted note")
      ]),
      el("hr", "HorizontalRule-ByOEk_"),
      el("div", "VisualizationBlock-BXpp50"),
      el("h6", "Heading-ZzZzZz", [], "Deep"),
      el("div", "Heading-Custom1", [], "Diagram title"),
      el("div", "MarkdownRoot-nested1", [
        el("h3", "Heading-Inner1", [], "Nested")
      ])
    ]),
    el("section", "theme MarkdownRoot-abcdef", [
      el("h1", "Heading-AAAAAA", [], "Overview")
    ]),
    el("div", "SubHeading-nope", [], "Not a section"),
    el("div", "markdown", [], "Lowercase markdown class")
  ]);

  const result = collectHashedMarkdownSections(fixture);

  assert.equal(result.messageNodes.length, 2);
  assert.deepEqual(result.sections.map((section) => [section.level, section.title]), [
    [2, "Light"],
    [6, "Deep"],
    [2, "Diagram title"],
    [3, "Nested"],
    [1, "Overview"]
  ]);
  assert.match(HASHED_MARKDOWN_ROOT_SELECTOR, /\[class\^="MarkdownRoot-"\]/);
  assert.match(HASHED_MARKDOWN_ROOT_SELECTOR, /\[class\*=" MarkdownRoot-"\]/);
  assert.match(HASHED_HEADING_SELECTOR, /\[class\^="Heading-"\]/);
  assert.match(contentSource, /HASHED_MARKDOWN_ROOT_SELECTOR/);
  assert.match(contentSource, /h5, h6/);
  assert.match(contentSource, /hashed-markdown/);
});

test("route fallback delivery distinguishes a closed side panel from a rejected snapshot", () => {
  assert.deepEqual(snapshotDeliveryResult({
    isCurrentSource: true,
    ack: { accepted: true }
  }), { acceptedBySidePanel: true, reason: "" });
  assert.deepEqual(snapshotDeliveryResult({
    isCurrentSource: false,
    ack: { accepted: true }
  }), { acceptedBySidePanel: false, reason: "not-current-source-tab" });
  assert.equal(snapshotDeliveryResult({
    isCurrentSource: true,
    errorMessage: "Could not establish connection. Receiving end does not exist."
  }).reason, "side-panel-closed");
  assert.equal(routeFallbackLogLevel({
    sentToBackground: true,
    acceptedBySidePanel: false,
    reason: "side-panel-closed",
    messageNodes: 1,
    sections: 2
  }), "info");
  assert.equal(routeFallbackLogLevel({
    sentToBackground: true,
    acceptedBySidePanel: false,
    reason: "not-current-source-tab",
    messageNodes: 1,
    sections: 2
  }), "warn");
  assert.equal(routeFallbackLogLevel({
    sentToBackground: true,
    acceptedBySidePanel: true,
    reason: "",
    messageNodes: 2,
    sections: 0
  }), "warn");
  assert.equal(routeFallbackLogLevel({
    sentToBackground: false,
    acceptedBySidePanel: false,
    reason: "Extension context invalidated.",
    messageNodes: 0,
    sections: 0
  }), "warn");
});

test("route fallback diagnostics are readable and suppress exact duplicates", () => {
  const details = {
    routeKey: "/c/example",
    hostname: "chatgpt.com",
    messageNodes: 2,
    hashedMarkdownRoots: 2,
    sections: 8,
    markerCount: 8,
    sentToBackground: true,
    acceptedBySidePanel: false,
    reason: "side-panel-did-not-acknowledge"
  };
  const first = routeFallbackDiagnosticDecision("", details);
  const duplicate = routeFallbackDiagnosticDecision(first.key, details);

  assert.equal(first.shouldLog, true);
  assert.equal(duplicate.shouldLog, false);
  assert.match(routeFallbackLogMessage(details), /reason=side-panel-did-not-acknowledge/);
  assert.doesNotMatch(routeFallbackLogMessage(details), /\[object Object\]/);
  assert.doesNotMatch(contentSource, /console\.warn\("\[Polaris\] Route fallback did not deliver sections/);
});

test("hidden assistant node diagnostics stay out of the extension error list", () => {
  assert.doesNotMatch(
    contentSource,
    /console\.warn\("\[Polaris\] Assistant message nodes were found but none were visible/
  );
  assert.match(
    contentSource,
    /console\.info\(`\[Polaris\] Assistant message nodes matched but are currently hidden; skipping this scan\. matched=\$\{matched\}`\)/
  );
});
