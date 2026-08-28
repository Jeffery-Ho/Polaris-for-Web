export function toggleFoldGroupExpansion({
  foldKey,
  expandedKeys,
  manuallyCollapsedKeys
}) {
  if (expandedKeys.has(foldKey)) {
    expandedKeys.delete(foldKey);
    manuallyCollapsedKeys.add(foldKey);
    return;
  }

  expandedKeys.add(foldKey);
  manuallyCollapsedKeys.delete(foldKey);
}

export function shouldAutoExpandActiveFoldGroup({
  foldKey,
  isParentExpanded,
  manuallyCollapsedKeys
}) {
  return isParentExpanded && !manuallyCollapsedKeys.has(foldKey);
}
