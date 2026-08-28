export function limitMarkerGroups({
  groups,
  maxVisibleUserGroups,
  areEarlierUserGroupsExpanded,
  hasSearchQuery
}) {
  if (hasSearchQuery) {
    return { groups, earlierUserGroupCount: 0 };
  }

  const userGroups = groups.filter((group) => group.user);
  const earlierUserGroupCount = Math.max(0, userGroups.length - maxVisibleUserGroups);
  if (!earlierUserGroupCount || areEarlierUserGroupsExpanded) {
    return { groups, earlierUserGroupCount };
  }

  const hiddenGroupKeys = new Set(
    userGroups.slice(0, earlierUserGroupCount).map((group) => group.key)
  );
  return {
    groups: groups.filter((group) => !hiddenGroupKeys.has(group.key)),
    earlierUserGroupCount
  };
}
