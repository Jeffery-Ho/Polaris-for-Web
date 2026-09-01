export function isFoldGroupExpanded({ foldKey, collapsedKeys }) {
  return !collapsedKeys.has(foldKey);
}

export function toggleFoldGroupExpansion({ foldKey, collapsedKeys }) {
  if (collapsedKeys.has(foldKey)) {
    collapsedKeys.delete(foldKey);
    return;
  }

  collapsedKeys.add(foldKey);
}
