export function createMarkerScanContext({
  getComputedStyle = globalThis.getComputedStyle,
  scrollY = globalThis.scrollY || 0
} = {}) {
  const rectCache = new WeakMap();
  const visibilityCache = new WeakMap();

  function rectFor(element) {
    if (!rectCache.has(element)) {
      rectCache.set(element, element.getBoundingClientRect());
    }
    return rectCache.get(element);
  }

  function isVisible(element) {
    if (!visibilityCache.has(element)) {
      const rect = rectFor(element);
      const style = getComputedStyle(element);
      visibilityCache.set(
        element,
        rect.width > 0
          && rect.height > 0
          && style.visibility !== "hidden"
          && style.display !== "none"
      );
    }
    return visibilityCache.get(element);
  }

  function topFor(element) {
    return rectFor(element).top + scrollY;
  }

  return { rectFor, isVisible, topFor };
}
