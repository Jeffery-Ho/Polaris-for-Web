export function syncLatestUserMarkerExpansion({ groups, expandedKeys, seenKeys }) {
  const userGroups = groups.filter((group) => group.user);
  if (!userGroups.length) {
    return "";
  }

  const latestKey = userGroups[userGroups.length - 1].key;
  const shouldExpandLatest = !seenKeys.has(latestKey);
  userGroups.forEach((group) => seenKeys.add(group.key));
  if (shouldExpandLatest) {
    expandedKeys.add(latestKey);
  }
  return latestKey;
}

export function shouldShowUserMarkerNotLoadedNotice({
  isChatGPT,
  visibleHeadingCount,
  groupKey,
  latestGroupKey
}) {
  return isChatGPT && visibleHeadingCount === 0 && groupKey !== latestGroupKey;
}
