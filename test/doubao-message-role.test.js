import test from "node:test";
import assert from "node:assert/strict";

import { doubaoMessageRoleFromClassNames } from "../src/doubao-message-role.js";

test("classifies the current Doubao send bubble as a user message", () => {
  assert.equal(doubaoMessageRoleFromClassNames([
    "content-KTJ1Rj",
    "rounded-s-radius-s",
    "bg-g-send-msg-bubble-bg",
    "text-g-send-msg-bubble-text"
  ]), "user");
});

test("keeps legacy Doubao send-message classes classified as user messages", () => {
  assert.equal(doubaoMessageRoleFromClassNames(["send-message-content-block-legacy"]), "user");
});

test("does not classify unrelated or assistant message classes as user messages", () => {
  assert.equal(doubaoMessageRoleFromClassNames(["receive-message-box"]), "");
  assert.equal(doubaoMessageRoleFromClassNames(["content-KTJ1Rj", "bg-g-receive-msg-bubble-bg"]), "");
  assert.equal(doubaoMessageRoleFromClassNames([]), "");
});
