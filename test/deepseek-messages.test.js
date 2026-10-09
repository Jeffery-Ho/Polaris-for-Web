import test from "node:test";
import assert from "node:assert/strict";
import { Element } from "../test-support/dom-element.js";
import {
  collectDeepSeekConversation,
  deepseekUserMessageText,
  isDeepSeekConversationScrollTarget,
  isDeepSeekConversationMutation,
  DEEPSEEK_ASSISTANT_SELECTOR,
  DEEPSEEK_USER_CONTAINER_SELECTOR
} from "../src/deepseek-messages.js";
import { createRuntimeMarkerKeySequence } from "../src/runtime-marker-key-sequence.js";
import { hasRelevantMarkerMutation } from "../src/marker-mutation-relevance.js";
import { userMessageImageSelectorForPlatform, isOwnedUserAttachmentCandidate } from "../src/user-message-images.js";

const heading = (text) => new Element("h3", {}, [], text);
const ai = (text = "Answer", children = [heading(text)]) => new Element("div", {
  class: "ds-markdown ds-assistant-message-main-content"
}, children);
const user = (text = "Question", attachments = []) => new Element("div", { class: "ds-message arbitrary-user-hash" }, [
  new Element("div", { class: "ds-collapsible-text" }, [new Element("span", {}, [], text)]),
  ...attachments,
  new Element("button", {}, [], "Edit")
]);
const reply = (body = ai(), extras = []) => new Element("div", { class: "ds-message arbitrary-assistant-hash" }, [body, ...extras]);
const item = (key, ...children) => new Element("div", { "data-virtual-list-item-key": String(key) }, children);
function conversation(items, outside = []) {
  const list = new Element("div", { class: "ds-virtual-list-visible-items" }, items);
  const scroller = new Element("div", { class: "ds-virtual-list ds-scroll-area" }, [list]);
  return { root: new Element("main", {}, [scroller, ...outside]), list, scroller };
}

test("DeepSeek groups mounted final replies with their own user messages", () => {
  const firstUser = user("First");
  const secondUser = user("Second");
  const first = ai("First answer");
  const second = ai("Second answer");
  const { root } = conversation([item(1, firstUser), item(2, reply(first)), item(3, secondUser), item(4, reply(second))]);
  const result = collectDeepSeekConversation(root);
  assert.deepEqual(result.userContainers, [firstUser, secondUser]);
  assert.deepEqual(result.assistantContainers, [first, second]);
  assert.equal(result.assistantToUser.get(first), firstUser);
  assert.equal(result.assistantToUser.get(second), secondUser);
  assert.equal(deepseekUserMessageText(firstUser), "First");
});

test("DeepSeek does not associate replies across gaps, hidden users or unknown items", () => {
  const first = user("First");
  const gapReply = ai("Gap");
  const hidden = user("Hidden");
  const hiddenReply = ai("Hidden user's answer");
  const latest = user("Latest");
  const unknownReply = ai("After unknown");
  const invalidKeyReply = ai("Invalid key");
  const { root } = conversation([
    item(1, first), item(4, reply(gapReply)),
    item(5, hidden), item(6, reply(hiddenReply)),
    item(7, latest), item(8, new Element("div", {}, [], "Unknown status")), item(9, reply(unknownReply)),
    item("not-a-number", user("Unverified")), item(10, reply(invalidKeyReply))
  ]);
  const result = collectDeepSeekConversation(root, { acceptNode: (node) => node !== hidden });
  assert.ok(!result.userContainers.includes(hidden));
  for (const body of [gapReply, hiddenReply, unknownReply, invalidKeyReply]) {
    assert.ok(result.assistantContainers.includes(body));
    assert.equal(result.assistantToUser.get(body), null);
  }
});

test("DeepSeek keeps only final Markdown roots and preserves their nested source content", () => {
  const nested = ai("Nested root");
  const body = ai("Final", [
    heading("Final"), nested,
    new Element("ol", {}, [new Element("li", {}, [new Element("ul", {}, [new Element("li", {}, [], "Nested list")])])]),
    new Element("table", {}, [new Element("tr", {}, [new Element("th", {}, [], "Column")])])
  ]);
  const thinking = new Element("div", { class: "ds-markdown ds-think-content" }, [heading("Thinking")]);
  const controls = new Element("button", {}, [heading("Copy")]);
  const disclaimer = new Element("div", {}, [], "This response is AI-generated, for reference only.");
  const prompt = user("Prompt");
  const { root } = conversation([item(1, prompt), item(2, reply(body, [thinking, controls, disclaimer]))], [reply(ai("Outside"))]);
  const result = collectDeepSeekConversation(root);
  assert.deepEqual(result.assistantContainers, [body]);
  assert.equal(result.assistantToUser.get(body), prompt);
  assert.equal(body.querySelectorAll("li").length, 2);
  assert.equal(body.querySelectorAll("table").length, 1);
  assert.deepEqual(collectDeepSeekConversation(new Element("main", {}, [reply(ai())])).assistantContainers, []);
});

test("DeepSeek keeps pending users and short final replies without inventing headings", () => {
  const first = user("Question");
  const short = ai("", [new Element("p", {}, [], "Short answer")]);
  const pending = user("Waiting");
  const { root } = conversation([item(1, first), item(2, reply(short)), item(3, pending)]);
  const result = collectDeepSeekConversation(root);
  assert.deepEqual(result.userContainers, [first, pending]);
  assert.deepEqual(result.assistantContainers, [short]);
  assert.equal(result.assistantToUser.get(short), first);
  assert.equal(short.querySelector("h3"), null);
});

