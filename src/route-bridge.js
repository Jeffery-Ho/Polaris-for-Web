(() => {
  const CHATGPT_CONVERSATION_CHANNEL = "polaris-for-web-chatgpt-conversation";
  const CHATGPT_CONVERSATION_REQUEST = "request";
  const CHATGPT_CONVERSATION_RESPONSE = "response";
  const ROUTE_CHANGE_EVENT = "polaris-for-web-route-change";

  function notifyRouteChange() {
    window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT));
  }

  ["pushState", "replaceState"].forEach((method) => {
    const original = window.history[method];
    window.history[method] = function (...args) {
      const result = original.apply(this, args);
      notifyRouteChange();
      return result;
    };
  });

  window.addEventListener("popstate", notifyRouteChange);
  window.addEventListener("hashchange", notifyRouteChange);

  function chatGPTConversationIdFromPath(pathname) {
    const match = String(pathname || "").match(/(?:^|\/)c\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  }

  function postConversationResponse({ conversation = null, conversationId, error = "", requestId, routeKey }) {
    window.postMessage({
      channel: CHATGPT_CONVERSATION_CHANNEL,
      conversation,
      conversationId,
      error,
      requestId,
      routeKey,
      type: CHATGPT_CONVERSATION_RESPONSE
    }, window.location.origin);
  }

  async function readChatGPTConversation(data) {
    const conversationId = chatGPTConversationIdFromPath(window.location.pathname);
    if (!conversationId || data.conversationId !== conversationId) {
      return;
    }

    const routeKey = `${window.location.origin}${window.location.pathname}${window.location.search}`;
    try {
      const response = await window.fetch(`/backend-api/conversation/${encodeURIComponent(conversationId)}`, {
        credentials: "same-origin"
      });
      if (!response.ok) {
        throw new Error(`Conversation request failed: ${response.status}`);
      }
      postConversationResponse({
        conversation: await response.json(),
        conversationId,
        requestId: data.requestId,
        routeKey
      });
    } catch (error) {
      postConversationResponse({
        conversationId,
        error: error instanceof Error ? error.message : "Conversation request failed",
        requestId: data.requestId,
        routeKey
      });
    }
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.origin !== window.location.origin) {
      return;
    }
    const data = event.data;
    if (!data || data.channel !== CHATGPT_CONVERSATION_CHANNEL || data.type !== CHATGPT_CONVERSATION_REQUEST) {
      return;
    }
    readChatGPTConversation(data);
  });
})();
