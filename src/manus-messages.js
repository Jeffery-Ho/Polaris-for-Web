export const MANUS_MESSAGE_LIST_SELECTOR = '#manus-chat-box [data-chat-message-list="true"]';
export const MANUS_QUESTION_SELECTOR = '[data-chat-question-bubble="true"]';
export const MANUS_ASSISTANT_SELECTOR = `${MANUS_MESSAGE_LIST_SELECTOR} .manus-markdown.chat-message-body`;
export const MANUS_USER_CONTAINER_SELECTOR = `${MANUS_MESSAGE_LIST_SELECTOR} [data-event-id]:has(${MANUS_QUESTION_SELECTOR}), ${MANUS_MESSAGE_LIST_SELECTOR} ${MANUS_QUESTION_SELECTOR}`;
export const MANUS_SCROLL_SELECTOR = '#manus-chat-scroll-viewport .simplebar-content-wrapper';

export function manusUserMessageText(container) {
  const bubble = container.matches(MANUS_QUESTION_SELECTOR)
    ? container
    : container.querySelector(MANUS_QUESTION_SELECTOR);
  const body = bubble?.querySelector(".chat-message-body");
  return body?.innerText || body?.textContent || "";
}

export function collectManusConversation(root, { acceptNode = () => true } = {}) {
  const userContainers = [];
  const assistantContainers = [];
  const assistantToUser = new Map();
  const lists = Array.from(root.querySelectorAll(MANUS_MESSAGE_LIST_SELECTOR));

  lists.forEach((list) => {
    const userOwners = new Set();
    const usersByTurn = new Map();
    list.querySelectorAll(MANUS_QUESTION_SELECTOR).forEach((bubble) => {
      const event = bubble.closest("[data-event-id]");
      const owner = event && list.contains(event)
        && event.closest("[data-turn-id]") === bubble.closest("[data-turn-id]")
        ? event : bubble;
      if (userOwners.has(owner)) return;
      userOwners.add(owner);
      if (!acceptNode(owner) || !acceptNode(bubble)) return;
      userContainers.push(owner);
      const turn = owner.closest("[data-turn-id]");
      if (turn && !usersByTurn.has(turn)) usersByTurn.set(turn, owner);
    });

    const candidates = Array.from(list.querySelectorAll(".manus-markdown.chat-message-body"))
      .filter((node) => acceptNode(node)
        && !node.closest(MANUS_QUESTION_SELECTOR)
        && !Array.from(userOwners).some((owner) => owner.contains(node)));
    const bodies = candidates.filter((node) => !candidates.some((other) => other !== node && other.contains(node)));
    bodies.forEach((body) => {
      assistantContainers.push(body);
      assistantToUser.set(body, usersByTurn.get(body.closest("[data-turn-id]")) || null);
    });
  });

  return { userContainers, assistantContainers, assistantToUser };
}

export function isManusConversationScrollTarget(target) {
  return Boolean(target?.matches?.(MANUS_SCROLL_SELECTOR));
}
