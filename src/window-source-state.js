export function didWindowConversationChange(currentState, message) {
  const nextTabId = message?.tabId ?? null;
  const nextRouteKey = message?.snapshot?.routeKey || "";
  if (currentState?.sourceTabId !== nextTabId) return true;

  const isSameSourceLoadingSnapshot = Boolean(
    message?.snapshot?.loading
      && message?.snapshot?.supportedRoute
      && !nextRouteKey
  );
  if (isSameSourceLoadingSnapshot) return false;

  return currentState?.routeKey !== nextRouteKey;
}
