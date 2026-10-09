export const DEEPSEEK_MESSAGE_LIST_SELECTOR = ".ds-virtual-list-visible-items";
const FINAL_BODY_SELECTOR = ".ds-markdown.ds-assistant-message-main-content";
const USER_TEXT_SELECTOR = ".ds-collapsible-text";
export const DEEPSEEK_ASSISTANT_SELECTOR = `${DEEPSEEK_MESSAGE_LIST_SELECTOR} [data-virtual-list-item-key] .ds-message ${FINAL_BODY_SELECTOR}`;
export const DEEPSEEK_USER_CONTAINER_SELECTOR = `${DEEPSEEK_MESSAGE_LIST_SELECTOR} [data-virtual-list-item-key] .ds-message:has(${USER_TEXT_SELECTOR})`;
export const DEEPSEEK_SCROLL_SELECTOR = ".ds-virtual-list.ds-scroll-area";
export const DEEPSEEK_OBSERVED_ATTRIBUTES = ["data-virtual-list-item-key", "class", "style", "hidden"];

export function deepseekUserMessageText(container) {
  const body = container.querySelector(USER_TEXT_SELECTOR);
  return body?.innerText || body?.textContent || "";
}

export function collectDeepSeekConversation(root, { acceptNode = () => true } = {}) {
  const userContainers = [];
  const assistantContainers = [];
  const assistantToUser = new Map();

  root.querySelectorAll(DEEPSEEK_MESSAGE_LIST_SELECTOR).forEach((list) => {
    let currentUser = null;
    let previousKey = null;
    Array.from(list.children).filter((node) => node.matches("[data-virtual-list-item-key]")).forEach((item) => {
      const value = item.getAttribute("data-virtual-list-item-key");
      const key = /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : null;
      if (key === null || previousKey === null || key !== previousKey + 1) currentUser = null;
      previousKey = key;
      const candidates = Array.from(item.querySelectorAll(".ds-message"));
      const messages = candidates.filter((node) => !candidates.some((other) => other !== node && other.contains(node)));
      if (!messages.length) currentUser = null;
      messages.forEach((message) => {
        const allBodies = Array.from(message.querySelectorAll(FINAL_BODY_SELECTOR));
        const bodies = allBodies.filter((node) => !allBodies.some((other) => other !== node && other.contains(node)));
        if (bodies.length) {
          bodies.filter((body) => acceptNode(message) && acceptNode(body)).forEach((body) => {
            assistantContainers.push(body);
            assistantToUser.set(body, currentUser);
          });
          return;
        }
        const text = message.querySelector(USER_TEXT_SELECTOR);
        if (text && acceptNode(message) && acceptNode(text)) {
          currentUser = message;
          userContainers.push(message);
        } else {
          currentUser = null;
        }
      });
    });
  });

  return { userContainers, assistantContainers, assistantToUser };
}

export function isDeepSeekConversationScrollTarget(target) {
  return Boolean(target?.matches?.(DEEPSEEK_SCROLL_SELECTOR));
}

export function isDeepSeekConversationMutation(mutation) {
  const target = mutation.target?.closest ? mutation.target : mutation.target?.parentElement;
  if (!target?.closest?.(DEEPSEEK_SCROLL_SELECTOR)
    || !(target.closest(DEEPSEEK_MESSAGE_LIST_SELECTOR) || target.querySelector(DEEPSEEK_MESSAGE_LIST_SELECTOR))) return false;
  return mutation.type === "childList"
    || (mutation.type === "attributes" && DEEPSEEK_OBSERVED_ATTRIBUTES.includes(mutation.attributeName));
}
