export function latestUserMarkerKey(groups) {
  const userGroups = groups.filter((group) => group.user);
  return userGroups[userGroups.length - 1]?.key || "";
}

export function isUserMarkerExpanded({ groupKey, hasUser, isSearchActive, collapsedKeys }) {
  return !hasUser || isSearchActive || !collapsedKeys.has(groupKey);
}

export function shouldShowUserMarkerNotLoadedNotice({
  isChatGPT,
  hasAssistantMessage,
  hasMarkers = false,
  groupKey,
  latestGroupKey
}) {
  return isChatGPT && !hasAssistantMessage && !hasMarkers && groupKey !== latestGroupKey;
}
