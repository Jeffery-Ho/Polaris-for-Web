function elementForNode(node) {
  if (node && typeof node.matches === "function") {
    return node;
  }
  return node?.parentElement || null;
}

function isInsideKnownContainer(node, knownContainers) {
  const element = elementForNode(node);
  if (!element) {
    return false;
  }
  return knownContainers.some((container) => (
    container === element
      || (typeof container.contains === "function" && container.contains(element))
  ));
}

function matchesMarkerSource(node, sourceSelectors) {
  if (!node || typeof node.matches !== "function") {
    return false;
  }

  return sourceSelectors.some((selector) => {
    try {
      return node.matches(selector)
        || (typeof node.querySelector === "function" && Boolean(node.querySelector(selector)));
    } catch {
      return false;
    }
  });
}

export function hasRelevantMarkerMutation({ mutations, knownContainers, sourceSelectors }) {
  return mutations.some((mutation) => {
    if (isInsideKnownContainer(mutation.target, knownContainers)) {
      return true;
    }
    if (mutation.type !== "childList") {
      return false;
    }

    return [...mutation.addedNodes, ...mutation.removedNodes].some((node) => (
      isInsideKnownContainer(node, knownContainers)
        || matchesMarkerSource(node, sourceSelectors)
    ));
  });
}
