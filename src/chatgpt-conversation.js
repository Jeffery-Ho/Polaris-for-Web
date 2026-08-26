function conversationText(content) {
  if (!content || typeof content !== "object") {
    return "";
  }
  if (typeof content.text === "string") {
    return content.text;
  }
  if (Array.isArray(content.parts)) {
    return content.parts.filter((part) => typeof part === "string").join("\n");
  }
  return "";
}

export function chatGPTConversationIdFromPath(pathname) {
  const match = String(pathname || "").match(/(?:^|\/)c\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function parseChatGPTConversation(conversation) {
  const mapping = conversation && typeof conversation === "object" ? conversation.mapping : null;
  const currentNodeId = conversation && typeof conversation.current_node === "string" ? conversation.current_node : "";
  if (!mapping || typeof mapping !== "object" || !currentNodeId) {
    return { assistantToUserMessageId: {}, userMessages: [] };
  }

  const activeMessages = [];
  const visitedNodeIds = new Set();
  let nodeId = currentNodeId;
  while (nodeId && !visitedNodeIds.has(nodeId)) {
    visitedNodeIds.add(nodeId);
    const node = mapping[nodeId];
    if (!node || typeof node !== "object") {
      break;
    }

    const message = node.message;
    const role = message && message.author && typeof message.author.role === "string"
      ? message.author.role
      : "";
    const messageId = message && typeof message.id === "string" ? message.id : nodeId;
    if (role === "user" || role === "assistant") {
      activeMessages.unshift({ id: messageId, role, text: conversationText(message.content).trim() });
    }
    nodeId = typeof node.parent === "string" ? node.parent : "";
  }

  const assistantToUserMessageId = {};
  const userMessages = [];
  let currentUserMessage = null;
  activeMessages.forEach((message) => {
    if (message.role === "user") {
      if (!message.text) {
        return;
      }
      currentUserMessage = {
        id: message.id,
        text: message.text,
        order: userMessages.length,
        hasAssistantMessage: false
      };
      userMessages.push(currentUserMessage);
      return;
    }
    if (currentUserMessage) {
      assistantToUserMessageId[message.id] = currentUserMessage.id;
      currentUserMessage.hasAssistantMessage = true;
    }
  });

  return { assistantToUserMessageId, userMessages };
}