test("DeepSeek removes unmounted messages, reads streamed content and gives remounts fresh runtime keys", () => {
  const original = ai("Original");
  const prompt = item(1, user());
  const answer = item(2, reply(original));
  const { root, list } = conversation([prompt, answer]);
  const keys = createRuntimeMarkerKeySequence();
  const oldKey = keys.keyFor(collectDeepSeekConversation(root).assistantContainers[0]);
  original.append(heading("Streamed"));
  assert.equal(collectDeepSeekConversation(root).assistantContainers[0].querySelectorAll("h3").length, 2);
  prompt.remove();
  assert.equal(collectDeepSeekConversation(root).assistantToUser.get(original), null);
  answer.remove();
  assert.equal(collectDeepSeekConversation(root).assistantContainers.length, 0);
  list.append(item(1, user()));
  list.append(item(2, reply(ai("Original"))));
  assert.notEqual(keys.keyFor(collectDeepSeekConversation(root).assistantContainers[0]), oldKey);
});

test("DeepSeek does not carry user ownership between virtual lists", () => {
  const orphan = ai("Orphan");
  const first = conversation([item(1, user())]);
  const second = conversation([item(2, reply(orphan))]);
  const root = new Element("main", {}, [first.scroller, second.scroller]);
  assert.equal(collectDeepSeekConversation(root).assistantToUser.get(orphan), null);
});

test("DeepSeek user images belong to the collected user container and text excludes controls", () => {
  const image = new Element("img", { src: "https://example.com/image.png" });
  const prompt = user("Image question", [image]);
  const { root } = conversation([item(1, prompt), item(2, reply())]);
  const owner = collectDeepSeekConversation(root).userContainers[0];
  assert.equal(image.closest(DEEPSEEK_USER_CONTAINER_SELECTOR), owner);
  assert.equal(deepseekUserMessageText(owner), "Image question");
  assert.equal(userMessageImageSelectorForPlatform("deepseek"), "img");
  assert.equal(isOwnedUserAttachmentCandidate({ platform: "deepseek", ownerMatches: true, inAttachmentRegion: true, excluded: false }), true);
  assert.equal(isOwnedUserAttachmentCandidate({ platform: "deepseek", ownerMatches: true, inAttachmentRegion: true, excluded: true }), false);
});

test("DeepSeek mutations include newly mounted replies, removals and streamed text", () => {
  const prompt = user();
  const body = ai();
  const mounted = item(2, reply(body));
  const { root, list } = conversation([item(1, prompt), mounted]);
  const options = { knownContainers: [prompt, body], sourceSelectors: [DEEPSEEK_ASSISTANT_SELECTOR, DEEPSEEK_USER_CONTAINER_SELECTOR] };
  assert.equal(hasRelevantMarkerMutation({ ...options, mutations: [{ type: "childList", target: list, addedNodes: [mounted], removedNodes: [] }] }), true);
  assert.equal(hasRelevantMarkerMutation({ ...options, mutations: [{ type: "characterData", target: body.children[0], addedNodes: [], removedNodes: [] }] }), true);
  mounted.remove();
  assert.equal(hasRelevantMarkerMutation({ ...options, mutations: [{ type: "childList", target: list, addedNodes: [], removedNodes: [mounted] }] }), true);
  const controls = new Element("button", {}, [], "Copy");
  assert.equal(hasRelevantMarkerMutation({ ...options, mutations: [{ type: "childList", target: root, addedNodes: [controls], removedNodes: [] }] }), false);
});

test("DeepSeek scroll tracking accepts the conversation scroller only", () => {
  const { list, scroller } = conversation([]);
  assert.equal(isDeepSeekConversationScrollTarget(scroller), true);
  assert.equal(isDeepSeekConversationScrollTarget(list), false);
  assert.equal(isDeepSeekConversationScrollTarget(new Element("div", { class: "ds-scroll-area" })), false);
  assert.equal(isDeepSeekConversationScrollTarget(null), false);
});

test("DeepSeek notices user text mounted after an initially empty message", () => {
  const pending = new Element("div", { class: "ds-message" });
  const { root } = conversation([item(1, pending)]);
  assert.equal(collectDeepSeekConversation(root).userContainers.length, 0);
  const text = new Element("div", { class: "ds-collapsible-text" }, [], "New question");
  pending.append(text);
  const mutation = { type: "childList", target: pending, addedNodes: [text], removedNodes: [] };
  assert.equal(isDeepSeekConversationMutation(mutation), true);
  assert.deepEqual(collectDeepSeekConversation(root).userContainers, [pending]);
});

test("DeepSeek notices grouping keys and visibility changes only inside its conversation", () => {
  const prompt = user();
  const body = ai();
  const answer = item(2, reply(body));
  const { root } = conversation([item(1, prompt), answer]);
  assert.equal(collectDeepSeekConversation(root).assistantToUser.get(body), prompt);
  answer.attrs["data-virtual-list-item-key"] = "4";
  assert.equal(isDeepSeekConversationMutation({ type: "attributes", attributeName: "data-virtual-list-item-key", target: answer }), true);
  assert.equal(collectDeepSeekConversation(root).assistantToUser.get(body), null);
  answer.attrs["data-virtual-list-item-key"] = "2";
  for (const attributeName of ["class", "style", "hidden"]) {
    assert.equal(isDeepSeekConversationMutation({ type: "attributes", attributeName, target: prompt }), true);
    assert.equal(collectDeepSeekConversation(root, { acceptNode: (node) => node !== prompt }).assistantToUser.get(body), null);
  }
  assert.equal(isDeepSeekConversationMutation({ type: "attributes", attributeName: "style", target: root }), false);
  assert.equal(isDeepSeekConversationMutation({ type: "childList", target: root, addedNodes: [], removedNodes: [] }), false);
});
