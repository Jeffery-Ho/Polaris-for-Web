const CONVERSATION_QUERY_KEYS_BY_PLATFORM = Object.freeze({
  chatgpt: [],
  doubao: ["chatId", "chat_id", "conversationId"],
  kimi: ["chatId", "conversationId"],
  qianwen: ["sessionId", "session_id", "conversationId"],
  yuanbao: ["conversationId", "chatId"],
  xiaohongshu: ["conversationId", "conversation_id", "chatId"]
});

const CONVERSATION_PATH_PATTERNS = Object.freeze({
  chatgpt: /(?:^|\/)c\/([^/?#]+)/,
  doubao: /(?:^|\/)chat\/([^/?#]+)/,
  kimi: /(?:^|\/)chat\/([^/?#]+)/,
  qianwen: /(?:^|\/)(?:chat|conversation)\/([^/?#]+)/,
  yuanbao: /(?:^|\/)(?:chat|conversation)\/([^/?#]+)/,
  xiaohongshu: /(?:^|\/)ai_chat\/([^/?#]+)/
});

const CONVERSATION_ATTRIBUTE_NAMES = [
  "data-conversation-id",
  "data-conversationid",
  "data-chat-id",
  "data-session-id",
  "data-thread-id"
];

const MESSAGE_ATTRIBUTE_NAMES = [
  "data-message-id",
  "data-messageid",
  "data-msg-id",
  "data-message-key",
  "data-item-id"
];

const MESSAGE_ID_SELECTOR = MESSAGE_ATTRIBUTE_NAMES.map((name) => `[${name}]`).join(", ");
const CONVERSATION_ID_SELECTOR = CONVERSATION_ATTRIBUTE_NAMES.map((name) => `[${name}]`).join(", ");

function normalizedIdentity(value) {
  const identity = String(value || "").trim();
  if (identity.length < 4 || /^(?:new|chat|conversation|session|thread)$/i.test(identity)) {
    return "";
  }
  return identity;
}

function attributeIdentity(element, attributeNames) {
  if (!element || typeof element.getAttribute !== "function") {
    return "";
  }
  for (const attributeName of attributeNames) {
    const identity = normalizedIdentity(element.getAttribute(attributeName));
    if (identity) {
      return identity;
    }
  }
  return "";
}

function relatedElementWithIdentity(element, selector, attributeNames) {
  if (!element) {
    return "";
  }
  const closest = typeof element.closest === "function" ? element.closest(selector) : null;
  const closestIdentity = attributeIdentity(closest, attributeNames);
  if (closestIdentity) {
    return closestIdentity;
  }
  const descendant = typeof element.querySelector === "function" ? element.querySelector(selector) : null;
  return attributeIdentity(descendant, attributeNames);
}

function pathConversationId(platformKey, pathname) {
  const normalizedPath = String(pathname || "");
  const pattern = CONVERSATION_PATH_PATTERNS[platformKey];
  if (!pattern) {
    return "";
  }
  const match = normalizedPath.match(pattern);
  if (!match) {
    return "";
  }
  try {
    return normalizedIdentity(decodeURIComponent(match[1]));
  } catch {
    return "";
  }
}

function conversationIdFromLocation(platformKey, location) {
  const searchParams = location?.searchParams instanceof URLSearchParams
    ? location.searchParams
    : new URLSearchParams(location?.search || "");
  for (const key of CONVERSATION_QUERY_KEYS_BY_PLATFORM[platformKey] || []) {
    const identity = normalizedIdentity(searchParams.get(key));
    if (identity) {
      return identity;
    }
  }
  return pathConversationId(platformKey, location?.pathname);
}

function conversationIdFromRoot(root) {
  if (!root || typeof root.querySelector !== "function") {
    return "";
  }
  return relatedElementWithIdentity(root.querySelector(CONVERSATION_ID_SELECTOR), CONVERSATION_ID_SELECTOR, CONVERSATION_ATTRIBUTE_NAMES);
}

export function makerConversationScope({ platformKey, location, root = null }) {
  const origin = String(location?.origin || "");
  const routeKey = `${origin}${String(location?.pathname || "")}${String(location?.search || "")}`;
  const conversationId = conversationIdFromLocation(platformKey, location) || conversationIdFromRoot(root);
  return {
    platformKey,
    conversationKey: conversationId ? `${origin}:${conversationId}` : routeKey,
    persistence: Boolean(conversationId)
  };
}

export function createMakerPlatformAdapter(platformKey) {
  const userPrefix = `${platformKey}:user:`;

  function titleHash(value) {
    let hash = 2166136261;
    for (const character of String(value || "")) {
      hash ^= character.codePointAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function messageIdentity(element) {
    return relatedElementWithIdentity(element, MESSAGE_ID_SELECTOR, MESSAGE_ATTRIBUTE_NAMES);
  }

  function groupIdentity(element, fallbackKey) {
    const messageId = messageIdentity(element);
    return messageId
      ? { groupKey: `${userPrefix}${messageId}`, persistent: true }
      : { groupKey: fallbackKey, persistent: false };
  }

  function sourceIdentity(element, groupKey, assistantIndex, { allowDerived = false } = {}) {
    if (allowDerived && groupKey.startsWith(userPrefix)) {
      return `${platformKey}:assistant-derived:${groupKey.slice(userPrefix.length)}:${assistantIndex}`;
    }
    const messageId = messageIdentity(element);
    if (messageId) {
      return `${platformKey}:assistant:${messageId}`;
    }
    return "";
  }

  return {
    platformKey,
    conversationScope({ location, root }) {
      return makerConversationScope({ platformKey, location, root });
    },
    coverage() {
      return "partial";
    },
    groupIdentity,
    messageIdentity,
    runtimeGroupKey(previewTitle, occurrence) {
      return `${platformKey}:runtime-user:${titleHash(previewTitle)}:${occurrence}`;
    },
    sourceIdentity
  };
}
