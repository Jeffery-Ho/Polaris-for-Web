export function syncLatestUserMarkerExpansion({ groups, expandedKeys, seenKeys }) {
  const userGroups = groups.filter((group) => group.user);
  if (!userGroups.length) {
    return "";
  }

  const latestKey = userGroups[userGroups.length - 1].key;
  const previousGroup = userGroups[userGroups.length - 2] || null;
  const hasInitialized = seenKeys.size > 0;
  const shouldExpandLatest = !seenKeys.has(latestKey);
  const shouldExpandPrevious = hasInitialized
    && previousGroup?.hasAssistantMessage
    && !seenKeys.has(previousGroup.key);
  userGroups.forEach((group) => seenKeys.add(group.key));
  if (shouldExpandLatest) {
    expandedKeys.add(latestKey);
  }
  if (shouldExpandPrevious) {
    expandedKeys.add(previousGroup.key);
  }
  return latestKey;
}

export function shouldShowUserMarkerNotLoadedNotice({
  isChatGPT,
  hasAssistantMessage,
  groupKey,
  latestGroupKey
}) {
  return isChatGPT && !hasAssistantMessage && groupKey !== latestGroupKey;
}
